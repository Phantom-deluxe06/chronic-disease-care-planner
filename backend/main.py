"""
FastAPI Backend for Chronic Disease Care Planner
Hackathon MVP - Authentication & Care Plan API
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from jose import JWTError, jwt
import hashlib
import secrets
import traceback
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import database
import trend_analyzer
import ai_analyzer

# ==================== CONFIG ====================
# TODO: Move to environment variables for production
SECRET_KEY = "chronic-care-planner-hackathon-secret-key-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours for hackathon convenience

# ==================== APP SETUP ====================
app = FastAPI(
    title="Chronic Disease Care Planner API",
    description="Backend API for managing chronic disease care plans",
    version="1.0.0"
)

# CORS - Allow frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "https://chronic-disease-care-planner.vercel.app",
        "https://chronic-disease-care-planner-main.onrender.com",  # User's Render frontend
        "https://*.vercel.app",  # Allow Vercel preview deployments
        "https://*.onrender.com",  # Allow Render deployments
        # Mobile app origins (Capacitor)
        "capacitor://localhost",
        "ionic://localhost",
        "http://localhost",
        "https://localhost",
        "file://",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Allow requests with null origin (mobile apps)
    allow_origin_regex=r"(capacitor|ionic|file|http|https)://.*",
)


# JWT Bearer token security
security = HTTPBearer()

# ==================== MODELS ====================

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    age: int
    gender: str
    diseases: List[str]  # ["diabetes", "heart_disease", "hypertension"]
    health_data: Dict[str, Dict[str, Any]]  # {"diabetes": {"fasting_sugar": 120, ...}}


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]


class CarePlanTask(BaseModel):
    time: str
    task: str
    category: str
    priority: str


class CarePlanResponse(BaseModel):
    user_name: str
    diseases: List[str]
    date: str
    tasks: List[CarePlanTask]
    tips: List[str]
    citations: List[str] = []


# ==================== LOG MODELS ====================

class GlucoseLog(BaseModel):
    value: float  # mg/dL
    reading_type: str  # fasting, after_meal, random
    notes: Optional[str] = None


class BPLog(BaseModel):
    systolic: float  # mmHg
    diastolic: float  # mmHg
    pulse: Optional[int] = None  # bpm
    reading_context: Optional[str] = None  # morning, afternoon, evening, after_meal
    notes: Optional[str] = None


class FoodLog(BaseModel):
    calories: float
    meal_type: str  # breakfast, lunch, dinner, snack
    description: Optional[str] = None
    notes: Optional[str] = None


class ActivityLog(BaseModel):
    duration_minutes: float
    activity_type: str  # walking, running, yoga, etc.
    intensity: str = "moderate"  # light, moderate, vigorous
    notes: Optional[str] = None


class LogResponse(BaseModel):
    id: int
    message: str
    alert: Optional[str] = None


# ==================== NEW FEATURE MODELS ====================

class WaterLog(BaseModel):
    amount_ml: int = 250  # Default glass of water

class FoodAnalysisRequest(BaseModel):
    food_description: str
    quantity: str = "1 serving"
    meal_type: str  # breakfast, lunch, dinner, snack

class MedicationCreate(BaseModel):
    name: str
    dosage: str
    frequency: str  # daily, twice_daily, etc.
    times_of_day: List[str]  # ["08:00", "20:00"]
    notes: Optional[str] = None

class MedicationIntake(BaseModel):
    medication_id: int
    scheduled_time: str
    taken: bool = True

class AppointmentCreate(BaseModel):
    appointment_type: str  # doctor_visit, lab_test, etc.
    doctor_name: Optional[str] = None
    location: Optional[str] = None
    appointment_date: str  # YYYY-MM-DD
    appointment_time: Optional[str] = None
    notes: Optional[str] = None

class HbA1cLog(BaseModel):
    value: float
    test_date: str  # YYYY-MM-DD
    lab_name: Optional[str] = None
    notes: Optional[str] = None


# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    """Hash password using SHA-256 with salt (simple approach for hackathon MVP)"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${password_hash}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against stored hash"""
    try:
        salt, stored_hash = hashed_password.split('$')
        password_hash = hashlib.sha256((salt + plain_password).encode()).hexdigest()
        return password_hash == stored_hash
    except:
        return False



