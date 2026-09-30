from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True)

    github_repo_id = Column(String, unique=True, nullable=False)

    name = Column(String, nullable=False)

    full_name = Column(String, nullable=False)

    description = Column(String, nullable=True)

    language = Column(String, nullable=True)

    stars = Column(Integer, default=0)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    
    readme = Column(Text, nullable=True)

    owner = relationship("User", back_populates="repositories")

    intelligence = relationship("RepositoryIntelligence", back_populates="repository", uselist=False)
    
    intelligence_history = relationship(
        "RepositoryIntelligenceHistory",
        back_populates="repository",
        cascade="all, delete-orphan"
    )