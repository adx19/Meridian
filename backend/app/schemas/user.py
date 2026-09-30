from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    github_id: str
    username: str
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    github_access_token: Optional[str] = None

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

from datetime import datetime
from typing import List, Dict

class CommitActivitySchema(BaseModel):
    sha: str
    message: str
    repo_name: str
    commit_timestamp: datetime

class UserProfileResponse(BaseModel):
    id: int
    github_id: str
    username: str
    avatar_url: Optional[str] = None
    created_at: datetime
    total_repos: int
    total_commits: int
    languages: Dict[str, int]
    recent_activity: List[CommitActivitySchema]

