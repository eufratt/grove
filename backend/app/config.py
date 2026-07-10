from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/grove"
    GROQ_API_KEY: str = "placeholder_key"
    JWT_SECRET: str = "placeholder_secret"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
