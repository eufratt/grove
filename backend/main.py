from fastapi import FastAPI
from app.routers import auth, products, search

app = FastAPI(title="Grove API")

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(search.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
