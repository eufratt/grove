import asyncio
import os
import sys
from sqlalchemy import select, func

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import AsyncSessionLocal
from app.models.reference_price import ReferencePrice

async def main():
    async with AsyncSessionLocal() as session:
        # 1. Total count
        total_stmt = select(func.count(ReferencePrice.id))
        total_res = await session.execute(total_stmt)
        print("Total rows in reference_prices:", total_res.scalar())

        # 2. Distinct commodities
        comm_stmt = select(ReferencePrice.commodity_name).distinct()
        comm_res = await session.execute(comm_stmt)
        commodities = comm_res.scalars().all()
        print("Commodities:", commodities)

        # 3. Distinct regions
        reg_stmt = select(ReferencePrice.region).distinct()
        reg_res = await session.execute(reg_stmt)
        regions = reg_res.scalars().all()
        print("Regions:", regions)

        # 4. Count per commodity x region
        stmt = (
            select(ReferencePrice.commodity_name, ReferencePrice.region, func.count(ReferencePrice.id), func.min(ReferencePrice.scraped_at), func.max(ReferencePrice.scraped_at))
            .group_by(ReferencePrice.commodity_name, ReferencePrice.region)
            .order_by(ReferencePrice.commodity_name, ReferencePrice.region)
        )
        res = await session.execute(stmt)
        rows = res.all()
        print("\nDistribution per combination:")
        for r in rows:
            print(f" - {r[0]} | {r[1]}: count={r[2]}, min_date={r[3]}, max_date={r[4]}")

if __name__ == '__main__':
    asyncio.run(main())
