"""Small dependency-free per-client rate limiter (in-memory, single process).

Good enough for a first deployment on one instance. For multiple instances
use a shared store (e.g. Redis) or a gateway-level limiter instead.
"""
import time
from collections import defaultdict, deque

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

LIMITED_PREFIX = "/api/reports/"
WINDOW_SECONDS = 60


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit_per_minute: int = 20):
        super().__init__(app)
        self.limit = limit_per_minute
        self.hits: dict[str, deque] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        if request.method == "POST" and request.url.path.startswith(LIMITED_PREFIX):
            now = time.monotonic()
            window = self.hits[_client_ip(request)]
            while window and now - window[0] > WINDOW_SECONDS:
                window.popleft()
            if len(window) >= self.limit:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please wait a minute and try again."},
                )
            window.append(now)
        return await call_next(request)
