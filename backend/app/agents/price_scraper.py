import asyncio
import logging
import psutil
from datetime import datetime
from typing import List, Dict, Any
from playwright.async_api import async_playwright
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db import AsyncSessionLocal
from app.models.reference_price import ReferencePrice

# Global state for status tracking
scraper_status = {
    "last_run": None,
    "status": "idle",
    "last_error": None,
    "items_scraped": 0
}

logger = logging.getLogger(__name__)

async def scrape_reference_prices():
    """
    Scrapes reference prices from PIHPS Nasional Bank Indonesia.
    """
    global scraper_status
    
    # Memory check for low-RAM environments
    vm = psutil.virtual_memory()
    # If more than 85% of RAM is used, we might want to skip to avoid crashing
    if vm.percent > 85:
        logger.warning(f"Scraping skipped due to high memory usage: {vm.percent}%")
        scraper_status["status"] = "skipped (high memory)"
        return []

    scraper_status["status"] = "running"
    scraper_status["last_run"] = datetime.utcnow().isoformat()
    
    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_viewport_size({"width": 1280, "height": 800})
            page = await browser.new_page()
            
            logger.info("Navigating to PIHPS...")
            await page.goto("https://www.bi.go.id/hargapangan/TabelHarga/ProdusenKomoditas", timeout=60000)
            
            # Wait for filter dropdowns to be ready
            # PIHPS often uses dynamic dropdowns. We'll wait for the 'Lihat Laporan' button.
            button_selector = "input[type='submit'][value='Lihat Laporan']"
            await page.wait_for_selector(button_selector)
            
            logger.info("Filtering data and clicking report...")
            # For simplicity, we trigger the default report (all commodities, all regions)
            # You can add more complex logic to select specific dropdown values if needed.
            await page.click(button_selector)
            
            # Data is loaded via AJAX. Wait for the results table.
            # Usually the table has a specific ID or class like 'table-report' or similar.
            # Based on PIHPS structure, we wait for the data table content.
            table_selector = ".table-report, table#MainContent_gridMain"
            await page.wait_for_selector(table_selector, timeout=30000)
            
            logger.info("Extracting data from table...")
            # Extract rows
            rows = await page.query_selector_all("tr")
            
            extracted_data = []
            # Start from index 1 to skip header if necessary, logic depends on actual table structure
            for row in rows:
                cols = await row.query_selector_all("td")
                if len(cols) >= 2:
                    # Example mapping (needs adjustment based on live site observation)
                    commodity = await cols[0].inner_text()
                    price_str = await cols[1].inner_text()
                    
                    # Basic cleaning
                    commodity = commodity.strip()
                    # Price usually format: "15,000" or "Rp 15.000"
                    price_cleaned = price_str.replace("Rp", "").replace(".", "").replace(",", "").strip()
                    
                    if commodity and price_cleaned.isdigit():
                        extracted_data.append({
                            "commodity_name": commodity,
                            "price_per_kg": float(price_cleaned),
                            "source": "PIHPS BI",
                            "region": "Nasional", # Adjust if scraping specific regions
                            "scraped_at": datetime.utcnow()
                        })
            
            await browser.close()
            
            if extracted_data:
                await save_scraped_prices(extracted_data)
                scraper_status["status"] = "success"
                scraper_status["items_scraped"] = len(extracted_data)
                scraper_status["last_error"] = None
                logger.info(f"Successfully scraped {len(extracted_data)} items.")
            else:
                scraper_status["status"] = "no data found"
                logger.warning("No data found in the table.")
                
            return extracted_data

        except Exception as e:
            logger.error(f"Scraping failed: {str(e)}")
            scraper_status["status"] = "failed"
            scraper_status["last_error"] = str(e)
            return []

async def save_scraped_prices(data: List[Dict[str, Any]]):
    """
    Saves or updates scraped data into the database.
    """
    async with AsyncSessionLocal() as db:
        try:
            # For simplicity, we'll clear old prices and insert new ones
            # or you could do an UPSERT logic.
            # await db.execute(delete(ReferencePrice)) 
            
            for item in data:
                # Check if exists to update or just insert new
                # Here we just insert to keep history, or update based on commodity + region
                new_price = ReferencePrice(**item)
                db.add(new_price)
            
            await db.commit()
        except Exception as e:
            logger.error(f"Database save failed: {str(e)}")
            await db.rollback()

def get_scraper_status():
    return scraper_status
