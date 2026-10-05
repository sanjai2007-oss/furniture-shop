import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./furniture_shop.db"
    SECRET_KEY: str = "furniture_shop_secret_jwt_key_super_secure_production_ready_9921"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    ALGORITHM: str = "HS256"
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    FRONTEND_URL: str = "http://localhost:5173"
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    ENVIRONMENT: str = "development"

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
