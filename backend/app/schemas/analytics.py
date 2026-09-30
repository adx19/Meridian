from pydantic import BaseModel
from typing import Dict

class UserAnalyticsResponse(BaseModel):
    total_repos: int
    total_commits: int
    weekly_commits: int
    active_repos: int
    most_active_repo: str
    most_active_repo_commits: int
    context_switching: str
    coding_momentum: str
    commit_quality: str
    language_distribution: Dict[str, int]
