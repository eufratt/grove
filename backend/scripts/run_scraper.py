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
        
        # 2. Interact with CommodityTree: click first row/element to select it
        print("Selecting first commodity in CommodityTree...")
        await page.locator("#CommodityTree .dx-treelist-rowsview td").first.click()
        
        # 3. Interact with cboProvince: check first checkbox/element to select it
        print("Selecting first province in cboProvince...")
        await page.locator("#cboProvince .dx-select-checkbox").first.click()
        
        # Wait a short moment for callbacks to run
        await asyncio.sleep(2)
        
        # 4. Wait for report button and click it
        button_selector = "button#btnReport"
        print(f"Waiting for report button: {button_selector}...")
        await page.wait_for_selector(button_selector, timeout=20000)
        
        print("Clicking Lihat Laporan...")
        await page.click(button_selector)
        
        # 5. Wait for results grid to render
        grid_selector = "#grid1 .dx-datagrid-rowsview"
        print(f"Waiting for grid to render: {grid_selector}...")
        await page.wait_for_selector(grid_selector, timeout=30000)
        
        # Save post-interaction screenshot for verification
        await page.screenshot(path="debug_screenshot.png")
        
        # Extract commodity name from the report header #info table
        print("Extracting commodity name from report header...")
        info_rows = await page.query_selector_all("#info tr")
        commodity_name = "Beras" # Default fallback
        for info_row in info_rows:
            tds = await info_row.query_selector_all("td")
            if len(tds) >= 2:
                label = (await tds[0].inner_text()).strip()
                if "Komoditas" in label:
                    value = (await tds[1].inner_text()).strip()
                    commodity_name = value.lstrip(":").replace("(kg)", "").strip()
                    break
        print(f"Extracted commodity name: '{commodity_name}'")
        
        print("Extracting table rows...")
        rows = await page.query_selector_all("#grid1 .dx-datagrid-rowsview tr.dx-data-row")
        extracted_data = []
        
        for row in rows:
            cells = await row.query_selector_all("td")
            if len(cells) >= 2:
                # Use text_content() to read hidden cells
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
                            "commodity_name": commodity_name,
                            "price_per_kg": float(price_cleaned),
                            "source": "PIHPS BI",
                            "region": region,
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
        
    # Mandatory exit code propagation for GitHub Actions
    if status == ScrapeStatusEnum.FAILED:
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())
