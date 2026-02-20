from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.config import settings
from jose import jwt
import shutil
import os

router = APIRouter(prefix="/issues", tags=["Issues"])

# ---------------------------
# Get All Issues
# ---------------------------
@router.get("")
def get_all_issues(db: Session = Depends(get_db)):
    return db.query(models.Issue).all()


# ---------------------------
# Create Issue
# ---------------------------
@router.post("")
def create_issue(
    title: str = Form(...),
    email: str = Form(...),
    department: str = Form(...),
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    image_path = None

    if image:
        os.makedirs("uploads", exist_ok=True)
        image_path = f"uploads/{image.filename}"
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

    new_issue = models.Issue(
        title=title,
        email=email,
        department=department,
        description=description,
        latitude=latitude,
        longitude=longitude,
        image_path=image_path,
        status="OPEN"
    )

    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)

    return new_issue


# ---------------------------
# Update Status (Admin Only)
# ---------------------------
@router.put("/{issue_id}")
def update_issue_status(
    issue_id: int,
    status: schemas.IssueStatusUpdate,
    db: Session = Depends(get_db),
):
    issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.status = status.status
    db.commit()
    db.refresh(issue)

    return issue


# ---------------------------
# Delete Issue (Admin Only)
# ---------------------------
@router.delete("/{issue_id}")
def delete_issue(
    issue_id: int,
    db: Session = Depends(get_db),
):
    issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    # Delete associated image if exists
    if issue.image_path:
        try:
            if os.path.exists(issue.image_path):
                os.remove(issue.image_path)
        except Exception as e:
            print(f"Error deleting file: {e}")

    db.delete(issue)
    db.commit()

    return {"message": "Issue deleted successfully", "issue_id": issue_id}
