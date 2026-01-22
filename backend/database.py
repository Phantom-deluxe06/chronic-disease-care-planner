"""
Database module for Chronic Disease Care Planner
Uses PostgreSQL for production (Render/Supabase)
Falls back to SQLite for local development
"""

import os
import json
import logging
from typing import Optional, Dict, Any, List
from contextlib import contextmanager
from datetime import datetime

logger = logging.getLogger(__name__)

# Check for DATABASE_URL environment variable (PostgreSQL)
DATABASE_URL = os.environ.get("DATABASE_URL")

# Determine if using PostgreSQL or SQLite
USE_POSTGRES = DATABASE_URL is not None and DATABASE_URL.startswith("postgres")

if USE_POSTGRES:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    logger.info(f"Using PostgreSQL database")
else:
    import sqlite3
    DATABASE_PATH = "chronic_care.db"
    logger.info(f"Using SQLite database: {DATABASE_PATH}")


@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    if USE_POSTGRES:
        # Fix for Render's postgres:// vs postgresql:// URL
        db_url = DATABASE_URL
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        
        conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
        try:
            yield conn
        finally:
            conn.close()
    else:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()


def _execute(conn, query, params=None):
    """Execute a query with proper parameter placeholder conversion"""
    cursor = conn.cursor()
    if USE_POSTGRES:
        # Convert ? to %s for PostgreSQL
        query = query.replace("?", "%s")
    cursor.execute(query, params or ())
    return cursor


def init_database():
    """Initialize database tables"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Users table
        if USE_POSTGRES:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    age INTEGER,
                    gender TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    age INTEGER,
                    gender TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        
        # Health data table
        if USE_POSTGRES:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS health_data (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    disease_type TEXT NOT NULL,
                    data JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS health_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    disease_type TEXT NOT NULL,
                    data JSON NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        
        # Care plan logs table
        if USE_POSTGRES:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS care_logs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    task_name TEXT NOT NULL,
                    completed BOOLEAN DEFAULT FALSE,
                    completed_at TIMESTAMP,
                    scheduled_for DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS care_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    task_name TEXT NOT NULL,
                    completed BOOLEAN DEFAULT FALSE,
                    completed_at TIMESTAMP,
                    scheduled_for DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        
        # Daily logs table
        if USE_POSTGRES:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS daily_logs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    log_type TEXT NOT NULL,
                    value REAL,
                    value_secondary REAL,
                    unit TEXT,
                    reading_context TEXT,
                    notes TEXT,
                    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    log_date DATE DEFAULT CURRENT_DATE,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS daily_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    log_type TEXT NOT NULL,
                    value REAL,
                    value_secondary REAL,
                    unit TEXT,
                    reading_context TEXT,
                    notes TEXT,
                    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    log_date DATE DEFAULT (date('now')),
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        
        conn.commit()


def create_user(name: str, email: str, password_hash: str, age: int, gender: str) -> int:
    """Create a new user and return their ID"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                "INSERT INTO users (name, email, password_hash, age, gender) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (name, email, password_hash, age, gender)
            )
            user_id = cursor.fetchone()["id"]
        else:
            cursor.execute(
                "INSERT INTO users (name, email, password_hash, age, gender) VALUES (?, ?, ?, ?, ?)",
                (name, email, password_hash, age, gender)
            )
            user_id = cursor.lastrowid
        conn.commit()
        return user_id


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        else:
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute("SELECT id, name, email, age, gender, created_at FROM users WHERE id = %s", (user_id,))
        else:
            cursor.execute("SELECT id, name, email, age, gender, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None


def save_health_data(user_id: int, disease_type: str, data: Dict[str, Any]) -> int:
    """Save health data for a user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        data_json = json.dumps(data)
        if USE_POSTGRES:
            cursor.execute(
                "INSERT INTO health_data (user_id, disease_type, data) VALUES (%s, %s, %s) RETURNING id",
                (user_id, disease_type, data_json)
            )
            health_id = cursor.fetchone()["id"]
        else:
            cursor.execute(
                "INSERT INTO health_data (user_id, disease_type, data) VALUES (?, ?, ?)",
                (user_id, disease_type, data_json)
            )
            health_id = cursor.lastrowid
        conn.commit()
        return health_id


def get_user_health_data(user_id: int) -> list:
    """Get all health data for a user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                "SELECT disease_type, data FROM health_data WHERE user_id = %s",
                (user_id,)
            )
        else:
            cursor.execute(
                "SELECT disease_type, data FROM health_data WHERE user_id = ?",
                (user_id,)
            )
        rows = cursor.fetchall()
        result = []
        for row in rows:
            row_dict = dict(row)
            data = row_dict["data"]
            if isinstance(data, str):
                data = json.loads(data)
            result.append({
                "disease_type": row_dict["disease_type"],
                "data": data
            })
        return result


