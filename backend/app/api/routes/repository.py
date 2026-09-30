import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.services.github_service import get_user_repos
from app.services import repository_service
from app.db.database import get_db
from app.schemas.repository import RepositoryResponse, RepositorySyncRequest

router = APIRouter()
logger = logging.getLogger(__name__)

from datetime import datetime, timedelta

# Global in-memory cache to store last sync timestamp per user
REPO_SYNC_CACHE = {}

@router.post("/sync", response_model=List[RepositoryResponse])
def sync_repos(req: RepositorySyncRequest, db: Session = Depends(get_db)):
    try:
        last_sync = REPO_SYNC_CACHE.get(req.user_id)
        now = datetime.utcnow()
        
        if last_sync and (now - last_sync) < timedelta(minutes=2):
            return repository_service.get_user_repositories(db, req.user_id)
            
        try:
            repos = get_user_repos(req.token)
            repository_service.save_repos(repos, req.user_id, db)
            REPO_SYNC_CACHE[req.user_id] = now
        except Exception:
            logger.exception("[Repository] Skipping GitHub repository sync due to exception")
            
        return repository_service.get_user_repositories(db, req.user_id)
    except HTTPException:
        raise
    except Exception:
        logger.exception("[Repository] Failed to sync repositories for user_id=%s", req.user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("", response_model=List[RepositoryResponse])
def get_repositories(user_id: int, db: Session = Depends(get_db)):
    try:
        return repository_service.get_user_repositories(db, user_id)
    except Exception:
        logger.exception("[Repository] Failed to fetch repositories for user_id=%s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/{name}", response_model=RepositoryResponse)
def get_repository_by_name(name: str, user_id: int, db: Session = Depends(get_db)):
    try:
        repo = repository_service.get_repo(db, name, user_id)
        if not repo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Repository {name} not found."
            )
        return repo
    except HTTPException:
        raise
    except Exception:
        logger.exception("[Repository] Failed to fetch repository %s for user_id=%s", name, user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
