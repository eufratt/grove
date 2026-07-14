import asyncio
import os
import sys
from sqlalchemy import select

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import AsyncSessionLocal
from app.models.reference_price import ReferencePrice

async def main():
    async with AsyncSessionLocal() as session:
        stmt = (
            select(ReferencePrice)
            .where(ReferencePrice.commodity_name == 'Bawang Merah')
            .where(ReferencePrice.region == 'Jawa Timur')
            .order_by(ReferencePrice.scraped_at.asc())
        )
        res = await session.execute(stmt)
        prices = res.scalars().all()
        print("Prices for Bawang Merah | Jawa Timur:")
        for p in prices:
            print(f"ID: {p.id}, price: {p.price_per_kg}, source: {p.source}, scraped_at: {p.scraped_at}")

if __name__ == '__main__':
    asyncio.run(main())
