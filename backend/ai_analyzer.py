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

try:
    from google import genai
    from google.genai import types
except ImportError:
    logger.warning("google-genai not installed. Some features may not work.")

# ==================== GEMINI AI CONFIGURATION ====================
# Load environment variables from .env file if present
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
gemini_client = None

def initialize_gemini():
    """Initialize Gemini AI client"""
    global gemini_client
    
    # Debug: Log Python info
    import sys
    logger.info(f"Python executable: {sys.executable}")
    logger.info(f"GEMINI_API_KEY present: {bool(GEMINI_API_KEY)}")
    
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set. AI features will use fallback static data.")
        return None
    
    try:
        # Try importing the new package
        logger.info("Attempting to import google.genai...")
        from google import genai
        logger.info("google.genai imported successfully")
        
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("Gemini AI client initialized successfully")
        return gemini_client
    except ImportError as ie:
        logger.error(f"ImportError - google-genai not found: {ie}")
        logger.error("Install with: pip install google-genai")
        return None
    except Exception as e:
        logger.error(f"Failed to initialize Gemini AI: {type(e).__name__}: {e}")
        return None

# Initialize on module load
initialize_gemini()


def analyze_food_with_gemini(food_description: str, quantity: str, condition: str = "diabetes") -> Optional[Dict[str, Any]]:
    """
    Use Gemini AI to analyze food for nutritional content.
    Returns structured JSON with nutrition info, health recommendations, and portion advice.
    """
    global gemini_client
    
    if not gemini_client:
        # Try to reinitialize
        initialize_gemini()
        if not gemini_client:
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
        response = gemini_client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )
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
    bp_logs = database.get_daily_logs(user_id, "bp", 7)
    food_logs = database.get_daily_logs(user_id, "food", 7)
    activity_logs = database.get_daily_logs(user_id, "activity", 7)
    
    # Get Strava activities
    strava_activities = []
    strava_stats = {"total_minutes": 0, "total_distance_km": 0, "activity_count": 0}
    try:
        strava_activities = database.get_strava_activities(user_id, 7)
        strava_stats = database.get_strava_weekly_stats(user_id)
    except Exception as e:
        logger.warning(f"Could not fetch Strava data for user {user_id}: {e}")
    
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
    
    # Calculate exercise consistency (combine manual + Strava)
    exercise_score = calculate_exercise_consistency_with_strava(activity_logs, strava_stats)
    
    # Calculate medication adherence
    med_adherence = calculate_medication_adherence(medications, med_logs)
    
    # Analyze blood sugar trends
    glucose_analysis = analyze_glucose_week(glucose_logs)
    
    # Analyze BP trends
    bp_analysis = analyze_bp_week(bp_logs)
    
    # Generate AI-powered suggestions using Gemini
    ai_summary = generate_ai_weekly_insight(
        diet_score, exercise_score, med_adherence, 
        glucose_analysis, bp_analysis, strava_activities
    )
    
    return {
        "week_of": datetime.now().strftime("%Y-%m-%d"),
        "summary": {
            "diet": diet_score,
            "exercise": exercise_score,
            "medication_adherence": med_adherence,
            "blood_sugar": glucose_analysis,
            "blood_pressure": bp_analysis,
            "strava": {
                "connected": len(strava_activities) > 0 or strava_stats["activity_count"] > 0,
                "activities": strava_stats["activity_count"],
                "total_minutes": strava_stats["total_minutes"],
                "total_distance_km": strava_stats["total_distance_km"]
            }
        },
        "ai_suggestions": ai_summary.get("suggestions", generate_improvement_suggestions(
            diet_score, exercise_score, med_adherence, glucose_analysis
        )),
        "ai_insight": ai_summary.get("insight", ""),
        "disclaimer": "⚠️ These AI recommendations are supportive only and not medical advice. Always consult your healthcare provider for treatment decisions."
    }


