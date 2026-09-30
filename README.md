# Meridian: Developer Intelligence & Repository Memory System

Meridian is an intelligent developer activity visualization and analysis platform. It aims to transform scattered git commits, repository metadata, and coding patterns into a cohesive, searchable, and AI-summarized intelligence layer. It reduces context-switching and provides deep, automated developer insights.

---

## 🏗️ Project Architecture

Meridian is designed as a decoupled fullstack application:
1. **Frontend**: Next.js (App Router) powered by Tailwind CSS, Framer Motion (for premium micro-animations/transitions), and NextAuth.js (for GitHub OAuth).
2. **Backend**: FastAPI (Python) web framework with SQLAlchemy ORM, PostgreSQL database, and Alembic database migration management.

---

## 📂 Codebase Directory Structure

Here is a breakdown of the repository and where components reside:

### Backend Architecture (`/backend`)
- **[backend/app/main.py](./backend/app/main.py)**: The FastAPI entry point. Includes routers and global middleware.
- **[backend/app/core/](./backend/app/core/)**: Configuration settings (e.g., [config.py](./backend/app/core/config.py) using Pydantic Settings for `.env` parsing) and security handlers ([security.py](./backend/app/core/security.py) - *currently empty placeholder*).
- **[backend/app/db/](./backend/app/db/)**: Database session manager ([session.py](./backend/app/db/session.py)), engine setup ([database.py](./backend/app/db/database.py)), and Alembic helper model collection ([base.py](./backend/app/db/base.py)).
- **[backend/app/models/](./backend/app/models/)**: Database tables defined via SQLAlchemy declarations:
  - [user.py](./backend/app/models/user.py): Defines the `User` schema (GitHub accounts, avatars, associated repositories).
  - [repository.py](./backend/app/models/repository.py): Defines the `Repository` schema synced from GitHub (stars, language, description).
  - [commits.py](./backend/app/models/commits.py): Defines the `Commit` schema (SHA, message, diffs, line insertion/deletions, author info).
  - [summary.py](./backend/app/models/summary.py): Defines the `Summary` schema for AI-generated summaries mapping to commits.
- **[backend/app/api/routes/](./backend/app/api/routes/)**:
  - [repository.py](./backend/app/api/routes/repository.py): Implements repo syncing endpoint (`/repository/sync`).
  - [auth.py](./backend/app/api/routes/auth.py) & [commits.py](./backend/app/api/routes/commits.py) (*currently empty placeholders*).
- **[backend/app/services/](./backend/app/services/)**:
  - [github_service.py](./backend/app/services/github_service.py): Service to interact with the GitHub REST API (fetching repositories).
  - [repository_service.py](./backend/app/services/repository_service.py): Service for database operations on repository items.
  - [commit_service.py](./backend/app/services/commit_service.py) (*currently empty placeholder*).
- **[backend/app/schemas/](./backend/app/schemas/)**: Pydantic schemas representing request/response payloads ([user.py](./backend/app/schemas/user.py), [repository.py](./backend/app/schemas/repository.py), [commit.py](./backend/app/schemas/commit.py) - *currently empty placeholders*).
- **[backend/alembic/](./backend/alembic/)**: Database migration version scripts mapping schema updates to PostgreSQL tables (`users`, `repositories`, `commits`, `summaries`).

### Frontend Architecture (`/frontend`)
- **[frontend/app/](./frontend/app/)**:
  - [page.tsx](./frontend/app/page.tsx): Main landing page styling with gradients, animations, features overview, and the "Sign In" CTA.
  - [dashboard/page.tsx](./frontend/app/dashboard/page.tsx): Authenticated developer dashboard display, listing user repositories and mock intelligence metrics.
  - [repo/\[name\]/page.tsx](./frontend/app/repo/[name]/page.tsx): Repository timeline page showing recent commit activity list fetched using the OAuth token.
  - [api/auth/\[...nextauth\]/route.ts](./frontend/app/api/auth/[...nextauth]/route.ts): Handles NextAuth OAuth authentication wrapper with GitHub, propagating access token and username.