def get_user_diseases(user_id: int) -> list:
    """Get list of diseases for a user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                "SELECT DISTINCT disease_type FROM health_data WHERE user_id = %s",
                (user_id,)
            )
        else:
            cursor.execute(
                "SELECT DISTINCT disease_type FROM health_data WHERE user_id = ?",
                (user_id,)
            )
        rows = cursor.fetchall()
        return [dict(row)["disease_type"] for row in rows]


# ==================== DAILY LOGS ====================

def save_daily_log(
    user_id: int,
    log_type: str,
    value: float,
    unit: str,
    value_secondary: float = None,
    reading_context: str = None,
    notes: str = None
) -> int:
    """Save a daily log entry (glucose, BP, food, activity)"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """INSERT INTO daily_logs 
                   (user_id, log_type, value, value_secondary, unit, reading_context, notes) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (user_id, log_type, value, value_secondary, unit, reading_context, notes)
            )
            log_id = cursor.fetchone()["id"]
        else:
            cursor.execute(
                """INSERT INTO daily_logs 
                   (user_id, log_type, value, value_secondary, unit, reading_context, notes) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (user_id, log_type, value, value_secondary, unit, reading_context, notes)
            )
            log_id = cursor.lastrowid
        conn.commit()
        return log_id


def get_daily_logs(user_id: int, log_type: str = None, days: int = 7) -> list:
    """Get daily logs for a user, optionally filtered by type and date range"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        if USE_POSTGRES:
            if log_type:
                cursor.execute(
                    """SELECT * FROM daily_logs 
                       WHERE user_id = %s AND log_type = %s 
                       AND log_date >= CURRENT_DATE - INTERVAL '%s days'
                       ORDER BY logged_at DESC""",
                    (user_id, log_type, days)
                )
            else:
                cursor.execute(
                    """SELECT * FROM daily_logs 
                       WHERE user_id = %s 
                       AND log_date >= CURRENT_DATE - INTERVAL '%s days'
                       ORDER BY logged_at DESC""",
                    (user_id, days)
                )
        else:
            if log_type:
                cursor.execute(
                    """SELECT * FROM daily_logs 
                       WHERE user_id = ? AND log_type = ? 
                       AND log_date >= date('now', ?)
                       ORDER BY logged_at DESC""",
                    (user_id, log_type, f'-{days} days')
                )
            else:
                cursor.execute(
                    """SELECT * FROM daily_logs 
                       WHERE user_id = ? 
                       AND log_date >= date('now', ?)
                       ORDER BY logged_at DESC""",
                    (user_id, f'-{days} days')
                )
        
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_logs_by_date(user_id: int, log_type: str, date: str) -> list:
    """Get logs for a specific date"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """SELECT * FROM daily_logs 
                   WHERE user_id = %s AND log_type = %s AND log_date = %s
                   ORDER BY logged_at DESC""",
                (user_id, log_type, date)
            )
        else:
            cursor.execute(
                """SELECT * FROM daily_logs 
                   WHERE user_id = ? AND log_type = ? AND log_date = ?
                   ORDER BY logged_at DESC""",
                (user_id, log_type, date)
            )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_weekly_stats(user_id: int, log_type: str) -> Dict[str, Any]:
    """Get weekly statistics for a specific log type"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """SELECT 
                    AVG(value) as avg_value,
                    MIN(value) as min_value,
                    MAX(value) as max_value,
                    COUNT(*) as count,
                    AVG(value_secondary) as avg_secondary
                   FROM daily_logs 
                   WHERE user_id = %s AND log_type = %s 
                   AND log_date >= CURRENT_DATE - INTERVAL '7 days'""",
                (user_id, log_type)
            )
        else:
            cursor.execute(
                """SELECT 
                    AVG(value) as avg_value,
                    MIN(value) as min_value,
                    MAX(value) as max_value,
                    COUNT(*) as count,
                    AVG(value_secondary) as avg_secondary
                   FROM daily_logs 
                   WHERE user_id = ? AND log_type = ? 
                   AND log_date >= date('now', '-7 days')""",
                (user_id, log_type)
            )
        row = cursor.fetchone()
        if row:
            row_dict = dict(row)
            return {
                "avg_value": row_dict["avg_value"],
                "min_value": row_dict["min_value"],
                "max_value": row_dict["max_value"],
                "count": row_dict["count"],
                "avg_secondary": row_dict["avg_secondary"]
            }
        return None


# ==================== WATER TRACKING ====================

def init_water_table():
    """Initialize water tracking table"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS water_logs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    amount_ml INTEGER NOT NULL,
                    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    log_date DATE DEFAULT CURRENT_DATE,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS water_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    amount_ml INTEGER NOT NULL,
                    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    log_date DATE DEFAULT (date('now')),
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        conn.commit()


def save_water_log(user_id: int, amount_ml: int) -> int:
    """Save water intake log"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                "INSERT INTO water_logs (user_id, amount_ml) VALUES (%s, %s) RETURNING id",
                (user_id, amount_ml)
            )
            log_id = cursor.fetchone()["id"]
        else:
            cursor.execute(
                "INSERT INTO water_logs (user_id, amount_ml) VALUES (?, ?)",
                (user_id, amount_ml)
            )
            log_id = cursor.lastrowid
        conn.commit()
        return log_id


def get_water_logs_today(user_id: int) -> Dict[str, Any]:
    """Get today's water intake"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """SELECT SUM(amount_ml) as total, COUNT(*) as count
                   FROM water_logs 
                   WHERE user_id = %s AND log_date = CURRENT_DATE""",
                (user_id,)
            )
        else:
            cursor.execute(
                """SELECT SUM(amount_ml) as total, COUNT(*) as count
                   FROM water_logs 
                   WHERE user_id = ? AND log_date = date('now')""",
                (user_id,)
            )
        row = cursor.fetchone()
        row_dict = dict(row)
        return {
            "total_ml": row_dict["total"] or 0,
            "glasses": row_dict["count"] or 0
        }


# ==================== MEDICATION MANAGEMENT ====================

def init_medication_tables():
    """Initialize medication tables"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        if USE_POSTGRES:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS medications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    dosage TEXT NOT NULL,
                    frequency TEXT NOT NULL,
                    times_of_day TEXT NOT NULL,
                    notes TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS medication_logs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    medication_id INTEGER NOT NULL,
                    scheduled_time TEXT NOT NULL,
                    taken_at TIMESTAMP,
                    skipped BOOLEAN DEFAULT FALSE,
                    log_date DATE DEFAULT CURRENT_DATE,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (medication_id) REFERENCES medications (id)
                )
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS medications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    dosage TEXT NOT NULL,
                    frequency TEXT NOT NULL,
                    times_of_day TEXT NOT NULL,
                    notes TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS medication_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    medication_id INTEGER NOT NULL,
                    scheduled_time TEXT NOT NULL,
                    taken_at TIMESTAMP,
                    skipped BOOLEAN DEFAULT FALSE,
                    log_date DATE DEFAULT (date('now')),
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (medication_id) REFERENCES medications (id)
                )
            """)
        conn.commit()


def save_medication(user_id: int, name: str, dosage: str, frequency: str, 
                    times_of_day: list, notes: str = None) -> int:
    """Save a new medication"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        times_json = json.dumps(times_of_day)
        if USE_POSTGRES:
            cursor.execute(
                """INSERT INTO medications (user_id, name, dosage, frequency, times_of_day, notes)
                   VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
                (user_id, name, dosage, frequency, times_json, notes)
            )
            med_id = cursor.fetchone()["id"]
        else:
            cursor.execute(
                """INSERT INTO medications (user_id, name, dosage, frequency, times_of_day, notes)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (user_id, name, dosage, frequency, times_json, notes)
            )
            med_id = cursor.lastrowid
        conn.commit()
        return med_id


