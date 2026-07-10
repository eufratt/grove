import enum
import uuid
from datetime import datetime
from sqlalchemy import Enum, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db import Base

class OrderStatus(str, enum.Enum):
    DIPESAN = "dipesan"
    DIKONFIRMASI = "dikonfirmasi"
    SIAP_DIAMBIL = "siap_diambil"
    SELESAI = "selesai"
    BATAL = "batal"

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    buyer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.DIPESAN)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
