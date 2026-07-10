from fastapi import FastAPI

app = FastAPI(title="Grove API")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