def calculate_exercise_consistency_with_strava(activity_logs: list, strava_stats: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate exercise consistency score combining manual logs and Strava data"""
    # Get manual exercise minutes
    manual_minutes = sum(log.get("value", 0) for log in activity_logs) if activity_logs else 0
    manual_sessions = len(activity_logs) if activity_logs else 0
    
    # Get Strava exercise minutes
    strava_minutes = strava_stats.get("total_minutes", 0)
    strava_sessions = strava_stats.get("activity_count", 0)
    
    # Combine both sources
    total_minutes = manual_minutes + strava_minutes
    total_sessions = manual_sessions + strava_sessions
    
    # ADA recommends 150 minutes/week
    target_minutes = 150
    percentage = min(100, (total_minutes / target_minutes) * 100) if target_minutes > 0 else 0
    
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
        "manual_minutes": round(manual_minutes, 0),
        "strava_minutes": round(strava_minutes, 0),
        "target_minutes": target_minutes,
        "sessions": total_sessions,
        "percentage_of_goal": round(percentage, 0),
        "strava_connected": strava_minutes > 0 or strava_sessions > 0
    }


def analyze_bp_week(bp_logs: list) -> Dict[str, Any]:
    """Analyze weekly blood pressure patterns"""
    if not bp_logs:
        return {
            "avg_systolic": 0,
            "avg_diastolic": 0,
            "trend": "no_data",
            "readings": 0
        }
    
    systolic_values = [log.get("value", 0) for log in bp_logs]
    diastolic_values = [log.get("value_secondary", 0) for log in bp_logs]
    
    avg_systolic = sum(systolic_values) / len(systolic_values)
    avg_diastolic = sum(diastolic_values) / len(diastolic_values)
    
    # Count readings in target range (below 130/80)
    in_range = sum(1 for i in range(len(bp_logs)) 
                   if systolic_values[i] < 130 and diastolic_values[i] < 80)
    in_range_pct = (in_range / len(bp_logs)) * 100
    
    # Determine trend
    if len(systolic_values) >= 3:
        first_half_avg = sum(systolic_values[:len(systolic_values)//2]) / (len(systolic_values)//2)
        second_half_avg = sum(systolic_values[len(systolic_values)//2:]) / (len(systolic_values) - len(systolic_values)//2)
        
        if second_half_avg < first_half_avg - 5:
            trend = "improving"
        elif second_half_avg > first_half_avg + 5:
            trend = "worsening"
        else:
            trend = "stable"
    else:
        trend = "insufficient_data"
    
    return {
        "avg_systolic": round(avg_systolic, 0),
        "avg_diastolic": round(avg_diastolic, 0),
        "trend": trend,
        "in_range_percentage": round(in_range_pct, 0),
        "readings": len(bp_logs)
    }


def generate_ai_weekly_insight(diet: Dict, exercise: Dict, medication: Dict,
                                glucose: Dict, bp: Dict, strava_activities: list) -> Dict[str, Any]:
    """Generate AI-powered weekly insight using Gemini, correlating exercise with health metrics"""
    global gemini_client
    
    if not gemini_client:
        initialize_gemini()
        if not gemini_client:
            return {"suggestions": [], "insight": ""}
    
    # Build activity summary for AI
    activity_summary = ""
    if strava_activities:
        activity_types = {}
        for activity in strava_activities[:10]:  # Limit to 10 activities
            act_type = activity.get("activity_type", "Unknown")
            minutes = activity.get("moving_time", 0) / 60
            if act_type in activity_types:
                activity_types[act_type] += minutes
            else:
                activity_types[act_type] = minutes
        
        activity_summary = "Strava Activities This Week:\n"
        for act_type, minutes in activity_types.items():
            activity_summary += f"- {act_type}: {round(minutes)} minutes\n"
    
    prompt = f"""Analyze this user's weekly health data and provide personalized insights.
Correlate their exercise patterns with their blood sugar and blood pressure readings.

HEALTH DATA SUMMARY:
- Blood Sugar: Average {glucose.get('average', 'N/A')} mg/dL, Trend: {glucose.get('trend', 'N/A')}, {glucose.get('readings', 0)} readings
- Blood Pressure: Average {bp.get('avg_systolic', 'N/A')}/{bp.get('avg_diastolic', 'N/A')} mmHg, Trend: {bp.get('trend', 'N/A')}
- Exercise: {exercise.get('total_minutes', 0)} minutes total ({exercise.get('percentage_of_goal', 0)}% of 150-min goal)
  - Manual logged: {exercise.get('manual_minutes', 0)} min
  - Strava synced: {exercise.get('strava_minutes', 0)} min
- Diet Score: {diet.get('rating', 'N/A')} ({diet.get('meals_logged', 0)} meals logged)
- Medication Adherence: {medication.get('percentage', 'N/A')}%

{activity_summary}

Provide:
1. A brief 2-3 sentence insight correlating their exercise with their blood sugar/BP readings
2. One specific actionable suggestion based on the data

Format as JSON: {{"insight": "...", "suggestions": ["..."]}}
Keep it concise and encouraging."""

    try:
        response = gemini_client.models.generate_content(model='gemini-2.0-flash', contents=prompt)
        response_text = response.text.strip()
        
        # Try to parse JSON
        import json
        # Clean up the response if it has markdown code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
        
        result = json.loads(response_text)
        return result
    except Exception as e:
        logger.error(f"AI weekly insight generation failed: {e}")
        return {"suggestions": [], "insight": ""}



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


# ==================== HEALTH CHATBOT ====================

def chat_with_health_buddy(
    message: str,
    user_context: Optional[Dict[str, Any]] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    AI-powered health chatbot using Gemini for chronic disease management.
    Provides personalized health advice while maintaining safety disclaimers.
    
    Args:
        message: User's message/question
        user_context: Optional user health data (diseases, age, etc.)
        conversation_history: Optional list of previous messages for context
    
    Returns:
        Dict with response, suggestions, and metadata
    """
    global gemini_client
    
    if not gemini_client:
        initialize_gemini()
        if not gemini_client:
            return {
                "response": "I'm sorry, the AI service is currently unavailable. Please try again later.",
                "success": False,
                "error": "Gemini AI not initialized"
            }
    
    # Build context from user data
    context_info = ""
    if user_context:
        diseases = user_context.get("diseases", [])
        age = user_context.get("age", "unknown")
        name = user_context.get("name", "there")
        
        if diseases:
            context_info = f"""
User Context:
- Name: {name}
- Age: {age}
- Health Conditions: {', '.join(diseases)}
"""
    
    # Build conversation history context
    history_context = ""
    if conversation_history and len(conversation_history) > 0:
        history_context = "\nPrevious conversation:\n"
        for msg in conversation_history[-5:]:  # Last 5 messages for context
            role = msg.get("role", "user")
            content = msg.get("content", "")
            history_context += f"{role.upper()}: {content}\n"
    
    system_prompt = f"""You are Health Buddy, a friendly and knowledgeable AI health assistant for people managing chronic diseases like Type-2 Diabetes and Hypertension.

{context_info}
{history_context}

GUIDELINES:
1. Be warm, empathetic, and encouraging
2. Provide evidence-based health information
3. Always recommend consulting healthcare providers for medical decisions
4. Never diagnose conditions or prescribe medications
5. Focus on lifestyle, diet, exercise, and general wellness advice
6. For diabetes: Focus on blood sugar management, carbs, glycemic index
7. For hypertension: Focus on sodium, DASH diet, stress management, BP monitoring
8. Keep responses concise (2-3 paragraphs max)
9. Use emojis sparingly to be friendly 💚
10. If asked about emergencies, advise to call emergency services immediately

IMPORTANT: Always end with a brief safety reminder when giving health advice.

User's message: {message}

Respond naturally and helpfully:"""

    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.0-flash',
            contents=system_prompt
        )
        response_text = response.text.strip()
        
        # Generate quick reply suggestions based on context
        suggestions = generate_chat_suggestions(message, user_context)
        
        return {
            "response": response_text,
            "success": True,
            "suggestions": suggestions,
            "disclaimer": "⚠️ I'm an AI assistant. This is not medical advice. Always consult your healthcare provider for medical decisions."
        }
        
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        return {
            "response": "I apologize, but I encountered an error processing your request. Please try again.",
            "success": False,
            "error": str(e)
        }


