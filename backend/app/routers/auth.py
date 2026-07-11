from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timedelta
from app.db import get_db
from app.schemas.auth import UserCreate, UserLogin, UserResponse
from app.models.user import User
from app.models.token import RefreshToken
from app.services import auth_service
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if email exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=user_data.email,
        hashed_password=auth_service.hash_password(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        phone_whatsapp=user_data.phone_whatsapp
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login")
async def login(response: Response, login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not auth_service.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Generate tokens
    access_token = auth_service.create_access_token(data={"sub": str(user.id)})
    refresh_token_raw = auth_service.generate_refresh_token()
    
    # Save refresh token in DB
    new_refresh_token = RefreshToken(
        user_id=user.id,
        token_hash=auth_service.hash_password(refresh_token_raw), # hashing for security
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(new_refresh_token)
    await db.commit()
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False, # Set to True in production with HTTPS
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_raw,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        samesite="lax",
        secure=False,
    )
    
    return {"message": "Login successful"}

@router.post("/refresh")
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    refresh_token_raw = request.cookies.get("refresh_token")
    if not refresh_token_raw:
        raise HTTPException(status_code=401, detail="No refresh token")
    
    # This is a bit expensive since we hash it. 
    # Usually we'd store a token ID or just the raw token and query it.
    # To keep it simple but somewhat secure as requested, we'll fetch tokens for this user or search.
    # Actually, a better way for RefreshToken in DB is to store it as a unique string and query directly.
    # Let's assume we can query by some property.
    
    # For now, let's find any non-revoked token and verify hash
    result = await db.execute(select(RefreshToken).where(RefreshToken.revoked == False))
    tokens = result.scalars().all()
    
    found_token = None
    for token in tokens:
        if auth_service.verify_password(refresh_token_raw, token.token_hash):
            if token.expires_at > datetime.utcnow():
                found_token = token
                break
    
    if not found_token:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    # Generate new access token
    access_token = auth_service.create_access_token(data={"sub": str(found_token.user_id)})
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,
    )
    
    return {"message": "Token refreshed"}

@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    refresh_token_raw = request.cookies.get("refresh_token")
    if refresh_token_raw:
        # Revoke token in DB
        result = await db.execute(select(RefreshToken).where(RefreshToken.revoked == False))
        tokens = result.scalars().all()
        for token in tokens:
            if auth_service.verify_password(refresh_token_raw, token.token_hash):
                token.revoked = True
                await db.commit()
                break
    
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}
