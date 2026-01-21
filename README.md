<p align="center">
  <img src="frontend/public/logo512.png" alt="Health Buddy Logo" width="120" height="120">
</p>

<h1 align="center">💚 Health Buddy</h1>
<h3 align="center">AI-Powered Chronic Disease Care Companion</h3>

<p align="center">
  <strong>An intelligent health management platform for Diabetes and Hypertension care</strong>
</p>

<p align="center">
  <a href="https://chronic-disease-care-planner.vercel.app">🌐 Live Demo</a> •
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-getting-started">Getting Started</a>
</p>

---

## 📋 Overview

**Health Buddy** is a comprehensive, AI-powered chronic disease care planner designed to help individuals manage **Type-2 Diabetes** and **Hypertension** effectively. Built for the **AI Ignite 2025 Hackathon**, it combines modern web technologies with Google's Gemini AI to deliver personalized health insights, real-time food analysis, medication tracking, and intelligent weekly health summaries.

### 🎯 Problem Statement

Chronic diseases like diabetes and hypertension require consistent daily management, including:
- Monitoring vital health metrics (blood glucose, blood pressure)
- Following strict dietary guidelines
- Maintaining medication schedules
- Tracking physical activity and hydration

**Health Buddy solves this** by providing an all-in-one platform with AI-powered insights that makes chronic disease management simple, intuitive, and personalized.

---

## ✨ Features

### 🔐 Secure Authentication
- **JWT-based authentication** with SHA-256 password hashing
- **Disease-specific onboarding** - Users select their condition(s) during signup
- **Personalized dashboard routing** based on health profile

### 📊 Disease-Specific Dashboards

#### 🩸 Diabetes Dashboard
- **Blood Glucose Tracking** - Log fasting, pre-meal, and post-meal readings with trend analysis
- **HbA1c Management** - Track long-term glucose control with historical data
- **AI Food Analysis** - Real-time nutritional analysis powered by Gemini AI
  - Glycemic Index & Carbohydrate estimation
  - Glucose spike risk assessment
  - Portion recommendations for diabetics
- **Medication Manager** - Track insulin and oral medications with reminders
- **Exercise Tracker** - Log physical activities with intensity levels
- **Weekly AI Summary** - Personalized health insights and improvement suggestions

#### 💓 Hypertension Dashboard
- **Blood Pressure Monitoring** - Track systolic/diastolic readings with pulse
- **DASH Diet Analysis** - AI-powered sodium analysis for meal planning
- **Water Intake Tracker** - Hydration monitoring for BP management
- **Stress & Lifestyle Tracker** - Monitor stress levels and sleep patterns
- **Medication Management** - Track antihypertensives and schedule adherence
- **Weekly BP Summary** - Trend analysis with cardiovascular risk assessment

### 🏠 Smart Home Dashboard
- Unified view for users managing multiple conditions
- Quick health stats and pending tasks at a glance
- AI-curated daily health tips

### 📈 Health Reports & Logs
- **Comprehensive health history** with filtering options
- **Visual trend charts** for glucose and BP readings
- **Export-ready data** for healthcare providers

### ⚙️ Settings & Customization
- Theme preferences
- Notification settings
- Profile management

### 📱 Mobile-Responsive Design
- Fully responsive UI with mobile navigation
- Touch-friendly interface optimized for on-the-go tracking
- Android APK support via WebView wrapper

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React.js 18** | Core UI framework with functional components & hooks |
| **React Router v6** | Client-side routing and navigation |
| **CSS3 Variables** | Dynamic theming (Dark mode, disease-specific colors) |
| **Glassmorphism UI** | Modern, premium design aesthetics |

### Backend
| Technology | Purpose |
|------------|---------|
| **Python FastAPI** | High-performance async REST API |
| **Google Gemini AI** | Intelligent food analysis & health recommendations |
| **SQLite** | Lightweight database for user data & health logs |
| **JWT (python-jose)** | Stateless authentication tokens |
| **Pydantic** | Request/response validation & serialization |
| **Uvicorn** | ASGI server for production deployment |

