# 💚 HealthBuddy
### AI-Powered Chronic Disease Care Planner

HealthBuddy is a modern, user-friendly web application designed to help individuals manage chronic conditions like **Diabetes** and **Hypertension**. It provides personalized care plans, health tracking, and actionable insights in a beautiful, dark-themed interface.

![HealthBuddy App](https://via.placeholder.com/800x400?text=HealthBuddy+Preview)

## ✨ Features

### 🔐 Secure Authentication
- **Modern UI**: Beautiful, glassmorphism-inspired dark theme for Login and Signup pages.
- **Security**: Password hashing (SHA-256), JWT authentication, and secure session management.
- **Smart Validation**: Real-time form validation with password visibility toggles.
- **Disease Selection**: Intuitive selection during signup to tailor the experience.

### 📊 Disease-Specific Dashboards
Customized experiences based on the user's condition:

#### 🩸 Diabetes Dashboard (Orange Theme)
- Track Blood Sugar readings (Fasting, Post-meal).
- Manage Insulin and Medication schedules.
- Receive diabetes-specific diet tips and care plans.
- Visual progress tracking with weekly stats.

#### 💓 Hypertension Dashboard (Purple Theme)
- Monitor Blood Pressure (Systolic/Diastolic) and Heart Rate.
- Sodium intake alerts and BP management tips.
- Hypertension-specific daily tasks.
- Stress management and activity tracking.

### 🏠 Overview Home
- **Smart Hub**: Centralized view of all your health conditions.
- **Quick Stats**: At-a-glance summary of tasks completed and pending reminders.
- **Health Tips**: Daily curated advice for better living.

## 🛠️ Tech Stack

### Frontend
- **React.js**: Core framework for a dynamic SPA experience.
- **React Router**: Seamless client-side navigation.
- **CSS3 Variables**: Advanced custom styling for themes (Dark/Light/Disease-specific).
- **Glassmorphism**: Modern UI design principles.

### Backend
- **Python FastAPI**: High-performance API framework.
- **SQLite**: Lightweight, serverless database for prototyping.
- **JWT**: JSON Web Token for stateless authentication.
- **Pydantic**: Robust data validation and settings management.

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.8 or higher)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Phantom-deluxe06/chronic-disease-care-planner.git
cd chronic-disease-care-planner
```

### 2. Backend Setup
Navigate to the backend folder and set up the Python environment.

```bash
cd backend
# Create virtual environment (optional but recommended)
python -m venv venv
# Activate venv (Windows)
.\venv\Scripts\activate
# Activate venv (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python -m uvicorn main:app --reload
```
*The backend will run at `http://127.0.0.1:8000`*

### 3. Frontend Setup
Open a new terminal, navigate to the frontend folder.

```bash
cd frontend
# Install Node modules
npm install

# Start the React app
npm start
```
*The frontend will open at `http://localhost:3000`*

## 🔮 Future Roadmap
- [ ] Integration with backend for real-time dashboard data.
- [ ] Interactive chart visualizations for health logs.
- [ ] Mobile-responsive optimizations.
- [ ] AI-driven personalized health recommendations.

## 📄 License
This project is open-source and available under the MIT License.
