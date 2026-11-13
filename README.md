# ReportSaathi

ReportSaathi is an educational web application concept that helps people understand laboratory report terminology in plain language. It is not a diagnostic tool and does not replace a qualified healthcare professional.

## Current implementation status

- **Phase 1:** React/Vite/Tailwind and FastAPI foundation.
- **Phase 2:** Responsive frontend, upload validation and clearly labelled synthetic demo results.
- **Phase 3:** FastAPI upload endpoint with digital PDF extraction and Tesseract OCR for images/scanned PDFs. React sends the file to the backend and displays extracted source text.
- **Phase 4:** Optional Gemini structured explanations in English, Kannada or Hindi. The backend validates the JSON response and checks that each reported source fact appears in a verbatim excerpt from the extracted report text.
- **Phase 5:** Optional Supabase email/password authentication, private report-history metadata, Row Level Security and delete-history action.
- **Phase 6:** Report-specific educational chat in English, Kannada or Hindi. Chat is temporary and not stored.
- **Phase 7:** QA checklist, deployment preparation guide, readiness endpoint and release-safety documentation.
- **Not included:** Telegram bot and actual production deployment.

Phase 4 does not make diagnoses, predict disease, classify results using generic reference ranges, or recommend treatment/medication changes.

## Prerequisites

- Python 3.10+
- Node.js 20.19+ or 22.12+, npm 10+
- Tesseract OCR for image/scanned-PDF OCR (add `tesseract-ocr-kan tesseract-ocr-hin` for Kannada/Hindi reports)
- A Gemini API key for AI explanations (optional for text extraction)
- A Supabase project for accounts/history (optional; the app remains in demo mode without it)
- Linux Mint/Ubuntu: `sudo apt update && sudo apt install tesseract-ocr`

## Backend setup (Linux Mint)

```bash
cd report-saathi/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Open `backend/.env` and add your key:

```env
GEMINI_API_KEY=your_real_key_here
GEMINI_MODEL=gemini-3.8-flash
GEMINI_TIMEOUT_SECONDS=45
```

Get a key from Google AI Studio: https://aistudio.google.com/app/apikey

**Keep the key in `backend/.env` only.** Never put it in React/Vite variables, commit it to Git, paste it into screenshots, or expose it in browser code. The `.env` file is ignored by Git.

Start the API:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend health: http://127.0.0.1:8000/api/health  
Interactive API docs (only when `DEBUG=true`): http://127.0.0.1:8000/docs

Tesseract is a separate system package. If missing, install it with `sudo apt install tesseract-ocr`. Digital PDFs with selectable text can still be extracted without OCR.

## Frontend setup

In a second terminal:

```bash
cd report-saathi/frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173.

Frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

If the frontend uses another origin, set backend `FRONTEND_URL` to that exact origin and restart FastAPI.

## Configure Supabase (Phase 5, optional)

1. Create a project at https://supabase.com/.
2. In **SQL Editor**, run the complete script from `supabase/schema.sql`.
3. In **Project Settings → API**, copy the Project URL and the publishable/anon public key.
4. Add them to `frontend/.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLIC_ANON_KEY
```

5. In **Authentication → Providers**, enable Email authentication. Configure email confirmation and redirect URLs for your local frontend (`http://localhost:5173`) and production frontend later.
6. Restart Vite after changing `.env`.

Only the public anon/publishable key belongs in the frontend. **Never put the Supabase `service_role` key in frontend code or any `VITE_` variable.** Row Level Security is the security boundary for browser-side database access.

### What gets saved

Nothing is saved automatically. After signing in, the user must click **Save report history metadata**. The app stores only a generic title, source type, extraction method, page count and creation timestamp. It does not store the original filename, uploaded document, extracted text, test values or Gemini explanation. The user can review and delete history entries from the dashboard.

If Supabase URL/key are missing, account and history controls are disabled and the rest of the app remains in demo mode. Do not disable RLS to make an error go away.

## Workflow

1. Select a PDF, JPG or PNG file (maximum 10 MB).
2. FastAPI validates the file and extracts text using PyMuPDF or Tesseract.
3. Review the extracted text. OCR may make mistakes.
4. Select English, Kannada or Hindi.
5. Explicitly click **Explain this report** to send extracted text to Gemini.
6. Review the educational explanation alongside the quoted source excerpt.
7. Ask report-specific questions in the chat panel; the chat is temporary and is cleared when a new report is selected.

