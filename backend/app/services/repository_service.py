from sqlalchemy.orm import Session
from typing import List, Optional
from app.db import base
from app.models.repository import Repository
from datetime import datetime
from app.services.github_service import get_repository_readme


def get_repo(db: Session, name: str, user_id: int) -> Optional[Repository]:
    return db.query(Repository).filter(
        Repository.name == name,
        Repository.user_id == user_id
    ).first()

def get_user_repositories(db: Session, user_id: int) -> List[Repository]:
    return db.query(Repository).filter(Repository.user_id == user_id).all()

def save_repos(repos, user_id,token, db: Session):
    try:
        
        added = 0
        updated = 0
        skipped = 0
        
        for repo in repos:
            existing_repo = db.query(Repository).filter(Repository.github_repo_id == str(repo["id"])).first()
            if existing_repo: 
                
                github_updated_at = datetime.fromisoformat(repo["updated_at"].replace("Z", "+00:00"))
                
                local_updated = existing_repo.last_synced_at
                
                if local_updated is not None:
                    if local_updated.tzinfo is None:
                        local_updated = local_updated.replace(tzinfo=github_updated_at.tzinfo)
                    
                    # Nothing change --> skip everything
                    
                    if github_updated_at <= local_updated:
                        skipped += 1
                        continue
                
                # Repository changed, NOW fetch README
                
                owner = repo["owner"]["login"]
                
                readme = get_repository_readme(token, owner, repo["name"])
                
                existing_repo.name = repo.get("name")
                existing_repo.full_name = repo.get("full_name")
                existing_repo.description = repo.get("description")
                existing_repo.language = repo.get("language")
                existing_repo.stars = repo.get("stargazers_count")
                existing_repo.readme = readme
                existing_repo.last_synced_at = datetime.utcnow()
                
                updated += 1
            else:
                # New repository -> fetch README once
                
                owner = repo["owner"]["login"]
                readme = get_repository_readme(token, owner, repo["name"])
                
                new_repo = Repository(
                    github_repo_id = str(repo.get("id")),
                    name = repo.get("name"),
                    full_name = repo.get("full_name"),
                    description = repo.get("description"),
                    language = repo.get("language"),
                    stars = repo.get("stargazers_count"),
                    user_id = user_id,
                    readme = readme,
                    last_synced_at = datetime.utcnow()
                )
                db.add(new_repo)
                added += 1
                
        db.commit()
        return {"status": "success", "added" : added, "updated" : updated, "skipped" : skipped}
    except Exception:
        db.rollback()
        raise 

