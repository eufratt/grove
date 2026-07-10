import enum
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Enum, DateTime, ForeignKey, Float, Column
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
from pgvector.sqlalchemy import Vector
from app.db import Base

class ProductStatus(str, enum.Enum):
    TERSEDIA = "tersedia"
    TERJUAL = "terjual"
    DITUTUP = "ditutup"

class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    price_per_kg: Mapped[float] = mapped_column(Float, nullable=False)
    reference_price_per_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Geography Point
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
    
    status: Mapped[ProductStatus] = mapped_column(Enum(ProductStatus), default=ProductStatus.TERSEDIA)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # pgvector embedding (dimensi 384)
    embedding = Column(Vector(384), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