def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get current user from JWT token"""
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = database.get_user_by_id(int(user_id))
    if user is None:
        raise credentials_exception
    return user


# ==================== CARE PLAN GENERATION ====================

def generate_care_plan(user: dict, diseases: list, health_data: list) -> CarePlanResponse:
    """Generate personalized care plan based on user's diseases and health data"""
    tasks = []
    tips = []
    citations = []
    
    # Base tasks for everyone
    tasks.append(CarePlanTask(
        time="07:00 AM",
        task="Take morning medications",
        category="medication",
        priority="high"
    ))
    tasks.append(CarePlanTask(
        time="07:30 AM",
        task="Light stretching exercise (10 mins)",
        category="exercise",
        priority="medium"
    ))
    
    # Disease-specific tasks
    if "diabetes" in diseases:
        tasks.append(CarePlanTask(
            time="08:00 AM",
            task="Check fasting blood sugar level",
            category="monitoring",
            priority="high"
        ))
        tasks.append(CarePlanTask(
            time="12:00 PM",
            task="Eat balanced lunch (low glycemic index)",
            category="diet",
            priority="high"
        ))
        tasks.append(CarePlanTask(
            time="06:00 PM",
            task="Check post-meal blood sugar",
            category="monitoring",
            priority="medium"
        ))
        tips.append("Keep blood sugar levels between 80-130 mg/dL before meals (ADA Guidelines)")
        tips.append("Stay hydrated - drink at least 8 glasses of water daily")
        tips.append("Target HbA1c below 7% for most adults with diabetes")
        citations.append("American Diabetes Association. Standards of Medical Care in Diabetes—2024. Diabetes Care 2024;47(Suppl 1)")
    
    if "heart_disease" in diseases:
        tasks.append(CarePlanTask(
            time="08:30 AM",
            task="Monitor blood pressure",
            category="monitoring",
            priority="high"
        ))
        tasks.append(CarePlanTask(
            time="10:00 AM",
            task="30-minute brisk walk",
            category="exercise",
            priority="high"
        ))
        tasks.append(CarePlanTask(
            time="01:00 PM",
            task="Take heart medication with lunch",
            category="medication",
            priority="high"
        ))
        tips.append("Limit sodium intake to less than 2,300mg per day (AHA Guidelines)")
        tips.append("Avoid saturated fats and trans fats")
        tips.append("Aim for 150 minutes of moderate exercise per week")
        citations.append("American Heart Association. Diet and Lifestyle Recommendations. 2024")
    
    if "hypertension" in diseases:
        tasks.append(CarePlanTask(
            time="09:00 AM",
            task="Morning blood pressure check",
            category="monitoring",
            priority="high"
        ))
        tasks.append(CarePlanTask(
            time="05:00 PM",
            task="Evening blood pressure check",
            category="monitoring",
            priority="high"
        ))
        tasks.append(CarePlanTask(
            time="08:00 PM",
            task="Relaxation/meditation (15 mins)",
            category="wellness",
            priority="medium"
        ))
        tips.append("Target blood pressure below 130/80 mmHg (AHA Guidelines)")
        tips.append("Reduce salt intake to help control blood pressure")
        tips.append("Practice stress management techniques daily")
        citations.append("American Heart Association. Understanding Blood Pressure Readings. 2024")
    
    # Common evening tasks
    tasks.append(CarePlanTask(
        time="09:00 PM",
        task="Take evening medications",
        category="medication",
        priority="high"
    ))
    tasks.append(CarePlanTask(
        time="10:00 PM",
        task="Prepare for 7-8 hours of sleep",
        category="wellness",
        priority="medium"
    ))
    
    # Sort tasks by time
    tasks.sort(key=lambda x: datetime.strptime(x.time, "%I:%M %p"))
    
    return CarePlanResponse(
        user_name=user["name"],
        diseases=diseases,
        date=datetime.now().strftime("%Y-%m-%d"),
        tasks=tasks,
        tips=tips,
        citations=list(set(citations))  # Remove duplicates
    )



# ==================== API ENDPOINTS ====================

@app.on_event("startup")
def startup():
    """Initialize database on startup"""
    database.init_all_tables()


@app.get("/")
def root():
    return {"message": "Welcome to Chronic Disease Care Planner API"}


@app.post("/signup", response_model=Token)
def signup(user_data: UserSignup):
    """Register a new user with their health data"""
    try:
        logger.info(f"Signup attempt for email: {user_data.email}")
        
        # Check if user exists
        existing_user = database.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        logger.info("Hashing password...")
        password_hash = hash_password(user_data.password)
        logger.info("Creating user in database...")
        user_id = database.create_user(
            name=user_data.name,
            email=user_data.email,
            password_hash=password_hash,
            age=user_data.age,
            gender=user_data.gender
        )
        logger.info(f"User created with ID: {user_id}")
        
        # Save health data for each disease
        for disease in user_data.diseases:
            disease_data = user_data.health_data.get(disease, {})
            database.save_health_data(user_id, disease, disease_data)
            logger.info(f"Saved health data for disease: {disease}")
        
        # Generate token
        access_token = create_access_token(
            data={"sub": str(user_id)},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        user = database.get_user_by_id(user_id)
        diseases = database.get_user_diseases(user_id)
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "age": user["age"],
                "gender": user["gender"],
                "diseases": diseases
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Signup failed: {str(e)}"
        )


@app.post("/login", response_model=Token)
def login(credentials: UserLogin):
    """Authenticate user and return JWT token"""
    user = database.get_user_by_email(credentials.email)
    
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": str(user["id"])},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    diseases = database.get_user_diseases(user["id"])
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "age": user["age"],
            "gender": user["gender"],
            "diseases": diseases
        }
    )


