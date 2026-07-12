from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import WKTElement

from app.db import get_db
from app.schemas.auth import UserResponse, UserLocationUpdate
from app.models.user import User
from app.services import auth_service

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
