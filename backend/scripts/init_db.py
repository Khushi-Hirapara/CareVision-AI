"""Create database tables from SQLAlchemy models.

Usage (from backend/):
    python -m scripts.init_db
"""

from app.database import init_db

if __name__ == "__main__":
    init_db()
    print("Database tables created successfully.")
