"""
AI Analyzer Module for Chronic Disease Care Planner
Provides AI-assisted food analysis, meal suitability assessment, and weekly health summaries
Now integrated with Gemini AI for real-time nutritional analysis
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import database
import os
import json
import logging

logger = logging.getLogger(__name__)

# ==================== GEMINI AI CONFIGURATION ====================
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
gemini_model = None

def initialize_gemini():
    """Initialize Gemini AI model"""
    global gemini_model
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set. AI features will use fallback static data.")
        return None
    
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("Gemini AI initialized successfully")
        return gemini_model
    except Exception as e:
        logger.error(f"Failed to initialize Gemini AI: {e}")
        return None

# Initialize on module load
initialize_gemini()


def analyze_food_with_gemini(food_description: str, quantity: str, condition: str = "diabetes") -> Optional[Dict[str, Any]]:
    """
    Use Gemini AI to analyze food for nutritional content.
    Returns structured JSON with nutrition info, health recommendations, and portion advice.
    """
    global gemini_model
    
    if not gemini_model:
        # Try to reinitialize
        initialize_gemini()
        if not gemini_model:
            return None
    
    if condition == "diabetes":
        prompt = f"""Analyze the following food for a person with Type 2 Diabetes.

Food: {food_description}
Portion Size: {quantity}

IMPORTANT: 
- If the food description contains a number (e.g., "2 idly", "3 rotis"), calculate nutrition for that EXACT quantity, not per piece.
- If portion size says "2 servings" or "large", also multiply accordingly.
- Example: "2 idly" should show ~160 calories (80 each), not 80.

Return a JSON object with this exact structure (no markdown, just raw JSON):
{{
    "nutrition": {{
        "calories": <total number for the quantity specified>,
        "carbohydrates_g": <total grams>,
        "sugar_g": <total grams>,
        "fiber_g": <total grams>,
        "protein_g": <total grams>,
        "glycemic_index": <number 0-100, this doesn't scale>
    }},
    "glucose_spike_risk": {{
        "level": "<low/medium/high>",
        "factors": ["<reason1>", "<reason2>"]
    }},
    "health_recommendation": "<Is this safe for diabetics? Brief advice>",
    "portion_advice": "<How much should they eat?>",
    "meal_suitability": {{
        "suitable": <true/false>,
        "rating": "<Good/Acceptable/Caution>",
        "positives": ["<positive1>", "<positive2>"],
        "improvements": ["<suggestion1>", "<suggestion2>"]
    }}
}}

Be accurate with nutritional estimates. Consider Indian foods if mentioned."""

    else:  # hypertension
        prompt = f"""Analyze the following food for a person with Hypertension (High Blood Pressure) following the DASH diet.

Food: {food_description}
Portion Size: {quantity}

IMPORTANT: 
- If the food description contains a number (e.g., "2 idly", "3 rotis"), calculate nutrition for that EXACT quantity, not per piece.
- If portion size says "2 servings" or "large", also multiply accordingly.
- Example: "2 idly" should show double the sodium/calories of 1 idly.

Return a JSON object with this exact structure (no markdown, just raw JSON):
{{
    "nutrition": {{
        "calories": <total number for the quantity specified>,
        "sodium_mg": <total mg - this is critical for hypertension>,
        "potassium_mg": <total mg>,
        "saturated_fat_g": <total grams>,
        "fiber_g": <total grams>,
        "protein_g": <total grams>
    }},
    "dash_compliant": <true/false>,
    "dash_score": "<Excellent/Good/Moderate/Poor>",
    "health_recommendation": "<Is this safe for blood pressure? Brief advice>",
    "portion_advice": "<How much should they eat?>",
    "positives": ["<positive1>", "<positive2>"],
    "improvements": ["<suggestion1>", "<suggestion2>"]
}}

