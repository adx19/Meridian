from sqlalchemy import ( Column, Integer, String, ForeignKey, DateTime, Text)

from sqlalchemy.orm import relationship
from sqlalchemy import func
from app.db.database import Base

class Commit(Base):
	__tablename__ = "commits"

	id = Column(Integer, primary_key=True, index=True)
	
	repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
	
	sha = Column(String, unique=True, nullable=False)
	
	message = Column(Text, nullable=False)
	
	author_name = Column(String, nullable=True)
	
	author_email = Column(String , nullable=True)
	
	commit_timestamp = Column(DateTime(timezone=True), nullable=False)
	
	files_changed = Column(Integer, default=0)
	
	insertions = Column(Integer, default=0)
	
	deletions = Column(Integer, default=0)
	
	diff = Column(Text, nullable=True)
	
	created_at = Column(DateTime(timezone=True), server_default=func.now())
	
	repository = relationship("Repository", backref="commits")