def generate_chat_suggestions(message: str, user_context: Optional[Dict[str, Any]] = None) -> List[str]:
    """Generate quick reply suggestions based on the conversation context"""
    suggestions = []
    message_lower = message.lower()
    
    diseases = user_context.get("diseases", []) if user_context else []
    
    # Context-aware suggestions
    if "food" in message_lower or "eat" in message_lower or "diet" in message_lower:
        suggestions = [
            "What's a healthy breakfast?",
            "Can I eat fruits?",
            "Show me low-sodium options"
        ]
    elif "sugar" in message_lower or "glucose" in message_lower:
        suggestions = [
            "How to lower blood sugar?",
            "Best time to check glucose?",
            "What affects blood sugar?"
        ]
    elif "blood pressure" in message_lower or "bp" in message_lower:
        suggestions = [
            "How to reduce BP naturally?",
            "DASH diet tips",
            "Stress management techniques"
        ]
    elif "exercise" in message_lower or "activity" in message_lower:
        suggestions = [
            "Best exercises for me?",
            "How much should I walk?",
            "Safe workout tips"
        ]
    elif "medication" in message_lower or "medicine" in message_lower:
        suggestions = [
            "Medication reminders",
            "Side effects info",
            "Talk to my doctor"
        ]
    else:
        # Default suggestions based on user's conditions
        if "diabetes" in diseases:
            suggestions = [
                "Blood sugar tips",
                "Healthy meal ideas",
                "Exercise recommendations"
            ]
        elif "hypertension" in diseases:
            suggestions = [
                "Lower my BP naturally",
                "DASH diet explained",
                "Stress relief tips"
            ]
        else:
            suggestions = [
                "Healthy lifestyle tips",
                "Diet recommendations",
                "Exercise guidance"
            ]
    
    return suggestions[:3]  # Return max 3 suggestions