@app.get("/me")
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user's information"""
    diseases = database.get_user_diseases(current_user["id"])
    health_data = database.get_user_health_data(current_user["id"])
    
    return {
        **current_user,
        "diseases": diseases,
        "health_data": health_data
    }


@app.get("/care-plan", response_model=CarePlanResponse)
def get_care_plan(current_user: dict = Depends(get_current_user)):
    """Get personalized care plan for the current user"""
    diseases = database.get_user_diseases(current_user["id"])
    health_data = database.get_user_health_data(current_user["id"])
    
    return generate_care_plan(current_user, diseases, health_data)


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


# ==================== DAILY LOG ENDPOINTS ====================

# Thresholds for alerts (based on ADA/AHA guidelines)
GLUCOSE_THRESHOLDS = {
    "low": 70,      # mg/dL - hypoglycemia
    "high": 180,    # mg/dL - hyperglycemia requiring attention
    "critical_low": 54,   # mg/dL - severe hypoglycemia
    "critical_high": 250  # mg/dL - seek medical attention
}

BP_THRESHOLDS = {
    "systolic_high": 140,   # mmHg - stage 2 hypertension
    "diastolic_high": 90,   # mmHg
    "systolic_low": 90,     # mmHg - hypotension
    "diastolic_low": 60,    # mmHg
    "systolic_crisis": 180, # mmHg - hypertensive crisis
    "diastolic_crisis": 120 # mmHg
}


def check_glucose_threshold(value: float) -> Optional[str]:
    """Check if glucose value triggers an alert"""
    if value <= GLUCOSE_THRESHOLDS["critical_low"]:
        return "⚠️ CRITICAL: Severe hypoglycemia! Consume fast-acting glucose immediately and contact your healthcare provider."
    if value >= GLUCOSE_THRESHOLDS["critical_high"]:
        return "⚠️ CRITICAL: Very high blood sugar! Consider contacting your healthcare provider."
    if value <= GLUCOSE_THRESHOLDS["low"]:
        return "⚠️ Low blood sugar detected. Consider having a small snack."
    if value >= GLUCOSE_THRESHOLDS["high"]:
        return "⚠️ Elevated blood sugar. Monitor closely and follow your care plan."
    return None


def check_bp_threshold(systolic: float, diastolic: float) -> Optional[str]:
    """Check if BP values trigger an alert"""
    if systolic >= BP_THRESHOLDS["systolic_crisis"] or diastolic >= BP_THRESHOLDS["diastolic_crisis"]:
        return "⚠️ CRITICAL: Blood pressure is dangerously high! Seek immediate medical attention."
    if systolic <= BP_THRESHOLDS["systolic_low"] or diastolic <= BP_THRESHOLDS["diastolic_low"]:
        return "⚠️ Low blood pressure detected. Sit down, drink water, and monitor symptoms."
    if systolic >= BP_THRESHOLDS["systolic_high"] or diastolic >= BP_THRESHOLDS["diastolic_high"]:
        return "⚠️ Elevated blood pressure. Rest and re-check in 15 minutes. Contact your provider if it persists."
    return None


@app.post("/logs/glucose", response_model=LogResponse)
def log_glucose(log: GlucoseLog, current_user: dict = Depends(get_current_user)):
    """Log a blood glucose reading"""
    alert = check_glucose_threshold(log.value)
    
    log_id = database.save_daily_log(
        user_id=current_user["id"],
        log_type="glucose",
        value=log.value,
        unit="mg/dL",
        reading_context=log.reading_type,
        notes=log.notes
    )
    
    return LogResponse(
        id=log_id,
        message=f"Glucose reading of {log.value} mg/dL logged successfully",
        alert=alert
    )


@app.post("/logs/bp", response_model=LogResponse)
def log_blood_pressure(log: BPLog, current_user: dict = Depends(get_current_user)):
    """Log a blood pressure reading"""
    alert = check_bp_threshold(log.systolic, log.diastolic)
    
    log_id = database.save_daily_log(
        user_id=current_user["id"],
        log_type="bp",
        value=log.systolic,
        value_secondary=log.diastolic,
        unit="mmHg",
        notes=log.notes
    )
    
    return LogResponse(
        id=log_id,
        message=f"Blood pressure {log.systolic}/{log.diastolic} mmHg logged successfully",
        alert=alert
    )


@app.post("/logs/food", response_model=LogResponse)
def log_food(log: FoodLog, current_user: dict = Depends(get_current_user)):
    """Log food intake"""
    log_id = database.save_daily_log(
        user_id=current_user["id"],
        log_type="food",
        value=log.calories,
        unit="kcal",
        reading_context=log.meal_type,
        notes=f"{log.description or ''} {log.notes or ''}".strip()
    )
    
    return LogResponse(
        id=log_id,
        message=f"{log.meal_type.title()} logged: {log.calories} kcal"
    )


