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
        res = await session.execute(select(func.count(ReferencePrice.id)))
        print("CURRENT_COUNT:", res.scalar(), flush=True)

if __name__ == '__main__':
    asyncio.run(main())
