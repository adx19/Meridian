# Meridian — Project Audit, System Architecture & Stabilization Report

This document provides a comprehensive report on the **Meridian** project architecture, database schemas, component structures, and the concrete stabilization changes introduced across the stabilization phases.

---

## 1. Executive Summary

Meridian is a decoupled, modern developer intelligence workspace designed to index, synchronize, and visualize repository activity. It is structured into two core tiers:
1. **Frontend (Next.js 16 + React 19 + TailwindCSS 3 + Framer Motion)**: A premium dark/light glassmorphic client interface.
2. **Backend (FastAPI + SQLAlchemy + PostgreSQL)**: A relational persistence and GitHub API ingestion engine.

During the audit and stabilization phases, we verified architectural separation, successfully cleared development typings conflicts, resolved missing real-time repository search/filtering, fixed Turbopack workspace warnings, enabled full GitHub repository pagination, and eliminated dead/non-functional UI components.

> [!NOTE]
> No AI/LLM/embeddings features have been added. All data is processed deterministically from the local database and the GitHub REST API.

---

## 2. System Architecture & Flow

```mermaid
graph TD
    Client[Next.js Frontend] <-->|JSON over HTTP| API[FastAPI Backend]
    API <-->|SQLAlchemy ORM| DB[(PostgreSQL Database)]
    API <-->|HTTP Requests| GitHub[GitHub REST API]
    Client <-->|OAuth callback / JWT sync| GitHub
```

### Authentication Flow
1. User clicks **"Continue with GitHub"** triggering NextAuth's `github` provider.
2. GitHub issues an OAuth callback. NextAuth handles the JWT token construction and retrieves user information.
3. In the NextAuth JWT sign-in callback (`frontend/app/api/auth/[...nextauth]/route.ts`), an automatic payload is dispatched to the backend (`/auth/login`) containing GitHub details and the secure OAuth `accessToken`.
4. The backend registers the user in the database if new, or updates their profile information if existing, and replies with the database `user_id`.

### Synchronization Flow
1. Upon landing on `/dashboard`, the client requests `/repository/sync` sending the user's DB `user_id` and the session's GitHub OAuth token in the POST body.
2. The backend contacts GitHub via the `get_user_repos` service, performs an ORM upsert, and updates the local repositories cache.
3. When the user navigates to a repository detail page (`/repo/[name]`), the client triggers `/commits/sync` to fetch and persist the repository's git commits.
4. Commit details (e.g. diffs, additions, deletions) are fetched in details of 10 commits per session to prevent GitHub API rate-limiting.

---

## 3. Directory Structure & File Inventory

Below is an overview of the workspace files, detailing the specific responsibilities of each module:

### 🎨 Frontend (`/frontend`)
*   [`next.config.ts`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/next.config.ts): Handles Next.js configuration. Now contains top-level `turbopack.root` mapping to silence workspace lockfile detection warnings.
*   [`app/providers.tsx`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/providers.tsx): Hoists global providers, including NextAuth `SessionProvider`, global Light/Dark Theme Context, and the newly implemented client-side `SearchContext` for cross-component query syncing.
*   [`app/globals.css`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/globals.css): Sets up custom utility classes, grid lines, animations, and the background glows.
*   [`app/page.tsx`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/page.tsx): High-fidelity landing page detailing platform advantages, stats, and featuring interactive button behaviors (smooth-scrolling to Features and redirecting signed-in users to the Dashboard).
*   [`app/dashboard/page.tsx`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/dashboard/page.tsx): Main engineer dashboard. Handles sync status, parses state, computes card analytics, and displays the filtered list of repositories.
*   [`app/profile/page.tsx`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/profile/page.tsx): Displays synced user information (username, avatar, email, join date).
*   [`app/repo/[name]/page.tsx`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/repo/[name]/page.tsx): Renders specific repository details, lists files changed, and shows a vertical interactive commit timeline.
*   [`components/Topbar.tsx`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/components/Topbar.tsx): Floating top navigation holding the user profile dropdown, theme toggler, and the reactive repository search field.
*   [`components/Sidebar.tsx`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/components/Sidebar.tsx): Global side-navigation panel displaying the application branding and menu options.
*   [`components/StatsCard.tsx`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/components/StatsCard.tsx): Reusable component for showing telemetry data (most active repo, commit quality, context switching rate).
*   [`components/RepoCard.tsx`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/components/RepoCard.tsx): Visual representations of indexed projects showing stars, languages, and descriptions.
*   [`types/next-auth.d.ts`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/types/next-auth.d.ts): Extends the default Session and User typings to carry GitHub tokens and database IDs safely.

