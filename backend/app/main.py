from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.reports import router as reports_router
from app.core.config import settings
from app.core.rate_limit import RateLimitMiddleware

app = FastAPI(
    title=settings.app_name,
    description="Educational laboratory report explanation platform with extraction, explanation and report-specific chat.",
    version="0.7.1",
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
    openapi_url="/openapi.json" if settings.debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.add_middleware(RateLimitMiddleware, limit_per_minute=settings.rate_limit_per_minute)

app.include_router(health_router)
app.include_router(reports_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"app": settings.app_name, "docs": "/docs", "health": "/api/health"}
