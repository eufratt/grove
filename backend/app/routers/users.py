from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import WKTElement

from app.db import get_db
from app.schemas.user import UserResponse, UserLocationUpdate, UpgradeToFarmerRequest, UpdateProfileRequest
from app.models.user import User, UserRole
from app.services import auth_service
from app.services.auth_service import validate_indonesian_phone

router = APIRouter(prefix="/users", tags=["users"])

@router.patch("/me/location", response_model=UserResponse)
async def update_location(
    location_data: UserLocationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    current_user.location = WKTElement(f"POINT({location_data.lng} {location_data.lat})", srid=4326)
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/upgrade-to-farmer", response_model=UserResponse)
async def upgrade_to_farmer(
    upgrade_data: UpgradeToFarmerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    phone = upgrade_data.phone_whatsapp
    if not phone or not validate_indonesian_phone(phone):
        raise HTTPException(
            status_code=400,
            detail="Format nomor telepon tidak valid. Gunakan format Indonesia (misal: 08xx atau +628xx)"
        )
    
    current_user.role = UserRole.PETANI
    current_user.phone_whatsapp = phone
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.patch("/me", response_model=UserResponse)
async def update_profile(
    profile_data: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    phone = profile_data.phone_whatsapp or profile_data.phone_number
    if phone is not None:
        if phone == "":
            current_user.phone_whatsapp = None
        else:
            if not validate_indonesian_phone(phone):
                raise HTTPException(
                    status_code=400,
                    detail="Format nomor telepon tidak valid. Gunakan format Indonesia (misal: 08xx atau +628xx)"
                )
            current_user.phone_whatsapp = phone
    await db.commit()
    await db.refresh(current_user)
    return current_user

