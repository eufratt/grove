import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, text
from typing import List, Optional
from uuid import UUID

from app.db import get_db
from app.models.user import User, UserRole
from app.models.product import Product, ProductStatus
from app.schemas.product import ProductResponse, ProductUpdate
from app.services import auth_service, storage_service, embedding_service, price_matching_service
from geoalchemy2 import WKTElement

router = APIRouter(prefix="/products", tags=["products"])

@router.post("", response_model=ProductResponse)
async def create_product(
    name: str = Form(...),
    category: str = Form(...),
    quantity_kg: float = Form(...),
    price_per_kg: float = Form(...),
    photo: UploadFile = File(...),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    if current_user.role not in [UserRole.PETANI, UserRole.AGEN]:
        raise HTTPException(status_code=403, detail="Only farmers or agents can post products")
    
    photo_url = await storage_service.upload_product_photo(photo)
    
    # Generate semantic embedding from name and category
    embedding_text = f"{name} {category}"
    embedding = await embedding_service.embedding_service.generate_embedding(embedding_text)
    
    product_location = None
    if lat is not None and lng is not None:
        product_location = WKTElement(f"POINT({lng} {lat})", srid=4326)
    elif current_user.location is not None:
        product_location = current_user.location

    reference_price = None
    try:
        ref_prices = await price_matching_service.get_latest_reference_prices(db)
        reference_price = price_matching_service.find_reference_price(name, category, ref_prices)
    except Exception as e:
        print(f"Failed to match reference price: {e}")

    new_product = Product(
        seller_id=current_user.id,
        name=name,
        category=category,
        quantity_kg=quantity_kg,
        price_per_kg=price_per_kg,
        photo_url=photo_url,
        status=ProductStatus.TERSEDIA,
        embedding=embedding,
        location=product_location,
        reference_price_per_kg=reference_price
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
    sql = text("""
        SELECT id, seller_id, name, category, quantity_kg, price_per_kg, reference_price_per_kg, status, photo_url, created_at,
               ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude
        FROM products 
        WHERE status = 'TERSEDIA'
        ORDER BY created_at DESC
        OFFSET :skip
        LIMIT :limit
    """)
    result = await db.execute(sql, {"skip": skip, "limit": limit})
    
    products = []
    for row in result:
        products.append({
            "id": row.id,
            "seller_id": row.seller_id,
            "name": row.name,
            "category": row.category,
            "quantity_kg": row.quantity_kg,
            "price_per_kg": row.price_per_kg,
            "reference_price_per_kg": row.reference_price_per_kg,
            "status": row.status,
            "photo_url": row.photo_url,
            "created_at": row.created_at,
            "latitude": row.latitude,
            "longitude": row.longitude
        })
    return products

@router.get("/nearby", response_model=List[ProductResponse])
async def get_nearby_products(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Find products within a radius using PostGIS.
    """
    # Use raw SQL to leverage PostGIS geography functions
    sql = text("""
        SELECT id, seller_id, name, category, quantity_kg, price_per_kg, reference_price_per_kg, status, photo_url, created_at,
               ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude,
               ST_Distance(location, ST_MakePoint(:lng, :lat)::geography) / 1000 as distance_km
        FROM products 
        WHERE status = 'TERSEDIA' 
          AND ST_DWithin(location, ST_MakePoint(:lng, :lat)::geography, :radius_meters)
        ORDER BY distance_km ASC
    """)
    
    result = await db.execute(sql, {
        "lng": lng, 
        "lat": lat, 
        "radius_meters": radius_km * 1000
    })
    
    products = []
    for row in result:
        products.append({
            "id": row.id,
            "seller_id": row.seller_id,
            "name": row.name,
            "category": row.category,
            "quantity_kg": row.quantity_kg,
            "price_per_kg": row.price_per_kg,
            "reference_price_per_kg": row.reference_price_per_kg,
            "status": row.status,
            "photo_url": row.photo_url,
            "created_at": row.created_at,
            "distance_km": row.distance_km,
            "latitude": row.latitude,
            "longitude": row.longitude
        })
        
    return products

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: UUID, db: AsyncSession = Depends(get_db)):
    sql = text("""
        SELECT id, seller_id, name, category, quantity_kg, price_per_kg, reference_price_per_kg, status, photo_url, created_at,
               ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude
        FROM products 
        WHERE id = :product_id
    """)
    result = await db.execute(sql, {"product_id": product_id})
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
        
    return {
        "id": row.id,
        "seller_id": row.seller_id,
        "name": row.name,
        "category": row.category,
        "quantity_kg": row.quantity_kg,
        "price_per_kg": row.price_per_kg,
        "reference_price_per_kg": row.reference_price_per_kg,
        "status": row.status,
        "photo_url": row.photo_url,
        "created_at": row.created_at,
        "latitude": row.latitude,
        "longitude": row.longitude
    }

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

@router.post("/{product_id}/refresh-reference-price", response_model=ProductResponse)
async def refresh_product_reference_price(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    if product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only refresh your own products")
        
    ref_prices = await price_matching_service.get_latest_reference_prices(db)
    matched_price = price_matching_service.find_reference_price(product.name, product.category, ref_prices)
    
    product.reference_price_per_kg = matched_price
    await db.commit()
    
    # We fetch it again using standard SELECT to populate ST_X/ST_Y/latitude/longitude/etc correctly
    sql = text("""
        SELECT id, seller_id, name, category, quantity_kg, price_per_kg, reference_price_per_kg, status, photo_url, created_at,
               ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude
        FROM products 
        WHERE id = :product_id
    """)
    result_refetched = await db.execute(sql, {"product_id": product.id})
    row = result_refetched.first()
    if not row:
        raise HTTPException(status_code=404, detail="Product not found after update")
        
    return {
        "id": row.id,
        "seller_id": row.seller_id,
        "name": row.name,
        "category": row.category,
        "quantity_kg": row.quantity_kg,
        "price_per_kg": row.price_per_kg,
        "reference_price_per_kg": row.reference_price_per_kg,
        "status": row.status,
        "photo_url": row.photo_url,
        "created_at": row.created_at,
        "latitude": row.latitude,
        "longitude": row.longitude
    }
