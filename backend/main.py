from fastapi import FastAPI, BackgroundTasks
from app.routers import auth, products, search, orders
from app.agents.scheduler import setup_scheduler, stop_scheduler
from app.agents.price_scraper import get_scraper_status, scrape_reference_prices

app = FastAPI(title="Grove API")

@app.on_event("startup")
async def startup_event():
    setup_scheduler()

@app.on_event("shutdown")
def shutdown_event():
    stop_scheduler()

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(search.router)
app.include_router(orders.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/admin/scraper-status")
async def scraper_status():
    return get_scraper_status()

@app.post("/admin/trigger-scrape")
async def trigger_scrape(background_tasks: BackgroundTasks):
    background_tasks.add_task(scrape_reference_prices)
    return {"message": "Scraping task started in background"}
