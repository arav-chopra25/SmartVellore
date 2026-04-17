# Load environment variables FIRST before any imports
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler
import os
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from app.routes.issues import router as issues_router
from app.routes.admin import router as admin_router
from app.database import Base, engine, SessionLocal
from app.config import settings
from app import models
from app.rate_limit import limiter
from app.security import hash_password

# Create database tables
Base.metadata.create_all(bind=engine)


def seed_admin_user():
    if not settings.ADMIN_USERNAME or not settings.ADMIN_PASSWORD:
        print("Admin bootstrap credentials not configured; skipping admin seed.")
        return

    try:
        with SessionLocal() as db:
            existing_admin = (
                db.query(models.Admin)
                .filter(models.Admin.username == settings.ADMIN_USERNAME)
                .first()
            )

            if existing_admin:
                return

            admin_user = models.Admin(
                username=settings.ADMIN_USERNAME,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
            )
            db.add(admin_user)
            db.commit()
            print(f"Seeded admin user: {settings.ADMIN_USERNAME}")
    except IntegrityError:
        # Reload mode can attempt duplicate inserts in parallel subprocesses.
        return
    except Exception as exc:
        print(f"Admin seed warning: {exc}")


def ensure_issue_department_column():
    if not settings.resolved_database_url.startswith("sqlite"):
        return

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
            if "ai_category" not in column_names:
                conn.execute(text("ALTER TABLE issues ADD COLUMN ai_category VARCHAR"))
                conn.commit()
            if "ai_priority" not in column_names:
                conn.execute(text("ALTER TABLE issues ADD COLUMN ai_priority VARCHAR"))
                conn.commit()
            if "ai_department_suggestion" not in column_names:
                conn.execute(text("ALTER TABLE issues ADD COLUMN ai_department_suggestion VARCHAR"))
                conn.commit()
            if "ai_confidence" not in column_names:
                conn.execute(text("ALTER TABLE issues ADD COLUMN ai_confidence FLOAT"))
                conn.commit()
            if "ai_summary" not in column_names:
                conn.execute(text("ALTER TABLE issues ADD COLUMN ai_summary VARCHAR"))
                conn.commit()
            if "ai_phase" not in column_names:
                conn.execute(text("ALTER TABLE issues ADD COLUMN ai_phase INTEGER"))
                conn.commit()
            if "ai_department_approved" not in column_names:
                conn.execute(text("ALTER TABLE issues ADD COLUMN ai_department_approved BOOLEAN DEFAULT 0"))
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


seed_admin_user()
ensure_issue_department_column()
cleanup_group_ids()

app = FastAPI(title="SmartVellore API", version="1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ========================
# CORS Middleware
# ========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
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

