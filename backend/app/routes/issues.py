from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas import IssueCreate, IssueResponse, IssueStatusUpdate
from typing import List, Optional
import shutil
import os

router = APIRouter(prefix="/issues", tags=["Issues"])


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/all", response_model=List[IssueResponse])
def get_all_issues(db: Session = Depends(get_db)):
    return db.query(models.Issue).order_by(models.Issue.created_at.desc()).all()


@router.post("/create", response_model=IssueResponse)
def create_issue(
    title: str = Form(...),
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    image_path = None

    if image:
        image_path = f"{UPLOAD_DIR}/{image.filename}"
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

    issue = models.Issue(
        title=title,
        description=description,
        latitude=latitude,
        longitude=longitude,
        status="OPEN",
        image_path=image_path,
    )

    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue


# ✅ THIS ENDPOINT FIXES YOUR 404
@router.put("/{issue_id}/status")
def update_issue_status(
    issue_id: int,
    payload: IssueStatusUpdate,
    db: Session = Depends(get_db),
):
    issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()

    if not issue:
        return {"error": "Issue not found"}

    issue.status = payload.status
    db.commit()
    return {"message": "Status updated"}
