from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from app.db import get_db
from app.models.user import User
from app.models.rating import Rating, RoleContext, TransactionType
from app.services import auth_service
from app.services.rating_service import create_rating, get_user_ratings

router = APIRouter(prefix="/ratings", tags=["ratings"])

class RatingCreateSchema(BaseModel):
    transaction_type: TransactionType
    reference_id: UUID
    score: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class RatingResponseSchema(BaseModel):
    id: UUID
    rater_id: UUID
    rated_id: UUID
    role_context: RoleContext
    transaction_type: TransactionType
    reference_id: UUID
    score: int
    comment: Optional[str]
    created_at: datetime
    rater_name: Optional[str] = None

    class Config:
        from_attributes = True

class RatingSummarySchema(BaseModel):
    ratings: List[RatingResponseSchema]
    average: float
    count: int

@router.post("", response_model=RatingResponseSchema)
async def submit_rating_endpoint(
    body: RatingCreateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    rating = await create_rating(
        db=db,
        rater_id=current_user.id,
        transaction_type=body.transaction_type,
        reference_id=body.reference_id,
        score=body.score,
        comment=body.comment
    )
    return rating

@router.get("/user/{user_id}/seller", response_model=RatingSummarySchema)
async def get_user_ratings_as_seller(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    return await get_user_ratings(db, user_id, RoleContext.AS_SELLER)

@router.get("/user/{user_id}/buyer", response_model=RatingSummarySchema)
async def get_user_ratings_as_buyer(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    return await get_user_ratings(db, user_id, RoleContext.AS_BUYER)
