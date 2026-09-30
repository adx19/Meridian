# Meridian — Comprehensive Project Directory & System Summary Guide

This guide provides a detailed visual directory, description, and architectural summary of all files present in the **Meridian** engineering workspace, including what the project accomplishes and how each module contributes to the whole.

---

## 1. What Meridian Does (Project Capabilities & Features)

Meridian is a decoupled, modern developer activity dashboard and repository visualization tool. It integrates secure third-party auth, live database persistence, background ingestion, and interactive client widgets:

*   **OAuth Single Sign-On (SSO)**: Uses **NextAuth.js** to complete GitHub OAuth handshakes on the frontend, and immediately syncs the authenticated profile details to our FastAPI backend using custom sign-in hooks.
*   **Automatic User Persistence & Up-to-date Profiles**: Upserts user info (username, email, avatar URL, access tokens) directly to the PostgreSQL database, returning a unified local database `user_id`.
*   **Decoupled Multi-Tier Architecture**:
    *   The **Frontend** never communicates directly with external resources (except during OAuth setup), keeping client access keys strictly hidden.
    *   The **Backend** securely signs requests to the GitHub REST API using the user's encrypted accessToken and handles data translation.
*   **Smart Repository Sync**: Synchronizes active user repositories upon loading the Dashboard. Utilizes transactional database upserts (updates stats/description or inserts new repositories) and implements a 2-minute in-memory cache lock to prevent GitHub API rate-limit abuse.
*   **Full Pagination Capabilities**: Ingests user repositories via iterative paginated GitHub requests (fetching 100 entries per page) to support developers with a high volume of repositories.
*   **Commit Ingestion & Diffs Assembly**: Pulls commit history for selected projects, deduping incoming entries by their unique `sha` signature. For the first 10 new commits, it fetches detailed diff metrics including files changed, addition/deletion line counts, and stitches file-level patch segments into a unified diff.
*   **Telemetry Analytics Engine**: Connects relational queries in backend SQL to fetch and dynamically compute engineer activity stats (Most Active Repo name, commit momentum indicators, context-switching rates, and commit line quality).
*   **Dynamic Theme-Based Rebranding**: Combines dark-mode utility classes, glassmorphic panel layers, custom glow vectors, and dynamic image swapping. Automatically toggles between `/meridian-icon.svg` (light mode) and `/meridian-icon-darkmode.svg` (dark mode) across all active views.
*   **Client-Side Real-Time Filter**: Hoists a shared React Context (`SearchContext`) to filter synced repositories dynamically on the dashboard by name, description, or programming language without executing redundant database queries.

---

## 2. Directory Map (File Tree)

```
Meridian/
├── PROJECT_SUMMARY.md               # This Comprehensive Directory & Capabilities Guide
├── PROJECT_REPORT.md                # System Audit & Stabilization Pass Report
├── FILE_STRUCTURE.md                # Directory Overview & High-level Architecture
├── README.md                        # Primary Project Setup & Running Commands
├── backend/                         # Python FastAPI Backend Services
│   ├── alembic/                     # Database migrations versions
│   ├── app/                         # Core API & Service module
│   │   ├── api/                     # Endpoint controllers
│   │   │   └── routes/              # Modular Router controllers (auth, repos, commits, stats)
│   │   ├── core/                    # Environment parser settings
│   │   ├── db/                      # Connection engines & session builders
│   │   ├── models/                  # Declarative SQLAlchemy ORM schemas
│   │   ├── schemas/                 # Input/Output Pydantic verification structures
│   │   └── services/                # Ingestion layers & external GitHub REST calls
│   ├── alembic.ini                  # Migration pointer configuration
│   └── requirements.txt             # Python module requirements
└── frontend/                        # Next.js 16 Client App
    ├── app/                         # Pages, routers, and global styles
    │   ├── api/auth/[...nextauth]/  # NextAuth endpoint setup & sync call
    │   ├── dashboard/               # Authenticated dashboard views
    │   │   └── page.tsx             # Telemetry numbers & repositories filter list
    │   ├── profile/                 # Developer profile page
    │   │   └── page.tsx             # Displays synced GitHub avatar & accounts
    │   ├── repo/[name]/             # Interactive project detailed view
    │   │   └── page.tsx             # Displays commit detailed diff files & timelines
    │   ├── globals.css              # Main style sheets & glow rings
    │   ├── layout.tsx               # Client root layout, header, fonts loader
    │   ├── loading.tsx              # Premium workspace streaming loading screen
    │   └── providers.tsx            # Session providers, theme hooks, search context
    ├── components/                  # Premium reusable layout items
    │   ├── Sidebar.tsx              # Side navigation panel & dynamic logo swapping
    │   ├── Topbar.tsx               # Top floating search & user profile dropdown
    │   ├── StatsCard.tsx            # Telemetry metrics visual card wrapper
    │   ├── RepoCard.tsx             # Interactive repository cards
    │   └── LoginModal.tsx           # Authentication modal
    └── public/                      # Static assets & SVG icons
        ├── meridian-icon.svg        # Light mode vector logo
        └── meridian-icon-darkmode.svg # Dark mode vector logo
```

