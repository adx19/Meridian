import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.repository import Repository
from app.models.commits import Commit
from app.schemas.analytics import UserAnalyticsResponse

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", response_model=UserAnalyticsResponse)
def get_user_analytics(user_id: int, db: Session = Depends(get_db)):
    try:
        # 1. Total repos count
        total_repos = db.query(Repository).filter(Repository.user_id == user_id).count()

        # 2. Total commits count across all repos for user
        total_commits = db.query(Commit).join(Repository).filter(Repository.user_id == user_id).count()

        # 3. Weekly commits count (last 7 days)
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        weekly_commits = db.query(Commit).join(Repository).filter(
            Repository.user_id == user_id,
            Commit.commit_timestamp >= one_week_ago
        ).count()

        # 4. Active repos count (repos with at least 1 commit)
        active_repos = db.query(Repository).filter(
            Repository.user_id == user_id
        ).join(Commit).group_by(Repository.id).count()

        # 5. Most active repository and its commit count
        most_active = db.query(
            Repository.name,
            func.count(Commit.id).label("commit_count")
        ).join(Commit).filter(
            Repository.user_id == user_id
        ).group_by(
            Repository.id
        ).order_by(
            desc("commit_count")
        ).first()

        if most_active:
            most_active_repo = most_active[0]
            most_active_repo_commits = most_active[1]
        else:
            most_active_repo = "None"
            most_active_repo_commits = 0

        # 6. Context Switching calculation
        # Let's count unique repositories committed to in the last 7 days.
        # If 1 repo -> "Low", 2-3 repos -> "Medium", >3 repos -> "High".
        active_repos_week = db.query(Repository.id).join(Commit).filter(
            Repository.user_id == user_id,
            Commit.commit_timestamp >= one_week_ago
        ).group_by(Repository.id).count()

        if active_repos_week <= 1:
            context_switching = "Low"
        elif active_repos_week <= 3:
            context_switching = "Medium"
        else:
            context_switching = "High"

        # 7. Coding Momentum calculation
        # Let's compare commits in the last 7 days vs commits in the 7 days before that (7 to 14 days ago).
        two_weeks_ago = datetime.utcnow() - timedelta(days=14)
        previous_week_commits = db.query(Commit).join(Repository).filter(
            Repository.user_id == user_id,
            Commit.commit_timestamp >= two_weeks_ago,
            Commit.commit_timestamp < one_week_ago
        ).count()

        if previous_week_commits == 0:
            if weekly_commits > 0:
                coding_momentum = "100%"
            else:
                coding_momentum = "0%"
        else:
            ratio = int((weekly_commits / previous_week_commits) * 100)
            coding_momentum = f"{ratio}%"

        # 8. Commit Quality based on average message length
        # If average length > 30 chars -> "High", > 15 -> "Medium", otherwise "Low".
        avg_len = db.query(func.avg(func.length(Commit.message))).join(Repository).filter(
            Repository.user_id == user_id
        ).scalar()

        if not avg_len:
            commit_quality = "High"  # Default when no commits
        elif avg_len > 30:
            commit_quality = "High"
        elif avg_len > 15:
            commit_quality = "Medium"
        else:
            commit_quality = "Low"

        # 9. Language Distribution: group by language and count repos
        langs_query = db.query(
            Repository.language,
            func.count(Repository.id)
        ).filter(
            Repository.user_id == user_id,
            Repository.language != None,
            Repository.language != ""
        ).group_by(
            Repository.language
        ).all()

        language_distribution = {lang: count for lang, count in langs_query}

        return {
            "total_repos": total_repos,
            "total_commits": total_commits,
            "weekly_commits": weekly_commits,
            "active_repos": active_repos if active_repos > 0 else total_repos,
            "most_active_repo": most_active_repo,
            "most_active_repo_commits": most_active_repo_commits,
            "context_switching": context_switching,
            "coding_momentum": coding_momentum,
            "commit_quality": commit_quality,
            "language_distribution": language_distribution
        }
    except Exception:
        logger.exception("[Analytics] Failed to compute analytics for user_id=%s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
