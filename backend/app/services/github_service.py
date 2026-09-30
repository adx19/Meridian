import logging
import requests
import base64

logger = logging.getLogger(__name__)


def get_user_repos(token):
    headers = {
      "Authorization": f"Bearer {token}",
      "Accept": "application/vnd.github.v3+json"
    }

    repos = []
    page = 1
    while True:
        url = f"https://api.github.com/user/repos?sort=updated&per_page=100&page={page}"
        response = requests.get(url, headers=headers)

        if response.status_code != 200:
            logger.error("[GitHub] Failed to fetch user repos: %s", response.json())
            raise RuntimeError("Failed to fetch user repos")
        
        page_repos = response.json()
        if not page_repos:
            break
        
        repos.extend(page_repos)
        if len(page_repos) < 100:
            break
        page += 1
        
    return repos

def get_repo_commits(token, owner, repo):
    headers = {
      "Authorization" : f"Bearer {token}",
      "Accept": "application/vnd.github.v3+json"
    }

    commits = []
    page = 1

    while True:
      url = f"https://api.github.com/repos/{owner}/{repo}/commits?per_page=100&page={page}"
      response = requests.get(url, headers=headers)
      
      if response.status_code == 409:
        logger.warning("[GitHub] %s/%s: Repository is empty.", owner, repo)
        return []
    
      if response.status_code == 404:
        raise RuntimeError(f"Repository {owner}/{repo} not found.")

      if response.status_code == 403:
        raise RuntimeError(f"Github  rate limit exceeded for {owner}/{repo}.")

      if response.status_code != 200:
        logger.error("[GitHub] Failed to fetch commits for %s/%s: %s", owner, repo, response.json())
        raise RuntimeError(f"Failed to fetch commits for {owner}/{repo}.")
      
      page_commits = response.json()

      if not page_commits:
        break
      commits.extend(page_commits)

      if len(page_commits) < 100:
        break

      page += 1

    return commits

def get_single_commit(token, owner, repo, sha):
    headers = {
      "Authorization": f"Bearer {token}",
      "Accept": "application/vnd.github.v3+json"
    }

    url = f"https://api.github.com/repos/{owner}/{repo}/commits/{sha}"
    response = requests.get(url, headers=headers)

    if response.status_code != 200:
      logger.error("[GitHub] Failed to fetch single commit %s: %s", sha, response.json())
    
    return response.json()


def get_repository_readme(token, owner, repo):
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json"
    }

    url = f"https://api.github.com/repos/{owner}/{repo}/readme"

    response = requests.get(url, headers=headers)

    # Repository has no README
    if response.status_code == 404:
        return None

    if response.status_code != 200:
        logger.error("[GitHub] Failed to fetch README for %s/%s: %s", owner, repo, response.json())
        raise RuntimeError(f"Failed to fetch README for {owner}/{repo}")

    data = response.json()

    content = data.get("content")
    encoding = data.get("encoding")

    if not content:
        return None

    if encoding == "base64":
        return base64.b64decode(content).decode("utf-8", errors="ignore")

    return content