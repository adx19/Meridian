from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class RepositoryIntelligenceResponse(BaseModel):
    id: int
    repository_id: int

    summary: Optional[str] = None
    development_update: Optional[str] = None

    current_focus: Optional[str] = None
    completed_milestones: list[str] = []
    potential_risks: list[str] = []

    next_priorities: list[str] = []

    main_technologies: list[str] = []

    generated_at: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True