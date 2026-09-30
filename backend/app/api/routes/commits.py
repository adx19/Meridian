import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.commit import CommitResponse, CommitSyncRequest
from app.services.github_service import get_repo_commits
from app.services import repository_service, commit_service

router = APIRouter()
logger = logging.getLogger(__name__)

from datetime import datetime, timedelta

# Global in-memory cache to store last sync timestamp per user and repo
COMMIT_SYNC_CACHE = {}

@router.post("/sync", response_model=List[CommitResponse])
def sync_commits(req: CommitSyncRequest, db: Session = Depends(get_db)):
    try:
        # Find the repository in database first
        repo_obj = repository_service.get_repo(db, req.repo, req.user_id)
        
        if not repo_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found in the database. Please sync repositories first."
            )
            
        cache_key = (req.user_id, req.repo)
        last_sync = COMMIT_SYNC_CACHE.get(cache_key)
        now = datetime.utcnow()
        
        if last_sync and (now - last_sync) < timedelta(minutes=2):
            return commit_service.get_commits(db, repo_obj.id)
            
        owner = repo_obj.full_name.split("/")[0] if (repo_obj.full_name and "/" in repo_obj.full_name) else req.owner
        try:
            commits_data = get_repo_commits(req.token, owner, repo_obj.name)
            logger.info(
                "[Commits] Sync requested for owner=%s repo=%s user_id=%s",
                owner,
                repo_obj.name,
                req.user_id,
            )
            commit_service.save_commits(commits_data, repo_obj.id, db, req.token, owner, repo_obj.name)
            COMMIT_SYNC_CACHE[cache_key] = now
        except Exception:
            logger.exception("[Commits] Skipping GitHub commits sync due to exception")
            
        return commit_service.get_commits(db, repo_obj.id)
    except HTTPException:
        raise
    except Exception:
        logger.exception("[Commits] Failed to sync commits for repo=%s user_id=%s", req.repo, req.user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/", response_model=List[CommitResponse])
def get_commits(repo_name: str, user_id: int, db: Session = Depends(get_db)):
    try:
        repo_obj = repository_service.get_repo(db, repo_name, user_id)
        
        if not repo_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found."
            )
            
        return commit_service.get_commits(db, repo_obj.id)
    except HTTPException:
        raise
    except Exception:
        logger.exception("[Commits] Failed to retrieve commits for repo=%s user_id=%s", repo_name, user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