---

## 3. Frontend Files Detail (`/frontend`)

### 🛣️ App Pages & Routing Hooks (`frontend/app/`)

*   **[app/layout.tsx](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/layout.tsx)**  
    *   *Role*: Client root layout file.  
    *   *Contents*: Implements modern Geist fonts, injects global stylesheets, wraps the page hierarchy inside global context providers, and specifies metadata title as **"Meridian"** and description as **"Engineering Intelligence Workspace"**.
*   **[app/providers.tsx](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/providers.tsx)**  
    *   *Role*: Core state providers layer.  
    *   *Contents*: Hoists React Contexts:
        *   `SessionProvider`: Distributes NextAuth session cookies.
        *   `ThemeContext`: Supplies light/dark strings and manages `localStorage` variables.
        *   `SearchContext`: Stores real-time search queries used by the Topbar and Dashboard.
*   **[app/loading.tsx](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/loading.tsx)**  
    *   *Role*: Global route loading component.  
    *   *Contents*: A client-rendered component that consumes `useTheme` to dynamically load the light/dark logo and renders a premium glassmorphic card with a hardware-accelerated progress slider to prevent blank screen delays during page compilation or hydration.
*   **[app/globals.css](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/globals.css)**  
    *   *Role*: Styling settings.  
    *   *Contents*: Imports Tailwind CSS directives, sets default canvas backdrops (`#030514` for dark), and defines the decorative grid lines and fuzzy colored glow overlay circles.
*   **[app/page.tsx](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/page.tsx)**  
    *   *Role*: High-fidelity interactive landing page.  
    *   *Contents*: Renders hero copy, decorative floats, client telemetry metrics (e.g. 89k+ commits, 1.2k+ repos), platform advantages, and contains navigation hooks. The **Features** button scrolls smoothly down to `#features`, and **Dashboard** routes authenticated users directly to their workspace or triggers the auth popup.
*   **[app/dashboard/page.tsx](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/dashboard/page.tsx)**  
    *   *Role*: Core workspace workspace page.  
    *   *Contents*: Authenticates sessions, invokes `/repository/sync` securely, loads telemetry indicators from the backend, and displays the repository grid. Includes real-time `useMemo` search filters that inspect repository name, language, or description.
*   **[app/profile/page.tsx](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/profile/page.tsx)**  
    *   *Role*: Profile center.  
    *   *Contents*: Calls the backend to query aggregated user stats and displays structural profile lists (GitHub Username, email, DB primary key ID, image credentials, and active account date).
*   **[app/repo/[name]/page.tsx](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/repo/[name]/page.tsx)**  
    *   *Role*: Repository detailed inspection page.  
    *   *Contents*: Syncs repository commits via `/commits/sync` POST body, lists all commits in chronological order in an interactive visual vertical timeline, parses author info, and hosts an expandable details card revealing commit files, lines changed, and unified color-coded diff patches.
*   **[app/api/auth/[...nextauth]/route.ts](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/app/api/auth/%5B...nextauth%5D/route.ts)**  
    *   *Role*: OAuth handshake controller.  
    *   *Contents*: Instantiates NextAuth configurations. On successful OAuth completion, triggers a secure database upsert payload dispatching the GitHub `username`, `accessToken`, and `avatar_url` to the backend `/auth/login` endpoint. Injects the database primary key `userId` and GitHub username into the client session cookie.

### 🧱 Modular UI Components (`frontend/components/`)

