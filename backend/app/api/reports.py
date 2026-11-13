import asyncio

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.schemas.report import (
    ReportExplanationRequest, ReportExplanationResponse,
    ReportChatRequest, ReportChatResponse,
)
from app.services.gemini_service import (
    GeminiInvalidResponseError,
    GeminiNotConfiguredError,
    GeminiUnavailableError,
    explain_report,
    chat_about_report,
)
from app.services.document_extractor import (
    MAX_FILE_BYTES,
    DocumentError,
    extract_document,
)

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("/analyze")
async def analyze_report(file: UploadFile = File(...)) -> dict:
    """Extract source text only. This endpoint does not interpret or diagnose."""
    filename = file.filename or "upload"
    try:
        content = await file.read(MAX_FILE_BYTES + 1)
        if len(content) > MAX_FILE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="The file is larger than the 10 MB upload limit.",
            )
        try:
            result = extract_document(filename, content)
        except DocumentError as exc:
            message = str(exc)
            code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE if "Unsupported file type" in message else status.HTTP_422_UNPROCESSABLE_ENTITY
            if "OCR is not available" in message:
                code = status.HTTP_503_SERVICE_UNAVAILABLE
            raise HTTPException(status_code=code, detail=message) from exc
        return {
            "success": True,
            "filename": filename,
            "file_size_bytes": len(content),
            **result,
            "notice": "Text extraction only. No diagnosis, medical interpretation or treatment advice is provided.",
        }
    finally:
        await file.close()



@router.post("/explain", response_model=ReportExplanationResponse)
async def explain_extracted_report(payload: ReportExplanationRequest) -> ReportExplanationResponse:
    """Generate a source-grounded educational explanation; never diagnose or prescribe."""
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini is not configured. Add GEMINI_API_KEY to backend/.env and restart the backend.",
        )

    try:
        explanation = await asyncio.wait_for(
            asyncio.to_thread(explain_report, payload.extracted_text, payload.language),
            timeout=settings.gemini_timeout_seconds,
        )
    except asyncio.TimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The AI explanation took too long. Please try again.",
        ) from exc
    except GeminiNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except GeminiInvalidResponseError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except GeminiUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    return ReportExplanationResponse(
        success=True,
        model=settings.gemini_model,
        language=payload.language,
        explanation=explanation,
        safety_notice=(
            "Educational information only. This is not a diagnosis or treatment recommendation. "
            "Verify extracted details against the original report and discuss results with a qualified clinician."
        ),
    )



@router.post("/chat", response_model=ReportChatResponse)
async def chat_about_selected_report(payload: ReportChatRequest) -> ReportChatResponse:
    """Answer a question using only the currently selected report text."""
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini is not configured. Add GEMINI_API_KEY to backend/.env and restart the backend.",
        )

    history = [message.model_dump() for message in payload.history]
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                chat_about_report,
                payload.extracted_text,
                payload.question,
                payload.language,
                history,
            ),
            timeout=settings.gemini_timeout_seconds,
        )
    except asyncio.TimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The AI chat took too long. Please try again.",
        ) from exc
    except GeminiNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except GeminiInvalidResponseError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except GeminiUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    return ReportChatResponse(
        success=True,
        answer=result["answer"],
        source_excerpt=result.get("source_excerpt"),
        supported_by_report=result["supported_by_report"],
        language=payload.language,
        safety_notice=(
            "Educational information only. Chat answers are not a diagnosis or treatment recommendation. "
            "The conversation is not saved by ReportSaathi."
        ),
    )