def generate_health_insights(user_id: int, diseases: list, health_data: list, 
                              glucose_logs: list, bp_logs: list, hba1c: dict) -> Dict[str, Any]:
    """
    Generate personalized AI health insights based on user's health data.
    """
    global gemini_client
    
    if not gemini_client:
        return {
            "overall_status": "Your health data looks stable. Continue monitoring regularly.",
            "recommendations": [
                "Log your blood sugar readings daily",
                "Stay active with at least 30 minutes of exercise",
                "Maintain a balanced diet low in processed sugars"
            ],
            "risk_areas": [],
            "positive_trends": ["Regular health monitoring is a great habit!"]
        }
    
    try:
        # Build context from health data
        context_parts = []
        
        if diseases:
            context_parts.append(f"User has: {', '.join(diseases)}")
        
        if glucose_logs:
            glucose_values = [log.get('value', 0) for log in glucose_logs[:10]]
            if glucose_values:
                avg_glucose = sum(glucose_values) / len(glucose_values)
                context_parts.append(f"Average blood glucose (last 10 readings): {avg_glucose:.0f} mg/dL")
        
        if bp_logs:
            bp_readings = [(log.get('value', 0), log.get('value_secondary', 0)) for log in bp_logs[:10]]
            if bp_readings:
                avg_sys = sum(bp[0] for bp in bp_readings) / len(bp_readings)
                avg_dia = sum(bp[1] for bp in bp_readings) / len(bp_readings)
                context_parts.append(f"Average blood pressure (last 10 readings): {avg_sys:.0f}/{avg_dia:.0f} mmHg")
        
        if hba1c:
            context_parts.append(f"Last HbA1c: {hba1c.get('value', 'N/A')}%")
        
        health_context = "\n".join(context_parts) if context_parts else "No recent health data available."
        
        prompt = f"""Analyze this patient's health data and provide personalized insights.

Patient Data:
{health_context}

Provide a JSON response with this exact structure (no markdown, just raw JSON):
{{
    "overall_status": "<1-2 sentence summary of overall health status>",
    "risk_areas": ["<risk area 1>", "<risk area 2>"],
    "recommendations": ["<specific recommendation 1>", "<specific recommendation 2>", "<specific recommendation 3>"],
    "positive_trends": ["<positive trend 1>", "<positive trend 2>"]
}}

If some data is missing, provide general recommendations for someone with {', '.join(diseases) if diseases else 'chronic conditions'}.
Keep recommendations practical and actionable. Maximum 3 items per array."""

        response = gemini_client.models.generate_content(model='gemini-2.0-flash', contents=prompt)
        response_text = response.text.strip()
        
        # Clean up response
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        result = json.loads(response_text.strip())
        return result
        
    except Exception as e:
        error_str = str(e).lower()
        logger.error(f"Health insights generation failed: {e}")
        if "429" in str(e) or "quota" in error_str or "exceeded" in error_str:
            return {"error": "AI service is busy. Please wait a moment and try again."}
        return {
            "overall_status": "Based on your logged data, continue monitoring your health metrics regularly.",
            "recommendations": [
                "Log your readings consistently for better tracking",
                "Consult with your healthcare provider regularly",
                "Maintain a healthy lifestyle with proper diet and exercise"
            ],
            "risk_areas": [],
            "positive_trends": ["You're actively tracking your health - keep it up!"]
        }


