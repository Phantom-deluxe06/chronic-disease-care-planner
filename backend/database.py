"""
Database module for Chronic Disease Care Planner
Uses SQLite for hackathon MVP
"""

import sqlite3
from typing import Optional, Dict, Any
from contextlib import contextmanager
import json

DATABASE_PATH = "chronic_care.db"


@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_database():
    """Initialize database tables"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Users table
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
        
        # Health data table - stores disease-specific data as JSON
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
        
        # Daily logs table for glucose, BP, food, activity tracking
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
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, age, gender) VALUES (?, ?, ?, ?, ?)",
            (name, email, password_hash, age, gender)
        )
        conn.commit()
        return cursor.lastrowid


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, age, gender, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None


def save_health_data(user_id: int, disease_type: str, data: Dict[str, Any]) -> int:
    """Save health data for a user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO health_data (user_id, disease_type, data) VALUES (?, ?, ?)",
            (user_id, disease_type, json.dumps(data))
        )
        conn.commit()
        return cursor.lastrowid


def get_user_health_data(user_id: int) -> list:
    """Get all health data for a user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT disease_type, data FROM health_data WHERE user_id = ?",
            (user_id,)
        )
        rows = cursor.fetchall()
        result = []
        for row in rows:
            result.append({
                "disease_type": row["disease_type"],
                "data": json.loads(row["data"])
            })
        return result


def get_user_diseases(user_id: int) -> list:
    """Get list of diseases for a user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT DISTINCT disease_type FROM health_data WHERE user_id = ?",
            (user_id,)
        )
        rows = cursor.fetchall()
        return [row["disease_type"] for row in rows]


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
        cursor.execute(
            """INSERT INTO daily_logs 
               (user_id, log_type, value, value_secondary, unit, reading_context, notes) 
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (user_id, log_type, value, value_secondary, unit, reading_context, notes)
        )
        conn.commit()
        return cursor.lastrowid


def get_daily_logs(user_id: int, log_type: str = None, days: int = 7) -> list:
    """Get daily logs for a user, optionally filtered by type and date range"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
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
            return {
                "avg_value": row["avg_value"],
                "min_value": row["min_value"],
                "max_value": row["max_value"],
                "count": row["count"],
                "avg_secondary": row["avg_secondary"]
            }
        return None


# ==================== WATER TRACKING ====================

def init_water_table():
    """Initialize water tracking table"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
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
        cursor.execute(
            "INSERT INTO water_logs (user_id, amount_ml) VALUES (?, ?)",
            (user_id, amount_ml)
        )
        conn.commit()
        return cursor.lastrowid


def get_water_logs_today(user_id: int) -> Dict[str, Any]:
    """Get today's water intake"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT SUM(amount_ml) as total, COUNT(*) as count
               FROM water_logs 
               WHERE user_id = ? AND log_date = date('now')""",
            (user_id,)
        )
        row = cursor.fetchone()
        return {
            "total_ml": row["total"] or 0,
            "glasses": row["count"] or 0
        }


# ==================== MEDICATION MANAGEMENT ====================

def init_medication_tables():
    """Initialize medication tables"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Medications prescribed by doctor
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
        
        # Medication intake logs
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
        cursor.execute(
            """INSERT INTO medications (user_id, name, dosage, frequency, times_of_day, notes)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_id, name, dosage, frequency, json.dumps(times_of_day), notes)
        )
        conn.commit()
        return cursor.lastrowid


def get_medications(user_id: int) -> list:
    """Get all active medications for a user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT * FROM medications WHERE user_id = ? AND is_active = TRUE""",
            (user_id,)
        )
        rows = cursor.fetchall()
        result = []
        for row in rows:
            med = dict(row)
            med['times_of_day'] = json.loads(med['times_of_day'])
            result.append(med)
        return result


def log_medication_intake(user_id: int, medication_id: int, scheduled_time: str, 
                          taken: bool = True) -> int:
    """Log medication intake"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
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
        conn.commit()
        return cursor.lastrowid


def get_medication_logs_today(user_id: int) -> list:
    """Get today's medication logs"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
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
        cursor.execute(
            """INSERT INTO appointments 
               (user_id, appointment_type, doctor_name, location, appointment_date, appointment_time, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (user_id, appointment_type, doctor_name, location, appointment_date, appointment_time, notes)
        )
        conn.commit()
        return cursor.lastrowid


def get_appointments(user_id: int, upcoming_only: bool = True) -> list:
    """Get appointments for a user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
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
        cursor.execute(
            """INSERT INTO hba1c_logs (user_id, value, test_date, lab_name, notes)
               VALUES (?, ?, ?, ?, ?)""",
            (user_id, value, test_date, lab_name, notes)
        )
        conn.commit()
        return cursor.lastrowid


def get_hba1c_history(user_id: int, limit: int = 10) -> list:
    """Get HbA1c history"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
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
        cursor.execute(
            """INSERT INTO reminders (user_id, reminder_type, title, description, time_of_day, frequency)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_id, reminder_type, title, description, time_of_day, frequency)
        )
        conn.commit()
        return cursor.lastrowid


def get_active_reminders(user_id: int, reminder_type: str = None) -> list:
    """Get active reminders for a user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
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


# ==================== INITIALIZE ALL NEW TABLES ====================

def init_all_tables():
    """Initialize all database tables including new ones"""
    init_database()
    init_water_table()
    init_medication_tables()
    init_appointment_tables()
    init_hba1c_table()
    init_reminder_tables()


