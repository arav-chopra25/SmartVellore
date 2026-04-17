from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.config import settings
from jose import jwt
import shutil
import os
from geopy.distance import geodesic
from datetime import datetime
from app.services.email_service import email_service
from app.services.ai_service import triage_issue
from app.rate_limit import limiter

router = APIRouter(prefix="/issues", tags=["Issues"])
GROUP_DISTANCE_METERS = 75


def generate_report_id(issue_id: int) -> str:
    """Generate professional report ID: VLR-{8-digit-number}"""
    return f"VLR-{issue_id:08d}"


def generate_group_id(group_number: int) -> str:
    """Generate professional group cluster ID: CLT-{8-digit-number}"""
    return f"CLT-{group_number:08d}"


def get_next_group_number(db: Session) -> int:
    """Get the next sequential group number by finding max existing CLT group number"""
    # Find all distinct group IDs that start with CLT-
    all_issues = db.query(models.Issue).filter(
        models.Issue.report_group_id.isnot(None),
        models.Issue.report_group_id.like('CLT-%')
    ).all()
    
    max_number = 0
    group_ids_found = set()
    
    for issue in all_issues:
        if issue.report_group_id:
            group_ids_found.add(issue.report_group_id)
            try:
                # Extract number from CLT-XXXXXXXX format
                # The number is always at position, after 'CLT-'
                number_str = issue.report_group_id[4:]  # Skip 'CLT-'
                number = int(number_str)
                max_number = max(max_number, number)
            except (ValueError, IndexError):
                pass
    
    # Ensure we return a number we haven't used yet
    next_number = max_number + 1
    while f"CLT-{next_number:08d}" in group_ids_found:
        next_number += 1
    
    return next_number


def resolve_report_group_id(db: Session, latitude: float, longitude: float, department: str):
    """
    Find a group for this issue based on proximity AND same department.
    Only groups issues that are within 75 meters AND have the same department.
    """
    nearest_issue = None
    nearest_distance = None

    existing_issues = db.query(models.Issue).all()
    for issue in existing_issues:
        if issue.latitude is None or issue.longitude is None:
            continue

        # Only consider issues from the SAME department
        if issue.department != department:
            continue

        distance_meters = geodesic((latitude, longitude), (issue.latitude, issue.longitude)).meters
        if distance_meters <= GROUP_DISTANCE_METERS:
            if nearest_distance is None or distance_meters < nearest_distance:
                nearest_distance = distance_meters
                nearest_issue = issue

    if not nearest_issue:
        return None

    if nearest_issue.report_group_id:
        return nearest_issue.report_group_id

    # Generate the next sequential group ID
    next_group_number = get_next_group_number(db)
    generated_group_id = generate_group_id(next_group_number)
    nearest_issue.report_group_id = generated_group_id
    db.commit()
    return generated_group_id

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
@limiter.limit("20/minute")
def create_issue(
    request: Request,
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
    report_group_id = resolve_report_group_id(db, latitude, longitude, department)

    if image:
        os.makedirs("uploads", exist_ok=True)
        image_path = f"uploads/{image.filename}"
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

    ai_result = {
        "category": None,
        "priority": None,
        "department_suggestion": None,
        "confidence": None,
        "summary": None,
        "phase": None,
    }

    if settings.AI_TRIAGE_ON_CREATE:
        try:
            ai_result = triage_issue(
                title=title,
                description=description,
                citizen_department=department,
            )
        except Exception as exc:
            print(f"AI triage warning: {exc}")

    new_issue = models.Issue(
        report_group_id=report_group_id,
        title=title,
        email=email,
        department=department,
        description=description,
        latitude=latitude,
        longitude=longitude,
        image_path=image_path,
        status="OPEN",
        ai_category=ai_result.get("category"),
        ai_priority=ai_result.get("priority"),
        ai_department_suggestion=ai_result.get("department_suggestion"),
        ai_department_approved=(department != "Others"),  # Requires approval only if "Others"
        ai_confidence=ai_result.get("confidence"),
        ai_summary=ai_result.get("summary"),
        ai_phase=ai_result.get("phase"),
    )

    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)

    # IMPORTANT: Single reports keep report_group_id = None
    # Only grouped reports (2+) get a CLT group ID
    # No need to assign a group ID here

    # Send confirmation email (non-blocking)
    try:
        report_id = generate_report_id(new_issue.id)
        email_service.send_issue_confirmation(
            citizen_email=email,
            issue_id=new_issue.id,
            report_id=report_id,
            title=title,
            department=department,
            status=new_issue.status,
            created_at=new_issue.created_at
        )
    except Exception as e:
        # Log error but don't fail the request
        print(f"⚠️ Email sending failed for issue {new_issue.id}: {str(e)}")

    return new_issue


# ---------------------------
# Update Status (Admin Only)
# ---------------------------
@router.put("/{issue_id}")
@limiter.limit("30/minute")
def update_issue_status(
    request: Request,
    issue_id: int,
    status: schemas.IssueStatusUpdate,
    db: Session = Depends(get_db),
):
    issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    old_status = issue.status
    issue.status = status.status
    db.commit()
    db.refresh(issue)

    # Send status update email (non-blocking)
    try:
        report_id = generate_report_id(issue.id)
        email_service.send_status_update(
            citizen_email=issue.email,
            report_id=report_id,
            title=issue.title,
            old_status=old_status,
            new_status=issue.status,
            updated_at=datetime.utcnow(),
            update_notes=None
        )
    except Exception as e:
        # Log error but don't fail the request
        print(f"⚠️ Email sending failed for status update on issue {issue.id}: {str(e)}")

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
