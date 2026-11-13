# ReportSaathi — Phase 7 QA checklist

This checklist is for a controlled test environment using synthetic/fake reports.
Do not use real patient documents until privacy, security, legal, hosting and
clinical-safety reviews are complete.

## 1. Environment and startup
- [ ] Backend starts with Python 3.10+ and `pip install -r requirements.txt`.
- [ ] Frontend installs with supported Node.js/npm and `npm run build` succeeds.
- [ ] `GET /api/health` returns HTTP 200.
- [ ] `GET /api/ready` returns HTTP 200 and does not expose API keys.
- [ ] Missing Gemini key disables AI features gracefully but extraction still works.
- [ ] Missing Supabase URL/key leaves the app in optional/demo account mode.
- [ ] No `.env`, key, token, database password or service-role key is committed.

## 2. Upload and extraction
- [ ] Valid text PDF extracts readable text.
- [ ] Valid image file extracts text when Tesseract is installed.
- [ ] Scanned PDF OCR works when Tesseract is installed.
- [ ] Empty, corrupt, unsupported and over-10-MB files are rejected clearly.
- [ ] OCR failure produces a useful warning, not a false successful interpretation.
- [ ] Selecting a new file clears prior extraction, explanation and chat.
- [ ] Temporary upload files are removed after processing.

## 3. Explanation and chat (use synthetic report content)
- [ ] English, Kannada and Hindi selection is respected.
- [ ] Missing Gemini configuration produces a safe 503 message.
- [ ] AI timeout produces a safe timeout message.
- [ ] Malformed AI JSON is rejected safely.
- [ ] A quoted source excerpt must be an exact substring of extracted text.
- [ ] Unsupported report facts are described as unavailable.
- [ ] Diagnosis, treatment and medication-change questions are redirected to a clinician.
- [ ] Prompt-like instructions embedded in uploaded text are treated as untrusted content.
- [ ] Chat history is cleared when selecting a new report and is not written to Supabase.
- [ ] The UI displays the educational-use disclaimer and OCR verification reminder.

## 4. Supabase (only after configuring a test project)
- [ ] Email sign-up, sign-in and sign-out work.
- [ ] Email confirmation/redirect URLs match the environment.
- [ ] User A cannot read, insert or delete User B's report-history rows.
- [ ] History saves only after explicit user action.
- [ ] Only generic metadata is saved; no filename, source text, report values or AI output.
- [ ] Deleting a history entry removes only the signed-in user's entry.
- [ ] Row Level Security remains enabled on all user-owned tables.

## 5. Browser and accessibility
- [ ] Test a narrow mobile viewport and desktop viewport.
- [ ] Upload, language selection, explanation, chat and sign-out controls are usable.
- [ ] Keyboard focus is visible and form fields have labels.
- [ ] Loading, empty, error and success states are understandable.
- [ ] Long extracted text and chat responses do not overflow the layout.

## 6. Release gate
- [ ] `pytest -q` passes.
- [ ] Python compile check passes.
- [ ] Frontend production build passes.
- [ ] Supabase RLS checks are completed on a test project.
- [ ] Production secrets are configured in hosting dashboards, not source files.
- [ ] HTTPS, CORS, logging redaction, retention/deletion and backup policies are reviewed.
- [ ] A qualified clinical/safety reviewer reviews user-facing wording before public launch.

## Known verification boundary for this handoff
Backend automated tests and Python compilation are run during this phase. The
frontend production build, live Gemini calls, live Supabase/RLS checks, browser
responsiveness and hosted deployment require network access and project credentials;
they must be completed by the project owner before release.
