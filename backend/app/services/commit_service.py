import logging
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List
from app.models.commits import Commit
from app.services.github_service import get_single_commit
from app.models.repository import Repository

logger = logging.getLogger(__name__)

def get_commits(db: Session, repository_id: int) -> List[Commit]:
    repo = db.query(Repository).filter(Repository.id == repository_id).first()
    return db.query(Commit).filter(
        Commit.repository_id == repository_id
    ).order_by(
        Commit.commit_timestamp.desc()
    ).all()

def save_commits(commits_data, repository_id: int, db: Session, token: str = None, owner: str = None, repo: str = None):
    # To avoid rate limits, limit detail queries to 10 new commits per sync session
    repo_obj = db.query(Repository).filter(Repository.id == repository_id).first()
    detail_fetch_count = 0
    added_shas = set()
    try:
        for item in commits_data:
            sha = item.get("sha")
            if not sha:
                continue
            
            # Skip if we already added/processed this SHA in the current batch
            if sha in added_shas:
                continue
            
            # Check if commit already exists in DB
            existing_commit = db.query(Commit).filter(Commit.sha == sha).first()
            if existing_commit:
                continue
                
            commit_info = item.get("commit", {})
            author_info = commit_info.get("author", {})
            
            date_str = author_info.get("date")
            commit_timestamp = None
            if date_str:
                # Convert 'Z' to '+00:00' to be compatible across Python versions
                commit_timestamp = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                
            # Default stats
            files_changed = 0
            insertions = 0
            deletions = 0
            diff = None
            
            # Fetch detailed stats if OAuth token and target are available
            if token and owner and repo and detail_fetch_count < 10:
                try:
                    detail = get_single_commit(token, owner, repo, sha)
                    if detail:
                        files_changed = len(detail.get("files", []))
                        insertions = detail.get("stats", {}).get("additions", 0)
                        deletions = detail.get("stats", {}).get("deletions", 0)
                        
                        # Stitch files patch together representing a unified diff
                        diff_patches = []
                        for f in detail.get("files", []):
                            patch = f.get("patch")
                            filename = f.get("filename")
                            if patch:
                                diff_patches.append(f"--- a/{filename}\n+++ b/{filename}\n{patch}")
                        diff = "\n\n".join(diff_patches) if diff_patches else None
                        detail_fetch_count += 1
                except Exception as e:
                    logger.exception("[Commit Service] Error fetching detailed stats for commit %s", sha)
                
            new_commit = Commit(
                repository_id=repository_id,
                sha=sha,
                message=commit_info.get("message", ""),
                author_name=author_info.get("name", ""),
                author_email=author_info.get("email", ""),
                commit_timestamp=commit_timestamp,
                files_changed=files_changed,
                insertions=insertions,
                deletions=deletions,
                diff=diff
            )
            db.add(new_commit)
            added_shas.add(sha)

        if repo_obj:
            repo_obj.last_synced_at = datetime.utcnow()
            
        db.commit()
        return {"status": "success", "message": "Commits saved successfully"}
    except Exception as e:
        db.rollback()
        raise e

