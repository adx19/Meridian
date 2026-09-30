import logging
from app.db.database import SessionLocal
from app.models.user import User
from app.services.sync_service import sync_user
from apscheduler.schedulers.background import BackgroundScheduler


scheduler = BackgroundScheduler()
logger = logging.getLogger(__name__)

def scheduled_sync():
  logger.info("[Scheduler] Starting sync cycle")

  db = SessionLocal()

  try:
    users = db.query(User).all()

    for user in users:
      try:
        logger.info("[Scheduler] Syncing user %s", user.id)

        sync_user(user.id, db)

        logger.info("[Scheduler] User %s synced successfully", user.id)
      except Exception as e:
        logger.exception("[Scheduler] Failed syncing user %s: %s", user.id, e)
  finally:
    db.close()
  logger.info("[Scheduler] Sync cycle completed")

def start_scheduler():
  if not scheduler.running:
    scheduler.add_job(scheduled_sync, "interval", minutes=15, id="user_sync_job")
    scheduler.start()

    logger.info("[Scheduler] Started")