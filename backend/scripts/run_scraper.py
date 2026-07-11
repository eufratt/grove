import os
import sys
import asyncio
from datetime import datetime
from playwright.async_api import async_playwright
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Add backend directory to sys.path so we can import app models/schemas
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.reference_price import ReferencePrice
from app.models.scraper_status import ScraperStatus, ScrapeStatusEnum

DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL environment variable is not set.")
    sys.exit(1)

# Configure async engine and sessionmaker
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def scrape_data() -> list[dict]:
    async with async_playwright() as p:
        # Launch headless browser
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print("Navigating to PIHPS...")
        await page.goto("https://www.bi.go.id/hargapangan/TabelHarga/ProdusenKomoditas", timeout=60000)
        
        # Wait for "Lihat Laporan" button to be ready
        button_selector = "input[type='submit'][value='Lihat Laporan']"
        await page.wait_for_selector(button_selector, timeout=20000)
        
        print("Clicking Lihat Laporan...")
        await page.click(button_selector)
        
        # Wait for results table to render
        table_selector = ".table-report, table#MainContent_gridMain"
        await page.wait_for_selector(table_selector, timeout=30000)
        
        print("Extracting data...")
        rows = await page.query_selector_all("tr")
        extracted_data = []
        
        for row in rows:
            cols = await row.query_selector_all("td")
            if len(cols) >= 2:
                commodity = await cols[0].inner_text()
                price_str = await cols[1].inner_text()
                
                commodity = commodity.strip()
                # Clean price string (e.g. "Rp 15.000" or "15,000" -> 15000)
                price_cleaned = price_str.replace("Rp", "").replace(".", "").replace(",", "").strip()
                
                if commodity and price_cleaned.isdigit():
                    extracted_data.append({
                        "commodity_name": commodity,
                        "price_per_kg": float(price_cleaned),
                        "source": "PIHPS BI",
                        "region": "Nasional",
                        "scraped_at": datetime.utcnow()
                    })
        
        await browser.close()
        return extracted_data

async def main():
    start_time = datetime.utcnow()
    status = ScrapeStatusEnum.FAILED
    error_message = None
    items_scraped = 0
    
    try:
        data = await scrape_data()
        items_scraped = len(data)
        
        if items_scraped > 0:
            async with AsyncSessionLocal() as db:
                for item in data:
                    new_price = ReferencePrice(**item)
                    db.add(new_price)
                await db.commit()
            
            status = ScrapeStatusEnum.SUCCESS
            print(f"Scraping completed successfully. Scraped {items_scraped} items.")
        else:
            error_message = "No data rows matched in the table."
            print(f"Scraping failed: {error_message}")
            
    except Exception as e:
        error_message = str(e)
        print(f"Error during scraping: {error_message}")
        
    # Always log status to scraper_statuses
    try:
        async with AsyncSessionLocal() as db:
            log_entry = ScraperStatus(
                last_run_at=start_time,
                status=status,
                items_scraped=items_scraped,
                error_message=error_message
            )
            db.add(log_entry)
            await db.commit()
            print("Logged scraper status to database.")
    except Exception as db_err:
        print(f"Failed to log scraper status to DB: {db_err}")

if __name__ == '__main__':
    asyncio.run(main())