@app.post("/logs/activity", response_model=LogResponse)
def log_activity(log: ActivityLog, current_user: dict = Depends(get_current_user)):
    """Log physical activity"""
    log_id = database.save_daily_log(
        user_id=current_user["id"],
        log_type="activity",
        value=log.duration_minutes,
        unit="minutes",
        reading_context=f"{log.activity_type} ({log.intensity})",
        notes=log.notes
    )
    
    return LogResponse(
        id=log_id,
        message=f"Activity logged: {log.duration_minutes} minutes of {log.activity_type}"
    )


@app.get("/logs/{log_type}")
def get_logs(log_type: str, days: int = 7, current_user: dict = Depends(get_current_user)):
    """Get logs by type for the current user"""
    valid_types = ["glucose", "bp", "food", "activity"]
    if log_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid log type. Must be one of: {valid_types}"
        )
    
    logs = database.get_daily_logs(current_user["id"], log_type, days)
    stats = database.get_weekly_stats(current_user["id"], log_type)
    
    return {
        "logs": logs,
        "stats": stats,
        "count": len(logs)
    }


@app.get("/logs")
def get_all_logs(days: int = 7, current_user: dict = Depends(get_current_user)):
    """Get all logs for the current user"""
    logs = database.get_daily_logs(current_user["id"], days=days)
    return {
        "logs": logs,
        "count": len(logs)
    }


# ==================== TREND ANALYSIS ENDPOINTS ====================

@app.get("/trends")
def get_trends(current_user: dict = Depends(get_current_user)):
    """Get comprehensive trend analysis for the current user"""
    diseases = database.get_user_diseases(current_user["id"])
    return trend_analyzer.get_full_trend_report(current_user["id"], diseases)


@app.get("/trends/glucose")
def get_glucose_trends(current_user: dict = Depends(get_current_user)):
    """Get glucose-specific trend analysis"""
    return trend_analyzer.analyze_glucose_trends(current_user["id"])


@app.get("/trends/bp")
def get_bp_trends(current_user: dict = Depends(get_current_user)):
    """Get blood pressure trend analysis"""
    return trend_analyzer.analyze_bp_trends(current_user["id"])


@app.get("/weekly-adjustments")
def get_weekly_adjustments(current_user: dict = Depends(get_current_user)):
    """Get weekly care plan adjustments based on trends"""
    diseases = database.get_user_diseases(current_user["id"])
    return trend_analyzer.generate_weekly_adjustments(current_user["id"], diseases)


# ==================== WATER TRACKING ENDPOINTS ====================

@app.post("/logs/water", response_model=LogResponse)
def log_water(log: WaterLog, current_user: dict = Depends(get_current_user)):
    """Log water intake"""
    log_id = database.save_water_log(current_user["id"], log.amount_ml)
    
    # Check if intake is low
    today = database.get_water_logs_today(current_user["id"])
    alert = None
    if today["total_ml"] < 1500:  # Less than 1.5L by mid-day
        alert = "💧 Remember to stay hydrated! Target: 2.5-3 liters per day."
    
    return LogResponse(
        id=log_id,
        message=f"Water intake logged: {log.amount_ml}ml (Total today: {today['total_ml']}ml)",
        alert=alert
    )


@app.get("/water/today")
def get_water_today(current_user: dict = Depends(get_current_user)):
    """Get today's water intake"""
    data = database.get_water_logs_today(current_user["id"])
    target_ml = 2500  # 2.5 liters
    return {
        **data,
        "target_ml": target_ml,
        "percentage": round((data["total_ml"] / target_ml) * 100, 0),
        "remaining_ml": max(0, target_ml - data["total_ml"])
    }


# ==================== AI FOOD ANALYSIS ENDPOINTS ====================

@app.post("/food/analyze")
def analyze_food(request: FoodAnalysisRequest, current_user: dict = Depends(get_current_user)):
    """Analyze food for nutritional content and diabetes suitability using AI"""
    # Use AI-powered analysis
    analysis = ai_analyzer.analyze_food_ai(request.food_description, request.quantity)
    
    # Also save as food log
    log_id = database.save_daily_log(
        user_id=current_user["id"],
        log_type="food",
        value=analysis["nutrition"]["calories"],
        unit="kcal",
        reading_context=request.meal_type,
        notes=f"{request.food_description} | {request.quantity}"
    )
    
    return {
        "log_id": log_id,
        **analysis
    }


@app.post("/food/analyze-hypertension")
def analyze_food_hypertension(request: FoodAnalysisRequest, current_user: dict = Depends(get_current_user)):
    """Analyze food for sodium content and DASH diet compliance using AI"""
    # Use AI-powered hypertension-focused analysis
    analysis = ai_analyzer.analyze_food_hypertension_ai(request.food_description, request.quantity)
    
    # Also save as food log
    log_id = database.save_daily_log(
        user_id=current_user["id"],
        log_type="food",
        value=analysis["nutrition"]["calories"],
        unit="kcal",
        reading_context=request.meal_type,
        notes=f"[BP] {request.food_description} | {request.quantity} | Sodium: {analysis['nutrition'].get('sodium_mg', 0)}mg"
    )
    
    return {
        "log_id": log_id,
        **analysis
    }


