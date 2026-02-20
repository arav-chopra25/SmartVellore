from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class IssueCreate(BaseModel):
    title: str
    email: str
    description: str
    latitude: float
    longitude: float


class IssueResponse(BaseModel):
    id: int
    title: str
    email: Optional[str] = None
    department: Optional[str] = None
    description: str
    latitude: float
    longitude: float
    status: str
    image_path: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ✅ THIS WAS MISSING
class IssueStatusUpdate(BaseModel):
    status: str
