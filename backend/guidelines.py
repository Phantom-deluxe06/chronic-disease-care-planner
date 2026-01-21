"""
Clinical Guidelines Module for Chronic Disease Care Planner
Contains evidence-based thresholds and recommendations from ADA/AHA guidelines
"""

from typing import Dict, List, Any

# ==================== DIABETES GUIDELINES (ADA) ====================
# Source: American Diabetes Association. Standards of Medical Care in Diabetes—2024

DIABETES_GUIDELINES = {
    "source": "American Diabetes Association",
    "document": "Standards of Medical Care in Diabetes—2024",
    "citation": "Diabetes Care 2024;47(Suppl 1)",
    "url": "https://diabetesjournals.org/care/issue/47/Supplement_1",
    
    "glucose_targets": {
        "fasting": {
            "min": 80,
            "max": 130,
            "unit": "mg/dL",
            "description": "Premeal (fasting) plasma glucose"
        },
        "postprandial": {
            "max": 180,
            "unit": "mg/dL",
            "description": "Peak postprandial (1-2 hours after meal) plasma glucose"
        },
        "bedtime": {
            "min": 90,
            "max": 150,
            "unit": "mg/dL",
            "description": "Bedtime glucose"
        }
    },
    
    "hba1c_targets": {
        "general": {
            "target": 7.0,
            "unit": "%",
            "description": "Target for most non-pregnant adults"
        },
        "stringent": {
            "target": 6.5,
            "unit": "%",
            "description": "May be appropriate for select individuals if achievable without hypoglycemia"
        },
        "less_stringent": {
            "target": 8.0,
            "unit": "%",
            "description": "May be appropriate for patients with limited life expectancy or where risks outweigh benefits"
        }
    },
    
    "hypoglycemia_levels": {
        "level_1": {
            "threshold": 70,
            "unit": "mg/dL",
            "description": "Alert value - take action"
        },
        "level_2": {
            "threshold": 54,
            "unit": "mg/dL",
            "description": "Clinically significant hypoglycemia - requires immediate treatment"
        }
    },
    
    "lifestyle_recommendations": {
        "activity": {
            "aerobic": "150 minutes/week of moderate-intensity or 75 minutes/week of vigorous-intensity",
            "resistance": "2-3 sessions/week",
            "reduce_sedentary": "Break up prolonged sitting every 30 minutes"
        },
        "diet": {
            "carbohydrate_monitoring": "Consistent carbohydrate intake important for glycemic control",
            "fiber": "14g fiber per 1000 kcal",
            "sodium": "<2,300 mg/day"
        }
    }
}


# ==================== HYPERTENSION GUIDELINES (AHA/ACC) ====================
# Source: American Heart Association/American College of Cardiology

HYPERTENSION_GUIDELINES = {
    "source": "American Heart Association / American College of Cardiology",
    "document": "2017 ACC/AHA/AAPA/ABC/ACPM/AGS/APhA/ASH/ASPC/NMA/PCNA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults",
    "citation": "J Am Coll Cardiol. 2018;71(19):e127-e248",
    "url": "https://www.heart.org/en/health-topics/high-blood-pressure",
    
    "bp_categories": {
        "normal": {
            "systolic": {"max": 120},
            "diastolic": {"max": 80},
            "description": "Normal blood pressure",
            "action": "Maintain healthy lifestyle"
        },
        "elevated": {
            "systolic": {"min": 120, "max": 129},
            "diastolic": {"max": 80},
            "description": "Elevated blood pressure",
            "action": "Lifestyle modifications, reassess in 3-6 months"
        },
        "stage1_hypertension": {
            "systolic": {"min": 130, "max": 139},
            "diastolic": {"min": 80, "max": 89},
            "description": "Stage 1 Hypertension",
            "action": "Lifestyle modifications, consider medication based on CVD risk"
        },
        "stage2_hypertension": {
            "systolic": {"min": 140},
            "diastolic": {"min": 90},
            "description": "Stage 2 Hypertension",
            "action": "Lifestyle modifications and medication"
        },
        "hypertensive_crisis": {
            "systolic": {"min": 180},
            "diastolic": {"min": 120},
            "description": "Hypertensive Crisis",
            "action": "Consult doctor immediately"
        }
    },
    
    "treatment_goals": {
        "general": {
            "systolic": 130,
            "diastolic": 80,
            "description": "Target for most adults"
        },
        "diabetes": {
            "systolic": 130,
            "diastolic": 80,
            "description": "Target for patients with diabetes"
        }
    },
    
    "lifestyle_modifications": {
        "DASH_diet": "Dietary Approaches to Stop Hypertension - rich in fruits, vegetables, whole grains, low-fat dairy",
        "sodium_reduction": "Target <1,500 mg/day for greater reduction, <2,300 mg/day general target",
        "potassium_increase": "3,500-5,000 mg/day from food sources",
        "physical_activity": "90-150 minutes/week aerobic exercise",
        "weight_management": "Maintain BMI 18.5-24.9 kg/m²",
        "alcohol_moderation": "Men: ≤2 drinks/day, Women: ≤1 drink/day",
        "stress_management": "Regular relaxation techniques"
    }
}


# ==================== HEART DISEASE GUIDELINES (AHA) ====================

