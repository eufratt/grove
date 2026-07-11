from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.agents.price_scraper import scrape_reference_prices
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

def setup_scheduler():
    """
    Configure and start the background scheduler.
    """
    # Schedule scraping once a day at midnight
    scheduler.add_job(
        scrape_reference_prices, 
        "cron", 
        hour=0, 
        minute=0, 
        id="daily_price_scrape",
        replace_existing=True
    )
    
    # Optional: Initial scrape on startup (can be disabled if slow)
    # scheduler.add_job(scrape_reference_prices, "date", id="startup_scrape")
    
    logger.info("Scheduler configured: Price scraping task added.")
    
    if not scheduler.running:
        scheduler.start()
        logger.info("Scheduler started.")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped.")
