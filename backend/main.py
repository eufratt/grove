from fastapi import FastAPI, BackgroundTasks, WebSocket, WebSocketDisconnect
from app.routers import auth, products, search, orders
from app.agents.scheduler import setup_scheduler, stop_scheduler
from app.agents.price_scraper import get_scraper_status, scrape_reference_prices
from app.services import connection_manager
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Grove API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Ganti dengan URL frontend Anda
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    setup_scheduler()

@app.on_event("shutdown")
def shutdown_event():
    stop_scheduler()

@app.websocket("/ws/orders/{order_id}")
async def websocket_endpoint(websocket: WebSocket, order_id: str):
    await connection_manager.manager.connect(websocket, order_id)
    try:
        while True:
            # Keep connection alive, though we only broadcast from server to client
            await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.manager.disconnect(websocket, order_id)

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
