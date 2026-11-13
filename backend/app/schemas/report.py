from typing import Literal

from pydantic import BaseModel, Field


class ReportExplanationRequest(BaseModel):
    extracted_text: str = Field(min_length=20, max_length=100_000)
    language: Literal["English", "Kannada", "Hindi"] = "English"


class LabFinding(BaseModel):
    test_name: str | None
    value: str | None
    unit: str | None
    reference_range: str | None
    source_excerpt: str = Field(min_length=1)
    explanation: str = Field(min_length=1)
    notes: list[str]


class ReportExplanation(BaseModel):
    summary: str
    findings: list[LabFinding]
    missing_or_unclear: list[str]
    general_notes: list[str]


class ReportExplanationResponse(BaseModel):
    success: bool
    model: str
    language: str
    explanation: ReportExplanation
    safety_notice: str


class ReportChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1500)


class ReportChatRequest(BaseModel):
    extracted_text: str = Field(min_length=20, max_length=100_000)
    question: str = Field(min_length=2, max_length=1000)
    language: Literal["English", "Kannada", "Hindi"] = "English"
    history: list[ReportChatMessage] = Field(default_factory=list, max_length=6)


class ReportChatResponse(BaseModel):
    success: bool
    answer: str
    source_excerpt: str | None = None
    supported_by_report: bool
    language: str
    safety_notice: str
