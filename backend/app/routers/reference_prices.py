from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db import get_db
from app.models.reference_price import ReferencePrice
from app.models.product import Product, ProductStatus
from app.schemas.reference_price import PaginatedReferencePrices
from typing import Optional

router = APIRouter(prefix="/reference-prices", tags=["reference-prices"])

@router.get("", response_model=PaginatedReferencePrices)
async def get_reference_prices(
    commodity: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    # Distinct commodities
    stmt_distinct = select(ReferencePrice.commodity_name).distinct().order_by(ReferencePrice.commodity_name)
    res_distinct = await db.execute(stmt_distinct)
    distinct_commodities = list(res_distinct.scalars().all())

    # Build query
    query = select(ReferencePrice)
    if commodity:
        query = query.where(ReferencePrice.commodity_name == commodity)
    if search:
        query = query.where(
            (ReferencePrice.commodity_name.ilike(f"%{search}%")) |
            (ReferencePrice.region.ilike(f"%{search}%"))
        )

    # Total matching count
    count_query = select(func.count()).select_from(query.subquery())
    res_count = await db.execute(count_query)
    total = res_count.scalar() or 0

    # Pagination
    query = query.order_by(ReferencePrice.commodity_name, ReferencePrice.region).offset((page - 1) * limit).limit(limit)
    res_items = await db.execute(query)
    items = res_items.scalars().all()

    pages = (total + limit - 1) // limit if limit > 0 else 0

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages,
        "distinct_commodities": distinct_commodities
    }

@router.get("/count")
async def get_reference_prices_count(db: AsyncSession = Depends(get_db)):
    # 1. Total reference price entries count
    stmt_count = select(func.count(ReferencePrice.id))
    count_res = await db.execute(stmt_count)
    total_commodities = count_res.scalar() or 0

    # 2. Latest update time (max scraped_at)
    stmt_max = select(func.max(ReferencePrice.scraped_at))
    max_res = await db.execute(stmt_max)
    last_updated = max_res.scalar()

    # 3. Total active products count
    stmt_prod = select(func.count(Product.id)).where(Product.status == ProductStatus.TERSEDIA)
    prod_res = await db.execute(stmt_prod)
    active_products = prod_res.scalar() or 0

    return {
        "total_commodities": total_commodities,
        "last_updated": last_updated,
        "active_products": active_products
    }
