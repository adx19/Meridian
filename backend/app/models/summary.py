from sqlalchemy import (Column, Integer, String, ForeignKey, DateTime, Text)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Summary(Base):
	__tablename__ = "summaries"
	
	id = Column(Integer, primary_key=True, index=True)
	
	commit_id = Column(Integer, ForeignKey("commits.id"), nullable=False)
	
	summary_text = Column(Text, nullable=False)
	
	summary_type = Column(String, default="commit")
	
	model_used = Column(String, nullable=True)
	
	created_at = Column(DateTime(timezone=True), server_default=func.now())
	
	commit = relationship("Commit", backref="summaries")

