from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.config import settings
from jose import jwt
from datetime import datetime, timedelta
from pydantic import BaseModel
from app.rate_limit import limiter
from app.security import verify_password

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
@limiter.limit("5/minute")
def admin_login(request: Request, credentials: AdminLogin, db: Session = Depends(get_db)):
    """
    Admin login endpoint - returns JWT token on success
    """
    admin_user = db.query(models.Admin).filter(models.Admin.username == credentials.username).first()

    if not admin_user or not verify_password(credentials.password, admin_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create JWT token
    payload = {
        "sub": admin_user.username,
        "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return {"access_token": token, "token_type": "bearer"}


# ========================
# Get All Issues (Admin view)
# ========================
@router.get("/issues")
@limiter.limit("30/minute")
def get_all_issues_admin(request: Request, db: Session = Depends(get_db)):
    """Get all issues for admin dashboard"""
    return db.query(models.Issue).all()


# ========================
# Update Issue Status
# ========================
@router.put("/issues/{issue_id}")
@limiter.limit("30/minute")
def update_issue_status_admin(
    request: Request,
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


# ========================
# Approve AI Department Suggestion
# ========================
class ApproveDepartmentRequest(BaseModel):
    approved: bool  # True to approve AI suggestion, False to keep current
    new_department: str = None  # Optional: override with a different department


@router.post("/issues/{issue_id}/approve-department")
@limiter.limit("30/minute")
def approve_department(
    issue_id: int,
    approval: ApproveDepartmentRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Admin approves or rejects AI-suggested department for 'Others' issues"""
    # Verify admin token
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

    issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    if approval.approved:
        # Approve the AI suggestion
        if not issue.ai_department_suggestion:
            raise HTTPException(status_code=400, detail="No AI department suggestion to approve")
        
        issue.department = issue.ai_department_suggestion
        issue.ai_department_approved = True
    else:
        # Reject: allow admin to assign a different department
        if approval.new_department:
            issue.department = approval.new_department
        issue.ai_department_approved = True  # Mark as reviewed by admin
    
    db.commit()
    db.refresh(issue)

    return {"message": "Department approval updated", "issue": issue}
