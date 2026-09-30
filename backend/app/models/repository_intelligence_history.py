from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import Base


class RepositoryIntelligenceHistory(Base):
    __tablename__ = "repository_intelligence_history"

    id = Column(Integer, primary_key=True, index=True)

    repository_id = Column(
        Integer,
        ForeignKey("repositories.id"),
        nullable=False
    )

    summary = Column(Text, nullable=False)

    recent_work = Column(Text, nullable=False)

    main_technologies = Column(Text, nullable=False)

    latest_commit_sha = Column(Text, nullable=True)

    commit_count = Column(Integer, nullable=False)

    generated_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    repository = relationship(
        "Repository",
        back_populates="intelligence_history"
    )