# ==================== MEDICATION ENDPOINTS ====================


@app.post("/medications")
def create_medication(med: MedicationCreate, current_user: dict = Depends(get_current_user)):
    """Add a new medication (doctor-prescribed)"""
    med_id = database.save_medication(
        user_id=current_user["id"],
        name=med.name,
        dosage=med.dosage,
        frequency=med.frequency,
        times_of_day=med.times_of_day,
        notes=med.notes
    )
    return {
        "id": med_id,
        "message": f"Medication '{med.name}' added successfully",
        "warning": "⚠️ Never modify medication dosage without consulting your doctor."
    }


@app.get("/medications")
def get_medications(current_user: dict = Depends(get_current_user)):
    """Get all active medications"""
    medications = database.get_medications(current_user["id"])
    today_logs = database.get_medication_logs_today(current_user["id"])
    
    # Mark which doses have been taken today
    taken_times = {(log["medication_id"], log["scheduled_time"]) for log in today_logs}
    
    for med in medications:
        med["today_status"] = []
        for time in med["times_of_day"]:
            med["today_status"].append({
                "time": time,
                "taken": (med["id"], time) in taken_times
            })
    
    return {
        "medications": medications,
        "disclaimer": "⚠️ Do not modify dosage without consulting your doctor."
    }


@app.post("/medications/log")
def log_medication_intake(intake: MedicationIntake, current_user: dict = Depends(get_current_user)):
    """Log medication intake"""
    log_id = database.log_medication_intake(
        user_id=current_user["id"],
        medication_id=intake.medication_id,
        scheduled_time=intake.scheduled_time,
        taken=intake.taken
    )
    return {
        "id": log_id,
        "message": "Medication intake logged" if intake.taken else "Medication skipped"
    }


