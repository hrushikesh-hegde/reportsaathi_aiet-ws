from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.rate_limit import RateLimitMiddleware


def test_rate_limit_returns_429_after_limit():
    app = FastAPI()
    app.add_middleware(RateLimitMiddleware, limit_per_minute=2)

    @app.post("/api/reports/x")
    async def x():
        return {"ok": True}

    client = TestClient(app)
    assert client.post("/api/reports/x").status_code == 200
    assert client.post("/api/reports/x").status_code == 200
    assert client.post("/api/reports/x").status_code == 429
