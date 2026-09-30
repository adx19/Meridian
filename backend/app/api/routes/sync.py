import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.sync_service import sync_user

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/user/{user_id}")
def sync_user_data(user_id: int, db: Session = Depends(get_db)):
    try:
        result = sync_user(user_id, db)
        return result
    except ValueError as exc:
        logger.warning("[Sync] User not found while syncing user_id=%s: %s", user_id, exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except PermissionError as exc:
        logger.warning("[Sync] User does not have access for user_id=%s: %s", user_id, exc)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have access"
        )
    except Exception:
        logger.exception("[Sync] Failed to sync user data for user_id=%s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