### 🐍 Backend (`/backend`)
*   [`app/main.py`](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/main.py): Registers routers, configures CORS, and launches the FastAPI app.
*   [`app/core/config.py`](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/core/config.py): Controls configuration parsing for environment variables using Pydantic Settings.
*   [`app/db/database.py`](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/db/database.py): Initializes the SQLAlchemy database engine and connection session pools.
*   [`app/models/user.py`](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/models/user.py): Declarative definition of the `users` table.
*   [`app/models/repository.py`](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/models/repository.py): Declarative definition of the `repositories` table.
*   [`app/models/commits.py`](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/models/commits.py): Declarative definition of the `commits` table.
*   [`app/models/summary.py`](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/models/summary.py): Declarative definition of the `summaries` table (intended for future AI summaries).
*   [`app/schemas/`](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/schemas/): Contains Pydantic serialization schemas (`user.py`, `repository.py`, `commit.py`) which govern the backend input/output boundary.
*   [`app/api/routes/auth.py`](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/api/routes/auth.py): Handles profile upsert during OAuth callbacks.
*   [`app/api/routes/repository.py`](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/api/routes/repository.py): Syncs and fetches repository lists.
*   [`app/api/routes/commits.py`](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/api/routes/commits.py): Syncs and retrieves repository commit histories.
*   [`app/api/routes/analytics.py`](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/api/routes/analytics.py): Queries database records to aggregate activity metrics.
*   [`app/services/github_service.py`](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/services/github_service.py): Wraps external GitHub REST endpoints. Now updated to support pagination on user repository list queries.
*   [`app/services/repository_service.py`](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/services/repository_service.py): Core database transactional operations for repositories.
*   [`app/services/commit_service.py`](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/services/commit_service.py): Ingestion and processing loop for commits and diff assemblies.

---

## 4. Summary of Changes (Phase 1 & Phase 2 Stabilization)

### Phase 1: Real-Time Repository Search & Style Polish
1.  **Search State Management**: Hoisted a new React Context (`SearchContext`) in [`providers.tsx`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/providers.tsx). This shares search queries between the floating top navbar and the central dashboard listing page seamlessly.
2.  **Search Input Wiring**: Added query triggers to the input field in [`Topbar.tsx`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/components/Topbar.tsx) with a responsive clean button (X) when non-empty.
3.  **Real-Time Dashboard Filtering**: Integrated `useMemo` in [`dashboard/page.tsx`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/dashboard/page.tsx) to filter repositories locally based on their name, description, or programming language. Renders custom empty states when no repositories match the query.
4.  **Premium Dashboard Accents**: Replaced monotone styling by binding unique, vibrant gradients to the developer stats cards (Indigo for Most Active Repo, Cyan for Context Switching, Emerald for Coding Momentum, and Rose for Commit Quality).

### Phase 2: Configuration, Pagination & UX Refinements
5.  **Workspace Root Lockfile Warning Resolution**: Set top-level `turbopack: { root: path.resolve(__dirname, "..") }` configuration within [`next.config.ts`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/next.config.ts) to silence Turbopack's workspace lockfile misidentification messages.
6.  **Full GitHub Repository Pagination**: Overhauled `get_user_repos` in [`github_service.py`](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/services/github_service.py) to loop page queries (handling 100 elements per page) until all repositories are fetched, preventing the 30-item truncation.
7.  **Elimination of Dead UI Elements**: Completely removed the non-functional notifications bell and its associated imports from [`Topbar.tsx`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/components/Topbar.tsx).
8.  **Landing Page Navigation Wiring**: Upgraded button elements in the main navigation of [`page.tsx`](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/page.tsx) to act as active shortcuts:
    *   **Features** and **Analytics**: Perform a smooth scroll directly to the features section.
    *   **Dashboard**: Intelligently routes authenticated users directly to `/dashboard` or triggers the Sign-In modal for anonymous users.

---

## 5. Local Setup & Running Instructions

### Backend (Python FastAPI)
1. Navigate to `/backend` directory.
2. Create and activate a python virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file containing your local PostgreSQL connection string:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/meridian
   ```
5. Apply database migrations:
   ```bash
   alembic upgrade head
   ```
6. Start the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend (Next.js 16)
1. Navigate to `/frontend` directory.
2. Install Node packages:
   ```bash
   npm install
   ```
3. Configure your local environment in `.env.local` containing your GitHub OAuth credentials:
   ```env
   GITHUB_ID=your_github_client_id
   GITHUB_SECRET=your_github_client_secret
   NEXTAUTH_SECRET=your_nextauth_jwt_secret
   NEXTAUTH_URL=http://localhost:3000
   ```
   > [!IMPORTANT]
   > Ensure that the NextAuth callback URL is configured as `http://localhost:3000/api/auth/callback/github` in your GitHub OAuth Developer Settings.
4. Launch the application:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` to interact with the platform.