def get_medications(user_id: int) -> list:
    """Get all active medications for a user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """SELECT * FROM medications WHERE user_id = %s AND is_active = TRUE""",
                (user_id,)
            )
        else:
            cursor.execute(
                """SELECT * FROM medications WHERE user_id = ? AND is_active = TRUE""",
                (user_id,)
            )
        rows = cursor.fetchall()
        result = []
        for row in rows:
            med = dict(row)
            times = med['times_of_day']
            if isinstance(times, str):
                times = json.loads(times)
            med['times_of_day'] = times
            result.append(med)
        return result


def log_medication_intake(user_id: int, medication_id: int, scheduled_time: str, 
                          taken: bool = True) -> int:
    """Log medication intake"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            if taken:
                cursor.execute(
                    """INSERT INTO medication_logs (user_id, medication_id, scheduled_time, taken_at)
                       VALUES (%s, %s, %s, CURRENT_TIMESTAMP) RETURNING id""",
                    (user_id, medication_id, scheduled_time)
                )
            else:
                cursor.execute(
                    """INSERT INTO medication_logs (user_id, medication_id, scheduled_time, skipped)
                       VALUES (%s, %s, %s, TRUE) RETURNING id""",
                    (user_id, medication_id, scheduled_time)
                )
            log_id = cursor.fetchone()["id"]
        else:
            if taken:
                cursor.execute(
                    """INSERT INTO medication_logs (user_id, medication_id, scheduled_time, taken_at)
                       VALUES (?, ?, ?, CURRENT_TIMESTAMP)""",
                    (user_id, medication_id, scheduled_time)
                )
            else:
                cursor.execute(
                    """INSERT INTO medication_logs (user_id, medication_id, scheduled_time, skipped)
                       VALUES (?, ?, ?, TRUE)""",
                    (user_id, medication_id, scheduled_time)
                )
            log_id = cursor.lastrowid
        conn.commit()
        return log_id


