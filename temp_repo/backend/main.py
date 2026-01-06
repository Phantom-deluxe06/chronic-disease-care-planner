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

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

import database

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
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        tips.append("Keep blood sugar levels between 80-130 mg/dL before meals")
        tips.append("Stay hydrated - drink at least 8 glasses of water daily")
    
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
        tips.append("Limit sodium intake to less than 2,300mg per day")
        tips.append("Avoid saturated fats and trans fats")
    
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
        tips.append("Reduce salt intake to help control blood pressure")
        tips.append("Practice stress management techniques daily")
    
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
        tips=tips
    )


# ==================== API ENDPOINTS ====================

@app.on_event("startup")
def startup():
    """Initialize database on startup"""
    database.init_database()


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
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "age": user["age"],
                "gender": user["gender"]
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
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "age": user["age"],
            "gender": user["gender"]
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
