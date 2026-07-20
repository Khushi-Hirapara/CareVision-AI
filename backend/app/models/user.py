from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.roles import DOCTOR
from app.database import Base

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.scan import Scan


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default=DOCTOR, server_default=DOCTOR)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    scans: Mapped[List["Scan"]] = relationship(
        "Scan",
        back_populates="user",
        foreign_keys="Scan.user_id",
        cascade="all, delete-orphan",
    )
    patients: Mapped[List["Patient"]] = relationship(
        "Patient",
        back_populates="doctor",
        foreign_keys="Patient.doctor_id",
        cascade="all, delete-orphan",
    )
    patient_profile: Mapped[Optional["Patient"]] = relationship(
        "Patient",
        back_populates="user",
        foreign_keys="Patient.user_id",
        uselist=False,
    )
