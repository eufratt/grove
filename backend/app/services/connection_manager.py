from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Dictionary mapping key to a list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, key: str):
        await websocket.accept()
        if key not in self.active_connections:
            self.active_connections[key] = []
        self.active_connections[key].append(websocket)

    def disconnect(self, websocket: WebSocket, key: str):
        if key in self.active_connections:
            self.active_connections[key].remove(websocket)
            if not self.active_connections[key]:
                del self.active_connections[key]

    async def broadcast_to_order(self, order_id: str, message: dict):
        await self.broadcast(order_id, message)

    async def broadcast(self, key: str, message: dict):
        if key in self.active_connections:
            for connection in self.active_connections[key]:
                await connection.send_json(message)

manager = ConnectionManager()
demand_manager = ConnectionManager()
