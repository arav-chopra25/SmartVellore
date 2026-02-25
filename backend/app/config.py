from pydantic_settings import BaseSettings
from pathlib import Path
from dotenv import load_dotenv
import os

# Load .env file explicitly
env_file = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_file)


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://smartvellore_db_user:MyiU3iCQCW2wBpwYQiDreV6WnQB8wrUK@dpg-d6fidp8gjchc73a5lod0-a/smartvellore_db"
    SECRET_KEY: str = "supersecretkey"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
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


settings = Settings()
