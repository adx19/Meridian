import logging
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.github_service import(get_user_repos, get_repo_commits)

from app.services import(repository_service, commit_service)

logger = logging.getLogger(__name__)


def sync_user(user_id: int, db: Session):
  repos_synced = 0
  commits_synced = 0
  user = db.query(User).filter(User.id == user_id).first()
  if not user:
    raise ValueError("User not found")
  
  if not user.github_access_token:
    raise PermissionError("User does not have access")
  
  repos = get_user_repos(user.github_access_token)

  repository_service.save_repos(repos, user.id,user.github_access_token, db)

  
  repos_synced = len(repos)

  db_repos = repository_service.get_user_repositories(db, user.id)

  for repo in db_repos:
    try:
      owner = (repo.full_name.split("/")[0] if repo.full_name and "/" in repo.full_name  else repo.name)

      commits_data = get_repo_commits(user.github_access_token, owner, repo.name)

      commit_service.save_commits(commits_data, repo.id, db, user.github_access_token, owner, repo.name)
    
      commits_synced += len(commits_data)
      
    except Exception as e:
      logger.exception("[Scheduler] Failed to sync repo %s: %s", repo.name, e)
      continue
  

  return {
    "status": "success",
    "repositories_synced": repos_synced,
    "commits_synced" : commits_synced
  }

