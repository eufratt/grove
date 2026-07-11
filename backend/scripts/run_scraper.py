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
        print("Launching browser...")
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        url = "https://www.bi.go.id/hargapangan/TabelHarga/ProdusenKomoditas"
        print(f"Navigating to {url}...")
        response = await page.goto(url, timeout=60000)
        
        print("Response Status:", response.status if response else "No response")
        print("Page Title:", await page.title())
        
        # Save pre-interaction screenshot for debugging
        await page.screenshot(path="debug_screenshot.png")
        print("Screenshot saved to debug_screenshot.png")
        
        # 1. Wait for DevExpress dropdown container controls
        print("Waiting for cboProvince and CommodityTree controls...")
        await page.wait_for_selector("#cboProvince", timeout=20000)
        await page.wait_for_selector("#CommodityTree", timeout=20000)
        
        # Get all commodity names from the tree to avoid element detaching issues during the click loop
        rows = await page.query_selector_all("#CommodityTree .dx-treelist-rowsview tr.dx-data-row")
        commodity_names = []
        for r in rows:
            name = (await r.text_content()).strip()
            if name:
                commodity_names.append(name)
        print(f"Found {len(commodity_names)} commodities in tree list.")
        
        extracted_data = []
        
        for i, comp_name in enumerate(commodity_names):
            print(f"[{i+1}/{len(commodity_names)}] Scraping '{comp_name}'...")
            
            try:
                # Click the commodity row matching the name
                row_locator = page.locator(f"#CommodityTree .dx-treelist-rowsview tr.dx-data-row >> text='{comp_name}'").first
                await row_locator.click()
                
                # Wait for report button and click it
                await page.wait_for_selector("button#btnReport", timeout=10000)
                await page.click("button#btnReport")
                
                # Wait for info header to update to match the selected commodity (this guarantees AJAX grid load is complete)
                escaped_name = comp_name.replace("'", "\\'")
                await page.wait_for_function(
                    f"document.querySelector('#info').innerText.includes('{escaped_name}')",
                    timeout=20000
                )
                
                # Wait for grid rows to render
                await page.wait_for_selector("#grid1 .dx-datagrid-rowsview tr.dx-data-row", timeout=15000)
                
                # Extract rows
                grid_rows = await page.query_selector_all("#grid1 .dx-datagrid-rowsview tr.dx-data-row")
                
                for row in grid_rows:
                    cells = await row.query_selector_all("td")
                    if len(cells) >= 2:
                        region_raw = (await cells[1].text_content()).strip()
                        region = "Nasional" if "SEMUA" in region_raw else region_raw.title()
                        
                        # Get the latest price value (last non-empty cell in row)
                        price_str = None
                        for cell in reversed(cells[2:]):
                            text_val = (await cell.text_content()).strip()
                            if text_val and text_val != "-" and any(c.isdigit() for c in text_val):
                                price_str = text_val
                                break
                                
                        if price_str:
                            # Clean price formatting
                            price_cleaned = price_str.replace("Rp", "").replace(".", "").replace(",", "").strip()
                            if price_cleaned.isdigit():
                                extracted_data.append({
                                    "commodity_name": comp_name,
                                    "price_per_kg": float(price_cleaned),
                                    "source": "PIHPS BI",
                                    "region": region,
                                    "scraped_at": datetime.utcnow()
                                })
            except Exception as item_err:
                print(f"Failed to scrape commodity '{comp_name}': {item_err}")
                
        # Save post-interaction screenshot for verification
        await page.screenshot(path="debug_screenshot.png")
        
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
        
    # Mandatory exit code propagation for GitHub Actions
    if status == ScrapeStatusEnum.FAILED:
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())
