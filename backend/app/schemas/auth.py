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
    created_at: datetime

    class Config:
        from_attributes = True

class GoogleLoginRequest(BaseModel):
    id_token: str

class CompleteProfileRequest(BaseModel):
    role: Optional[UserRole] = None
    phone_whatsapp: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class UpdateProfileRequest(BaseModel):
    phone_whatsapp: Optional[str] = None
    phone_number: Optional[str] = None


class UpgradeToFarmerRequest(BaseModel):
    phone_whatsapp: str


class UserLocationUpdate(BaseModel):
    lat: float
    lng: float