The file and extracted text are not stored in a database in this phase. Extracted text is sent to Gemini only after the user clicks the explanation button.

## API endpoints

### `GET /api/health`

Checks whether the FastAPI process is running.

### `POST /api/reports/analyze`

Multipart upload with field name `file`. Returns extracted source text, extraction method, page count and OCR warnings.

### `GET /api/ready`

Returns non-secret configuration readiness information, including whether the optional Gemini feature is configured.

### `POST /api/reports/explain`

JSON body:

```json
{
  "extracted_text": "Haemoglobin 13.2 g/dL",
  "language": "English"
}
```

Supported languages: `English`, `Kannada`, `Hindi`.

The response contains a summary, findings, source excerpts, explanations, missing/unclear notes and a safety notice. Every populated source field must match text in the quoted source excerpt, and each excerpt must occur verbatim in the extracted report text. Findings that fail this check are removed.

Common API errors:

- `413`: upload exceeds 10 MB.
- `415`: unsupported file extension.
- `422`: invalid, empty, unreadable or invalid request.
- `502`: invalid structured response from Gemini.
- `503`: Gemini key/SDK is missing or service is unavailable.
- `504`: configured AI request timeout reached.

## Tests

From `backend/` with the virtual environment activated:

```bash
pytest -q
```

Tests cover health, upload validation, upload response, missing Gemini key, source-grounding checks, chat request validation and structured endpoint output using mocked AI responses. The test suite does **not** call the live Gemini service.

See `docs/qa-checklist.md` for the release test plan and `docs/deployment.md` for deployment preparation. Deployment steps are guidance only; no hosted environment has been configured or deployed.

## Privacy, safety and limitations

- Uploaded files are temporarily written to a private temporary directory for extraction; that directory is removed after processing.
- Uploaded files and extracted text are not saved to a database. Phase 5 stores only report metadata after an explicit user action.
- Extracted text is sent to the configured Gemini API only after the user explicitly requests an explanation.
- Supabase receives only opt-in history metadata; RLS restricts rows to their authenticated owner. Review Google's current API terms, data handling and regional requirements before using real patient data.
- Do not use real patient reports until authentication, consent, transport security, access controls, retention/deletion policies and production hosting have been reviewed.
- OCR may misread small, blurred or handwritten text. Always compare extracted text and quoted source excerpts with the original report.
- Structured output and source matching reduce unsupported facts but do not guarantee medical accuracy. The model can still produce a misleading explanation.
- Do not diagnose, prescribe, recommend medication changes, or replace a clinician. Discuss unclear results with a qualified healthcare professional.
- Never commit `.env` files or API keys.

## Troubleshooting

- `pip install` fails: check internet connectivity and retry.
- Gemini says not configured: check `GEMINI_API_KEY` in `backend/.env`, then restart FastAPI.
- Gemini SDK missing: activate the backend virtual environment and run `pip install -r requirements.txt`.
- Model not available: change `GEMINI_MODEL` to a model enabled for your Google AI Studio key.
- OCR says Tesseract is unavailable: install it with `sudo apt install tesseract-ocr`.
- `npm install` fails: check DNS/internet access to `registry.npmjs.org`.
- Browser cannot connect: confirm FastAPI is running and `VITE_API_BASE_URL` is correct.
- CORS error: make sure `FRONTEND_URL` exactly matches the frontend origin, including port.

## Next steps

- Telegram/WhatsApp bot (optional), clinical wording review, production hosting.


## Phase 6 — Report-specific chat

After extracting a report, a user can ask questions about that selected report in
English, Kannada or Hindi. The chat endpoint receives the extracted text and the
current short conversation context for that request; ReportSaathi does not write
chat messages or report text to the database. Changing/removing a selected file
clears the visible chat.

- API: `POST /api/reports/chat`
- Answers must be grounded in the selected report; report-specific answers include
  an exact source excerpt that the backend verifies against the submitted text.
- If information is unavailable or the model's source excerpt cannot be verified,
  the response is marked unsupported and the UI displays that status.
- Diagnosis, disease prediction, treatment and medication-change questions are
  outside the app's scope and should be directed to a qualified clinician.
- Telegram integration is not included in this phase; the web chat is the supported
  interface.

The chat feature requires the same server-side `GEMINI_API_KEY` as report
explanations. Never put the Gemini key in frontend environment variables.
