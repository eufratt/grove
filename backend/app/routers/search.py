from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import List

from app.db import get_db
from app.models.product import Product, ProductStatus
from app.schemas.product import ProductResponse
from app.services.embedding_service import embedding_service

router = APIRouter(prefix="/search", tags=["search"])

@router.get("", response_model=List[ProductResponse])
async def semantic_search(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db)
):
    # Generate embedding for the search query
    query_embedding = await embedding_service.generate_embedding(q)
    
    # Execute semantic search using pgvector cosine distance operator (<=>)
    # We use raw SQL because pgvector-sqlalchemy integration with async sessions 
    # can be tricky depending on the version, and raw SQL is explicit.
    
    sql = text("""
        SELECT id, seller_id, name, category, quantity_kg, price_per_kg, reference_price_per_kg, status, photo_url, created_at,
               ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude
        FROM products 
        WHERE status = 'TERSEDIA'
        ORDER BY embedding <=> :embedding
        LIMIT 20
    """)
    
    result = await db.execute(sql, {"embedding": str(query_embedding)})
    
    # Map the results to the schema
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
