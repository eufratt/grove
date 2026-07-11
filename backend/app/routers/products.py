import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from uuid import UUID

from app.db import get_db
from app.models.user import User, UserRole
from app.models.product import Product, ProductStatus
from app.schemas.product import ProductResponse, ProductUpdate
from app.services import auth_service, storage_service, embedding_service

router = APIRouter(prefix="/products", tags=["products"])

@router.post("", response_model=ProductResponse)
async def create_product(
    name: str = Form(...),
    category: str = Form(...),
    quantity_kg: float = Form(...),
    price_per_kg: float = Form(...),
    photo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    if current_user.role not in [UserRole.PETANI, UserRole.AGEN]:
        raise HTTPException(status_code=403, detail="Only farmers or agents can post products")
    
    photo_url = await storage_service.upload_product_photo(photo)
    
    # Generate semantic embedding from name and category
    embedding_text = f"{name} {category}"
    embedding = embedding_service.embedding_service.generate_embedding(embedding_text)
    
    new_product = Product(
        seller_id=current_user.id,
        name=name,
        category=category,
        quantity_kg=quantity_kg,
        price_per_kg=price_per_kg,
        photo_url=photo_url,
        status=ProductStatus.TERSEDIA,
        embedding=embedding
    )
    
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return new_product

@router.get("", response_model=List[ProductResponse])
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product)
        .where(Product.status == ProductStatus.TERSEDIA)
        .offset(skip)
        .limit(limit)
        .order_by(Product.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    product_data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own products")
    
    update_data = product_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    await db.commit()
    await db.refresh(product)
    return product