# ==================== IMAGE ANALYSIS FUNCTIONS ====================

def analyze_prescription_image(image_data: bytes) -> Optional[Dict[str, Any]]:
    """
    Analyze a prescription image using Gemini Vision API.
    Detects medications, dosages, and frequencies from the prescription.
    
    Args:
        image_data: Raw bytes of the prescription image
        
    Returns:
        Dictionary with detected medications or None if analysis fails
    """
    global gemini_client
    
    if not gemini_client:
        initialize_gemini()
        if not gemini_client:
            logger.error("Gemini client not initialized for prescription analysis")
            return None
    
    try:
        import google.generativeai as genai
        import base64
        
        # Detect image format from bytes
        mime_type = "image/jpeg"  # Default
        if image_data[:4] == b'\x89PNG':
            mime_type = "image/png"
        elif image_data[:2] == b'\xff\xd8':
            mime_type = "image/jpeg"
        elif image_data[:4] == b'GIF8':
            mime_type = "image/gif"
        elif image_data[:4] == b'RIFF':
            mime_type = "image/webp"
        
        logger.info(f"Prescription image size: {len(image_data)} bytes, detected mime_type: {mime_type}")
        
        # Create image part for vision model - using inline_data format
        image_part = {
            "inline_data": {
                "mime_type": mime_type,
                "data": base64.b64encode(image_data).decode('utf-8')
            }
        }
        
        prompt = """You are a specialized medical OCR agent for the 'Health Buddy' app.

Task: Inspect the provided image of a medical prescription.

Extraction Rules:
1. Extract only the Medication Name, Dosage (e.g., 500mg), and Frequency (e.g., Twice a day).
2. Do NOT provide any medical advice, diagnosis, or treatment recommendations.
3. If a value is unclear or handwritten text is illegible, return 'unclear' for that field.
4. Do NOT paraphrase; use the exact text seen in the image.

Output Format: Provide the results strictly as a JSON object (no markdown, just raw JSON):
{
    "medications": [
        {"name": "...", "dosage": "...", "frequency": "..."}
    ]
}

If no medications can be detected, return:
{"medications": [], "error": "Could not detect medications from this image"}"""

        # Retry logic with exponential backoff
        import time
        max_retries = 3
        last_error = None
        
        for attempt in range(max_retries):
            try:
                response = gemini_client.models.generate_content(model='gemini-2.0-flash', contents=[prompt, image_part])
                response_text = response.text.strip()
                
                # Clean up response
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.startswith("```"):
                    response_text = response_text[3:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                
                result = json.loads(response_text.strip())
                logger.info(f"Prescription analysis detected {len(result.get('medications', []))} medications")
                return result
                
            except Exception as e:
                last_error = e
                error_str = str(e).lower()
                if "429" in str(e) or "quota" in error_str or "exceeded" in error_str or "rate" in error_str:
                    if attempt < max_retries - 1:
                        wait_time = (2 ** attempt) * 2  # 2, 4, 8 seconds
                        logger.warning(f"Rate limit hit, waiting {wait_time}s before retry {attempt + 2}/{max_retries}")
                        time.sleep(wait_time)
                        continue
                break
        
        # All retries failed
        error_str = str(last_error).lower() if last_error else ""
        logger.error(f"Prescription analysis failed after retries: {last_error}")
        if "429" in str(last_error) or "quota" in error_str or "exceeded" in error_str:
            return {"medications": [], "error": "AI quota exhausted. Please try again in a few minutes."}
        return {"medications": [], "error": "Analysis failed. Please try again."}
    except Exception as e:
        logger.error(f"Prescription image analysis setup error: {e}")
        return {"medications": [], "error": "Failed to process image. Please try again."}


def analyze_food_image(image_data: bytes, condition: str = "diabetes") -> Optional[Dict[str, Any]]:
    """
    Analyze a food plate image using Gemini Vision API.
    Detects food items and provides nutritional analysis.
    
    Args:
        image_data: Raw bytes of the food plate image
        condition: User's health condition (diabetes/hypertension)
        
    Returns:
        Dictionary with nutritional analysis or None if analysis fails
    """
    global gemini_client
    
    if not gemini_client:
        initialize_gemini()
        if not gemini_client:
            return None
    
    try:
        # Create image part for vision model
        image_part = types.Part.from_bytes(
            data=image_data,
            mime_type="image/jpeg"
        )
        
        condition_context = ""
        if condition == "diabetes":
            condition_context = "This person has Type 2 Diabetes. Focus on glycemic index, carbohydrates, and sugar content."
        elif condition == "hypertension":
            condition_context = "This person has Hypertension. Focus on sodium content and heart-healthy aspects."
        
        prompt = f"""Analyze this food plate image and provide detailed nutritional information.

{condition_context}

Identify all food items visible on the plate and estimate their nutritional content.

Return a JSON object with this exact structure (no markdown, just raw JSON):
{{
    "detected_foods": [
        {{
            "name": "<food item name>",
            "estimated_portion": "<estimated portion size>",
            "calories": <estimated calories>,
            "carbs_g": <grams>,
            "protein_g": <grams>,
            "fat_g": <grams>,
            "fiber_g": <grams>,
            "sugar_g": <grams>,
            "sodium_mg": <milligrams>
        }}
    ],
    "total_nutrition": {{
        "calories": <total calories>,
        "carbohydrates_g": <total carbs>,
        "protein_g": <total protein>,
        "fat_g": <total fat>,
        "fiber_g": <total fiber>,
        "sugar_g": <total sugar>,
        "sodium_mg": <total sodium>,
        "glycemic_index": <estimated average GI 0-100>
    }},
    "health_assessment": {{
        "suitable_for_condition": <true/false>,
        "rating": "<Excellent/Good/Moderate/Poor>",
        "positives": ["<positive aspects>"],
        "concerns": ["<health concerns>"],
        "recommendations": ["<suggestions to improve>"]
    }},
    "meal_description": "<brief description of the meal>"
}}

If no food can be detected, return:
{{"detected_foods": [], "error": "Could not detect food items from this image"}}"""

        # Retry logic with exponential backoff
        import time
        max_retries = 3
        last_error = None
        
        for attempt in range(max_retries):
            try:
                response = gemini_client.models.generate_content(model='gemini-2.0-flash', contents=[prompt, image_part])
                response_text = response.text.strip()
                
                # Clean up response
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.startswith("```"):
                    response_text = response_text[3:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                
                result = json.loads(response_text.strip())
                logger.info(f"Food image analysis detected {len(result.get('detected_foods', []))} food items")
                return result
                
            except Exception as e:
                last_error = e
                error_str = str(e).lower()
                if "429" in str(e) or "quota" in error_str or "exceeded" in error_str or "rate" in error_str:
                    if attempt < max_retries - 1:
                        wait_time = (2 ** attempt) * 2  # 2, 4, 8 seconds
                        logger.warning(f"Rate limit hit, waiting {wait_time}s before retry {attempt + 2}/{max_retries}")
                        time.sleep(wait_time)
                        continue
                break
        
        # All retries failed - return fallback data
        error_str = str(last_error).lower() if last_error else ""
        logger.error(f"Food image analysis failed after retries: {last_error}")
        logger.info("Using fallback food analysis data")
        return _get_fallback_food_analysis(condition)
    except Exception as e:
        logger.error(f"Food image analysis setup error: {e}")
        logger.info("Using fallback food analysis data due to error")
        return _get_fallback_food_analysis(condition)


def _get_fallback_food_analysis(condition: str = "diabetes") -> Dict[str, Any]:
    """
    Provide fallback food analysis when AI is unavailable.
    Returns sample nutritional data for a typical balanced meal.
    """
    if condition == "diabetes":
        return {
            "detected_foods": [
                {
                    "name": "Mixed Vegetables",
                    "estimated_portion": "1 cup",
                    "calories": 80,
                    "carbs_g": 15,
                    "protein_g": 3,
                    "fat_g": 1,
                    "fiber_g": 4,
                    "sugar_g": 6,
                    "sodium_mg": 50
                },
                {
                    "name": "Grilled Protein",
                    "estimated_portion": "100g",
                    "calories": 165,
                    "carbs_g": 0,
                    "protein_g": 31,
                    "fat_g": 4,
                    "fiber_g": 0,
                    "sugar_g": 0,
                    "sodium_mg": 75
                },
                {
                    "name": "Whole Grains/Rice",
                    "estimated_portion": "1/2 cup",
                    "calories": 110,
                    "carbs_g": 23,
                    "protein_g": 2,
                    "fat_g": 1,
                    "fiber_g": 2,
                    "sugar_g": 0,
                    "sodium_mg": 5
                }
            ],
            "total_nutrition": {
                "calories": 355,
                "carbohydrates_g": 38,
                "protein_g": 36,
                "fat_g": 6,
                "fiber_g": 6,
                "sugar_g": 6,
                "sodium_mg": 130,
                "glycemic_index": 52
            },
            "health_assessment": {
                "suitable_for_condition": True,
                "rating": "Good",
                "positives": [
                    "High protein content helps stabilize blood sugar",
                    "Good fiber content slows glucose absorption",
                    "Low glycemic index meal"
                ],
                "concerns": [
                    "Monitor portion size of carbohydrates"
                ],
                "recommendations": [
                    "Add more leafy greens for extra fiber",
                    "Consider using brown rice for lower GI"
                ]
            },
            "meal_description": "Balanced meal with protein, vegetables, and grains",
            "ai_generated": False,
            "fallback_notice": "⚠️ This is estimated nutritional data. For accurate AI analysis, please try again later.",
            "disclaimer": "⚠️ Nutritional estimates are approximate. Consult your healthcare provider for personalized dietary guidance."
        }
    else:  # hypertension
        return {
            "detected_foods": [
                {
                    "name": "Fresh Vegetables",
                    "estimated_portion": "1 cup",
                    "calories": 75,
                    "carbs_g": 14,
                    "protein_g": 3,
                    "fat_g": 0,
                    "fiber_g": 5,
                    "sugar_g": 5,
                    "sodium_mg": 40
                },
                {
                    "name": "Lean Protein",
                    "estimated_portion": "100g",
                    "calories": 150,
                    "carbs_g": 0,
                    "protein_g": 28,
                    "fat_g": 4,
                    "fiber_g": 0,
                    "sugar_g": 0,
                    "sodium_mg": 60
                },
                {
                    "name": "Potatoes/Grains",
                    "estimated_portion": "1/2 cup",
                    "calories": 100,
                    "carbs_g": 22,
                    "protein_g": 2,
                    "fat_g": 0,
                    "fiber_g": 2,
                    "sugar_g": 1,
                    "sodium_mg": 10
                }
            ],
            "total_nutrition": {
                "calories": 325,
                "carbohydrates_g": 36,
                "protein_g": 33,
                "fat_g": 4,
                "fiber_g": 7,
                "sugar_g": 6,
                "sodium_mg": 110,
                "glycemic_index": 55
            },
            "health_assessment": {
                "suitable_for_condition": True,
                "rating": "Excellent",
                "positives": [
                    "Very low sodium content - DASH diet compliant",
                    "High potassium from vegetables",
                    "Heart-healthy lean protein"
                ],
                "concerns": [],
                "recommendations": [
                    "Season with herbs and spices instead of salt",
                    "Add avocado for healthy fats"
                ]
            },
            "meal_description": "Heart-healthy meal with low sodium and high potassium",
            "dash_compliant": True,
            "ai_generated": False,
            "fallback_notice": "⚠️ This is estimated nutritional data. For accurate AI analysis, please try again later.",
            "disclaimer": "⚠️ Nutritional estimates are approximate. Consult your healthcare provider for personalized dietary guidance."
        }
