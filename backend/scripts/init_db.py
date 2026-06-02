"""Create database tables from SQLAlchemy models.

Usage (from backend/):
    python -m scripts.init_db
"""

from app.database import SessionLocal, init_db
from app.services.user import get_or_create_default_user

if __name__ == "__main__":
    init_db()
    with SessionLocal() as db:
        user = get_or_create_default_user(db)
        print(f"Demo user ready: id={user.id} email={user.email}")
    print("Database tables created successfully.")
