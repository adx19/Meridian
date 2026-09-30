import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.commits import Commit
from app.models.repository import Repository
from app.models.repository_intelligence import RepositoryIntelligence
from app.services.ai_service import generate_repository_intelligence

logger = logging.getLogger(__name__)


def get_or_generate_repository_intelligence(repository: Repository, commits, db: Session):
    existing = (
        db.query(RepositoryIntelligence)
        .filter(RepositoryIntelligence.repository_id == repository.id)
        .first()
    )

    if existing:
        logger.info("[Repository Intelligence] Cache hit for repository %s", repository.id)
        return existing

    logger.info("[Repository Intelligence] Cache miss for repository %s", repository.id)
    logger.info("Generating intelligence with Gemini...")

    if commits is None:
        commits = (
            db.query(Commit)
            .filter(Commit.repository_id == repository.id)
            .order_by(Commit.commit_timestamp.desc())
            .limit(20)
            .all()
        )

    try:
        ai_result = generate_repository_intelligence(repository, commits)
    except Exception as exc:
        db.rollback()
        raise RuntimeError(
            f"Failed to generate repository intelligence for repository {repository.id}: {exc}"
        ) from exc

    summary = ai_result["summary"]
    development_update = ai_result["development_update"]

    project_insights = ai_result["project_insights"]

    current_focus = project_insights["current_focus"]
    completed_milestones = project_insights["completed_milestones"]
    potential_risks = project_insights["potential_risks"]

    next_priorities = ai_result["next_priorities"]
    main_technologies = ai_result["main_technologies"]

    intelligence = RepositoryIntelligence(
        repository_id=repository.id,
        summary=summary,
        development_update=development_update,
        current_focus=current_focus,
        completed_milestones=completed_milestones,
        potential_risks=potential_risks,
        next_priorities=next_priorities,
        main_technologies=main_technologies,
        generated_at=datetime.now(timezone.utc),
    )
    try:
        db.add(intelligence)
        db.commit()
        db.refresh(intelligence)
    except Exception as exc:
        db.rollback()
        raise RuntimeError(
            f"Failed to save repository intelligence for repository {repository.id}: {exc}"
        ) from exc

    return intelligence


def generate_mock_intelligence(repository: Repository, db: Session):
    commits = (
        db.query(Commit)
        .filter(Commit.repository_id == repository.id)
        .order_by(Commit.commit_timestamp.desc())
        .limit(20)
        .all()
    )
    return get_or_generate_repository_intelligence(repository, commits, db) 