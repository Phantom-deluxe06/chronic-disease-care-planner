"""
Trend Analyzer Module for Chronic Disease Care Planner
Analyzes health data trends and generates weekly plan adjustments
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import database


# ==================== GUIDELINE THRESHOLDS ====================
# Based on ADA (American Diabetes Association) and AHA (American Heart Association) guidelines

GLUCOSE_TARGETS = {
    "fasting": {"min": 80, "max": 130, "unit": "mg/dL"},
    "after_meal": {"min": 80, "max": 180, "unit": "mg/dL"},
    "hba1c": {"target": 7.0, "unit": "%"},
    "citation": "American Diabetes Association. Standards of Medical Care in Diabetes—2024. Diabetes Care 2024;47(Suppl 1)"
}

BP_TARGETS = {
    "normal": {"systolic": 120, "diastolic": 80},
    "elevated": {"systolic": 129, "diastolic": 80},
    "stage1": {"systolic": 139, "diastolic": 89},
    "stage2": {"systolic": 140, "diastolic": 90},
    "citation": "American Heart Association. Understanding Blood Pressure Readings. 2024"
}


# ==================== TREND ANALYSIS ====================

def analyze_glucose_trends(user_id: int) -> Dict[str, Any]:
    """Analyze 7-day glucose trends and detect patterns"""
    logs = database.get_daily_logs(user_id, "glucose", days=7)
    stats = database.get_weekly_stats(user_id, "glucose")
    
    if not logs or stats["count"] == 0:
        return {
            "status": "insufficient_data",
            "message": "Not enough glucose readings to analyze trends. Log at least 3 readings.",
            "recommendations": ["Log your fasting glucose daily", "Log after-meal readings"]
        }
    
    # Calculate trend direction
    values = [log["value"] for log in logs]
    trend_direction = calculate_trend_direction(values)
    
    # Categorize readings
    fasting_readings = [log for log in logs if log.get("reading_context") == "fasting"]
    after_meal_readings = [log for log in logs if log.get("reading_context") == "after_meal"]
    
    # Check against targets
    avg_value = stats["avg_value"]
    in_target = GLUCOSE_TARGETS["fasting"]["min"] <= avg_value <= GLUCOSE_TARGETS["fasting"]["max"]
    
    # Generate insights
    insights = []
    recommendations = []
    alerts = []
    
    if avg_value > GLUCOSE_TARGETS["fasting"]["max"]:
        insights.append(f"Your average glucose ({avg_value:.0f} mg/dL) is above target range")
        recommendations.append("Consider reducing carbohydrate intake")
        recommendations.append("Increase physical activity duration")
        if avg_value > 200:
            alerts.append("Persistently high glucose - consult your healthcare provider")
    elif avg_value < GLUCOSE_TARGETS["fasting"]["min"]:
        insights.append(f"Your average glucose ({avg_value:.0f} mg/dL) is below target range")
        recommendations.append("Monitor for hypoglycemia symptoms")
        recommendations.append("Consider adjusting meal timing")
    else:
        insights.append(f"Your average glucose ({avg_value:.0f} mg/dL) is within target range! 🎉")
    
    if trend_direction == "increasing":
        insights.append("Your glucose levels show an increasing trend this week")
        recommendations.append("Review recent dietary changes")
    elif trend_direction == "decreasing":
        insights.append("Your glucose levels show a decreasing trend - good progress!")
    
    return {
        "status": "analyzed",
        "period": "7 days",
        "stats": {
            "average": round(avg_value, 1) if avg_value else None,
            "min": stats["min_value"],
            "max": stats["max_value"],
            "readings_count": stats["count"]
        },
        "trend_direction": trend_direction,
        "in_target_range": in_target,
        "insights": insights,
        "recommendations": recommendations,
        "alerts": alerts,
        "citation": GLUCOSE_TARGETS["citation"]
    }


def analyze_bp_trends(user_id: int) -> Dict[str, Any]:
    """Analyze 7-day blood pressure trends"""
    logs = database.get_daily_logs(user_id, "bp", days=7)
    stats = database.get_weekly_stats(user_id, "bp")
    
    if not logs or stats["count"] == 0:
        return {
            "status": "insufficient_data",
            "message": "Not enough BP readings to analyze trends. Log at least 3 readings.",
            "recommendations": ["Log your blood pressure morning and evening"]
        }
    
    avg_systolic = stats["avg_value"]
    avg_diastolic = stats["avg_secondary"]
    
    # Categorize BP level
    bp_category = categorize_bp(avg_systolic, avg_diastolic)
    
    # Calculate trends
    systolic_values = [log["value"] for log in logs]
    diastolic_values = [log["value_secondary"] for log in logs if log.get("value_secondary")]
    
    systolic_trend = calculate_trend_direction(systolic_values)
    
    # Generate insights
    insights = []
    recommendations = []
    alerts = []
    
    if bp_category == "normal":
        insights.append(f"Your average BP ({avg_systolic:.0f}/{avg_diastolic:.0f}) is in the normal range! 🎉")
    elif bp_category == "elevated":
        insights.append(f"Your average BP ({avg_systolic:.0f}/{avg_diastolic:.0f}) is elevated")
        recommendations.append("Reduce sodium intake to less than 2,300mg/day")
        recommendations.append("Increase physical activity to 150 minutes/week")
    elif bp_category == "stage1":
        insights.append(f"Your average BP ({avg_systolic:.0f}/{avg_diastolic:.0f}) indicates Stage 1 hypertension")
        recommendations.append("Follow DASH diet principles")
        recommendations.append("Limit alcohol and caffeine")
        alerts.append("Discuss medication options with your healthcare provider")
    elif bp_category == "stage2":
        insights.append(f"Your average BP ({avg_systolic:.0f}/{avg_diastolic:.0f}) indicates Stage 2 hypertension")
        alerts.append("Contact your healthcare provider about blood pressure management")
        recommendations.append("Monitor BP twice daily")
    
    if systolic_trend == "increasing":
        insights.append("Your systolic pressure shows an increasing trend")
        recommendations.append("Review stress levels and sleep quality")
    elif systolic_trend == "decreasing":
        insights.append("Your blood pressure is trending downward - great progress!")
    
    return {
        "status": "analyzed",
        "period": "7 days",
        "stats": {
            "avg_systolic": round(avg_systolic, 0) if avg_systolic else None,
            "avg_diastolic": round(avg_diastolic, 0) if avg_diastolic else None,
            "min": stats["min_value"],
            "max": stats["max_value"],
            "readings_count": stats["count"]
        },
        "bp_category": bp_category,
        "trend_direction": systolic_trend,
        "insights": insights,
        "recommendations": recommendations,
        "alerts": alerts,
        "citation": BP_TARGETS["citation"]
    }


def calculate_trend_direction(values: List[float]) -> str:
    """Calculate if values are trending up, down, or stable"""
    if len(values) < 3:
        return "insufficient_data"
    
    # Compare first half average to second half average
    mid = len(values) // 2
    first_half_avg = sum(values[:mid]) / mid if mid > 0 else 0
    second_half_avg = sum(values[mid:]) / (len(values) - mid) if len(values) - mid > 0 else 0
    
    diff_percent = ((second_half_avg - first_half_avg) / first_half_avg * 100) if first_half_avg > 0 else 0
    
    if diff_percent > 5:
        return "increasing"
    elif diff_percent < -5:
        return "decreasing"
    else:
        return "stable"


def categorize_bp(systolic: float, diastolic: float) -> str:
    """Categorize blood pressure according to AHA guidelines"""
    if systolic < 120 and diastolic < 80:
        return "normal"
    elif systolic < 130 and diastolic < 80:
        return "elevated"
    elif systolic < 140 or diastolic < 90:
        return "stage1"
    else:
        return "stage2"


# ==================== WEEKLY PLAN ADJUSTMENTS ====================

def generate_weekly_adjustments(user_id: int, diseases: List[str]) -> Dict[str, Any]:
    """Generate weekly care plan adjustments based on trends"""
    adjustments = []
    
    if "diabetes" in diseases:
        glucose_trends = analyze_glucose_trends(user_id)
        if glucose_trends["status"] == "analyzed":
            if not glucose_trends["in_target_range"]:
                if glucose_trends["stats"]["average"] and glucose_trends["stats"]["average"] > 180:
                    adjustments.append({
                        "type": "diet",
                        "action": "Add an extra vegetable serving to lunch and dinner",
                        "reason": "High average glucose levels detected"
                    })
                    adjustments.append({
                        "type": "activity",
                        "action": "Increase walking duration by 10 minutes",
                        "reason": "Physical activity helps regulate blood sugar"
                    })
                elif glucose_trends["stats"]["average"] and glucose_trends["stats"]["average"] < 80:
                    adjustments.append({
                        "type": "diet",
                        "action": "Add a small snack between meals",
                        "reason": "Low average glucose levels detected"
                    })
    
    if "hypertension" in diseases:
        bp_trends = analyze_bp_trends(user_id)
        if bp_trends["status"] == "analyzed":
            if bp_trends["bp_category"] in ["stage1", "stage2"]:
                adjustments.append({
                    "type": "diet",
                    "action": "Reduce sodium to less than 1,500mg daily",
                    "reason": "Elevated blood pressure detected"
                })
                adjustments.append({
                    "type": "wellness",
                    "action": "Add 10-minute evening relaxation session",
                    "reason": "Stress management helps lower blood pressure"
                })
    
    return {
        "week_of": datetime.now().strftime("%Y-%m-%d"),
        "adjustments": adjustments,
        "adjustment_count": len(adjustments),
        "message": "Your care plan has been updated based on this week's data" if adjustments else "No adjustments needed - keep up the good work!"
    }


def get_full_trend_report(user_id: int, diseases: List[str]) -> Dict[str, Any]:
    """Get comprehensive trend report for all conditions"""
    report = {
        "generated_at": datetime.now().isoformat(),
        "period": "7 days",
        "trends": {},
        "weekly_adjustments": generate_weekly_adjustments(user_id, diseases)
    }
    
    if "diabetes" in diseases:
        report["trends"]["glucose"] = analyze_glucose_trends(user_id)
    
    if "hypertension" in diseases:
        report["trends"]["blood_pressure"] = analyze_bp_trends(user_id)
    
    # Add activity summary
    activity_logs = database.get_daily_logs(user_id, "activity", days=7)
    total_activity_minutes = sum(log.get("value", 0) for log in activity_logs)
    report["activity_summary"] = {
        "total_minutes": total_activity_minutes,
        "target_minutes": 150,  # AHA recommendation
        "on_track": total_activity_minutes >= 150,
        "citation": "American Heart Association. Recommendations for Physical Activity in Adults. 2024"
    }
    
    return report
