# Meridian

Meridian is a developer-activity platform. It signs in with GitHub, syncs a developer's repositories and commit history, and uses Google Gemini to turn recent commits into a per-repository summary, a list of current focus areas, milestones, risks, and next priorities. It also lets you ask questions about a repository's history in a chat.

> **Status: in progress.** The core flows work locally. Deployment and some polish are still to do.

## Features

- **GitHub OAuth login** via NextAuth. The GitHub access token is stored with the user record for API calls.
- **Repository sync.** Pulls the user's repositories from the GitHub REST API and saves them to PostgreSQL.
- **Commit sync.** Stores each commit with author, timestamp, and insertion and deletion counts. Detail lookups are capped per sync to respect GitHub rate limits.
- **Background sync.** An APScheduler job re-syncs every user's repositories and commits every 15 minutes.
- **Repository intelligence.** Gemini summarizes a repository from its recent commits. Results are cached per repository, so repeat views don't call the model again.
- **Repository chat.** `POST /ai/repository-chat` answers a question using commit history and the stored intelligence.
- **AI consent.** AI features run only after the user opts in during onboarding. The choice can be changed on the profile page.
- **Dashboard analytics.** `GET /analytics` returns repository count, total commits, commits in the last 7 days, and active repositories, all computed from the database.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS, Framer Motion, NextAuth.js |
| Backend | FastAPI, SQLAlchemy 2, Pydantic 2, APScheduler |
| Database | PostgreSQL, Alembic migrations |
| AI | Google Gemini via `google-genai` |
| Source data | GitHub REST API |

## Project structure

```
backend/
  app/
    main.py                 FastAPI app, CORS, scheduler startup, routers
    api/routes/             auth, sync, repository, commits, analytics, intelligence, ai_routes
    services/               github_service, sync_service, commit_service, repository_service,
                            intelligence_service, ai_service, ai_providers/gemini_provider.py
    models/                 User, Repository, Commit, Summary, RepositoryIntelligence(+History)
    scheduler/              sync_scheduler.py (15-minute background sync)
    core/config.py          settings loaded from backend/.env
  alembic/                  database migrations
  tests/                    unit tests for the intelligence service and Gemini provider
frontend/
  app/                      pages: landing, dashboard, repo/[name], profile, onboarding/ai-consent
  app/api/auth/             NextAuth GitHub OAuth route
  components/               Sidebar, Topbar, RepoCard, StatsCard, LoginModal
```

## Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL running locally
- A GitHub OAuth app (callback URL `http://localhost:3000/api/auth/callback/github`)
- A Gemini API key (optional; AI features need it)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/meridian
GEMINI_API_KEY=your_gemini_api_key
```

Apply migrations and start the API:

```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Start the dev server and open http://localhost:3000:

```bash
npm run dev
```

### Tests

```bash
cd backend
python -m unittest discover -s tests
```

## API overview

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` | Create or update a user from a GitHub login |
| GET | `/auth/profile/{user_id}` | Profile and AI settings |
| POST | `/auth/ai-consent` | Record AI consent |
| POST | `/sync` | Sync repositories for a user |
| POST | `/commits/sync` | Sync commits for a repository |
| GET | `/commits/` | List stored commits for a repository |
| GET | `/repository` | List a user's repositories |
| GET | `/intelligence/repository/{name}` | Get or generate repository intelligence |
| POST | `/ai/repository-chat` | Ask a question about a repository |
| GET | `/analytics` | Dashboard counts for a user |

## Known gaps

- Not deployed yet. Local setup only.
- The frontend dashboard's weekly and focus metrics are being moved from static values to live database aggregates.
- The sync scheduler runs in the API process, so it isn't suited to running several API replicas without moving it out.
- Search and filtering on the repository list are not built.
