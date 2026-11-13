from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["app"] == "ReportSaathi"



def test_readiness_endpoint_does_not_expose_secret():
    response = client.get("/api/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert "gemini_configured" in data
    assert "api_key" not in data
    assert "secret" not in data
