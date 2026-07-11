from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/grove"
    GROQ_API_KEY: str = "placeholder_key"
    JWT_SECRET: str = "placeholder_secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SUPABASE_URL: str = "https://placeholder.supabase.co"
    SUPABASE_SERVICE_KEY: str = "placeholder_service_key"
    SUPABASE_STORAGE_BUCKET: str = "product-photos"
    GOOGLE_CLIENT_ID: str = "placeholder_google_client_id"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
