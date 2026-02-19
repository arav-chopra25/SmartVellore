from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.config import settings
from jose import jwt
from datetime import datetime, timedelta
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin"])

# ========================
# Pydantic Schemas
# ========================
class AdminLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


# ========================
# Admin Login
# ========================
@router.post("/login", response_model=TokenResponse)
def admin_login(credentials: AdminLogin):
    """
    Admin login endpoint - returns JWT token on success
    Default credentials: username='admin', password='admin'
    """
    # Simple hardcoded admin credentials (for demo)
    # In production, check against database with hashed passwords
    if credentials.username != "admin" or credentials.password != "admin":
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create JWT token
    payload = {
        "sub": "admin",
        "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return {"access_token": token, "token_type": "bearer"}


# ========================
# Get All Issues (Admin view)
# ========================
@router.get("/issues")
def get_all_issues_admin(db: Session = Depends(get_db)):
    """Get all issues for admin dashboard"""
    return db.query(models.Issue).all()


# ========================
# Update Issue Status
# ========================
@router.put("/issues/{issue_id}")
def update_issue_status_admin(
    issue_id: int,
    status_update: schemas.IssueStatusUpdate,
    db: Session = Depends(get_db),
):
    """Admin endpoint to update issue status"""
    issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.status = status_update.status
    db.commit()
    db.refresh(issue)

    return {"message": "Status updated", "issue": issue}
