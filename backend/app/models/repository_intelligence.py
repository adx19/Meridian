from sqlalchemy import JSON, Column, Integer, Text, DateTime, ForeignKey

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class RepositoryIntelligence(Base):
  __tablename__ = "repository_intelligence"

  id = Column(Integer, primary_key=True, index=True)

  repository_id = Column(Integer, ForeignKey("repositories.id"), unique=True, nullable=False)

  summary = Column(Text, nullable=True)

  current_focus = Column(Text, nullable=True)
  
  development_update = Column(Text, nullable=False)

  completed_milestones = Column(JSON, nullable=False, default=list)

  potential_risks = Column(JSON, nullable=False, default=list)

  next_priorities = Column(JSON, nullable=False, default=list)

  main_technologies = Column(JSON, nullable=False, default=list)

  generated_at = Column(DateTime(timezone=True), server_default=func.now())

  updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

  created_at = Column(DateTime(timezone=True), server_default=func.now())

  repository = relationship("Repository", back_populates="intelligence")