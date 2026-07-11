import asyncio
from typing import List
from google import genai
from google.genai import types
from app.config import settings

_client = None

def get_genai_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client

class EmbeddingService:
    async def generate_embedding(self, text: str) -> List[float]:
        # Sanitize/clean input text
        cleaned_text = text.replace("\n", " ")
        
        # Exponential backoff retry logic (up to 3 attempts)
        for attempt in range(3):
            try:
                loop = asyncio.get_running_loop()
                
                def _call_api():
                    client = get_genai_client()
                    response = client.models.embed_content(
                        model="gemini-embedding-001",
                        contents=cleaned_text,
                        config=types.EmbedContentConfig(
                            output_dimensionality=768
                        )
                    )
                    return response.embeddings[0].values
                
                embedding_values = await loop.run_in_executor(None, _call_api)
                return embedding_values
                
            except Exception as e:
                # If it's the last attempt, raise the error
                if attempt == 2:
                    raise e
                # Wait 2^attempt * 1 seconds (1s, 2s) before retrying
                await asyncio.sleep(2 ** attempt)

# Export the instance to match imports in products.py and search.py
embedding_service = EmbeddingService()
