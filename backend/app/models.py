from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from .database import Base

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    image_path = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String, default="OPEN")
    created_at = Column(DateTime, default=datetime.utcnow)
