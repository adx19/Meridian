import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.schemas.ai_consent import AIConsentRequest

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/login", response_model=UserResponse)
def login_or_register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.github_id == user_in.github_id).first()
        if db_user:
            # Update user profile in case it changed
            db_user.username = user_in.username
            db_user.avatar_url = user_in.avatar_url
            db_user.github_access_token = user_in.github_access_token
        else:
            # Create new user
            db_user = User(
                github_id=user_in.github_id,
                username=user_in.username,
                avatar_url=user_in.avatar_url,
                github_access_token=user_in.github_access_token
            )
            db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception:
        logger.exception("[Auth] Failed to login or register user")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

from fastapi import HTTPException, status
from app.schemas.user import UserProfileResponse, CommitActivitySchema
from app.models.repository import Repository
from app.models.commits import Commit
from sqlalchemy import func

@router.get("/profile/{user_id}", response_model=UserProfileResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        
        # Repos count
        total_repos = db.query(Repository).filter(Repository.user_id == user_id).count()
        
        # Commits count
        total_commits = db.query(Commit).join(Repository).filter(Repository.user_id == user_id).count()
        
        # Languages count
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
        
        languages = {lang: count for lang, count in langs_query}
        
        # Recent activity: latest 5 commits
        recent_commits = db.query(
            Commit.sha,
            Commit.message,
            Repository.name.label("repo_name"),
            Commit.commit_timestamp
        ).join(Repository).filter(
            Repository.user_id == user_id
        ).order_by(
            Commit.commit_timestamp.desc()
        ).limit(5).all()
        
        recent_activity = [
            CommitActivitySchema(
                sha=c.sha,
                message=c.message,
                repo_name=c.repo_name,
                commit_timestamp=c.commit_timestamp
            )
            for c in recent_commits
        ]
        
        return UserProfileResponse(
            id=db_user.id,
            github_id=db_user.github_id,
            username=db_user.username,
            avatar_url=db_user.avatar_url,
            created_at=db_user.created_at,
            total_repos=total_repos,
            total_commits=total_commits,
            languages=languages,
            recent_activity=recent_activity
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("[Auth] Failed to retrieve user profile for user_id=%s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/ai-consent")
def save_ai_consent(req: AIConsentRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == req.user_id).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.ai_consent = req.ai_consent
        user.ai_enabled = req.ai_consent

        db.commit()
        db.refresh(user)
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception:
        logger.exception("[Auth] Failed to save AI consent for user_id=%s", req.user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/ai-settings/{user_id}")
def get_ai_settings(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(status_code = 404, detail = "User not found")

        return {
            "ai_consent": user.ai_consent,
            "ai_enabled": user.ai_enabled
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("[Auth] Failed to get AI settings for user_id=%s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
