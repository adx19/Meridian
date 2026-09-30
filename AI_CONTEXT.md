# AI_CONTEXT.md — Meridian Developer Intelligence Platform
### Complete Technical Context for AI Feature Development
> **Last inspected:** May 2026 · **Codebase path:** `c:\Users\pabhi\Desktop\GitRecall`
> This document is written from direct inspection of every source file. It is the authoritative reference for continuing AI development on Meridian.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current Architecture](#2-current-architecture)
3. [Database Schema](#3-database-schema)
4. [Authentication Flow](#4-authentication-flow)
5. [Repository Sync System](#5-repository-sync-system)
6. [API Inventory](#6-api-inventory)
7. [Frontend Pages](#7-frontend-pages)
8. [Existing Intelligence Infrastructure](#8-existing-intelligence-infrastructure)
9. [AI Requirements](#9-ai-requirements)
10. [Repository Intelligence Design Proposal](#10-repository-intelligence-design-proposal)
11. [Future AI Features](#11-future-ai-features)
12. [Technical Debt](#12-technical-debt)
13. [Recommended Next Steps](#13-recommended-next-steps)

---

## 1. Project Overview

### What Meridian Is

Meridian (previously named **GitRecall**) is a **developer intelligence platform** that connects to a user's GitHub account via OAuth, continuously syncs their repositories and commit history into a local database, and surfaces analytics, patterns, and insights back to the developer through a polished web UI.

The core idea: raw Git commits are noisy and hard to reason about at scale. Meridian ingests them, structures them, and transforms them into a searchable, visual, and eventually AI-enriched understanding of a developer's work history.

### Original Vision (GitRecall)

The original name — GitRecall — reveals the founding intent: **help developers recall what they did, when, and why.** Context loss between sessions, across repositories, and over time is a real pain point. GitRecall aimed to be a memory system for engineers.

### Current Vision (Meridian)

The rebrand to **Meridian** signals an expanded vision. The tagline visible throughout the UI is **"Developer Intelligence"** and **"Dev Intelligence"**. Meridian is no longer just a recall tool — it's the foundation for an **AI layer on top of your engineering identity**.

The landing page states the product mission plainly:
> *"Meridian transforms scattered commits into a visual, searchable intelligence layer for developers and teams."*

The ultimate vision: Meridian becomes the platform that knows your repositories better than you do — surfaces what you've been building, how fast you're moving, what technologies you use, and eventually lets you *talk* to your own codebase history.

### Main User Flow

1. User lands on the marketing page (`/`) and clicks **"Sign In"**
2. GitHub OAuth popup appears via NextAuth
3. On successful OAuth, NextAuth's JWT callback syncs the user to the Meridian backend (`POST /auth/login`)
4. User is redirected to `/dashboard`
5. Dashboard reads repositories from DB and surfaces analytics
6. User clicks a repository card → navigated to `/repo/[name]`
7. The repo page loads commits from DB; user can manually trigger a commit sync
8. Background scheduler (APScheduler) runs every 15 minutes and syncs all users automatically

### Why The Project Exists

Developers lose context constantly — between weekends, between projects, between team handoffs. Commit messages are terse. There's no tool that takes the full history of a developer's GitHub activity and makes it *intelligible*. Meridian fills that gap, with AI as the long-term amplifier.

---

## 2. Current Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER / CLIENT                         │
│                                                                   │
│   Next.js 16 (React 19)  ·  TailwindCSS  ·  Framer Motion        │
│   next-auth v4  ·  lucide-react                                   │
└──────────────────────────┬──────────────────────────────────────-┘
                           │  HTTP (fetch)
                           │  NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      FASTAPI BACKEND                              │
│                                                                   │
│   FastAPI 0.136  ·  Uvicorn  ·  Pydantic v2                       │
│   SQLAlchemy 2.0 (sync)  ·  APScheduler (BackgroundScheduler)     │
│   Alembic (migrations)  ·  psycopg2-binary (PostgreSQL driver)   │
└──────────┬────────────────────────────────────────┬─────────────┘
           │  SQLAlchemy ORM                        │  requests (HTTP)
           │                                        │
┌──────────▼──────────────┐          ┌─────────────▼─────────────┐
│     POSTGRESQL DB        │          │     GITHUB REST API v3     │
│  gitrecall (database)    │          │  api.github.com            │
│  localhost:5432          │          │  Bearer token auth         │
│                          │          │                            │
│  · users                 │          │  /user/repos               │
│  · repositories          │          │  /repos/{owner}/{repo}/    │
│  · commits               │          │    commits                 │
│  · summaries             │          │  /repos/{owner}/{repo}/    │
│  · repository_intelligence│         │    commits/{sha}           │
└─────────────────────────┘          └────────────────────────────┘
```

### Frontend

| Concern | Technology | Detail |
|---|---|---|
| **Framework** | Next.js 16.2.4 | App Router, `"use client"` components |
| **Language** | TypeScript 5 | Strict mode |
| **Runtime** | React 19.2.4 | |
| **Styling** | TailwindCSS 3.4.1 | Via PostCSS |
| **Animations** | framer-motion 12.38.0 | Used on landing page and profile page |
| **Icons** | lucide-react 1.14.0 | Used throughout |
| **Authentication** | next-auth 4.24.14 | GitHub OAuth provider |
| **State Management** | React Context API | `ThemeContext`, `SearchContext` in `providers.tsx` |
| **Dev Server** | nodemon + next dev | Hot reload via nodemon |

**Routing structure** (App Router):
```
/                    → app/page.tsx              (Landing page)
/dashboard           → app/dashboard/page.tsx   (Main dashboard)
/repo/[name]         → app/repo/[name]/page.tsx (Repository detail)
/profile             → app/profile/page.tsx     (User profile)
/api/auth/[...nextauth] → app/api/auth/[...nextauth]/route.ts (Auth handler)
```

### Backend

| Concern | Technology | Detail |
|---|---|---|
| **Framework** | FastAPI 0.136.1 | Async-capable but using sync SQLAlchemy |
| **ASGI Server** | Uvicorn 0.46.0 | |
| **ORM** | SQLAlchemy 2.0.49 | Synchronous session (`Session`) |
| **Database Driver** | psycopg2-binary 2.9.12 | Also asyncpg installed but unused |
| **Validation** | Pydantic v2 (2.13.4) | Request/response schemas |
| **Config** | pydantic-settings | Reads `DATABASE_URL` from `.env` |
| **Migration System** | Alembic 1.18.4 | Linear migration chain |
| **Scheduler** | APScheduler (BackgroundScheduler) | Runs in-process, 15-min interval |
| **HTTP Client** | requests 2.31.0 | Synchronous calls to GitHub API |

**Database:**
- PostgreSQL running at `localhost:5432`
- Database name: `gitrecall`
- Connection string pattern: `postgresql://postgres:<password>@localhost:5432/gitrecall`

### External Integrations

#### GitHub OAuth
- Configured via NextAuth `GitHubProvider`
- `GITHUB_ID` and `GITHUB_SECRET` from `.env.local`
- Scopes: default NextAuth GitHub scopes (read:user, repo access via token)
- The OAuth `access_token` is stored in: NextAuth JWT, then synced to PostgreSQL `users.github_access_token`

#### GitHub REST API v3
Three endpoints are used, all called from `backend/app/services/github_service.py`:

| Function | Endpoint | Purpose |
|---|---|---|
| `get_user_repos(token)` | `GET /user/repos?sort=updated&per_page=100&page=N` | Paginated fetch of all user repos |
| `get_repo_commits(token, owner, repo)` | `GET /repos/{owner}/{repo}/commits` | Fetch commit list (no pagination implemented) |
| `get_single_commit(token, owner, repo, sha)` | `GET /repos/{owner}/{repo}/commits/{sha}` | Fetch diff stats for a single commit |

#### AI Integrations Currently Present

**None are currently functional.** The UI shows labels like "AI Insight" and "Repository Intelligence" in the repo detail page, but these are **static/hardcoded UX strings**. No LLM API is called anywhere in the codebase. The `summaries` table exists in the database with `model_used` and `summary_text` columns, but no code writes to it. The `repository_intelligence` table model file exists but has **syntax errors** and has not been migrated.

---

## 3. Database Schema

### Migration History

The Alembic migration chain (in order):
1. `ed32c3af433c` — Create `users` table
2. `05cbf503311a` — Create `repositories` table
3. `a580a81c3fa1` / `e7c2fbc4a1e3` — Add `github_access_token` to users
4. `afe6134ad9e4` — Create `commits` and `summaries` tables

> **Note:** `repository_intelligence` has **no migration file**. The model file exists but has not been applied to the database.

---

### Table: `users`

**Purpose:** Stores one record per GitHub user who has authenticated with Meridian.

| Column | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | Integer | No | PK, indexed | Internal auto-increment ID |
| `github_id` | String | No | UNIQUE | GitHub's numeric user ID (stored as string) |
| `username` | String | No | UNIQUE | GitHub login handle (e.g., `pabhi`) |
| `avatar_url` | String | Yes | — | GitHub avatar URL |
| `github_access_token` | String | Yes | — | GitHub OAuth token; updated on every login |
| `created_at` | DateTime(tz) | No | server_default=now() | Account creation time |

**Relationships:**
- `users` → `repositories`: One-to-Many via `repositories.user_id`

---

### Table: `repositories`

**Purpose:** Stores metadata for every GitHub repository belonging to a user, synced from the GitHub API.

| Column | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | Integer | No | PK, indexed | Internal auto-increment ID |
| `github_repo_id` | String | No | UNIQUE | GitHub's numeric repo ID (stored as string) |
| `name` | String | No | — | Repository short name (e.g., `GitRecall`) |
| `full_name` | String | No | — | Owner/repo format (e.g., `pabhi/GitRecall`) |
| `description` | String | Yes | — | GitHub repo description |
| `language` | String | Yes | — | Primary language as reported by GitHub |
| `stars` | Integer | No | default=0 | GitHub stargazers count |
| `user_id` | Integer | No | FK → users.id | Owner of this repository record |
| `created_at` | DateTime(tz) | No | server_default=now() | When the record was first created in Meridian |
| `last_synced_at` | DateTime(tz) | Yes | — | Last time a sync completed; updated by both repo sync and commit sync |

**Relationships:**
- `repositories.user_id` → `users.id` (Many-to-One)
- `repositories` → `commits`: One-to-Many via `commits.repository_id` (backref `"commits"`)

---

### Table: `commits`

**Purpose:** Stores individual commit records for each repository. Each commit is unique by SHA across the entire database.

| Column | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | Integer | No | PK, indexed | Internal auto-increment ID |
| `repository_id` | Integer | No | FK → repositories.id | Which repository this commit belongs to |
| `sha` | String | No | UNIQUE | Full git commit SHA |
| `message` | Text | No | — | Full commit message |
| `author_name` | String | Yes | — | Git author name |
| `author_email` | String | Yes | — | Git author email |
| `commit_timestamp` | DateTime(tz) | No | — | When the commit was made (from GitHub) |
| `files_changed` | Integer | No | default=0 | Number of files modified in this commit |
| `insertions` | Integer | No | default=0 | Lines added |
| `deletions` | Integer | No | default=0 | Lines removed |
| `diff` | Text | Yes | — | Stitched unified diff string (limited to first 10 new commits per sync) |
| `created_at` | DateTime(tz) | No | server_default=now() | When Meridian indexed this commit |

**Relationships:**
- `commits.repository_id` → `repositories.id` (Many-to-One)
- `commits` → `summaries`: One-to-Many via `summaries.commit_id` (backref `"summaries"`)

**Important detail on `diff`:** The diff is not always populated. `commit_service.save_commits` only fetches detailed stats (including the diff) for the **first 10 new commits per sync session** to avoid GitHub API rate limiting. Older commits may have `diff = NULL`.

---

### Table: `summaries`

**Purpose:** Designed to hold AI-generated summaries for individual commits. This table exists in the database (migrated) but is **completely unused** — no code path writes to it or reads from it.

| Column | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | Integer | No | PK, indexed | Internal auto-increment ID |
| `commit_id` | Integer | No | FK → commits.id | Which commit this summary describes |
| `summary_text` | Text | No | — | The generated summary content |
| `summary_type` | String | Yes | default="commit" | Type of summary (designed for extensibility) |
| `model_used` | String | Yes | — | Which AI model generated it (e.g., "gemini-pro") |
| `created_at` | DateTime(tz) | No | server_default=now() | When the summary was generated |

**Relationships:**
- `summaries.commit_id` → `commits.id` (Many-to-One)

---

### Table: `repository_intelligence` *(Model Exists — Not Migrated)*

**Purpose:** Designed to hold AI-generated high-level intelligence for an entire repository. The model file exists at `backend/app/models/repository_intelligence.py` but contains **syntax errors** (`COlumn` instead of `Column`) and has never been migrated to the database.

| Column | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | Integer | No | PK, indexed | Internal auto-increment ID |
| `repository_id` | Integer | No | FK → repositories.id, UNIQUE | One intelligence record per repository |
| `summary` | Text | Yes | — | Natural language repo summary |
| `recent_work` | Text | Yes | — | What has been worked on recently |
| `main_technologies` | Text | Yes | — | Technologies detected or inferred |
| `generated_at` | DateTime(tz) | No | server_default=now() | When the intelligence was generated |
| `updated_at` | DateTime(tz) | No | server_default=now(), onupdate=now() | Last regeneration time |

*(Note: `generate_at` and `updated_at` have typos in the model file as well — `Date` instead of `DateTime`.)*

---

### ER Relationships Summary

```
users (1) ──────────────── (N) repositories
                                    │
                           (1)      │
                                    ▼
                          (N) commits (1) ──── (N) summaries
                                    │
                           (1)      │
                                    ▼
                     repository_intelligence (1)  [not yet migrated]
```

---

## 4. Authentication Flow

### Overview

Authentication uses the **NextAuth v4 GitHub OAuth flow**. The frontend handles all session management. The backend has **no JWT verification middleware** — it trusts the `user_id` passed in requests, which comes from the NextAuth session.

### Configuration

**File:** `frontend/app/api/auth/[...nextauth]/route.ts`

- **Provider:** `GitHubProvider` with `GITHUB_ID` + `GITHUB_SECRET`
- **Secret:** `NEXTAUTH_SECRET=gitrecall-secret-key-2026`
- **Callbacks:**
  - `jwt`: Stores `accessToken`, `username`, and `userId` (from backend) into the JWT
  - `session`: Exposes `accessToken`, `username`, `userId` on the client-side session object

### Session Object Shape

After login, `useSession()` returns a session with these custom fields:

```typescript
session.accessToken   // GitHub OAuth token (string)
session.username      // GitHub login handle (string)
session.userId        // Meridian backend integer user ID (number)
session.user.name     // Display name
session.user.image    // Avatar URL
```

### Authentication Sequence Diagram

```
Browser                  NextAuth            GitHub OAuth         Meridian Backend
   │                        │                     │                      │
   │  Click "Sign In"       │                     │                      │
   │──────────────────────►│                     │                      │
   │                        │  Redirect to GitHub │                      │
   │                        │────────────────────►│                      │
   │                        │                     │  User grants access  │
   │                        │◄────────────────────│                      │
   │                        │  code + access_token│                      │
   │                        │                     │                      │
   │                        │  jwt() callback fires                      │
   │                        │─────────────────────────────────────────►│
   │                        │  POST /auth/login                          │
   │                        │  { github_id, username,                   │
   │                        │    avatar_url, github_access_token }       │
   │                        │◄─────────────────────────────────────────│
   │                        │  { id, username, ... }  (UserResponse)    │
   │                        │                     │                      │
   │                        │  token.userId = backendUser.id            │
   │                        │  token.accessToken = account.access_token │
   │                        │  token.username = githubProfile.login     │
   │                        │                     │                      │
   │  session() callback    │                     │                      │
   │◄──────────────────────│                     │                      │
   │  session.accessToken   │                     │                      │
   │  session.userId        │                     │                      │
   │  session.username      │                     │                      │
   │                        │                     │                      │
   │  Redirect to /dashboard│                     │                      │
```

### Backend User Sync (`POST /auth/login`)

When a user signs in, the backend's `login_or_register_user` function:
1. Queries for an existing user by `github_id`
2. **If found:** Updates `username`, `avatar_url`, and `github_access_token` in-place
3. **If not found:** Creates a new `User` record
4. Returns the user record as `UserResponse`

This means **the GitHub access token in the database is always fresh after login**.

### Access Token Storage

| Location | Token Present | Expiry |
|---|---|---|
| NextAuth JWT (encrypted cookie) | Yes (`accessToken`) | NextAuth session lifetime |
| Client-side session (`useSession()`) | Yes (`session.accessToken`) | While session active |
| PostgreSQL `users.github_access_token` | Yes | Updated on every login; does not expire unless revoked on GitHub |

> **Security note:** The GitHub access token is stored in plaintext in PostgreSQL. For a production system, this should be encrypted at rest.

---

## 5. Repository Sync System

### Overview

Meridian has two sync mechanisms that ultimately call the same `sync_user()` function:
1. **Automatic background sync** — APScheduler fires every 15 minutes
2. **Manual user-triggered sync** — via the "Sync Repositories" button in the Topbar

### What `sync_user()` Does

**File:** `backend/app/services/sync_service.py`

```
sync_user(user_id, db)
│
├── 1. Load User from DB (get github_access_token)
├── 2. get_user_repos(token) → GitHub API (paginated, all repos)
├── 3. repository_service.save_repos(repos, user_id, db)
│       └── For each repo: upsert by github_repo_id
│           - UPDATE: name, full_name, description, language, stars, last_synced_at
│           - INSERT: new Repository record
│
├── 4. Get all repos from DB for this user
└── 5. For each DB repo:
        ├── get_repo_commits(token, owner, repo_name) → GitHub API
        └── commit_service.save_commits(commits_data, repo_id, db, token, owner, repo_name)
                └── For each commit:
                    ├── Skip if sha already in DB
                    ├── If < 10 new commits: fetch detailed stats (get_single_commit)
                    │       → files_changed, insertions, deletions, diff
                    ├── INSERT new Commit record
                    └── UPDATE repo.last_synced_at = utcnow()
```

### Scheduler Implementation

**File:** `backend/app/scheduler/sync_scheduler.py`

```python
scheduler = BackgroundScheduler()

def scheduled_sync():
    db = SessionLocal()
    users = db.query(User).all()
    for user in users:
        sync_user(user.id, db)   # ← uses same DB session for all users
    db.close()

def start_scheduler():
    scheduler.add_job(scheduled_sync, "interval", minutes=15, id="user_sync_job")
    scheduler.start()
```

The scheduler starts on FastAPI startup (`@app.on_event("startup")`).

**Critical issue:** All users share a single database session in the scheduler. If one user's sync fails, the exception is caught per-user but the shared session state may be inconsistent.

### Manual Sync Endpoints

There are two manual sync paths:

**1. Full user sync (Topbar "Sync Repositories" button):**
```
POST /sync/user/{user_id}
```
Calls `sync_user(user_id, db)` — syncs all repos and all commits for the user.

**2. Commit-only sync for a single repo (Repo detail page "Sync Commits" button):**
```
POST /commits/sync
Body: { token, owner, repo, user_id }
```
Only syncs commits for one specific repository.

**3. Repository-only sync (implicit in dashboard load — legacy):**
```
POST /repository/sync
Body: { token, user_id }
```
Only syncs repository metadata. Has a 2-minute in-memory cooldown per user (`REPO_SYNC_CACHE`). **Note:** The dashboard no longer calls this endpoint on load — it reads from DB directly with `GET /repository?user_id=...`.

### Sync Trigger Table

| Trigger | What Syncs | Where Defined |
|---|---|---|
| APScheduler (every 15 min) | All repos + all commits for all users | `sync_scheduler.py` |
| "Sync Repositories" Topbar button | All repos + all commits for the current user | `Topbar.tsx` → `POST /sync/user/{id}` |
| "Sync Commits" button on Repo page | Commits for one repo only | `repo/[name]/page.tsx` → `POST /commits/sync` |
| Dashboard page load | **Nothing** (reads from DB only) | `dashboard/page.tsx` |
| Repo page load | **Nothing** (reads from DB only) | `repo/[name]/page.tsx` |
| Login / JWT callback | **Nothing** (only user profile upsert) | `route.ts` |

### `last_synced_at` Update Logic

`last_synced_at` on `repositories` is updated in two places:
1. `repository_service.save_repos()` — sets it to `datetime.utcnow()` for every repo (new or updated)
2. `commit_service.save_commits()` — sets it to `datetime.utcnow()` after saving commits

This means a repo's `last_synced_at` reflects the time commits were last processed, not just metadata.

### Repository Sync Sequence Diagram

```
Topbar (Frontend)              FastAPI /sync               GitHub API        PostgreSQL
       │                           │                           │                  │
  Click "Sync"                     │                           │                  │
       │──POST /sync/user/{id}────►│                           │                  │
       │                           │ sync_user(id, db)          │                  │
       │                           │──GET /user/repos──────────►│                  │
       │                           │◄──────────────────────────│                  │
       │                           │ save_repos()               │                  │
       │                           │──────────────────────────────────────────────►│
       │                           │ For each repo:             │                  │
       │                           │──GET /repos/{o}/{r}/commits►│                 │
       │                           │◄──────────────────────────│                  │
       │                           │ For new commits (≤10):     │                  │
       │                           │──GET /repos/{o}/{r}/commits/{sha}►│           │
       │                           │◄──────────────────────────│                  │
       │                           │ save_commits()             │                  │
       │                           │──────────────────────────────────────────────►│
       │◄──{ status, repos_synced, commits_synced }─────────────────────────────── │
  router.refresh()                 │                           │                  │
```

---

## 6. API Inventory

Base URL: `http://localhost:8000`

All routes are registered in `backend/app/main.py`.

---

### Auth Routes (`/auth`)

#### `POST /auth/login`
**Purpose:** Upsert a user record. Called by NextAuth on every sign-in.

**Request body:**
```json
{
  "github_id": "string",
  "username": "string",
  "avatar_url": "string | null",
  "github_access_token": "string | null"
}
```
**Response (`UserResponse`):**
```json
{
  "id": 1,
  "github_id": "12345",
  "username": "pabhi",
  "avatar_url": "https://avatars.githubusercontent.com/..."
}
```

---

#### `GET /auth/profile/{user_id}`
**Purpose:** Fetch a user's complete profile with aggregated stats.

**Path param:** `user_id: int`

**Response (`UserProfileResponse`):**
```json
{
  "id": 1,
  "github_id": "string",
  "username": "string",
  "avatar_url": "string | null",
  "created_at": "datetime",
  "total_repos": 12,
  "total_commits": 340,
  "languages": { "Python": 5, "TypeScript": 4, "JavaScript": 3 },
  "recent_activity": [
    {
      "sha": "abc1234",
      "message": "Fix auth bug",
      "repo_name": "MyRepo",
      "commit_timestamp": "datetime"
    }
  ]
}
```
*(recent_activity is limited to 5 commits, ordered by newest first)*

---

### Repository Routes (`/repository`)

#### `POST /repository/sync`
**Purpose:** Sync repository metadata from GitHub (upsert). Has 2-minute in-memory rate-limit per user.

**Request body (`RepositorySyncRequest`):**
```json
{
  "token": "github_access_token",
  "user_id": 1,
  "force": false
}
```
**Response:** `List[RepositoryResponse]`

---

#### `GET /repository`
**Purpose:** Fetch all repositories for a user from the DB (no GitHub call).

**Query params:** `user_id: int`

**Response:** `List[RepositoryResponse]`

```json
[{
  "id": 1,
  "github_repo_id": "123456",
  "name": "GitRecall",
  "full_name": "pabhi/GitRecall",
  "description": "...",
  "language": "TypeScript",
  "stars": 0,
  "user_id": 1,
  "created_at": "datetime",
  "last_synced_at": "datetime"
}]
```

---

#### `GET /repository/{name}`
**Purpose:** Fetch a single repository by name for a user.

**Path param:** `name: str`
**Query params:** `user_id: int`

**Response:** `RepositoryResponse` or `404`

---

### Commit Routes (`/commits`)

#### `POST /commits/sync`
**Purpose:** Sync commits for a single repository from GitHub. Has 2-minute in-memory rate-limit per (user, repo) pair.

**Request body (`CommitSyncRequest`):**
```json
{
  "token": "github_access_token",
  "owner": "pabhi",
  "repo": "GitRecall",
  "user_id": 1
}
```
**Response:** `List[CommitResponse]`

---

#### `GET /commits/`
**Purpose:** Fetch all commits for a repository from the DB (newest first).

**Query params:** `repo_name: str`, `user_id: int`

**Response:** `List[CommitResponse]`
```json
[{
  "id": 1,
  "sha": "abc123...",
  "message": "Add feature X",
  "author_name": "pabhi",
  "author_email": "pabhi@example.com",
  "commit_timestamp": "datetime",
  "files_changed": 3,
  "insertions": 42,
  "deletions": 7,
  "diff": "--- a/file.py\n+++ b/file.py\n...",
  "repository_id": 1,
  "created_at": "datetime"
}]
```

---

### Analytics Routes (`/analytics`)

#### `GET /analytics`
**Purpose:** Compute and return developer analytics for a user across all their repos.

**Query params:** `user_id: int`

**Response (`UserAnalyticsResponse`):**
```json
{
  "total_repos": 12,
  "total_commits": 340,
  "weekly_commits": 23,
  "active_repos": 8,
  "most_active_repo": "GitRecall",
  "most_active_repo_commits": 87,
  "context_switching": "Low | Medium | High",
  "coding_momentum": "142%",
  "commit_quality": "High | Medium | Low",
  "language_distribution": { "Python": 5, "TypeScript": 4 }
}
```

**Analytics computation logic (all done in SQL):**
- `context_switching`: Count unique repos committed to in last 7 days → ≤1: Low, 2-3: Medium, >3: High
- `coding_momentum`: (last 7 days commits / prior 7 days commits) × 100 as percentage
- `commit_quality`: Average message length → >30 chars: High, >15: Medium, ≤15: Low

---

### Sync Routes (`/sync`)

#### `POST /sync/user/{user_id}`
**Purpose:** Full sync for a user — all repos and all commits. This is the "master sync" used by the Topbar button.

**Path param:** `user_id: int`

**Response:**
```json
{
  "status": "success",
  "repositories_synced": 12,
  "commits_synced": 340
}
```

---

### Root

#### `GET /`
**Response:** `{ "message": "Meridian Backend Running" }`

---

## 7. Frontend Pages

### Landing Page — `app/page.tsx`

**Route:** `/`

**Purpose:** Public marketing page. No auth required. Redirects authenticated users to `/dashboard`.

**Key behaviors:**
- `useSession()` check: if `status === "authenticated"` → `router.replace("/dashboard")`
- Dark/light theme toggle (persisted to localStorage)
- Login modal (`<LoginModal />`) triggered by "Sign In" and "Start Exploring" buttons
- Animated hero section with Framer Motion
- Animated "Connecting Meridian" spinner while session status is `"loading"`

**Data sources:** None (static content, no API calls)

**UX sections:**
1. **Navbar** — Logo, nav links (Features, Dashboard, Analytics), Sign In button, theme toggle
2. **Hero** — Headline, tagline, "Start Exploring" CTA, "View Demo" scroll button, stat counters (89K+ commits, 1.2K+ repos, 42% less context loss — hardcoded marketing copy)
3. **Features** — Feature cards (Timeline Intelligence, AI Summaries, Developer Analytics)
4. **CTA** — "Continue with GitHub" bottom section

---

### Dashboard — `app/dashboard/page.tsx`

**Route:** `/dashboard`

**Purpose:** Main authenticated workspace. Shows greeting, analytics, AI insight panel, and the full repository grid.

**Data sources:**
- `GET /repository?user_id=...` — All repos from DB
- `GET /analytics?user_id=...` — Computed analytics

**API calls on mount** (via `useEffect` triggered by `session`):
1. Fetch repositories from DB
2. Fetch analytics from backend

**No sync is triggered on dashboard load.** The dashboard is purely read-only from the database.

**State:**
- `repos: any[]` — All repos
- `analytics: any` — Analytics object
- `loading: boolean`
- `currentPage: number` — Pagination state (12 repos/page)
- `languageFilter: string` — Dropdown filter by language

**Client-side filtering:** `useMemo` over repos with `searchQuery` (from `SearchContext`) and `languageFilter`. No server round-trips for search.

**Components used:** `<Sidebar>`, `<Topbar>`, `<StatsCard>`, `<RepoCard>`

**AI Insight panel (right side of hero):** Currently shows `analytics.most_active_repo` with hardcoded framing text. Not actually AI-generated.

---

### Repository Detail — `app/repo/[name]/page.tsx`

**Route:** `/repo/[name]`

**Purpose:** Shows a single repository's overview and full paginated commit timeline.

**Data sources:**
- `GET /repository/{name}?user_id=...` — Repo metadata
- `GET /commits/?repo_name=...&user_id=...` — All commits from DB (sorted newest-first)

**Manual sync:** "Sync Commits" button → `POST /commits/sync` → updates commit list client-side

**State:**
- `commits: any[]` — All commits
- `repoDetails: any` — Repository metadata
- `loading: boolean`
- `syncing: boolean` — Commit sync in progress
- `currentCommitPage: number` — Pagination (10 commits/page)

**AI Insight panel (right side):**
- Hardcoded: `"Recent commits indicate active development."` or `"Sync complete — no commits found yet."`
- Shows most recent commit message as a preview
- **No AI is called** — this is placeholder UI

**Commit card displays:** SHA (7-char), message, insertions (+), deletions (-), files changed, author name, date

---

### Profile — `app/profile/page.tsx`

**Route:** `/profile`

**Purpose:** User profile page with GitHub identity, aggregated stats, language breakdown, and recent commit feed.

**Data sources:**
- `GET /auth/profile/{userId}` — Full profile with stats

**Displays:**
- Avatar, username, GitHub ID, join date
- Total repos, total commits synced, unique languages (3 stat cards)
- Language breakdown bar chart (CSS-based progress bars)
- Recent 5 commits feed (timeline style)
- "Sign Out" button → `signOut({ callbackUrl: "/" })`

---

### Shared Components

| Component | File | Purpose |
|---|---|---|
| `<Sidebar>` | `components/Sidebar.tsx` | Fixed left navigation (Dashboard, My Profile links) + Platform Status widget |
| `<Topbar>` | `components/Topbar.tsx` | Top bar with search input, "Sync Repositories" button, theme toggle, profile dropdown |
| `<RepoCard>` | `components/RepoCard.tsx` | Repository card linking to `/repo/[name]`; shows name, description, language, stars, last synced relative time |
| `<StatsCard>` | `components/StatsCard.tsx` | Generic stat display card with title, value, subtitle, accent color |
| `<LoginModal>` | `components/LoginModal.tsx` | GitHub sign-in modal (calls `signIn("github")`) |

**Global Providers** (`app/providers.tsx`):
- `SessionProvider` (NextAuth)
- `ThemeContext` — dark/light with localStorage persistence
- `SearchContext` — global search query state shared between Topbar (input) and Dashboard (filter)

---

## 8. Existing Intelligence Infrastructure

### The `summaries` Table

**Why it exists:**
The `summaries` table was created alongside `commits` in migration `afe6134ad9e4` (May 2026). Its structure clearly anticipates AI-generated text: `summary_text` (the output), `model_used` (which model produced it), and `summary_type` (a discriminator for future summary types).

**What it currently stores:**
Nothing. The table exists in the live PostgreSQL database but no code path writes to it, reads from it, or exposes it through any API endpoint.

**Schema revisited:**
```
summaries
  id            → PK
  commit_id     → FK → commits.id   (ONE-TO-ONE intended: one summary per commit)
  summary_text  → AI output
  summary_type  → "commit" (default) — intended for "repository", "weekly", etc.
  model_used    → "gemini-pro", "gpt-4", etc. — model tracking for observability
  created_at    → generation timestamp
```

**Whether it is commit-level intelligence:**
Yes. The current schema anchors a summary to a **specific commit** (`commit_id` FK). This means the intended first AI use case was **commit summarization** — taking a raw commit message and diff and producing a human-readable explanation.

**How it could be used in future AI systems:**

1. **Commit-level summarization (immediate):** For every commit that has a non-null `diff`, send `(message + diff)` to an LLM and store the result in `summaries`. The `summary_text` becomes the AI-enriched version of the commit message.

2. **Rollup summaries (medium term):** Use `summary_type` as a discriminator:
   - `"commit"` — per-commit summary (existing design)
   - `"daily"` — aggregate of a day's commits
   - `"weekly"` — week-level narrative
   - `"repository"` — whole-repo intelligence (overlaps with `repository_intelligence` table)

3. **RAG retrieval corpus:** All `summaries` for a repository form a searchable corpus. With embeddings, they enable semantic search over "what was I working on in March?" or "when did I add authentication?"

4. **Developer narrative:** Chain summaries across repos to produce a developer timeline — "Here's what you built this month."

---

## 9. AI Requirements

### First AI Goal: Repository Intelligence

Each repository should eventually surface four dimensions of intelligence automatically:

| Field | Description | Source Data |
|---|---|---|
| **Summary** | "What is this repository?" — purpose, domain, scope | `commits.message`, `repositories.description`, `commits.diff` |
| **Recent Work** | "What has been happening lately?" — recent commits in plain English | Last N `commits.message` values |
| **Main Technologies** | "What technologies does this use?" — languages, frameworks, tools | `repositories.language`, commit messages, diff content |
| **Development Direction** | "Where is this going?" — trajectory, active areas, momentum | Commit patterns, frequency, file change areas |

### Recommended Storage Structure

**Option A: Fields directly on the `repositories` table**

Add `summary`, `recent_work`, `main_technologies`, `development_direction`, `intelligence_generated_at` columns directly to `repositories`.

| Pros | Cons |
|---|---|
| Simple joins — one table fetch gets everything | `repositories` table grows wide and harder to evolve |
| No extra migration complexity | Intelligence fields mixed with sync metadata (conceptual coupling) |
| Easy to query in existing analytics | Harder to track generation history or version intelligence |
| No FK join needed | Cannot support multiple intelligence "versions" |

---

**Option B: Separate `RepositoryIntelligence` table (already stubbed)**

Keep intelligence in its own table with `repository_id` as a unique FK.

| Pros | Cons |
|---|---|
| Clean separation of concerns | Requires a JOIN to access |
| Can version intelligence over time | One extra table to manage |
| Easy to add new intelligence fields without touching repositories | |
| `updated_at` clearly tracks regeneration | |
| Can be extended per-feature (e.g., add `embedding_vector` column later) | |
| Aligns with how `summaries` was designed for commits | |
| Supports "intelligence not yet generated" state (NULL row = not yet run) | |

### Recommendation

**Option B is strongly preferred.** The current codebase already has a stub model for `RepositoryIntelligence`. It mirrors the pattern already established by the `summaries` table for commits. It keeps intelligence as a separate, evolvable concern. As the AI feature set grows (embeddings, confidence scores, generation timestamps, model tracking), Option A would require increasingly disruptive schema changes to the `repositories` table.

---

## 10. Repository Intelligence Design Proposal

### Recommended Model: `RepositoryIntelligence`

This fixes and extends the existing stub at `backend/app/models/repository_intelligence.py`:

```python
class RepositoryIntelligence(Base):
    __tablename__ = "repository_intelligence"

    id = Column(Integer, primary_key=True, index=True)

    # Core FK — one-to-one with Repository
    repository_id = Column(
        Integer,
        ForeignKey("repositories.id"),
        unique=True,
        nullable=False,
        index=True
    )

    # === Core AI-generated fields ===
    summary = Column(Text, nullable=True)
    # "A machine learning project for predicting football match outcomes
    #  using historical match data, xG models, and scikit-learn pipelines."

    recent_work = Column(Text, nullable=True)
    # "Recent commits focused on refactoring the data pipeline and
    #  adding a validation layer for input features."

    main_technologies = Column(Text, nullable=True)
    # JSON array stored as text: ["Python", "scikit-learn", "pandas", "FastAPI"]
    # OR comma-separated: "Python, scikit-learn, pandas, FastAPI"

    development_direction = Column(Text, nullable=True)
    # "Active development with increasing backend complexity.
    #  Recent work suggests a move toward model serving infrastructure."

    # === Generation metadata ===
    generated_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    model_used = Column(String, nullable=True)
    # Which LLM generated this — "gemini-2.0-flash", "gpt-4o", etc.

    generation_status = Column(String, default="pending")
    # "pending" | "generating" | "complete" | "failed"

    # === Future extensibility ===
    # embedding_vector = Column(Vector(1536), nullable=True)  # pgvector
    # confidence_score = Column(Float, nullable=True)
    # raw_prompt_tokens = Column(Integer, nullable=True)
    # raw_completion_tokens = Column(Integer, nullable=True)

    # Relationship
    repository = relationship("Repository", back_populates="intelligence")
```

And add to `Repository` model:
```python
intelligence = relationship(
    "RepositoryIntelligence",
    back_populates="repository",
    uselist=False  # one-to-one
)
```

### Why This Design Fits Meridian's Long-Term Vision

1. **Mirrors commit-level architecture:** The `summaries` table is the commit-level intelligence store. `RepositoryIntelligence` is the repo-level equivalent. Both have `model_used`, `created_at`/`updated_at`, and text content fields. Consistent pattern.

2. **`generation_status` enables async AI pipelines:** AI generation takes time. A `"pending"` → `"generating"` → `"complete"` state machine allows the frontend to show a loading state and poll, rather than blocking the HTTP request.

3. **`model_used` enables A/B testing and model migration:** When swapping from Gemini to GPT or vice versa, you can track which model generated which intelligence records and compare outputs.

4. **One-to-one FK with UNIQUE constraint:** Prevents duplicate intelligence records per repo. Upsert logic becomes simple: `INSERT OR UPDATE WHERE repository_id = ?`.

5. **JSON for `main_technologies`:** Storing as a JSON array (serialized to Text) allows the frontend to parse and render a tag list without complex querying. In future, this column can be replaced with a proper JSON column or a junction table.

6. **Extensibility slots:** Comment lines for `embedding_vector` (pgvector), `confidence_score`, and token counts are architectural placeholders. They document intent without coupling the schema to unbuilt features.

---

## 11. Future AI Features

### Repository Intelligence *(Phase 1 — Immediate)*

**What:** For every synced repository, generate: Summary, Recent Work, Main Technologies, Development Direction.

**How it fits:** Stored in `repository_intelligence` table. Generated by an LLM given:
- `repository.name` + `repository.description`
- Last N commit messages (e.g., 50)
- Available diff content from `commits.diff`

**Where shown:** Repo detail page (`/repo/[name]`) — the "AI Insight" panel currently shows hardcoded text. This becomes real AI output.

---

### Commit Intelligence *(Phase 2)*

**What:** For every commit with a diff, generate a plain-English explanation of what changed and why.

**How it fits:** Stored in the existing `summaries` table (`summary_type = "commit"`). The `diff` column on commits already has the raw material. The `model_used` column tracks which model was used.

**Where shown:** Commit cards on the repo detail page. Each card shows the AI summary below the commit message.

---

### Developer Intelligence *(Phase 3)*

**What:** Cross-repository intelligence about a developer's patterns, strengths, focus areas, and trajectory.

**How it fits:** A new `DeveloperIntelligence` table (mirroring `RepositoryIntelligence`) keyed to `user_id`. Generated by aggregating `RepositoryIntelligence` summaries + commit activity patterns.

**Where shown:** Profile page — instead of raw stats, show: "You are primarily a Python/ML developer with strong backend focus. You've been increasingly working on infrastructure and data pipeline work this month."

---

### Repository Chat *(Phase 4)*

**What:** Allow a user to ask questions about a specific repository in natural language. "What did I change in the auth module last month?" "What does this repo do?"

**How it fits:** Uses `commits.diff`, `commits.message`, and `summaries.summary_text` as a retrieval corpus. A RAG (Retrieval-Augmented Generation) pipeline:
1. Embed commits and summaries → store in pgvector column or separate vector DB
2. User query → embed → similarity search → retrieve top-K commits
3. Prompt LLM with retrieved context → stream response to UI

**Architecture needed:** Vector storage (pgvector extension or Pinecone), embedding model, streaming API endpoint.

---

### Developer Chat *(Phase 5)*

**What:** Cross-repository conversational interface. "What was I building in February?" "Show me everything I shipped this week."

**How it fits:** Same RAG approach but over all repositories for a user. Uses `DeveloperIntelligence` + all `RepositoryIntelligence` as the grounding context.

---

### Cross-Repository RAG *(Phase 6)*

**What:** Enable queries that span multiple repositories. "Where did I implement authentication across my projects?" "Which repos share a similar architecture?"

**How it fits:** Requires a shared embedding index keyed by `user_id`. Each commit/summary is embedded with repository and user metadata. Similarity search across all repositories.

---

### Bring Your Own Model (BYOM) *(Phase 7)*

**What:** Allow users to configure which AI model powers their intelligence — OpenAI GPT-4o, Anthropic Claude, Google Gemini, local Ollama models, etc.

**How it fits:** A `model_used` field already exists on both `summaries` and `RepositoryIntelligence`. A `UserAISettings` table (or column on `users`) stores the user's preferred provider and API key. The backend routes AI requests through a **provider abstraction layer**.

---

### Provider Abstraction Layer *(Required for BYOM)*

**What:** A unified interface that accepts `(prompt, context, model_name)` and returns a response, regardless of which backend LLM is used.

**Design:**
```python
class AIProvider(ABC):
    @abstractmethod
    async def complete(self, prompt: str, context: str, **kwargs) -> str:
        ...

class GeminiProvider(AIProvider): ...
class OpenAIProvider(AIProvider): ...
class AnthropicProvider(AIProvider): ...
class OllamaProvider(AIProvider): ...  # local models

def get_provider(model_name: str) -> AIProvider:
    if model_name.startswith("gemini"): return GeminiProvider(...)
    if model_name.startswith("gpt"): return OpenAIProvider(...)
    ...
```

This layer should be built **before** any specific LLM is integrated, to avoid hard-coded model dependencies.

---

## 12. Technical Debt

### 1. `RepositoryIntelligence` Model Has Syntax Errors and Is Unmigrated

**File:** `backend/app/models/repository_intelligence.py`

- `COlumn` (line 12) → should be `Column`
- `COlumn` (line 24) → should be `Column`
- `Date(timezone=True)` (line 24) → should be `DateTime(timezone=True)`
- No corresponding Alembic migration exists
- `Repository` model does not declare the `intelligence` backref

**Impact:** This model is **completely non-functional** and would crash on import if used.

---

### 2. No Authentication on Backend Routes

All backend routes accept `user_id` as a query parameter or request body field with no verification. Any client knowing a `user_id` integer can read or trigger syncs for any user. There is no JWT middleware, no session validation, and no row-level security.

**Impact:** In a production multi-user deployment, this is a critical security vulnerability.

---

### 3. GitHub Access Token Stored in Plaintext

`users.github_access_token` is stored as a plaintext string in PostgreSQL. If the database is compromised, all user GitHub tokens are exposed.

---

### 4. Commit Sync Has No Pagination

`get_repo_commits()` in `github_service.py` fetches only the first page of commits from GitHub (default 30 commits). There is no `page` loop like `get_user_repos()` has. Repositories with more than 30 commits will only ever have their 30 most recent commits synced.

---

### 5. Scheduler Uses a Shared Database Session

`scheduled_sync()` opens a single `SessionLocal()` and passes it to `sync_user()` for every user sequentially. A transaction failure for one user can contaminate the session state for subsequent users. Each user sync should use its own isolated session.

---

### 6. In-Memory Rate Limit Caches (`REPO_SYNC_CACHE`, `COMMIT_SYNC_CACHE`)

These dictionaries in `repository.py` and `commits.py` are stored in memory on the FastAPI process. They are:
- **Lost on every server restart** — no persistence
- **Not shared** if multiple workers are used
- **Not thread-safe** (though not yet a problem in single-worker dev mode)

Should be replaced with database-backed cooldown timestamps or a Redis cache.

---

### 7. `diff` Only Populated for First 10 New Commits Per Sync

The 10-commit detail fetch limit was added to avoid GitHub rate limits. This means most commits in the database have `diff = NULL`. This severely limits what AI features can do without fetching diffs retroactively.

A background job that backfills diffs for commits where `diff IS NULL` would significantly increase the data quality available to the AI layer.

---

### 8. No Error Tracking or Observability

The backend uses `print()` statements for all logging. There is no structured logging, no error tracking (Sentry, etc.), no metrics, and no alerting on scheduler failures.

---

### 9. `RepositoryResponse` Schema Declares `last_synced_at` as Non-Optional

```python
class RepositoryResponse(RepositoryBase):
    last_synced_at: datetime  # Not Optional
```

But `repository.last_synced_at` is nullable in the database. If a repo has never been synced (created via a path that doesn't set it), this will cause a Pydantic validation error. Should be `Optional[datetime] = None`.

---

### 10. Frontend Uses `any` Types Pervasively

Both `dashboard/page.tsx` and `repo/[name]/page.tsx` use `useState<any>` for `repos`, `commits`, and `analytics`. Type definitions exist in `frontend/types/` (directory present but not inspected in detail) but are not used in the pages. This eliminates TypeScript's safety guarantees in the most data-critical components.

---

## 13. Recommended Next Steps

This is an ordered, practical implementation plan starting from the current state of the codebase.

---

### Step 1 — Fix the `RepositoryIntelligence` Model (1 day)

Fix all syntax errors in `backend/app/models/repository_intelligence.py`:
- Fix `COlumn` → `Column`
- Fix `Date` → `DateTime`
- Add `development_direction` field
- Add `model_used` and `generation_status` fields
- Add `intelligence` relationship to `Repository` model

Create and run the Alembic migration.

**Deliverable:** A clean, migrated `repository_intelligence` table in the live database.

---

### Step 2 — Fix the Commit Sync Pagination (0.5 days)

Add a pagination loop to `get_repo_commits()` in `github_service.py`, mirroring the existing loop in `get_user_repos()`. Increase from 30 to up to 100 commits per page.

**Deliverable:** Complete commit history synced for all repos.

---

### Step 3 — Build the AI Provider Abstraction Layer (2 days)

Create `backend/app/ai/` directory with:
- `provider.py` — Abstract base class `AIProvider`
- `gemini.py` — Google Gemini implementation (recommended first provider)
- `factory.py` — `get_provider(model_name: str) → AIProvider`

No LLM calls yet. Just the interface and one concrete implementation.

**Deliverable:** A testable, extensible AI provider system.

---

### Step 4 — Build Repository Intelligence Generation (3 days)

Create `backend/app/services/intelligence_service.py`:

```python
async def generate_repository_intelligence(repo_id: int, db: Session):
    # 1. Load repo + last 50 commits from DB
    # 2. Build prompt from repo metadata + commit messages
    # 3. Call AI provider
    # 4. Parse response into (summary, recent_work, main_technologies, development_direction)
    # 5. Upsert into repository_intelligence table
    # 6. Set generation_status = "complete"
```

Add a new API route: `POST /intelligence/repository/{repo_id}`

**Deliverable:** On-demand repository intelligence generation.

---

### Step 5 — Expose Intelligence on the Repo Detail Page (2 days)

- Add `GET /intelligence/repository/{repo_id}` endpoint
- Update `repo/[name]/page.tsx` to fetch and display real AI intelligence
- Replace the hardcoded "AI Insight" panel with live `summary` and `recent_work` content
- Show `main_technologies` as a tag list

**Deliverable:** The first live AI feature visible in the UI.

---

### Step 6 — Trigger Intelligence Generation on Sync (1 day)

In `sync_service.py`, after `save_commits()` completes for a repository, enqueue intelligence generation (or call it directly if latency is acceptable). Update `generation_status` throughout.

**Deliverable:** Intelligence is generated automatically on every sync cycle.

---

### Step 7 — Add Commit Summarization (2 days)

For commits where `diff IS NOT NULL`, generate a `summaries` record:
- Prompt: `(commit message + diff)` → "Explain what changed in plain English"
- Store in `summaries` table with `summary_type = "commit"`, `model_used = "..."` 
- Expose via new endpoint `GET /summaries/commit/{commit_id}`
- Display in commit cards on the repo detail page

**Deliverable:** AI-powered commit explanations, using the already-migrated `summaries` table.

---

### Step 8 — Backfill Missing Diffs (1 day)

Write a background task that runs during the scheduler cycle and backfills `diff` for commits where `diff IS NULL`, respecting GitHub rate limits. This expands the dataset available for commit summarization and future RAG.

**Deliverable:** Near-complete diff coverage for all commits.

---

### Step 9 — Add Backend Authentication Middleware (2 days)

Add a dependency in FastAPI that validates the `user_id` in each request against the NextAuth session token passed in headers. This is the minimum required before any public deployment.

**Deliverable:** Backend routes are user-scoped and cannot be accessed cross-user.

---

### Step 10 — Developer Intelligence (3 days)

Create `DeveloperIntelligence` model (analogous to `RepositoryIntelligence` but keyed to `user_id`). Generate a cross-repo summary from all `RepositoryIntelligence` records for a user. Surface on the Profile page.

**Deliverable:** "Who am I as a developer?" intelligence on the profile page.

---

### Step 11 — Repository Chat / RAG (5 days)

Install `pgvector` PostgreSQL extension. Add `embedding_vector` column to `summaries`. Build an embedding pipeline (embed each commit summary). Add `POST /chat/repository/{repo_id}` endpoint with RAG retrieval. Build a chat UI component on the repo detail page.

**Deliverable:** Natural language Q&A over a repository's commit history.

---

*End of AI_CONTEXT.md*
