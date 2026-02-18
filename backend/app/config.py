import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./smartvellore.db"
)

UPLOAD_DIR = "uploads"
