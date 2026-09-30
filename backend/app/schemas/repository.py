from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RepositoryBase(BaseModel):
    github_repo_id: str
    name: str
    full_name: str
    description: Optional[str] = None
    language: Optional[str] = None
    stars: Optional[int] = 0
    last_synced_at: Optional[datetime] = None

class RepositoryResponse(RepositoryBase):
    id: int
    user_id: int
    created_at: datetime
    last_synced_at: datetime

    class Config:
        from_attributes = True

class RepositorySyncRequest(BaseModel):
    token: str
    user_id: int
    force: Optional[bool] = False
    

