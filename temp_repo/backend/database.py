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
