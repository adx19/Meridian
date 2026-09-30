from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    github_id = Column(String, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=False)

    avatar_url = Column(String, nullable=True)

    github_access_token = Column(String, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    ai_consent = Column(Boolean, default=False)
    ai_enabled = Column(Boolean, default=True)
    repositories = relationship("Repository", back_populates="owner")

