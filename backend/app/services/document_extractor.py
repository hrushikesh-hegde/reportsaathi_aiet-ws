from __future__ import annotations

import io
import shutil
import tempfile
from pathlib import Path

import fitz
import pytesseract
from PIL import Image, UnidentifiedImageError

MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_PDF_PAGES = 30
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}


class DocumentError(Exception):
    """A safe, user-displayable document processing error."""


def _detect_type(filename: str, content: bytes) -> str:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise DocumentError("Unsupported file type. Upload a PDF, JPG or PNG file.")

    if suffix == ".pdf":
        if not content.startswith(b"%PDF-"):
            raise DocumentError("The file does not appear to be a valid PDF.")
        return "application/pdf"
    if suffix == ".png":
        if not content.startswith(b"\x89PNG\r\n\x1a\n"):
            raise DocumentError("The file does not appear to be a valid PNG image.")
        return "image/png"
    if not (content.startswith(b"\xff\xd8\xff")):
        raise DocumentError("The file does not appear to be a valid JPG image.")
    return "image/jpeg"


PREFERRED_OCR_LANGS = ("eng", "kan", "hin")


def _ocr_lang() -> str:
    """Use English + Kannada + Hindi when those Tesseract language packs are installed."""
    try:
        installed = set(pytesseract.get_languages(config=""))
    except Exception:
        return "eng"
    langs = [l for l in PREFERRED_OCR_LANGS if l in installed]
    return "+".join(langs) if langs else "eng"


def _run_ocr(image: Image.Image) -> str:
    if not shutil.which("tesseract"):
        raise DocumentError(
            "OCR is not available on the server. Install the Tesseract OCR engine and try again."
        )
    try:
        return pytesseract.image_to_string(image, lang=_ocr_lang())
    except pytesseract.TesseractNotFoundError as exc:
        raise DocumentError(
            "OCR is not available on the server. Install the Tesseract OCR engine and try again."
        ) from exc
    except pytesseract.TesseractError as exc:
        raise DocumentError("The image could not be read by OCR. Try a clearer image.") from exc


def extract_document(filename: str, content: bytes) -> dict:
    if not content:
        raise DocumentError("The uploaded file is empty.")
    if len(content) > MAX_FILE_BYTES:
        raise DocumentError("The file is larger than the 10 MB upload limit.")

    detected_type = _detect_type(filename, content)
    # Use a private temporary directory and a generated filename. The original
    # user filename is never used as a filesystem path.
    with tempfile.TemporaryDirectory(prefix="report-saathi-") as temp_dir:
        suffix = Path(filename).suffix.lower()
        temp_path = Path(temp_dir) / f"upload{suffix}"
        temp_path.write_bytes(content)

        if detected_type == "application/pdf":
            return _extract_pdf(temp_path)
        return _extract_image(temp_path, detected_type)


def _extract_pdf(path: Path) -> dict:
    try:
        document = fitz.open(path)
    except Exception as exc:
        raise DocumentError("The PDF could not be opened. It may be damaged or password-protected.") from exc

    with document:
        if document.is_encrypted:
            raise DocumentError("Password-protected PDFs are not supported. Upload an unlocked copy.")
        if document.page_count == 0:
            raise DocumentError("The PDF has no pages.")
        if document.page_count > MAX_PDF_PAGES:
            raise DocumentError(f"The PDF has more than {MAX_PDF_PAGES} pages. Upload a shorter report.")

        page_texts = [page.get_text("text") for page in document]
        extracted_text = "\n\n".join(text.strip() for text in page_texts if text.strip()).strip()
        if extracted_text:
            return {
                "status": "text_extracted",
                "source_type": "pdf",
                "extraction_method": "pdf_text",
                "page_count": document.page_count,
                "extracted_text": extracted_text[:100_000],
                "warnings": [],
            }

        # Scanned/image-only PDF: render pages and OCR them.
        ocr_chunks = []
        for page in document:
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            image = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
            ocr_chunks.append(_run_ocr(image).strip())
        extracted_text = "\n\n".join(chunk for chunk in ocr_chunks if chunk).strip()
        if not extracted_text:
            raise DocumentError("No readable text was found. Try a sharper, well-lit scan.")
        return {
            "status": "ocr_completed",
            "source_type": "pdf",
            "extraction_method": "tesseract_ocr",
            "page_count": document.page_count,
            "extracted_text": extracted_text[:100_000],
            "warnings": ["This PDF appeared to be scanned; text was read using OCR and may contain errors."],
        }


def _extract_image(path: Path, source_type: str) -> dict:
    try:
        with Image.open(path) as opened:
            image = opened.convert("RGB")
    except (UnidentifiedImageError, OSError) as exc:
        raise DocumentError("The image could not be opened. Upload a valid JPG or PNG file.") from exc

    text = _run_ocr(image).strip()
    if not text:
        raise DocumentError("No readable text was found in this image. Try a sharper, well-lit image.")
    return {
        "status": "ocr_completed",
        "source_type": source_type.split("/")[-1],
        "extraction_method": "tesseract_ocr",
        "page_count": 1,
        "extracted_text": text[:100_000],
        "warnings": ["OCR can misread small, blurred or handwritten text. Check extracted text against the original report."],
    }