def get_medication_logs_today(user_id: int) -> list:
    """Get today's medication logs"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """SELECT ml.*, m.name, m.dosage 
                   FROM medication_logs ml
                   JOIN medications m ON ml.medication_id = m.id
                   WHERE ml.user_id = %s AND ml.log_date = CURRENT_DATE""",
                (user_id,)
            )
        else:
            cursor.execute(
                """SELECT ml.*, m.name, m.dosage 
                   FROM medication_logs ml
                   JOIN medications m ON ml.medication_id = m.id
                   WHERE ml.user_id = ? AND ml.log_date = date('now')""",
                (user_id,)
            )
        return [dict(row) for row in cursor.fetchall()]


def delete_medication(user_id: int, medication_id: int) -> bool:
    """Delete a medication (soft delete by setting is_active=FALSE)"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """UPDATE medications SET is_active = FALSE 
                   WHERE id = %s AND user_id = %s""",
                (medication_id, user_id)
            )
        else:
            cursor.execute(
                """UPDATE medications SET is_active = FALSE 
                   WHERE id = ? AND user_id = ?""",
                (medication_id, user_id)
            )
        conn.commit()
        return cursor.rowcount > 0


# ==================== APPOINTMENTS & CALENDAR ====================

def init_appointment_tables():
    """Initialize appointment tables"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS appointments (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    appointment_type TEXT NOT NULL,
                    doctor_name TEXT,
                    location TEXT,
                    appointment_date DATE NOT NULL,
                    appointment_time TEXT,
                    notes TEXT,
                    completed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS appointments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    appointment_type TEXT NOT NULL,
                    doctor_name TEXT,
                    location TEXT,
                    appointment_date DATE NOT NULL,
                    appointment_time TEXT,
                    notes TEXT,
                    completed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        conn.commit()


