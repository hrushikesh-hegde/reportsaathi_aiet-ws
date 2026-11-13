import json

from fastapi.testclient import TestClient

from app.main import app
from app.api import reports as reports_api
from app.services import gemini_service

client = TestClient(app)


def test_explain_requires_api_key(monkeypatch):
    monkeypatch.setattr(reports_api.settings, "gemini_api_key", None)
    response = client.post(
        "/api/reports/explain",
        json={"extracted_text": "Haemoglobin 13.2 g/dL reference range 12.0-15.5", "language": "English"},
    )
    assert response.status_code == 503
    assert "not configured" in response.json()["detail"].lower()


def test_source_grounding_drops_unverified_findings():
    from app.schemas.report import LabFinding, ReportExplanation

    result = ReportExplanation(
        summary="A simple explanation.",
        findings=[
            LabFinding(
                test_name="Haemoglobin",
                value="13.2",
                unit="g/dL",
                reference_range="12.0-15.5",
                source_excerpt="Haemoglobin 13.2 g/dL (12.0-15.5)",
                explanation="This test measures a protein in red blood cells.",
                notes=[],
            ),
            LabFinding(
                test_name="Glucose",
                value="95",
                unit="mg/dL",
                reference_range="70-100",
                source_excerpt="Glucose 95 mg/dL (70-100)",
                explanation="This is a general description.",
                notes=[],
            ),
        ],
        missing_or_unclear=[],
        general_notes=[],
    )
    source = "Haemoglobin 13.2 g/dL (12.0-15.5)"
    safe = gemini_service._validate_source_grounding(result, source)
    assert len(safe.findings) == 1
    assert safe.findings[0].test_name == "Haemoglobin"
    assert safe.missing_or_unclear


def test_explain_endpoint_returns_structured_response(monkeypatch):
    from app.schemas.report import ReportExplanation, LabFinding

    monkeypatch.setattr(reports_api.settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(
        reports_api,
        "explain_report",
        lambda text, language: ReportExplanation(
            summary="This report contains one listed test.",
            findings=[
                LabFinding(
                    test_name="Haemoglobin",
                    value="13.2",
                    unit="g/dL",
                    reference_range=None,
                    source_excerpt="Haemoglobin 13.2 g/dL",
                    explanation="Haemoglobin is a protein in red blood cells that carries oxygen.",
                    notes=[],
                )
            ],
            missing_or_unclear=[],
            general_notes=[],
        ),
    )
    response = client.post(
        "/api/reports/explain",
        json={"extracted_text": "Haemoglobin 13.2 g/dL", "language": "English"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["explanation"]["findings"][0]["value"] == "13.2"
    assert "not a diagnosis" in data["safety_notice"].lower()


def test_report_chat_requires_api_key(monkeypatch):
    monkeypatch.setattr(reports_api.settings, "gemini_api_key", None)
    response = client.post(
        "/api/reports/chat",
        json={
            "extracted_text": "Haemoglobin 13.2 g/dL printed on the laboratory report.",
            "question": "What does haemoglobin mean?",
            "language": "English",
        },
    )
    assert response.status_code == 503
    assert "not configured" in response.json()["detail"].lower()


def test_report_chat_returns_grounded_answer(monkeypatch):
    monkeypatch.setattr(reports_api.settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(
        reports_api,
        "chat_about_report",
        lambda text, question, language, history: {
            "answer": "The report lists haemoglobin as 13.2 g/dL.",
            "source_excerpt": "Haemoglobin 13.2 g/dL",
            "supported_by_report": True,
        },
    )
    response = client.post(
        "/api/reports/chat",
        json={
            "extracted_text": "Haemoglobin 13.2 g/dL",
            "question": "What value is listed?",
            "language": "English",
            "history": [],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["supported_by_report"] is True
    assert data["source_excerpt"] == "Haemoglobin 13.2 g/dL"
    assert "not saved" in data["safety_notice"].lower()


def test_report_chat_rejects_oversized_question():
    response = client.post(
        "/api/reports/chat",
        json={
            "extracted_text": "Haemoglobin 13.2 g/dL",
            "question": "x" * 1001,
            "language": "English",
        },
    )
    assert response.status_code == 422



def test_chat_service_blocks_treatment_question_without_calling_model(monkeypatch):
    monkeypatch.setattr(gemini_service.settings, "gemini_api_key", "test-key")
    result = gemini_service.chat_about_report(
        "Haemoglobin 13.2 g/dL",
        "Should I stop taking my medicine?",
        "English",
        [],
    )
    assert result["supported_by_report"] is False
    assert result["source_excerpt"] is None
    assert "cannot diagnose" in result["answer"].lower()


def test_source_grounding_tolerates_whitespace_differences():
    from app.schemas.report import LabFinding, ReportExplanation

    result = ReportExplanation(
        summary="s",
        findings=[LabFinding(
            test_name="Haemoglobin", value="13.2", unit="g/dL", reference_range=None,
            source_excerpt="Haemoglobin 13.2 g/dL", explanation="e", notes=[],
        )],
        missing_or_unclear=[], general_notes=[],
    )
    source = "Haemoglobin   13.2\ng/dL   (12.0-15.5)"
    safe = gemini_service._validate_source_grounding(result, source)
    assert len(safe.findings) == 1