@app.delete("/medications/{medication_id}")
def delete_medication(medication_id: int, current_user: dict = Depends(get_current_user)):
    """Delete a medication"""
    try:
        success = database.delete_medication(current_user["id"], medication_id)
        if success:
            return {"message": "Medication deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Medication not found")
    except Exception as e:
        logger.error(f"Failed to delete medication: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== APPOINTMENT ENDPOINTS ====================

@app.post("/appointments")
def create_appointment(appt: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    """Create a new appointment"""
    appt_id = database.save_appointment(
        user_id=current_user["id"],
        appointment_type=appt.appointment_type,
        doctor_name=appt.doctor_name,
        location=appt.location,
        appointment_date=appt.appointment_date,
        appointment_time=appt.appointment_time,
        notes=appt.notes
    )
    return {
        "id": appt_id,
        "message": f"Appointment scheduled for {appt.appointment_date}"
    }


@app.get("/appointments")
def get_appointments(upcoming: bool = True, current_user: dict = Depends(get_current_user)):
    """Get appointments"""
    appointments = database.get_appointments(current_user["id"], upcoming)
    last_visit = database.get_last_doctor_visit(current_user["id"])
    
    # Check if doctor visit is overdue (more than 6 months)
    reminder = None
    if last_visit:
        from datetime import datetime
        last_date = datetime.strptime(last_visit["appointment_date"], "%Y-%m-%d")
        days_since = (datetime.now() - last_date).days
        if days_since > 180:
            reminder = f"⚠️ It's been {days_since} days since your last doctor visit. Schedule a check-up soon!"
    else:
        reminder = "📅 Don't forget to schedule regular check-ups with your doctor (every 3-6 months)."
    
    return {
        "appointments": appointments,
        "last_doctor_visit": last_visit,
        "reminder": reminder
    }


# ==================== HbA1c ENDPOINTS ====================

@app.post("/hba1c")
def log_hba1c(log: HbA1cLog, current_user: dict = Depends(get_current_user)):
    """Log an HbA1c test result"""
    log_id = database.save_hba1c(
        user_id=current_user["id"],
        value=log.value,
        test_date=log.test_date,
        lab_name=log.lab_name,
        notes=log.notes
    )
    
    # Provide feedback based on value
    feedback = None
    if log.value < 5.7:
        feedback = "✅ Normal range - Excellent blood sugar control!"
    elif log.value < 6.5:
        feedback = "⚠️ Prediabetes range (5.7-6.4%) - Consider lifestyle modifications."
    elif log.value < 7.0:
        feedback = "🎯 Good control for most diabetics. Target is below 7% (ADA Guidelines)."
    elif log.value < 8.0:
        feedback = "📊 Above target - Discuss with your doctor about optimizing your care plan."
    else:
        feedback = "⚠️ Above 8% - Please consult your healthcare provider about adjusting treatment."
    
    return {
        "id": log_id,
        "message": f"HbA1c of {log.value}% logged for {log.test_date}",
        "feedback": feedback,
        "citation": "American Diabetes Association. Standards of Medical Care in Diabetes—2024"
    }


@app.get("/hba1c")
def get_hba1c_history(current_user: dict = Depends(get_current_user)):
    """Get HbA1c history"""
    history = database.get_hba1c_history(current_user["id"])
    last = database.get_last_hba1c(current_user["id"])
    
    # Check if test is overdue
    reminder = None
    if last:
        from datetime import datetime
        last_date = datetime.strptime(last["test_date"], "%Y-%m-%d")
        days_since = (datetime.now() - last_date).days
        if days_since > 90:  # 3 months
            reminder = f"⏰ It's been {days_since} days since your last HbA1c test. Schedule one soon!"
    else:
        reminder = "📋 No HbA1c records found. This test should be done every 3-6 months."
    
    return {
        "history": history,
        "last_result": last,
        "reminder": reminder,
        "target": "Below 7% for most adults with diabetes (ADA Guidelines)"
    }


# ==================== WEEKLY SUMMARY ENDPOINT ====================

@app.get("/weekly-summary")
def get_weekly_summary(current_user: dict = Depends(get_current_user)):
    """Get AI-powered weekly health summary"""
    return ai_analyzer.generate_weekly_summary(current_user["id"])


@app.get("/health/ai-insights")
def get_ai_health_insights(current_user: dict = Depends(get_current_user)):
    """Get AI-powered personalized health insights based on user's health data"""
    try:
        # Get user's health data
        diseases = database.get_user_diseases(current_user["id"])
        health_data = database.get_user_health_data(current_user["id"])
        glucose_logs = database.get_daily_logs(current_user["id"], "glucose", 30)
        bp_logs = database.get_daily_logs(current_user["id"], "blood_pressure", 30)
        hba1c = database.get_last_hba1c(current_user["id"])
        
        # Generate AI insights
        insights = ai_analyzer.generate_health_insights(
            user_id=current_user["id"],
            diseases=diseases,
            health_data=health_data,
            glucose_logs=glucose_logs,
            bp_logs=bp_logs,
            hba1c=hba1c
        )
        return insights
    except Exception as e:
        logger.error(f"Failed to generate AI health insights: {e}")
        return {"error": "Could not generate insights. Please try again."}



# ==================== REMINDERS ENDPOINT ====================

@app.get("/reminders")
def get_reminders(current_user: dict = Depends(get_current_user)):
    """Get personalized diabetes care reminders"""
    reminders = database.get_active_reminders(current_user["id"])
    
    # Add default diabetes reminders
    default_reminders = [
        {
            "type": "foot_care",
            "title": "👣 Daily Foot Check",
            "description": "Check your feet for cuts, blisters, or sores using a mirror. This helps prevent infections.",
            "priority": "high"
        },
        {
            "type": "id_band",
            "title": "🏷️ Diabetes ID Band",
            "description": "Remember to wear your diabetes identification band or carry an ID card.",
            "priority": "medium"
        },
        {
            "type": "hydration",
            "title": "💧 Stay Hydrated",
            "description": "Drink 2.5-3 liters of water daily. Proper hydration helps manage blood sugar.",
            "priority": "medium"
        },
        {
            "type": "lifestyle",
            "title": "🚭 Healthy Lifestyle",
            "description": "Avoid smoking and limit alcohol consumption. These affect blood sugar control.",
            "priority": "high"
        }
    ]
    
    return {
        "custom_reminders": reminders,
        "daily_reminders": default_reminders,
        "disclaimer": "⚠️ These reminders support your care plan but do not replace medical advice."
    }


# ==================== TRAVEL SAFETY ENDPOINT ====================

@app.get("/travel-checklist")
def get_travel_checklist(current_user: dict = Depends(get_current_user)):
    """Get travel safety checklist for diabetics"""
    return {
        "checklist": [
            {"item": "Medications in hand luggage", "reason": "Never put insulin/medications in checked baggage - temperature changes can damage them"},
            {"item": "Diabetes ID band/card", "reason": "Helps medical staff identify your condition in emergencies"},
            {"item": "Emergency contact info", "reason": "Keep doctor's contact and emergency numbers accessible"},
            {"item": "Glucose tablets/snacks", "reason": "For managing low blood sugar during travel delays"},
            {"item": "Blood glucose meter & supplies", "reason": "Monitor your levels during travel"},
            {"item": "Doctor's letter", "reason": "Explains your medications and supplies for airport security"},
            {"item": "Extra medication supply", "reason": "Carry at least double your expected needs in case of delays"},
            {"item": "Medical insurance documents", "reason": "Ensure coverage for diabetes-related emergencies abroad"}
        ],
        "gp_letter_template": """
Dear Medical Professional,

This letter confirms that [Patient Name] has Type 2 Diabetes Mellitus and requires the following medications and supplies:

Medications:
- [List medications with dosages]

Medical Supplies:
- Blood glucose monitoring device
- Test strips
- Lancets
- [Other supplies as needed]

These items are essential for the management of their diabetes during travel.

Please contact me if you require any additional information.

Yours sincerely,
[Doctor's Name]
[Doctor's Contact]
        """,
        "disclaimer": "⚠️ Please have your doctor sign the letter before travel."
    }


# ==================== CHATBOT ENDPOINTS ====================

class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None

@app.post("/chat")
def chat_with_assistant(chat: ChatMessage, current_user: dict = Depends(get_current_user)):
    """Chat with Health Buddy AI assistant"""
    # Get user context for personalized responses
    diseases = database.get_user_diseases(current_user["id"])
    
    user_context = {
        "name": current_user.get("name", "there"),
        "age": current_user.get("age"),
        "diseases": diseases
    }
    
    # Call the AI chatbot
    response = ai_analyzer.chat_with_health_buddy(
        message=chat.message,
        user_context=user_context,
        conversation_history=chat.conversation_history
    )
    
    return response


@app.get("/chat/welcome")
def get_chat_welcome(current_user: dict = Depends(get_current_user)):
    """Get a personalized welcome message for the chatbot"""
    diseases = database.get_user_diseases(current_user["id"])
    name = current_user.get("name", "there")
    
    # Personalized greeting based on conditions
    condition_tips = []
    if "diabetes" in diseases:
        condition_tips.append("blood sugar management")
    if "hypertension" in diseases:
        condition_tips.append("blood pressure control")
    
    tips_text = " and ".join(condition_tips) if condition_tips else "your health journey"
    
    return {
        "welcome_message": f"Hi {name}! 👋 I'm Health Buddy, your AI health assistant. I'm here to help you with {tips_text}. How can I assist you today?",
        "suggestions": [
            "What should I eat today?",
            "Give me health tips",
            "How can I improve my readings?"
        ],
        "disclaimer": "⚠️ I'm an AI assistant. This is not medical advice. Always consult your healthcare provider."
    }


# ==================== IMAGE ANALYSIS ENDPOINTS ====================

from fastapi import UploadFile, File

@app.post("/prescription/analyze")
async def analyze_prescription(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze a prescription image to detect medications.
    Upload a prescription photo and get detected medications.
    """
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Analyze with AI
        result = ai_analyzer.analyze_prescription_image(contents)
        
        if result is None:
            raise HTTPException(
                status_code=503,
                detail="AI analysis service is not available. Please try again later."
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Prescription analysis endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/food/analyze-image")
async def analyze_food_image_endpoint(
    file: UploadFile = File(...),
    condition: str = "diabetes",
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze a food plate image to detect food items and nutritional content.
    Upload a food photo and get nutritional analysis.
    """
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Analyze with AI
        result = ai_analyzer.analyze_food_image(contents, condition)
        
        if result is None:
            raise HTTPException(
                status_code=503,
                detail="AI analysis service is not available. Please try again later."
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Food image analysis endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== STRAVA INTEGRATION ENDPOINTS ====================

import os
import httpx
from dotenv import load_dotenv
from fastapi.responses import RedirectResponse

load_dotenv()

STRAVA_CLIENT_ID = os.environ.get("STRAVA_CLIENT_ID", "197229")
STRAVA_CLIENT_SECRET = os.environ.get("STRAVA_CLIENT_SECRET", "")
# Use environment variable for redirect URI, defaulting to deployed Render URL
STRAVA_REDIRECT_URI = os.environ.get("STRAVA_REDIRECT_URI", "https://chronic-disease-care-planner-main.onrender.com/strava/callback")
STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize"
STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
STRAVA_API_URL = "https://www.strava.com/api/v3"


@app.get("/strava/auth")
def strava_auth(current_user: dict = Depends(get_current_user)):
    """Redirect user to Strava OAuth page"""
    auth_url = (
        f"{STRAVA_AUTH_URL}?"
        f"client_id={STRAVA_CLIENT_ID}&"
        f"redirect_uri={STRAVA_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=activity:read_all&"
        f"state={current_user['id']}"
    )
    return {"auth_url": auth_url}


@app.post("/strava/callback")
async def strava_callback(code: str, state: str, current_user: dict = Depends(get_current_user)):
    """Exchange authorization code for access tokens"""
    try:
        # Exchange code for tokens
        async with httpx.AsyncClient() as client:
            response = await client.post(
                STRAVA_TOKEN_URL,
                data={
                    "client_id": STRAVA_CLIENT_ID,
                    "client_secret": STRAVA_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code"
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Strava token exchange failed: {response.text}")
                raise HTTPException(
                    status_code=400,
                    detail="Failed to exchange code for tokens"
                )
            
            token_data = response.json()
        
        # Save tokens to database
        athlete = token_data.get("athlete", {})
        database.save_strava_tokens(
            user_id=current_user["id"],
            access_token=token_data["access_token"],
            refresh_token=token_data["refresh_token"],
            expires_at=token_data["expires_at"],
            athlete_id=athlete.get("id"),
            athlete_name=f"{athlete.get('firstname', '')} {athlete.get('lastname', '')}".strip()
        )
        
        logger.info(f"Strava connected for user {current_user['id']}")
        
        return {
            "success": True,
            "message": "Strava connected successfully",
            "athlete_name": f"{athlete.get('firstname', '')} {athlete.get('lastname', '')}".strip()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Strava callback error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def refresh_strava_token(user_id: int) -> Optional[Dict[str, Any]]:
    """Refresh Strava access token if expired"""
    tokens = database.get_strava_tokens(user_id)
    if not tokens:
        return None
    
    import time
    current_time = int(time.time())
    
    # If token is not expired, return existing tokens
    if tokens["expires_at"] > current_time:
        return tokens
    
    # Refresh the token
    async with httpx.AsyncClient() as client:
        response = await client.post(
            STRAVA_TOKEN_URL,
            data={
                "client_id": STRAVA_CLIENT_ID,
                "client_secret": STRAVA_CLIENT_SECRET,
                "grant_type": "refresh_token",
                "refresh_token": tokens["refresh_token"]
            }
        )
        
        if response.status_code != 200:
            logger.error(f"Strava token refresh failed: {response.text}")
            return None
        
        new_tokens = response.json()
    
    # Update tokens in database
    database.save_strava_tokens(
        user_id=user_id,
        access_token=new_tokens["access_token"],
        refresh_token=new_tokens["refresh_token"],
        expires_at=new_tokens["expires_at"],
        athlete_id=tokens.get("athlete_id"),
        athlete_name=tokens.get("athlete_name")
    )
    
    return database.get_strava_tokens(user_id)


@app.get("/strava/status")
async def strava_status(current_user: dict = Depends(get_current_user)):
    """Check if user has connected Strava"""
    tokens = database.get_strava_tokens(current_user["id"])
    
    if not tokens:
        return {"connected": False}
    
    return {
        "connected": True,
        "athlete_name": tokens.get("athlete_name", ""),
        "athlete_id": tokens.get("athlete_id")
    }


@app.post("/strava/sync")
async def strava_sync(current_user: dict = Depends(get_current_user)):
    """Sync activities from Strava"""
    try:
        # Get valid tokens (refresh if needed)
        tokens = await refresh_strava_token(current_user["id"])
        
        if not tokens:
            raise HTTPException(
                status_code=400,
                detail="Strava not connected. Please connect your Strava account first."
            )
        
        # Fetch activities from Strava
        import time
        after_timestamp = int(time.time()) - (7 * 24 * 60 * 60)  # Last 7 days
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{STRAVA_API_URL}/athlete/activities",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
                params={
                    "after": after_timestamp,
                    "per_page": 50
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Strava activities fetch failed: {response.text}")
                raise HTTPException(
                    status_code=400,
                    detail="Failed to fetch activities from Strava"
                )
            
            activities = response.json()
        
        # Save activities to database
        synced_count = 0
        for activity in activities:
            database.save_strava_activity(
                user_id=current_user["id"],
                strava_id=activity["id"],
                activity_type=activity.get("type", "Unknown"),
                name=activity.get("name", ""),
                distance=activity.get("distance", 0),
                moving_time=activity.get("moving_time", 0),
                elapsed_time=activity.get("elapsed_time", 0),
                start_date=activity.get("start_date", ""),
                start_date_local=activity.get("start_date_local", ""),
                average_speed=activity.get("average_speed"),
                max_speed=activity.get("max_speed"),
                average_heartrate=activity.get("average_heartrate"),
                max_heartrate=activity.get("max_heartrate"),
                calories=activity.get("calories")
            )
            synced_count += 1
        
        logger.info(f"Synced {synced_count} activities for user {current_user['id']}")
        
        return {
            "success": True,
            "synced_count": synced_count,
            "message": f"Successfully synced {synced_count} activities from Strava"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Strava sync error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/strava/activities")
async def get_strava_activities(days: int = 7, current_user: dict = Depends(get_current_user)):
    """Get synced Strava activities"""
    activities = database.get_strava_activities(current_user["id"], days)
    weekly_stats = database.get_strava_weekly_stats(current_user["id"])
    
    # Calculate progress towards 150 minute goal
    goal_minutes = 150
    progress_percent = min((weekly_stats["total_minutes"] / goal_minutes) * 100, 100)
    
    return {
        "activities": activities,
        "weekly_stats": weekly_stats,
        "goal": {
            "target_minutes": goal_minutes,
            "current_minutes": weekly_stats["total_minutes"],
            "progress_percent": round(progress_percent, 1),
            "remaining_minutes": max(0, goal_minutes - weekly_stats["total_minutes"])
        }
    }


@app.delete("/strava/disconnect")
async def strava_disconnect(current_user: dict = Depends(get_current_user)):
    """Disconnect Strava account"""
    deleted = database.delete_strava_tokens(current_user["id"])
    
    if deleted:
        return {"success": True, "message": "Strava disconnected successfully"}
    else:
        return {"success": False, "message": "Strava was not connected"}
