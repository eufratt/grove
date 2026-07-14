import asyncio
import os
import sys
import uuid
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    from dotenv import load_dotenv
    load_dotenv()
    DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def main():
    print("Connecting to DB...", flush=True)
    async with AsyncSessionLocal() as session:
        print("Inserting single row...", flush=True)
        sql = text("INSERT INTO reference_prices (id, commodity_name, price_per_kg, source, region, scraped_at) VALUES (:id, :comm, :price, :source, :reg, :scraped)")
        await session.execute(sql, {
            "id": uuid.uuid4(),
            "comm": "Test Beras",
            "price": 15000.0,
            "source": "Test",
            "reg": "Nasional",
            "scraped": datetime.utcnow()
        })
        print("Committing...", flush=True)
        await session.commit()
        print("Done successfully!", flush=True)

if __name__ == '__main__':
    asyncio.run(main())
