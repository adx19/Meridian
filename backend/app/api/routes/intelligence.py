import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import traceback
from app.db.database import get_db
from app.models.commits import Commit
from app.models.repository import Repository
from app.schemas.repository_intelligence import RepositoryIntelligenceResponse
from app.services.intelligence_service import get_or_generate_repository_intelligence

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get(
    "/repository/{repo_name}",
    response_model=RepositoryIntelligenceResponse
)
def get_repository_intelligence(
    repo_name: str,
    user_id: int,
    db: Session = Depends(get_db)
):
    try:
        repo = (
            db.query(Repository)
            .filter(
                Repository.name == repo_name,
                Repository.user_id == user_id
            )
            .first()
        )

        if not repo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found."
            )

        commits = (
            db.query(Commit)
            .filter(Commit.repository_id == repo.id)
            .order_by(Commit.commit_timestamp.desc())
            .limit(20)
            .all()
        )

        intelligence = get_or_generate_repository_intelligence(repo, commits, db)
        return intelligence
    except HTTPException:
        raise
    except RuntimeError:
        logger.exception(
            "[Repository Intelligence] Runtime error while processing repository intelligence for %s",
            repo_name,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
    except Exception:
        logger.exception(
            "[Repository Intelligence] Failed to generate intelligence for %s",
            repo_name,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