- **[frontend/components/](./frontend/components/)**: UI components:
  - [LoginModal.tsx](./frontend/components/LoginModal.tsx): Visual overlay prompting user to sign in with GitHub.
  - [Sidebar.tsx](./frontend/components/Sidebar.tsx): Collapsible dashboard navigation panel.
  - [Topbar.tsx](./frontend/components/Topbar.tsx): Workspace navigation header (including user session details and a mock search bar).
  - [RepoCard.tsx](./frontend/components/RepoCard.tsx): Displays individual repository information with language indicators.
  - [StatsCard.tsx](./frontend/components/StatsCard.tsx): Minimalistic container for dashboard developer activity stats.
- **[frontend/lib/](./frontend/lib/)**: Client-side network helpers:
  - [github.ts](./frontend/lib/github.ts): Retrieves OAuth user repositories from GitHub REST API.
  - [commits.ts](./frontend/lib/commits.ts): Retrieves repository commits from GitHub REST API.

---

## ⚡ Current Status & Completion Map

Below is the verification breakdown showing which sections are **Fully Functioning**, **Partially Completed**, or **Pending/To-Do**.

### 🟢 Fully Functioning (Completed)
- **Frontend Design System**:
  - Dark mode glassmorphic UI using Tailwind CSS.
  - Fluid micro-animations built using Framer Motion.
  - Seamless navigation flow between the landing page, login modal, dashboard, and repository timeline.
- **GitHub OAuth Login Flow**:
  - GitHub authentication configuration via NextAuth.
  - Storing user access tokens and GitHub handles inside NextAuth session object for API consumption.
- **Client-Side GitHub REST Integration**:
  - Fetching the user's active repositories directly from GitHub.
  - Fetching commits chronologically for any selected repository directly from GitHub.
- **Backend Schema & Database Setup**:
  - PostgreSQL models defined via SQLAlchemy for users, repos, commits, and AI summaries.
  - Alembic migrations fully configured to sync code schemas with database tables.

### 🟡 Partially Completed
- **Backend Sync API**:
  - An endpoint `/repository/sync` accepts a GitHub token and saves repositories to the database, but it is not connected to the frontend client. The frontend dashboard currently reads directly from GitHub via the `fetchUserRepos` API call.
- **Empty Placeholders**:
  - Files such as `commit_service.py`, `auth.py` (routes), `commits.py` (routes), and Pydantic schemas exist but are currently blank.

### 🔴 Pending / To-Do
- **DB User Synchronization**:
  - Save/sync authenticated user details into the local PostgreSQL `users` database table when they first login via NextAuth.
- **Backend Commit Synchronization**:
  - Implement commit syncing in the backend (`commit_service.py`, `/commits/sync` endpoint) to fetch commit history, extract commit details (insertions, deletions, diffs), and persist them in PostgreSQL.
- **AI Summary Engine Integration**:
  - Connect a large language model (LLM) to read commit diffs and generate structured summaries mapping to the `Summary` DB model.
- **Developer Insights & Search Analytics**:
  - Replace static mockup statistics (like +18 weekly commits, 92% Focus Consistency, AI Insight text) on the dashboard and repository detail page with live aggregations from database records.
  - Implement live repository search filtering.

---

## 🚀 Setup & Launch Instructions

### Backend Setup
1. Navigate to `/backend`.
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/Scripts/activate # Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file specifying your PostgreSQL credentials:
   ```env
   DATABASE_URL=postgresql://<user>:<password>@localhost:5432/meridian
   ```
5. Apply Alembic migrations:
   ```bash
   alembic upgrade head
   ```
6. Start the server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup
1. Navigate to `/frontend`.
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Configure your local environment in a `.env.local` file:
   ```env
   GITHUB_ID=your_github_client_id
   GITHUB_SECRET=your_github_client_secret
   NEXTAUTH_SECRET=your_nextauth_jwt_secret
   NEXTAUTH_URL=http://localhost:3000
   ```
4. Start the next.js development server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000 in your browser.
