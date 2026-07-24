from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.user import UserRole

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    avatar_url: Optional[str] = None
    role: Optional[UserRole] = None
    phone_whatsapp: Optional[str] = None
    bio: Optional[str] = None
    theme_color: Optional[str] = None
    seller_rating_avg: Optional[float] = 0.0
    seller_rating_count: int = 0
    buyer_rating_avg: Optional[float] = 0.0
    buyer_rating_count: int = 0
    created_at: datetime
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True

class CompleteProfileRequest(BaseModel):
    role: Optional[UserRole] = None
    phone_whatsapp: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class UpdateProfileRequest(BaseModel):
    phone_whatsapp: Optional[str] = None
    phone_number: Optional[str] = None
    bio: Optional[str] = None
    theme_color: Optional[str] = None

class UpgradeToFarmerRequest(BaseModel):
    phone_whatsapp: str

class UserLocationUpdate(BaseModel):
    lat: float
    lng: float
