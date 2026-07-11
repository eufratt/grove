import enum
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Enum, DateTime, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db import Base

class ScrapeStatusEnum(str, enum.Enum):
    SUCCESS = "success"
    FAILED = "failed"

class ScraperStatus(Base):
    __tablename__ = "scraper_statuses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    last_run_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    status: Mapped[ScrapeStatusEnum] = mapped_column(Enum(ScrapeStatusEnum), nullable=False)
    items_scraped: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
