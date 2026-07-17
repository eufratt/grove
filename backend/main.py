from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.routers import auth, products, search, orders, admin, users, reference_prices, demand_requests, ratings
from app.services import connection_manager
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(title="Grove API")

# Parse ALLOWED_ORIGINS to a list of stripped strings
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/orders/{order_id}")
async def websocket_endpoint(websocket: WebSocket, order_id: str):
    await connection_manager.manager.connect(websocket, order_id)
    try:
        while True:
            # Keep connection alive, though we only broadcast from server to client
            await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.manager.disconnect(websocket, order_id)

@app.websocket("/ws/demand-requests/{id}")
async def websocket_demand_endpoint(websocket: WebSocket, id: str):
    await connection_manager.demand_manager.connect(websocket, id)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.demand_manager.disconnect(websocket, id)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(search.router)
app.include_router(orders.router)
app.include_router(admin.router)
app.include_router(users.router)
app.include_router(reference_prices.router)
app.include_router(demand_requests.router)
app.include_router(ratings.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
