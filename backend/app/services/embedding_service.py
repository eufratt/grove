from sentence_transformers import SentenceTransformer
from typing import List

class EmbeddingService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            # Load model 'all-MiniLM-L6-v2' (384 dimensions)
            cls._model = SentenceTransformer('all-MiniLM-L6-v2')
        return cls._instance

    def generate_embedding(self, text: str) -> List[float]:
        embedding = self._model.encode(text)
        return embedding.tolist()

embedding_service = EmbeddingService()