def save_appointment(user_id: int, appointment_type: str, doctor_name: str,
                     location: str, appointment_date: str, appointment_time: str = None,
                     notes: str = None) -> int:
    """Save an appointment"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """INSERT INTO appointments 
                   (user_id, appointment_type, doctor_name, location, appointment_date, appointment_time, notes)
                   VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (user_id, appointment_type, doctor_name, location, appointment_date, appointment_time, notes)
            )
            appt_id = cursor.fetchone()["id"]
        else:
            cursor.execute(
                """INSERT INTO appointments 
                   (user_id, appointment_type, doctor_name, location, appointment_date, appointment_time, notes)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (user_id, appointment_type, doctor_name, location, appointment_date, appointment_time, notes)
            )
            appt_id = cursor.lastrowid
        conn.commit()
        return appt_id


def get_appointments(user_id: int, upcoming_only: bool = True) -> list:
    """Get appointments for a user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            if upcoming_only:
                cursor.execute(
                    """SELECT * FROM appointments 
                       WHERE user_id = %s AND appointment_date >= CURRENT_DATE
                       ORDER BY appointment_date ASC""",
                    (user_id,)
                )
            else:
                cursor.execute(
                    """SELECT * FROM appointments WHERE user_id = %s ORDER BY appointment_date DESC""",
                    (user_id,)
                )
        else:
            if upcoming_only:
                cursor.execute(
                    """SELECT * FROM appointments 
                       WHERE user_id = ? AND appointment_date >= date('now')
                       ORDER BY appointment_date ASC""",
                    (user_id,)
                )
            else:
                cursor.execute(
                    """SELECT * FROM appointments WHERE user_id = ? ORDER BY appointment_date DESC""",
                    (user_id,)
                )
        return [dict(row) for row in cursor.fetchall()]


def get_last_doctor_visit(user_id: int) -> Optional[Dict[str, Any]]:
    """Get the most recent completed doctor visit"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """SELECT * FROM appointments 
                   WHERE user_id = %s AND completed = TRUE AND appointment_type = 'doctor_visit'
                   ORDER BY appointment_date DESC LIMIT 1""",
                (user_id,)
            )
        else:
            cursor.execute(
                """SELECT * FROM appointments 
                   WHERE user_id = ? AND completed = TRUE AND appointment_type = 'doctor_visit'
                   ORDER BY appointment_date DESC LIMIT 1""",
                (user_id,)
            )
        row = cursor.fetchone()
        return dict(row) if row else None


# ==================== HbA1c TRACKING ====================

def init_hba1c_table():
    """Initialize HbA1c table"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS hba1c_logs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    value REAL NOT NULL,
                    test_date DATE NOT NULL,
                    lab_name TEXT,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS hba1c_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    value REAL NOT NULL,
                    test_date DATE NOT NULL,
                    lab_name TEXT,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        conn.commit()


def save_hba1c(user_id: int, value: float, test_date: str, 
               lab_name: str = None, notes: str = None) -> int:
    """Save an HbA1c result"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """INSERT INTO hba1c_logs (user_id, value, test_date, lab_name, notes)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                (user_id, value, test_date, lab_name, notes)
            )
            log_id = cursor.fetchone()["id"]
        else:
            cursor.execute(
                """INSERT INTO hba1c_logs (user_id, value, test_date, lab_name, notes)
                   VALUES (?, ?, ?, ?, ?)""",
                (user_id, value, test_date, lab_name, notes)
            )
            log_id = cursor.lastrowid
        conn.commit()
        return log_id


