import difflib
from typing import Optional, Dict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.reference_price import ReferencePrice

async def get_latest_reference_prices(db: AsyncSession) -> Dict[str, float]:
    """
    Queries the reference_prices table, takes the latest row (based on scraped_at)
    for each unique commodity_name, and returns a dictionary: {commodity_name: price_per_kg}.
    """
    stmt = (
        select(ReferencePrice)
        .distinct(ReferencePrice.commodity_name)
        .order_by(ReferencePrice.commodity_name, ReferencePrice.scraped_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return {row.commodity_name: row.price_per_kg for row in rows}

def find_reference_price(product_name: str, product_category: str, reference_prices: Dict[str, float]) -> Optional[float]:
    """
    Uses Python's difflib.get_close_matches to find the commodity_name closest to
    product_name (first), and falls back to product_category if not found.
    Uses a similarity cutoff of 0.6.
    Returns the matched price or None.
    """
    # Normalize keys and values
    normalized_prices = {name.lower(): price for name, price in reference_prices.items()}
    possibilities = list(normalized_prices.keys())
    
    # Try finding close match for product_name
    name_matches = difflib.get_close_matches(product_name.lower(), possibilities, n=1, cutoff=0.6)
    if name_matches:
        return normalized_prices[name_matches[0]]
        
    # Try finding close match for product_category
    category_matches = difflib.get_close_matches(product_category.lower(), possibilities, n=1, cutoff=0.6)
    if category_matches:
        return normalized_prices[category_matches[0]]
        
    return None