### Deployment
| Platform | Service |
|----------|---------|
| **Vercel** | Frontend hosting with auto-deployment |
| **Render** | Backend API hosting |
| **GitHub** | Version control & CI/CD triggers |

---

## 🔌 API Reference

### Base URL
```
Production: https://chronic-disease-care-planner.onrender.com
Local: http://127.0.0.1:8000
```

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/signup` | Register new user with health profile |
| `POST` | `/login` | Authenticate and receive JWT token |
| `GET` | `/me` | Get current user information |

### Health Logging Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/logs/glucose` | Log blood glucose reading |
| `POST` | `/logs/bp` | Log blood pressure reading |
| `POST` | `/logs/food` | Log food intake |
| `POST` | `/logs/activity` | Log physical activity |
| `POST` | `/logs/water` | Log water intake |
| `POST` | `/logs/hba1c` | Log HbA1c test result |
| `GET` | `/logs/{type}` | Get logs by type (glucose/bp/food/activity) |
| `GET` | `/logs/all` | Get all user logs |

### AI-Powered Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze/food` | AI food analysis for diabetes |
| `POST` | `/analyze/food/hypertension` | AI food analysis for hypertension (DASH diet) |
| `GET` | `/weekly-summary` | AI-generated weekly health summary |

### Trend Analysis Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/trends` | Comprehensive health trend analysis |
| `GET` | `/trends/glucose` | Glucose-specific trends |
| `GET` | `/trends/bp` | Blood pressure trends |
| `GET` | `/trends/weekly-adjustments` | AI care plan adjustments |

### Medication & Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/medications` | Add new medication |
| `GET` | `/medications` | Get all active medications |
| `POST` | `/medications/intake` | Log medication intake |
| `POST` | `/appointments` | Create appointment |
| `GET` | `/appointments` | Get upcoming appointments |

### Care Plan & Utilities
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/care-plan` | Get personalized daily care plan |
| `GET` | `/reminders` | Get health reminders |
| `GET` | `/travel-checklist` | Get diabetic travel safety tips |
| `GET` | `/water/today` | Get today's water intake |
| `GET` | `/health` | API health check |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v16 or higher
- **Python** v3.9 or higher
- **Git**
- **Google Gemini API Key** (for AI features)

### 1. Clone the Repository
```bash
git clone https://github.com/Phantom-deluxe06/chronic-disease-care-planner.git
cd chronic-disease-care-planner
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate venv (Windows)
.\venv\Scripts\activate
# Activate venv (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variable for Gemini AI
# Windows PowerShell:
$env:GEMINI_API_KEY="your-gemini-api-key"
# Mac/Linux:
export GEMINI_API_KEY="your-gemini-api-key"

# Run the server
python -m uvicorn main:app --reload
```
*Backend runs at `http://127.0.0.1:8000`*

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```
*Frontend runs at `http://localhost:3000`*

---

## 📁 Project Structure

