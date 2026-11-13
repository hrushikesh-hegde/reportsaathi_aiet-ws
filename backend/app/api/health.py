from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "app": "ReportSaathi",
        "message": "Backend is running",
    }



@router.get("/ready")
async def readiness_check() -> dict[str, str | bool]:
    """Report configuration readiness without exposing secrets."""
    from app.core.config import settings

    return {
        "status": "ready",
        "app": settings.app_name,
        "gemini_configured": bool(settings.gemini_api_key),
        "message": "API process is ready; optional AI features require Gemini configuration.",
    }