def get_hba1c_history(user_id: int, limit: int = 10) -> list:
    """Get HbA1c history"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """SELECT * FROM hba1c_logs 
                   WHERE user_id = %s ORDER BY test_date DESC LIMIT %s""",
                (user_id, limit)
            )
        else:
            cursor.execute(
                """SELECT * FROM hba1c_logs 
                   WHERE user_id = ? ORDER BY test_date DESC LIMIT ?""",
                (user_id, limit)
            )
        return [dict(row) for row in cursor.fetchall()]


def get_last_hba1c(user_id: int) -> Optional[Dict[str, Any]]:
    """Get the most recent HbA1c result"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """SELECT * FROM hba1c_logs 
                   WHERE user_id = %s ORDER BY test_date DESC LIMIT 1""",
                (user_id,)
            )
        else:
            cursor.execute(
                """SELECT * FROM hba1c_logs 
                   WHERE user_id = ? ORDER BY test_date DESC LIMIT 1""",
                (user_id,)
            )
        row = cursor.fetchone()
        return dict(row) if row else None


# ==================== REMINDERS ====================

def init_reminder_tables():
    """Initialize reminder tables"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS reminders (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    reminder_type TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    time_of_day TEXT,
                    frequency TEXT DEFAULT 'daily',
                    is_active BOOLEAN DEFAULT TRUE,
                    last_shown DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS reminders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    reminder_type TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    time_of_day TEXT,
                    frequency TEXT DEFAULT 'daily',
                    is_active BOOLEAN DEFAULT TRUE,
                    last_shown DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        conn.commit()


