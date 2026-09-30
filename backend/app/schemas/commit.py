from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CommitBase(BaseModel):
    sha: str
    message: str
    author_name: Optional[str] = None
    author_email: Optional[str] = None
    commit_timestamp: datetime
    files_changed: Optional[int] = 0
    insertions: Optional[int] = 0
    deletions: Optional[int] = 0
    diff: Optional[str] = None

class CommitResponse(CommitBase):
    id: int
    repository_id: int
    created_at: datetime

    class Config:
        from_attributes = True
class CommitSyncRequest(BaseModel):
    token: str
    owner: str
    repo: str
    user_id: int
