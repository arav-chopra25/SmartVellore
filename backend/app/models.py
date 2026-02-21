from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from .database import Base

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    report_group_id = Column(String, index=True)
    title = Column(String)
    email = Column(String)
    department = Column(String)
    description = Column(String)
    image_path = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String, default="OPEN")
    created_at = Column(DateTime, default=datetime.utcnow)


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

