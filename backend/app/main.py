import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import repository, auth, commits, analytics, sync, intelligence, ai_routes
from app.scheduler.sync_scheduler import start_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

app = FastAPI(
	title="Meridian API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.on_event("startup")
def startup_event():
    start_scheduler()
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(sync.router, prefix="/sync", tags=["Sync"])
app.include_router(repository.router, prefix="/repository", tags=["Repositories"])
app.include_router(commits.router, prefix="/commits", tags=["Commits"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(intelligence.router, prefix="/intelligence", tags=["Intelligence"])
app.include_router(ai_routes.router, prefix="/ai", tags=["AI"])

@app.get("/")
def root():
	return {
		"message": "Meridian Backend Running"
	}

