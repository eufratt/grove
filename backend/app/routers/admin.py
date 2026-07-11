from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db import get_db
from app.models.scraper_status import ScraperStatus

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/scraper-status")
async def get_admin_scraper_status(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ScraperStatus).order_by(ScraperStatus.last_run_at.desc()).limit(1)
    )
    latest_run = result.scalar_one_or_none()
    
    if not latest_run:
        return {
            "last_run": None,
            "status": "idle",
            "last_error": None,
            "items_scraped": 0
        }
        
    return {
        "last_run": latest_run.last_run_at.isoformat(),
        "status": latest_run.status.value,
        "last_error": latest_run.error_message,
        "items_scraped": latest_run.items_scraped
    }
