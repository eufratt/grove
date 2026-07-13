from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db import get_db
from app.models.reference_price import ReferencePrice
from app.models.product import Product, ProductStatus

router = APIRouter(prefix="/reference-prices", tags=["reference-prices"])

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
