from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.routes.issues import router as issues_router
from app.routes.admin import router as admin_router
from app.database import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartVellore API", version="1.0")

# ========================
# CORS Middleware
# ========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",  # Allow all for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================
# Include Routers
# ========================
app.include_router(issues_router)
app.include_router(admin_router)

# ========================
# Static Files
# ========================
# Serve uploaded files from /uploads
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ========================
# Health Check
# ========================
@app.get("/")
def root():
    return {"message": "SmartVellore API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}

