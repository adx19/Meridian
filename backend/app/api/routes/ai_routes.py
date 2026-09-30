import logging
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.db.database import get_db
from app.models.repository import Repository
from app.models.commits import Commit
from app.models.repository_intelligence import RepositoryIntelligence
from app.services.ai_service import test_gemini, generate_repository_chat_response
from app.services.intelligence_service import get_or_generate_repository_intelligence

router = APIRouter()
logger = logging.getLogger(__name__)


class RepositoryChatRequest(BaseModel):
    repo_name: str
    user_id: int
    prompt: str


class RepositoryChatResponse(BaseModel):
    answer: str


@router.get("/test-gemini")
def test():
    try:
        result = test_gemini()
        return {"response": result}
    except Exception:
        logger.exception("[AI] Failed to test Gemini provider")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/repository-chat", response_model=RepositoryChatResponse)
def repository_chat(request: RepositoryChatRequest, db: Session = Depends(get_db)):
    try:
        repo = (
            db.query(Repository)
            .filter(
                Repository.name == request.repo_name,
                Repository.user_id == request.user_id,
            )
            .first()
        )

        if not repo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found."
            )

        # Fetch only the latest 5 commits for the chat prompt (reduce DB work)
        commits_for_chat = (
            db.query(Commit)
            .filter(Commit.repository_id == repo.id)
            .order_by(Commit.commit_timestamp.desc())
            .limit(5)
            .all()
        )

        # Try to load cached intelligence. If absent, generate using the existing service
        intelligence = (
            db.query(RepositoryIntelligence)
            .filter(RepositoryIntelligence.repository_id == repo.id)
            .first()
        )

        if not intelligence:
            # Use the existing generation flow which will fetch/limit commits as it currently does
            intelligence = get_or_generate_repository_intelligence(repo, None, db)

        answer = generate_repository_chat_response(repo, commits_for_chat, request.prompt, intelligence)
        return {"answer": answer}
    except HTTPException:
        raise
    except Exception:
        logger.exception(
            "[AI] Failed to generate repository chat response for %s",
            request.repo_name,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