def save_reminder(user_id: int, reminder_type: str, title: str, 
                  description: str = None, time_of_day: str = None,
                  frequency: str = 'daily') -> int:
    """Save a reminder"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """INSERT INTO reminders (user_id, reminder_type, title, description, time_of_day, frequency)
                   VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
                (user_id, reminder_type, title, description, time_of_day, frequency)
            )
            rem_id = cursor.fetchone()["id"]
        else:
            cursor.execute(
                """INSERT INTO reminders (user_id, reminder_type, title, description, time_of_day, frequency)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (user_id, reminder_type, title, description, time_of_day, frequency)
            )
            rem_id = cursor.lastrowid
        conn.commit()
        return rem_id


def get_active_reminders(user_id: int, reminder_type: str = None) -> list:
    """Get active reminders for a user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            if reminder_type:
                cursor.execute(
                    """SELECT * FROM reminders 
                       WHERE user_id = %s AND reminder_type = %s AND is_active = TRUE""",
                    (user_id, reminder_type)
                )
            else:
                cursor.execute(
                    """SELECT * FROM reminders WHERE user_id = %s AND is_active = TRUE""",
                    (user_id,)
                )
        else:
            if reminder_type:
                cursor.execute(
                    """SELECT * FROM reminders 
                       WHERE user_id = ? AND reminder_type = ? AND is_active = TRUE""",
                    (user_id, reminder_type)
                )
            else:
                cursor.execute(
                    """SELECT * FROM reminders WHERE user_id = ? AND is_active = TRUE""",
                    (user_id,)
                )
        return [dict(row) for row in cursor.fetchall()]


# ==================== STRAVA INTEGRATION ====================

def init_strava_tables():
    """Initialize Strava OAuth and activities tables"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        if USE_POSTGRES:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS strava_tokens (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER UNIQUE NOT NULL,
                    access_token TEXT NOT NULL,
                    refresh_token TEXT NOT NULL,
                    expires_at INTEGER NOT NULL,
                    athlete_id INTEGER,
                    athlete_name TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS strava_activities (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    strava_id BIGINT UNIQUE NOT NULL,
                    activity_type TEXT NOT NULL,
                    name TEXT,
                    distance REAL,
                    moving_time INTEGER,
                    elapsed_time INTEGER,
                    start_date TEXT NOT NULL,
                    start_date_local TEXT,
                    average_speed REAL,
                    max_speed REAL,
                    average_heartrate REAL,
                    max_heartrate REAL,
                    calories REAL,
                    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS strava_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER UNIQUE NOT NULL,
                    access_token TEXT NOT NULL,
                    refresh_token TEXT NOT NULL,
                    expires_at INTEGER NOT NULL,
                    athlete_id INTEGER,
                    athlete_name TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS strava_activities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    strava_id INTEGER UNIQUE NOT NULL,
                    activity_type TEXT NOT NULL,
                    name TEXT,
                    distance REAL,
                    moving_time INTEGER,
                    elapsed_time INTEGER,
                    start_date TEXT NOT NULL,
                    start_date_local TEXT,
                    average_speed REAL,
                    max_speed REAL,
                    average_heartrate REAL,
                    max_heartrate REAL,
                    calories REAL,
                    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        conn.commit()


def save_strava_tokens(user_id: int, access_token: str, refresh_token: str, 
                       expires_at: int, athlete_id: int = None, 
                       athlete_name: str = None) -> int:
    """Save or update Strava OAuth tokens for a user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            # Use upsert for PostgreSQL
            cursor.execute(
                """INSERT INTO strava_tokens 
                   (user_id, access_token, refresh_token, expires_at, athlete_id, athlete_name, updated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                   ON CONFLICT (user_id) DO UPDATE SET
                   access_token = EXCLUDED.access_token,
                   refresh_token = EXCLUDED.refresh_token,
                   expires_at = EXCLUDED.expires_at,
                   athlete_id = EXCLUDED.athlete_id,
                   athlete_name = EXCLUDED.athlete_name,
                   updated_at = CURRENT_TIMESTAMP
                   RETURNING id""",
                (user_id, access_token, refresh_token, expires_at, athlete_id, athlete_name)
            )
            token_id = cursor.fetchone()["id"]
        else:
            cursor.execute(
                """INSERT OR REPLACE INTO strava_tokens 
                   (user_id, access_token, refresh_token, expires_at, athlete_id, athlete_name, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)""",
                (user_id, access_token, refresh_token, expires_at, athlete_id, athlete_name)
            )
            token_id = cursor.lastrowid
        conn.commit()
        return token_id


def get_strava_tokens(user_id: int) -> Optional[Dict[str, Any]]:
    """Get Strava tokens for a user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """SELECT * FROM strava_tokens WHERE user_id = %s""",
                (user_id,)
            )
        else:
            cursor.execute(
                """SELECT * FROM strava_tokens WHERE user_id = ?""",
                (user_id,)
            )
        row = cursor.fetchone()
        return dict(row) if row else None


def delete_strava_tokens(user_id: int) -> bool:
    """Delete Strava tokens for a user (disconnect)"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """DELETE FROM strava_tokens WHERE user_id = %s""",
                (user_id,)
            )
        else:
            cursor.execute(
                """DELETE FROM strava_tokens WHERE user_id = ?""",
                (user_id,)
            )
        conn.commit()
        return cursor.rowcount > 0


def save_strava_activity(user_id: int, strava_id: int, activity_type: str,
                         name: str, distance: float, moving_time: int,
                         elapsed_time: int, start_date: str,
                         start_date_local: str = None, average_speed: float = None,
                         max_speed: float = None, average_heartrate: float = None,
                         max_heartrate: float = None, calories: float = None) -> int:
    """Save or update a Strava activity"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """INSERT INTO strava_activities 
                   (user_id, strava_id, activity_type, name, distance, moving_time, 
                    elapsed_time, start_date, start_date_local, average_speed, 
                    max_speed, average_heartrate, max_heartrate, calories, synced_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                   ON CONFLICT (strava_id) DO UPDATE SET
                   activity_type = EXCLUDED.activity_type,
                   name = EXCLUDED.name,
                   distance = EXCLUDED.distance,
                   moving_time = EXCLUDED.moving_time,
                   elapsed_time = EXCLUDED.elapsed_time,
                   start_date = EXCLUDED.start_date,
                   start_date_local = EXCLUDED.start_date_local,
                   average_speed = EXCLUDED.average_speed,
                   max_speed = EXCLUDED.max_speed,
                   average_heartrate = EXCLUDED.average_heartrate,
                   max_heartrate = EXCLUDED.max_heartrate,
                   calories = EXCLUDED.calories,
                   synced_at = CURRENT_TIMESTAMP
                   RETURNING id""",
                (user_id, strava_id, activity_type, name, distance, moving_time,
                 elapsed_time, start_date, start_date_local, average_speed,
                 max_speed, average_heartrate, max_heartrate, calories)
            )
            activity_id = cursor.fetchone()["id"]
        else:
            cursor.execute(
                """INSERT OR REPLACE INTO strava_activities 
                   (user_id, strava_id, activity_type, name, distance, moving_time, 
                    elapsed_time, start_date, start_date_local, average_speed, 
                    max_speed, average_heartrate, max_heartrate, calories, synced_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)""",
                (user_id, strava_id, activity_type, name, distance, moving_time,
                 elapsed_time, start_date, start_date_local, average_speed,
                 max_speed, average_heartrate, max_heartrate, calories)
            )
            activity_id = cursor.lastrowid
        conn.commit()
        return activity_id


def get_strava_activities(user_id: int, days: int = 7) -> list:
    """Get Strava activities for a user within the specified days"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """SELECT * FROM strava_activities 
                   WHERE user_id = %s AND date(start_date) >= CURRENT_DATE - INTERVAL '%s days'
                   ORDER BY start_date DESC""",
                (user_id, days)
            )
        else:
            cursor.execute(
                """SELECT * FROM strava_activities 
                   WHERE user_id = ? AND date(start_date) >= date('now', ?)
                   ORDER BY start_date DESC""",
                (user_id, f'-{days} days')
            )
        return [dict(row) for row in cursor.fetchall()]


def get_strava_weekly_stats(user_id: int) -> Dict[str, Any]:
    """Get weekly statistics from Strava activities"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute(
                """SELECT 
                    SUM(moving_time) as total_moving_time,
                    SUM(distance) as total_distance,
                    COUNT(*) as activity_count,
                    AVG(average_heartrate) as avg_heartrate
                   FROM strava_activities 
                   WHERE user_id = %s AND date(start_date) >= CURRENT_DATE - INTERVAL '7 days'""",
                (user_id,)
            )
        else:
            cursor.execute(
                """SELECT 
                    SUM(moving_time) as total_moving_time,
                    SUM(distance) as total_distance,
                    COUNT(*) as activity_count,
                    AVG(average_heartrate) as avg_heartrate
                   FROM strava_activities 
                   WHERE user_id = ? AND date(start_date) >= date('now', '-7 days')""",
                (user_id,)
            )
        row = cursor.fetchone()
        if row:
            row_dict = dict(row)
            total_seconds = row_dict["total_moving_time"] or 0
            return {
                "total_minutes": round(total_seconds / 60),
                "total_distance_km": round((row_dict["total_distance"] or 0) / 1000, 2),
                "activity_count": row_dict["activity_count"] or 0,
                "avg_heartrate": round(row_dict["avg_heartrate"]) if row_dict["avg_heartrate"] else None
            }
        return {"total_minutes": 0, "total_distance_km": 0, "activity_count": 0, "avg_heartrate": None}


# ==================== INITIALIZE ALL TABLES ====================

def init_all_tables():
    """Initialize all database tables including new ones"""
    init_database()
    init_water_table()
    init_medication_tables()
    init_appointment_tables()
    init_hba1c_table()
    init_reminder_tables()
    init_strava_tables()
    logger.info("All database tables initialized successfully")