Focus heavily on sodium content. DASH diet limits sodium to <2300mg/day. Consider Indian foods if mentioned."""

    try:
        response = gemini_model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean up response - remove markdown code blocks if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])
        if response_text.startswith("json"):
            response_text = response_text[4:].strip()
        
        result = json.loads(response_text)
        result["ai_generated"] = True
        result["disclaimer"] = "⚠️ AI nutritional estimates are approximate. This is not medical advice. Consult your healthcare provider for personalized dietary guidance."
        
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e}")
        logger.debug(f"Raw response: {response_text if 'response_text' in dir() else 'N/A'}")
        return None
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return None


def analyze_food_ai(food_description: str, quantity: str = "1 serving") -> Dict[str, Any]:
    """
    AI-powered food analysis for diabetes with fallback to static database.
    """
    # Try AI first
    ai_result = analyze_food_with_gemini(food_description, quantity, "diabetes")
    
    if ai_result:
        ai_result["food_description"] = food_description
        ai_result["quantity"] = quantity
        return ai_result
    
    # Fallback to static analysis
    logger.info("Falling back to static food analysis")
    return analyze_food(food_description, quantity)


def analyze_food_hypertension_ai(food_description: str, quantity: str = "1 serving") -> Dict[str, Any]:
    """
    AI-powered food analysis for hypertension with focus on sodium and DASH diet.
    """
    # Try AI first
    ai_result = analyze_food_with_gemini(food_description, quantity, "hypertension")
    
    if ai_result:
        ai_result["food_description"] = food_description
        ai_result["quantity"] = quantity
        ai_result["daily_sodium"] = ai_result.get("nutrition", {}).get("sodium_mg", 0)  # Running total would need DB
        return ai_result
    
    # Fallback to static sodium estimation
    logger.info("Falling back to static hypertension food analysis")
    return analyze_food_hypertension_static(food_description, quantity)


def analyze_food_hypertension_static(food_description: str, quantity: str = "1 serving") -> Dict[str, Any]:
    """Static fallback for hypertension food analysis"""
    # Use existing food analysis and add sodium estimates
    base_analysis = analyze_food(food_description, quantity)
    
    # Estimate sodium based on food type (simplified)
    food_lower = food_description.lower()
    sodium_estimate = 200  # Default per serving
    
    high_sodium_foods = ["pickle", "papad", "chips", "fries", "pizza", "burger", "samosa", "pakora", "chaat", "namkeen", "processed", "canned", "instant"]
    medium_sodium_foods = ["bread", "cheese", "roti", "paratha", "puri", "biryani"]
    low_sodium_foods = ["salad", "fruit", "vegetables", "dal", "rice", "oats", "milk", "curd", "yogurt"]
    
    for food in high_sodium_foods:
        if food in food_lower:
            sodium_estimate = 600
            break
    for food in medium_sodium_foods:
        if food in food_lower:
            sodium_estimate = 350
            break
    for food in low_sodium_foods:
        if food in food_lower:
            sodium_estimate = 100
            break
    
    # Adjust for quantity
    multiplier = 1.0
    qty_lower = quantity.lower()
    if "2" in qty_lower or "large" in qty_lower:
        multiplier = 1.5
    elif "small" in qty_lower or "half" in qty_lower:
        multiplier = 0.6
    
    sodium_mg = int(sodium_estimate * multiplier)
    potassium_mg = int(base_analysis["nutrition"]["fiber_g"] * 50 + base_analysis["nutrition"]["protein_g"] * 20)
    
    dash_compliant = sodium_mg < 400
    
    return {
        "food_description": food_description,
        "quantity": quantity,
        "nutrition": {
            "calories": base_analysis["nutrition"]["calories"],
            "sodium_mg": sodium_mg,
            "potassium_mg": potassium_mg,
            "saturated_fat_g": round(base_analysis["nutrition"]["calories"] * 0.02, 1),
            "fiber_g": base_analysis["nutrition"]["fiber_g"],
            "protein_g": base_analysis["nutrition"]["protein_g"]
        },
        "dash_compliant": dash_compliant,
        "dash_score": "Good" if dash_compliant else "Moderate" if sodium_mg < 600 else "Poor",
        "health_recommendation": "Low sodium option, good for blood pressure" if dash_compliant else "Consider reducing portion or choosing lower-sodium alternatives",
        "portion_advice": "Standard portion is fine" if dash_compliant else "Smaller portions recommended",
        "positives": ["Contains fiber" if base_analysis["nutrition"]["fiber_g"] > 2 else "Moderate calories"],
        "improvements": [] if dash_compliant else ["Look for low-sodium alternatives", "Add more potassium-rich vegetables"],
        "daily_sodium": sodium_mg,
        "disclaimer": "⚠️ Sodium estimates are approximate. This is not medical advice. Consult your healthcare provider.",
        "ai_generated": False
    }


# ==================== FOOD DATABASE (Mock AI) ====================

# This simulates AI food analysis. In production, integrate with USDA FoodData or similar API.

FOOD_DATABASE = {
    # Grains & Carbs
    "rice": {"calories": 130, "carbs": 28, "sugar": 0, "fiber": 0.4, "protein": 2.7, "gi": 73},
    "white rice": {"calories": 130, "carbs": 28, "sugar": 0, "fiber": 0.4, "protein": 2.7, "gi": 73},
    "brown rice": {"calories": 112, "carbs": 24, "sugar": 0, "fiber": 1.8, "protein": 2.6, "gi": 50},
    "bread": {"calories": 79, "carbs": 15, "sugar": 1.5, "fiber": 0.6, "protein": 2.7, "gi": 75},
    "whole wheat bread": {"calories": 81, "carbs": 14, "sugar": 1.4, "fiber": 2, "protein": 4, "gi": 51},
    "roti": {"calories": 71, "carbs": 15, "sugar": 0.3, "fiber": 1.9, "protein": 2.7, "gi": 62},
    "chapati": {"calories": 71, "carbs": 15, "sugar": 0.3, "fiber": 1.9, "protein": 2.7, "gi": 62},
    "oats": {"calories": 68, "carbs": 12, "sugar": 0.5, "fiber": 1.7, "protein": 2.4, "gi": 55},
    "pasta": {"calories": 131, "carbs": 25, "sugar": 0.6, "fiber": 1.8, "protein": 5, "gi": 50},
    
    # Proteins
    "chicken": {"calories": 165, "carbs": 0, "sugar": 0, "fiber": 0, "protein": 31, "gi": 0},
    "fish": {"calories": 206, "carbs": 0, "sugar": 0, "fiber": 0, "protein": 22, "gi": 0},
    "egg": {"calories": 155, "carbs": 1.1, "sugar": 1.1, "fiber": 0, "protein": 13, "gi": 0},
    "eggs": {"calories": 155, "carbs": 1.1, "sugar": 1.1, "fiber": 0, "protein": 13, "gi": 0},
    "dal": {"calories": 116, "carbs": 20, "sugar": 1, "fiber": 8, "protein": 9, "gi": 30},
    "lentils": {"calories": 116, "carbs": 20, "sugar": 1, "fiber": 8, "protein": 9, "gi": 30},
    "paneer": {"calories": 265, "carbs": 1.2, "sugar": 0.5, "fiber": 0, "protein": 18, "gi": 0},
    "tofu": {"calories": 76, "carbs": 1.9, "sugar": 0.6, "fiber": 0.3, "protein": 8, "gi": 15},
    
    # Vegetables
    "salad": {"calories": 20, "carbs": 3.6, "sugar": 1.3, "fiber": 1.8, "protein": 1.3, "gi": 15},
    "vegetables": {"calories": 25, "carbs": 5, "sugar": 2.4, "fiber": 2, "protein": 1.3, "gi": 15},
    "spinach": {"calories": 23, "carbs": 3.6, "sugar": 0.4, "fiber": 2.2, "protein": 2.9, "gi": 15},
    "broccoli": {"calories": 34, "carbs": 7, "sugar": 1.7, "fiber": 2.6, "protein": 2.8, "gi": 10},
    "potato": {"calories": 77, "carbs": 17, "sugar": 0.8, "fiber": 2.2, "protein": 2, "gi": 78},
    "sweet potato": {"calories": 86, "carbs": 20, "sugar": 4.2, "fiber": 3, "protein": 1.6, "gi": 63},
    
    # Fruits
    "apple": {"calories": 52, "carbs": 14, "sugar": 10, "fiber": 2.4, "protein": 0.3, "gi": 36},
    "banana": {"calories": 89, "carbs": 23, "sugar": 12, "fiber": 2.6, "protein": 1.1, "gi": 51},
    "orange": {"calories": 47, "carbs": 12, "sugar": 9, "fiber": 2.4, "protein": 0.9, "gi": 43},
    "mango": {"calories": 60, "carbs": 15, "sugar": 14, "fiber": 1.6, "protein": 0.8, "gi": 56},
    "grapes": {"calories": 69, "carbs": 18, "sugar": 16, "fiber": 0.9, "protein": 0.7, "gi": 59},
    "watermelon": {"calories": 30, "carbs": 8, "sugar": 6, "fiber": 0.4, "protein": 0.6, "gi": 76},
    
    # Dairy
    "milk": {"calories": 42, "carbs": 5, "sugar": 5, "fiber": 0, "protein": 3.4, "gi": 39},
    "yogurt": {"calories": 59, "carbs": 3.6, "sugar": 3.2, "fiber": 0, "protein": 10, "gi": 35},
    "curd": {"calories": 98, "carbs": 3.4, "sugar": 3.4, "fiber": 0, "protein": 11, "gi": 35},
    "cheese": {"calories": 402, "carbs": 1.3, "sugar": 0.5, "fiber": 0, "protein": 25, "gi": 0},
    
    # Common meals
    "idli": {"calories": 39, "carbs": 8, "sugar": 0.2, "fiber": 0.4, "protein": 1.3, "gi": 77},
    "dosa": {"calories": 133, "carbs": 18, "sugar": 1.5, "fiber": 1, "protein": 4, "gi": 77},
    "upma": {"calories": 161, "carbs": 26, "sugar": 1, "fiber": 2, "protein": 4, "gi": 65},
    "poha": {"calories": 180, "carbs": 32, "sugar": 2, "fiber": 1, "protein": 3.5, "gi": 64},
    "biryani": {"calories": 290, "carbs": 35, "sugar": 2, "fiber": 1, "protein": 15, "gi": 70},
    "pizza": {"calories": 266, "carbs": 33, "sugar": 3.6, "fiber": 2.3, "protein": 11, "gi": 80},
    "burger": {"calories": 295, "carbs": 24, "sugar": 5, "fiber": 1.3, "protein": 17, "gi": 66},
    "sandwich": {"calories": 252, "carbs": 29, "sugar": 4, "fiber": 2, "protein": 10, "gi": 55},
    
    # Beverages
    "tea": {"calories": 2, "carbs": 0.5, "sugar": 0, "fiber": 0, "protein": 0, "gi": 0},
    "coffee": {"calories": 2, "carbs": 0, "sugar": 0, "fiber": 0, "protein": 0.3, "gi": 0},
    "juice": {"calories": 45, "carbs": 11, "sugar": 10, "fiber": 0.2, "protein": 0.4, "gi": 50},
    "soda": {"calories": 41, "carbs": 10.6, "sugar": 10.6, "fiber": 0, "protein": 0, "gi": 63},
    "lassi": {"calories": 72, "carbs": 8, "sugar": 7, "fiber": 0, "protein": 3, "gi": 35},
    
    # Snacks
    "biscuits": {"calories": 502, "carbs": 63, "sugar": 20, "fiber": 2, "protein": 6, "gi": 70},
    "chips": {"calories": 536, "carbs": 53, "sugar": 0.3, "fiber": 4.4, "protein": 7, "gi": 54},
    "samosa": {"calories": 262, "carbs": 24, "sugar": 2, "fiber": 2, "protein": 4, "gi": 60},
    "pakora": {"calories": 200, "carbs": 18, "sugar": 1, "fiber": 2, "protein": 5, "gi": 55},
    "nuts": {"calories": 607, "carbs": 21, "sugar": 4, "fiber": 7, "protein": 20, "gi": 15},
    "almonds": {"calories": 579, "carbs": 22, "sugar": 4, "fiber": 12.5, "protein": 21, "gi": 0},
}

# Glycemic Index categories
GI_LOW = 55
GI_MEDIUM = 70


def analyze_food(food_description: str, quantity: str = "1 serving") -> Dict[str, Any]:
    """
    Analyze food for nutritional content and diabetes suitability.
    Returns estimated calories, carbs, sugar impact, and glucose spike risk.
    """
    food_description = food_description.lower().strip()
    
    # Try to find matching foods
    matched_foods = []
    total_nutrition = {
        "calories": 0,
        "carbs": 0,
        "sugar": 0,
        "fiber": 0,
        "protein": 0,
        "gi": 0
    }
    
    # Parse quantity multiplier (simple parsing)
    multiplier = 1.0
    qty_lower = quantity.lower()
    if "2" in qty_lower or "two" in qty_lower or "double" in qty_lower:
        multiplier = 2.0
    elif "half" in qty_lower or "0.5" in qty_lower:
        multiplier = 0.5
    elif "3" in qty_lower or "three" in qty_lower:
        multiplier = 3.0
    elif "large" in qty_lower:
        multiplier = 1.5
    elif "small" in qty_lower:
        multiplier = 0.7
    
    # Search for food matches
    words = food_description.split()
    for word in words:
        word = word.strip(",.!?")
        if word in FOOD_DATABASE:
            matched_foods.append(word)
            food_data = FOOD_DATABASE[word]
            for key in total_nutrition:
                total_nutrition[key] += food_data.get(key, 0) * multiplier
    
    # Also check multi-word matches
    for food_name in FOOD_DATABASE:
        if food_name in food_description and food_name not in matched_foods:
            matched_foods.append(food_name)
            food_data = FOOD_DATABASE[food_name]
            for key in total_nutrition:
                total_nutrition[key] += food_data.get(key, 0) * multiplier
    
    # If no matches, provide default estimate
    if not matched_foods:
        total_nutrition = {
            "calories": 200 * multiplier,
            "carbs": 25 * multiplier,
            "sugar": 5 * multiplier,
            "fiber": 2 * multiplier,
            "protein": 8 * multiplier,
            "gi": 50
        }
        matched_foods = ["unknown food"]
    
    # Calculate averages for GI
    if len(matched_foods) > 1:
        total_nutrition["gi"] = total_nutrition["gi"] / len(matched_foods)
    
    # Determine glucose spike risk
    glucose_risk = calculate_glucose_spike_risk(total_nutrition)
    
    # Determine meal suitability
    suitability = assess_meal_suitability(total_nutrition)
    
    return {
        "food_description": food_description,
        "quantity": quantity,
        "matched_foods": matched_foods,
        "nutrition": {
            "calories": round(total_nutrition["calories"], 1),
            "carbohydrates_g": round(total_nutrition["carbs"], 1),
            "sugar_g": round(total_nutrition["sugar"], 1),
            "fiber_g": round(total_nutrition["fiber"], 1),
            "protein_g": round(total_nutrition["protein"], 1),
            "glycemic_index": round(total_nutrition["gi"], 0)
        },
        "glucose_spike_risk": glucose_risk,
        "meal_suitability": suitability,
        "disclaimer": "⚠️ AI nutritional estimates are approximate. This is not medical advice. Consult your healthcare provider for personalized dietary guidance."
    }


def calculate_glucose_spike_risk(nutrition: Dict[str, float]) -> Dict[str, Any]:
    """Calculate the risk of glucose spike from a meal"""
    carbs = nutrition.get("carbs", 0)
    sugar = nutrition.get("sugar", 0)
    fiber = nutrition.get("fiber", 0)
    gi = nutrition.get("gi", 50)
    
    # Calculate glycemic load (simplified)
    gl = (carbs * gi) / 100
    
    # Fiber mitigates spike
    net_carbs = max(0, carbs - fiber)
    
    # Risk scoring
    risk_score = 0
    risk_factors = []
    
    if gi > GI_MEDIUM:
        risk_score += 3
        risk_factors.append("High glycemic index food")
    elif gi > GI_LOW:
        risk_score += 1
        risk_factors.append("Medium glycemic index food")
    
    if net_carbs > 45:
        risk_score += 3
        risk_factors.append("High carbohydrate content")
    elif net_carbs > 30:
        risk_score += 2
        risk_factors.append("Moderate carbohydrate content")
    
    if sugar > 15:
        risk_score += 3
        risk_factors.append("High sugar content")
    elif sugar > 8:
        risk_score += 1
        risk_factors.append("Moderate sugar content")
    
    if fiber < 2:
        risk_score += 1
        risk_factors.append("Low fiber content")
    
    # Determine risk level
    if risk_score >= 6:
        risk_level = "high"
        color = "red"
    elif risk_score >= 3:
        risk_level = "medium"
        color = "orange"
    else:
        risk_level = "low"
        color = "green"
    
    return {
        "level": risk_level,
        "score": risk_score,
        "color": color,
        "glycemic_load": round(gl, 1),
        "net_carbs": round(net_carbs, 1),
        "factors": risk_factors
    }


def assess_meal_suitability(nutrition: Dict[str, float]) -> Dict[str, Any]:
    """Assess if a meal is suitable for Type-2 diabetics"""
    carbs = nutrition.get("carbs", 0)
    sugar = nutrition.get("sugar", 0)
    fiber = nutrition.get("fiber", 0)
    protein = nutrition.get("protein", 0)
    gi = nutrition.get("gi", 50)
    
    is_suitable = True
    improvements = []
    positives = []
    
    # Check carbs
    if carbs > 45:
        is_suitable = False
        improvements.append("Consider reducing portion size or choosing a lower-carb alternative")
    elif carbs > 30:
        improvements.append("Pair with protein or healthy fat to slow glucose absorption")
    
    # Check sugar
    if sugar > 15:
        is_suitable = False
        improvements.append("High sugar content - choose a lower-sugar alternative")
    elif sugar > 8:
        improvements.append("Moderate sugar - consume in moderation")
    
    # Check GI
    if gi > GI_MEDIUM:
        improvements.append("High GI - pair with low-GI foods or add vinegar/lemon")
    
    # Positive factors
    if fiber > 5:
        positives.append("Good fiber content helps slow glucose absorption")
    if protein > 15:
        positives.append("High protein content helps maintain stable blood sugar")
    if gi < GI_LOW:
        positives.append("Low glycemic index - good choice for blood sugar control")
    if carbs < 20 and protein > 10:
        positives.append("Excellent balance of protein with low carbs")
    
    return {
        "suitable": is_suitable,
        "rating": "Good" if is_suitable and not improvements else "Acceptable" if is_suitable else "Caution",
        "positives": positives,
        "improvements": improvements
    }


# ==================== WEEKLY HEALTH SUMMARY ====================

def generate_weekly_summary(user_id: int) -> Dict[str, Any]:
    """Generate AI-powered weekly health summary for a user"""
    
    # Get all logs from past 7 days
    glucose_logs = database.get_daily_logs(user_id, "glucose", 7)
    food_logs = database.get_daily_logs(user_id, "food", 7)
    activity_logs = database.get_daily_logs(user_id, "activity", 7)
    
    # Get medication data
    medications = database.get_medications(user_id)
    med_logs = []
    try:
        med_logs = database.get_medication_logs_today(user_id)  # This week ideally
    except:
        pass
    
    # Get water intake
    water_data = {"total_ml": 0, "glasses": 0}
    try:
        water_data = database.get_water_logs_today(user_id)
    except:
        pass
    
    # Calculate diet quality
    diet_score = calculate_diet_quality(food_logs)
    
    # Calculate exercise consistency
    exercise_score = calculate_exercise_consistency(activity_logs)
    
    # Calculate medication adherence
    med_adherence = calculate_medication_adherence(medications, med_logs)
    
    # Analyze blood sugar trends
    glucose_analysis = analyze_glucose_week(glucose_logs)
    
    # Generate AI suggestions
    suggestions = generate_improvement_suggestions(
        diet_score, exercise_score, med_adherence, glucose_analysis
    )
    
    return {
        "week_of": datetime.now().strftime("%Y-%m-%d"),
        "summary": {
            "diet": diet_score,
            "exercise": exercise_score,
            "medication_adherence": med_adherence,
            "blood_sugar": glucose_analysis
        },
        "ai_suggestions": suggestions,
        "disclaimer": "⚠️ These AI recommendations are supportive only and not medical advice. Always consult your healthcare provider for treatment decisions."
    }


def calculate_diet_quality(food_logs: list) -> Dict[str, Any]:
    """Calculate diet quality score based on food logs"""
    if not food_logs:
        return {
            "score": 0,
            "rating": "No data",
            "meals_logged": 0,
            "avg_calories": 0
        }
    
    total_calories = sum(log.get("value", 0) for log in food_logs)
    meals_logged = len(food_logs)
    avg_calories = total_calories / meals_logged if meals_logged > 0 else 0
    
    # Score based on logging consistency (21 meals = 3/day * 7 days)
    consistency = min(100, (meals_logged / 21) * 100)
    
    # Determine rating
    if consistency >= 70:
        rating = "Excellent"
        score = 90
    elif consistency >= 50:
        rating = "Good"
        score = 70
    elif consistency >= 30:
        rating = "Fair"
        score = 50
    else:
        rating = "Needs Improvement"
        score = 30
    
    return {
        "score": score,
        "rating": rating,
        "meals_logged": meals_logged,
        "avg_calories": round(avg_calories, 0),
        "total_calories": round(total_calories, 0)
    }


def calculate_exercise_consistency(activity_logs: list) -> Dict[str, Any]:
    """Calculate exercise consistency score"""
    if not activity_logs:
        return {
            "score": 0,
            "rating": "No data",
            "total_minutes": 0,
            "sessions": 0
        }
    
    total_minutes = sum(log.get("value", 0) for log in activity_logs)
    sessions = len(activity_logs)
    
    # ADA recommends 150 minutes/week
    target_minutes = 150
    percentage = min(100, (total_minutes / target_minutes) * 100)
    
    # Determine rating
    if percentage >= 100:
        rating = "Excellent"
        score = 100
    elif percentage >= 75:
        rating = "Good"
        score = 80
    elif percentage >= 50:
        rating = "Fair"
        score = 60
    else:
        rating = "Needs Improvement"
        score = 40
    
    return {
        "score": score,
        "rating": rating,
        "total_minutes": round(total_minutes, 0),
        "target_minutes": target_minutes,
        "sessions": sessions,
        "percentage_of_goal": round(percentage, 0)
    }


def calculate_medication_adherence(medications: list, med_logs: list) -> Dict[str, Any]:
    """Calculate medication adherence percentage"""
    if not medications:
        return {
            "score": 100,
            "rating": "No medications",
            "percentage": 100
        }
    
    # Calculate expected doses (simplified - would need more complex logic for real adherence)
    expected_doses = len(medications) * 7  # Assuming daily medications
    taken_doses = len([log for log in med_logs if log.get("taken_at")])
    
    if expected_doses == 0:
        percentage = 100
    else:
        percentage = min(100, (taken_doses / expected_doses) * 100)
    
    if percentage >= 90:
        rating = "Excellent"
        score = 95
    elif percentage >= 75:
        rating = "Good"
        score = 75
    elif percentage >= 50:
        rating = "Fair"
        score = 50
    else:
        rating = "Needs Improvement"
        score = 30
    
    return {
        "score": score,
        "rating": rating,
        "percentage": round(percentage, 0),
        "expected_doses": expected_doses,
        "taken_doses": taken_doses
    }


def analyze_glucose_week(glucose_logs: list) -> Dict[str, Any]:
    """Analyze weekly glucose patterns"""
    if not glucose_logs:
        return {
            "average": 0,
            "trend": "no_data",
            "in_range_percentage": 0,
            "readings": 0
        }
    
    values = [log.get("value", 0) for log in glucose_logs]
    avg_glucose = sum(values) / len(values)
    
    # Count readings in target range (80-180 mg/dL)
    in_range = sum(1 for v in values if 80 <= v <= 180)
    in_range_pct = (in_range / len(values)) * 100
    
    # Determine trend
    if len(values) >= 3:
        first_half_avg = sum(values[:len(values)//2]) / (len(values)//2)
        second_half_avg = sum(values[len(values)//2:]) / (len(values) - len(values)//2)
        
        if second_half_avg < first_half_avg - 10:
            trend = "improving"
        elif second_half_avg > first_half_avg + 10:
            trend = "worsening"
        else:
            trend = "stable"
    else:
        trend = "insufficient_data"
    
    return {
        "average": round(avg_glucose, 0),
        "min": min(values),
        "max": max(values),
        "trend": trend,
        "in_range_percentage": round(in_range_pct, 0),
        "readings": len(values)
    }


def generate_improvement_suggestions(diet: Dict, exercise: Dict, 
                                     medication: Dict, glucose: Dict) -> List[str]:
    """Generate personalized improvement suggestions"""
    suggestions = []
    
    # Diet suggestions
    if diet.get("score", 0) < 50:
        suggestions.append("📝 Try logging your meals more consistently to better track your diet patterns.")
    
    # Exercise suggestions
    if exercise.get("score", 0) < 60:
        remaining = exercise.get("target_minutes", 150) - exercise.get("total_minutes", 0)
        if remaining > 0:
            suggestions.append(f"🚶 You're {round(remaining)} minutes short of your weekly exercise goal. Try adding a 10-minute walk after meals.")
    elif exercise.get("score", 0) >= 100:
        suggestions.append("💪 Great job meeting your exercise goal! Keep up the excellent work.")
    
    # Medication suggestions
    if medication.get("percentage", 100) < 90:
        suggestions.append("💊 Your medication adherence could improve. Try setting phone reminders for medication times.")
    
    # Glucose suggestions
    if glucose.get("trend") == "worsening":
        suggestions.append("📈 Your blood sugar trend is showing an increase. Review your recent diet and activity, and consult your doctor if this continues.")
    elif glucose.get("trend") == "improving":
        suggestions.append("✅ Your blood sugar control is improving! Keep following your care plan.")
    
    if glucose.get("in_range_percentage", 0) < 70 and glucose.get("readings", 0) > 0:
        suggestions.append("🎯 Try to keep more readings in the target range (80-180 mg/dL) by maintaining consistent meal times and portions.")
    
    # General suggestions
    if not suggestions:
        suggestions.append("👍 You're doing well overall! Continue following your diabetes care plan.")
    
    return suggestions
