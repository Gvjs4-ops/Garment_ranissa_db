from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    APP_NAME: str
    ENVIRONMENT: str

    DATABASE_URL: str

    SUPABASE_URL: str
    SUPABASE_KEY: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        case_sensitive=True,
    )


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()
