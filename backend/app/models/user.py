import enum
import uuid
from datetime import datetime
from sqlalchemy import String, Enum, DateTime, Column
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
from app.db import Base

class UserRole(str, enum.Enum):
    PETANI = "petani"
    PEMBELI = "pembeli"
    AGEN = "agen"

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    phone_whatsapp: Mapped[str] = mapped_column(String(20), nullable=False)
    
    # Geography Point (SRID 4326 for WGS84)
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
