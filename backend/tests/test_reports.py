from fastapi.testclient import TestClient

from app.main import app
from app.api import reports as reports_api

client = TestClient(app)


def test_rejects_unsupported_extension():
    response = client.post("/api/reports/analyze", files={"file": ("notes.txt", b"hello", "text/plain")})
    assert response.status_code == 415
    assert "Unsupported file type" in response.json()["detail"]


def test_rejects_empty_file():
    response = client.post("/api/reports/analyze", files={"file": ("empty.pdf", b"", "application/pdf")})
    assert response.status_code == 422
    assert "empty" in response.json()["detail"].lower()


def test_rejects_fake_pdf():
    response = client.post("/api/reports/analyze", files={"file": ("fake.pdf", b"not a pdf", "application/pdf")})
    assert response.status_code == 422
    assert "valid PDF" in response.json()["detail"]


def test_upload_returns_extracted_text(monkeypatch):
    def fake_extract(filename, content):
        return {
            "status": "text_extracted",
            "source_type": "pdf",
            "extraction_method": "pdf_text",
            "page_count": 1,
            "extracted_text": "Haemoglobin 13.2 g/dL",
            "warnings": [],
        }

    monkeypatch.setattr(reports_api, "extract_document", fake_extract)
    response = client.post(
        "/api/reports/analyze",
        files={"file": ("report.pdf", b"%PDF-fake-test", "application/pdf")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["extracted_text"] == "Haemoglobin 13.2 g/dL"
    assert data["status"] == "text_extracted"
    assert "No diagnosis" in data["notice"]


def test_rejects_oversized_upload():
    # The API reads at most 10 MB + 1 byte before rejecting the upload.
    response = client.post(
        "/api/reports/analyze",
        files={"file": ("large.png", b"x" * (10 * 1024 * 1024 + 1), "image/png")},
    )
    assert response.status_code == 413