```
chronic-disease-care-planner/
├── frontend/
│   ├── public/
│   │   ├── index.html          # App entry point
│   │   ├── manifest.json       # PWA manifest
│   │   ├── favicon.ico         # Health Buddy icon
│   │   └── logo*.png           # App logos
│   └── src/
│       ├── pages/
│       │   ├── Landing.js          # Welcome page
│       │   ├── Login.js            # Authentication
│       │   ├── Signup.js           # Registration with disease selection
│       │   ├── Home.js             # Dashboard hub
│       │   ├── DiabetesDashboard.js    # Diabetes management
│       │   ├── HypertensionDashboard.js # BP management
│       │   ├── HealthLogs.js       # Health history
│       │   ├── Reports.js          # Analytics & reports
│       │   └── Settings.js         # User preferences
│       ├── components/
│       │   ├── FoodAnalysisModal.js     # AI food analysis (Diabetes)
│       │   ├── HypertensionFoodModal.js # AI food analysis (BP)
│       │   ├── BPEntryModal.js          # Blood pressure logging
│       │   ├── LogEntryModal.js         # Glucose logging
│       │   ├── MedicationManager.js     # Medication tracking
│       │   ├── ExerciseTracker.js       # Activity logging
│       │   ├── WaterTracker.js          # Hydration tracking
│       │   ├── StressTracker.js         # Lifestyle monitoring
│       │   ├── WeeklySummary.js         # AI weekly insights
│       │   ├── WeeklySummaryBP.js       # BP weekly summary
│       │   ├── Sidebar.js               # Navigation sidebar
│       │   └── MobileNav.js             # Mobile navigation
│       ├── config/
│       │   └── api.js              # API configuration
│       ├── App.js                  # Root component
│       └── App.css                 # Global styles
├── backend/
│   ├── main.py             # FastAPI application & endpoints
│   ├── database.py         # SQLite database operations
│   ├── ai_analyzer.py      # Gemini AI integration
│   ├── trend_analyzer.py   # Health trend analysis
│   ├── guidelines.py       # Medical guidelines (ADA/AHA)
│   ├── requirements.txt    # Python dependencies
│   ├── Procfile            # Render deployment config
│   └── runtime.txt         # Python version specification
└── README.md
```

---

## 🔮 AI Features Deep Dive

### Gemini AI Integration

Health Buddy leverages **Google Gemini AI** for intelligent health analysis:

#### 1. Food Analysis for Diabetes
```json
{
  "food_description": "2 slices of whole wheat bread with peanut butter",
  "response": {
    "calories": 320,
    "carbohydrates": 42,
    "glycemic_index": 51,
    "glucose_spike_risk": "medium",
    "recommendation": "Good choice! Pair with protein for slower absorption.",
    "portion_advice": "Stick to 2 tablespoons of peanut butter"
  }
}
```

#### 2. DASH Diet Analysis for Hypertension
```json
{
  "food_description": "grilled salmon with steamed vegetables",
  "response": {
    "sodium_mg": 120,
    "potassium_mg": 680,
    "dash_compliance": "excellent",
    "recommendation": "Heart-healthy choice! Rich in omega-3.",
    "alternatives": []
  }
}
```

#### 3. Weekly Health Summary
AI analyzes 7-day health data to provide:
- Diet quality score
- Exercise consistency rating
- Medication adherence percentage
- Personalized improvement suggestions

---

## 🏥 Medical Guidelines Implementation

Health Buddy follows established medical guidelines:

| Condition | Guidelines | Implementation |
|-----------|------------|----------------|
| Diabetes | ADA (American Diabetes Association) | Glucose thresholds, HbA1c targets, nutrition recommendations |
| Hypertension | AHA (American Heart Association) | BP categories, DASH diet scoring, sodium limits |

### Alert Thresholds
- **Hypoglycemia Alert**: Blood glucose < 70 mg/dL
- **Hyperglycemia Alert**: Blood glucose > 180 mg/dL
- **Hypertensive Crisis**: BP > 180/120 mmHg
- **Hypotension Alert**: BP < 90/60 mmHg

---

## 🌐 Live Deployment

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | https://chronic-disease-care-planner.vercel.app |
| **Backend API (Render)** | https://chronic-disease-care-planner.onrender.com |
| **API Documentation** | https://chronic-disease-care-planner.onrender.com/docs |

---

## 📱 Screenshots

### Landing Page
Modern, welcoming interface introducing Health Buddy's capabilities.

### Disease-Specific Dashboards
Tailored experiences for Diabetes (glucose tracking, insulin management) and Hypertension (BP monitoring, DASH diet).

### AI Food Analysis
Real-time nutritional analysis with health recommendations powered by Gemini AI.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👥 Team

**Developed for AI Ignite 2025 Hackathon**

- Built with ❤️ using React, FastAPI, and Google Gemini AI

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI** for powering intelligent health analysis
- **American Diabetes Association (ADA)** for diabetes care guidelines
- **American Heart Association (AHA)** for hypertension management guidelines
- **Vercel** and **Render** for seamless deployment

---

<p align="center">
  Made with 💚 for better health management
</p>