*   **[components/Sidebar.tsx](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/components/Sidebar.tsx)**  
    *   *Role*: Left-hand navigation panel.  
    *   *Contents*: Displays navigation menus (Dashboard, Profile) and status panels. Ingests `useTheme` and automatically toggles the application logo: `/meridian-icon-darkmode.svg` when dark mode is enabled, and `/meridian-icon.svg` when light mode is active.
*   **[components/Topbar.tsx](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/components/Topbar.tsx)**  
    *   *Role*: Floating dashboard banner.  
    *   *Contents*: Contains the theme toggler button (Sun/Moon), profile drop-down (View Profile, Sign Out), and search `<input>`. Synced to the shared context, it increases input width dynamically on focus and features an inline 'X' button to clear search input.
*   **[components/StatsCard.tsx](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/components/StatsCard.tsx)**  
    *   *Role*: Telemetry metric card.  
    *   *Contents*: Formats metric cards with beautiful neon borders and custom gradient glow accents.
*   **[components/RepoCard.tsx](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/components/RepoCard.tsx)**  
    *   *Role*: Repository wrapper card.  
    *   *Contents*: Displays repository programming language indicators, star counts, descriptions, and name tags inside glassmorphic backdrops.
*   **[components/LoginModal.tsx](file:///c:/Users/pabhi/Desktop/GitRecall/frontend/components/LoginModal.tsx)**  
    *   *Role*: Authorization popup.  
    *   *Contents*: Floating glass card offering OAuth access via standard GitHub hooks, detailed benefit lists, and active security statuses.

---

## 4. Backend Files Detail (`/backend`)

### ⚙️ Main Configurations (`backend/app/`)

*   **[backend/app/main.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/main.py)**  
    *   *Role*: Application setup.  
    *   *Contents*: Instantiates FastAPI under the title **"Meridian API"**, mounts CORS policies mapping local node ports, sets up `/` root health checks returning **"Meridian Backend Running"**, and registers the modular endpoint controllers.
*   **[backend/app/core/config.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/core/config.py)**  
    *   *Role*: Environment configuration.  
    *   *Contents*: Utilizes Pydantic settings parsing algorithms to parse and validate parameters (such as `DATABASE_URL` and `PROJECT_NAME`).
*   **[backend/app/db/database.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/db/database.py)**  
    *   *Role*: DB connection pools setup.  
    *   *Contents*: Creates the engine binding with PostgreSQL, constructs `SessionLocal` factory connections, and exposes the `get_db` generator utility.
*   **[backend/app/db/base.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/db/base.py)**  
    *   *Role*: ORM migration pointer list.  
    *   *Contents*: Consolidates ORM schema model class structures inside a unified index so Alembic migration tracking engines can detect database schema changes automatically.

### 🗄️ Database Models (`backend/app/models/`)

*   **[app/models/user.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/models/user.py)**  
    *   *Role*: Relational `users` table schema.  
    *   *Contents*: Maps structural credentials: database ID, `github_id` reference key, `username` string, user `email` field, `avatar_url`, and sets up parent-child relationships linking repositories.
*   **[app/models/repository.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/models/repository.py)**  
    *   *Role*: Relational `repositories` table schema.  
    *   *Contents*: Maps project metadata details: repository ID, owner database `user_id`, GitHub ID, project `name` strings, `full_name`, `description` strings, primary programming `language` tag, `stars`, and links mapped commits.
*   **[app/models/commits.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/models/commits.py)**  
    *   *Role*: Relational `commits` table schema.  
    *   *Contents*: Maps commits details: database ID, parent database `repository_id`, SHA reference string, message content, author name, author email, `commit_timestamp`, changed file counts, addition/deletion line metrics, and unified diff patches.
*   **[app/models/summary.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/models/summary.py)**  
    *   *Role*: Relational `summaries` table schema.  
    *   *Contents*: Defines summary tables linked to commit records for future AI-generated explanations.

### 🛡️ Data Schemas (`backend/app/schemas/`)

*   **[app/schemas/user.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/schemas/user.py)**: Serialization constraints representing user data shapes (`UserCreate`, `UserResponse`).
*   **[app/schemas/repository.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/schemas/repository.py)**: Serialization parameters for repositories, containing the secure sync body configuration structure (`RepositorySyncRequest`) and response details.
*   **[app/schemas/commit.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/schemas/commit.py)**: Serialization parameters for commits (`CommitSyncRequest`, `CommitResponse`).

### 🛣️ API Routers (`backend/app/api/routes/`)

*   **[app/api/routes/auth.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/api/routes/auth.py)**  
    *   *Role*: OAuth webhook backend sync.  
    *   *Contents*: Provides the secure `/login` endpoint. Inspects the incoming payload; if the user's `github_id` exists, it updates their record with the latest credentials, otherwise it registers them as a new user. Returns the database record ID.
*   **[app/api/routes/repository.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/api/routes/repository.py)**  
    *   *Role*: Repository synchronizer route.  
    *   *Contents*: Exposes a secure body POST endpoint under `/sync` to trigger repository index updating and a GET endpoint to return active repositories. Implements a 2-minute sync block cache to prevent GitHub API rate-limit abuse.
*   **[app/api/routes/commits.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/api/routes/commits.py)**  
    *   *Role*: Commits synchronization route.  
    *   *Contents*: Exposes a body POST endpoint under `/sync` to trigger commit indexing for a chosen repository, and a GET endpoint to display commit timeline histories.
*   **[app/api/routes/analytics.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/api/routes/analytics.py)**  
    *   *Role*: Metrics computation controller.  
    *   *Contents*: Exposes `/` and `/profile` GET routes, computing live SQL query metrics (Most Active Repo name, Weekly Commits count, active repo counts, line quality rates, and context-switching metrics).

### 🧠 Service & Ingestion Modules (`backend/app/services/`)

*   **[app/services/github_service.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/services/github_service.py)**  
    *   *Role*: GitHub REST API integration wrapper.  
    *   *Contents*: Integrates securely with external endpoints:
        *   `get_user_repos`: Iteratively pages through GitHub repositories (fetching 100 entries per page) until all repositories are retrieved.
        *   `get_repo_commits`: Queries repository commit list.
        *   `get_single_commit`: Queries detailed commit information (including modified files and patch diffs).
*   **[app/services/repository_service.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/services/repository_service.py)**  
    *   *Role*: Repository SQL database transactions service.  
    *   *Contents*: Handles database insertion and updates, ensuring incoming repository lists are safely upserted without duplication.
*   **[app/services/commit_service.py](file:///c:/Users/pabhi/Desktop/GitRecall/backend/app/services/commit_service.py)**  
    *   *Role*: Commit database ingestion service.  
    *   *Contents*: Batch processes repository commit indexes, sanitizes author timestamps, and limits detailed diff queries to 10 new commits per sync session to stay within GitHub API rate-limit bounds.

---

## 5. Database Relational Schema

Below is the database table configuration showing columns, types, and primary/foreign keys:

| Table | Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`users`** | `id` | Integer | Primary Key | Local database User ID |
| | `github_id` | String | Unique, Indexed | External GitHub Account ID |
| | `username` | String | Unique | GitHub username handles |
| | `email` | String | Nullable | Synced email credentials |
| | `avatar_url` | String | Nullable | GitHub Profile image |
| | `created_at` | DateTime | Default: NOW | Local registration date |
| **`repositories`** | `id` | Integer | Primary Key | Local database Repository ID |
| | `user_id` | Integer | Foreign Key (`users.id`) | Mapped project owner |
| | `github_repo_id` | Integer | Unique, Indexed | External GitHub repository ID |
| | `name` | String | - | Repository name tag |
| | `full_name` | String | - | Owner + Name (e.g. `owner/repo`) |
| | `description` | String | Nullable | Repository description |
| | `language` | String | Nullable | Primary programming language |
| | `stars` | Integer | Default: 0 | Star count |
| | `created_at` | DateTime | Default: NOW | Ingestion timestamp |
| **`commits`** | `id` | Integer | Primary Key | Local database Commit ID |
| | `repository_id` | Integer | Foreign Key (`repositories.id`)| Mapped parent repository |
| | `sha` | String | Unique, Indexed | Git commit hash |
| | `message` | String | - | Commit message body |
| | `author_name` | String | - | Author name |
| | `author_email` | String | - | Author email |
| | `commit_timestamp` | DateTime | - | Actual git author timestamp |
| | `files_changed` | Integer | Default: 0 | Count of modified files |
| | `insertions` | Integer | Default: 0 | Added line counts |
| | `deletions` | Integer | Default: 0 | Deleted line counts |
| | `diff` | Text | Nullable | Color-coded unified patch diffs |
| | `created_at` | DateTime | Default: NOW | Ingestion timestamp |