HEART_DISEASE_GUIDELINES = {
    "source": "American Heart Association",
    "document": "2019 ACC/AHA Guideline on the Primary Prevention of Cardiovascular Disease",
    "citation": "Circulation. 2019;140:e596-e646",
    
    "lifestyle_recommendations": {
        "diet": {
            "fruits_vegetables": "4-5 servings each per day",
            "whole_grains": "3+ servings per day",
            "fish": "2+ servings per week (especially fatty fish)",
            "limit_saturated_fat": "<6% of total calories",
            "limit_trans_fat": "Avoid trans fats",
            "limit_sodium": "<2,300 mg/day",
            "limit_added_sugars": "<10% of total calories"
        },
        "physical_activity": {
            "moderate": "150 minutes/week",
            "vigorous": "75 minutes/week (or combination)",
            "strength": "2+ days/week"
        }
    }
}


# ==================== HELPER FUNCTIONS ====================

def get_glucose_status(value: float, reading_type: str = "fasting") -> Dict[str, Any]:
    """Determine glucose status based on ADA guidelines"""
    targets = DIABETES_GUIDELINES["glucose_targets"]
    
    if reading_type == "fasting":
        target = targets["fasting"]
        if value < target["min"]:
            return {
                "status": "low",
                "message": f"Below target range ({target['min']}-{target['max']} {target['unit']})",
                "action": "Consider adjusting meal timing or medication. Monitor for hypoglycemia.",
                "severity": "warning" if value >= 54 else "critical"
            }
        elif value > target["max"]:
            return {
                "status": "high", 
                "message": f"Above target range ({target['min']}-{target['max']} {target['unit']})",
                "action": "Review diet and medication. Increase physical activity.",
                "severity": "warning" if value < 180 else "elevated"
            }
        else:
            return {
                "status": "normal",
                "message": f"Within target range ({target['min']}-{target['max']} {target['unit']})",
                "action": "Keep up the good work!",
                "severity": "normal"
            }
    
    elif reading_type == "after_meal":
        target = targets["postprandial"]
        if value > target["max"]:
            return {
                "status": "high",
                "message": f"Above target (<{target['max']} {target['unit']})",
                "action": "Consider lower-carbohydrate options for next meal",
                "severity": "warning"
            }
        else:
            return {
                "status": "normal",
                "message": f"Within target (<{target['max']} {target['unit']})",
                "action": "Good meal choice!",
                "severity": "normal"
            }
    
    return {"status": "unknown", "message": "Unknown reading type"}


def get_bp_status(systolic: float, diastolic: float) -> Dict[str, Any]:
    """Determine blood pressure category based on AHA guidelines"""
    categories = HYPERTENSION_GUIDELINES["bp_categories"]
    
    if systolic >= 180 or diastolic >= 120:
        cat = categories["hypertensive_crisis"]
        return {
            "category": "hypertensive_crisis",
            "description": cat["description"],
            "action": cat["action"],
            "severity": "critical"
        }
    elif systolic >= 140 or diastolic >= 90:
        cat = categories["stage2_hypertension"]
        return {
            "category": "stage2",
            "description": cat["description"],
            "action": cat["action"],
            "severity": "elevated"
        }
    elif systolic >= 130 or diastolic >= 80:
        cat = categories["stage1_hypertension"]
        return {
            "category": "stage1",
            "description": cat["description"],
            "action": cat["action"],
            "severity": "warning"
        }
    elif systolic >= 120:
        cat = categories["elevated"]
        return {
            "category": "elevated",
            "description": cat["description"],
            "action": cat["action"],
            "severity": "caution"
        }
    else:
        cat = categories["normal"]
        return {
            "category": "normal",
            "description": cat["description"],
            "action": cat["action"],
            "severity": "normal"
        }


def get_all_citations() -> List[Dict[str, str]]:
    """Get all guideline citations"""
    return [
        {
            "organization": DIABETES_GUIDELINES["source"],
            "document": DIABETES_GUIDELINES["document"],
            "citation": DIABETES_GUIDELINES["citation"],
            "url": DIABETES_GUIDELINES["url"]
        },
        {
            "organization": HYPERTENSION_GUIDELINES["source"],
            "document": HYPERTENSION_GUIDELINES["document"],
            "citation": HYPERTENSION_GUIDELINES["citation"],
            "url": HYPERTENSION_GUIDELINES["url"]
        },
        {
            "organization": HEART_DISEASE_GUIDELINES["source"],
            "document": HEART_DISEASE_GUIDELINES["document"],
            "citation": HEART_DISEASE_GUIDELINES["citation"]
        }
    ]


# ==================== DISCLAIMER ====================

MEDICAL_DISCLAIMER = """
⚠️ IMPORTANT HEALTH DISCLAIMER

This application is for informational and educational purposes only. It is NOT intended to:
- Provide medical diagnosis
- Replace professional medical advice
- Serve as a substitute for consultation with a healthcare provider

The care plans, recommendations, and health insights provided are based on general clinical 
guidelines and may not be appropriate for your specific health situation.

ALWAYS:
- Consult with your healthcare provider before making changes to your treatment
- Seek immediate medical attention for severe symptoms
- Follow your doctor's personalized recommendations over general guidelines

If you experience any of the following, contact your healthcare provider or seek 
emergency care immediately:
- Blood glucose below 54 mg/dL or above 250 mg/dL
- Blood pressure above 180/120 mmHg
- Chest pain, shortness of breath, or severe symptoms
- Any concerning changes in your health

Your health data is stored locally and we do not share your information with third parties.
"""
