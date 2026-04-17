from pydantic_settings import BaseSettings
from pathlib import Path
from dotenv import load_dotenv
import os

# Load .env file explicitly
env_file = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_file)


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = ""
    SQLITE_DATABASE_URL: str = "sqlite:///./smartvellore.db"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    ADMIN_USERNAME: str = ""
    ADMIN_PASSWORD: str = ""

    # Gemini AI Configuration
    GEMINI_ENABLED: bool = False
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_TIMEOUT_SECONDS: int = 20
    GEMINI_PHASE: int = 1
    AI_TRIAGE_ON_CREATE: bool = True
    
    # Email Configuration
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SENDER_EMAIL: str = ""
    
    class Config:
        env_file = str(env_file)
        env_file_encoding = "utf-8"
        case_sensitive = False

    @property
    def resolved_database_url(self) -> str:
        if self.ENVIRONMENT.lower() == "production":
            if not self.DATABASE_URL:
                raise ValueError("DATABASE_URL must be set in production")
            return self.DATABASE_URL

        return self.DATABASE_URL or self.SQLITE_DATABASE_URL

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
