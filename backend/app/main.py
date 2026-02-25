# Load environment variables FIRST before any imports
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy import text
from app.routes.issues import router as issues_router
from app.routes.admin import router as admin_router
from app.database import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)


def ensure_issue_department_column():
    try:
        with engine.connect() as conn:
            columns = conn.execute(text("PRAGMA table_info(issues)")).fetchall()
            column_names = [col[1] for col in columns]
            if "department" not in column_names:
                conn.execute(text("ALTER TABLE issues ADD COLUMN department VARCHAR"))
                conn.commit()
            if "email" not in column_names:
                conn.execute(text("ALTER TABLE issues ADD COLUMN email VARCHAR"))
                conn.commit()
            if "report_group_id" not in column_names:
                conn.execute(text("ALTER TABLE issues ADD COLUMN report_group_id VARCHAR"))
                conn.commit()
    except Exception as exc:
        print(f"Database migration warning: {exc}")


def cleanup_group_ids():
    """
    Ensures only reports that are truly grouped have CLT group IDs.
    Single reports should have report_group_id = NULL.
    """
    try:
        with engine.connect() as conn:
            # Find all CLT group IDs and their counts
            result = conn.execute(text("""
                SELECT report_group_id, COUNT(*) as count 
                FROM issues 
                WHERE report_group_id IS NOT NULL AND report_group_id LIKE 'CLT-%'
                GROUP BY report_group_id
            """)).fetchall()
            
            # Remove CLT IDs from reports that are alone in their group (should be single reports)
            for group_id, count in result:
                if count == 1:
                    conn.execute(text(f"""
                        UPDATE issues 
                        SET report_group_id = NULL 
                        WHERE report_group_id = '{group_id}'
                    """))
                    conn.commit()
                    print(f"Cleaned up orphaned group ID {group_id}")
            
    except Exception as exc:
        print(f"Group ID cleanup warning: {exc}")


ensure_issue_department_column()
cleanup_group_ids()

app = FastAPI(title="SmartVellore API", version="1.0")

# ========================
# CORS Middleware
# ========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",  # Vercel deployment
        "*",  # Allow all for development/testing
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

