# ReportSaathi deployment preparation

This document describes a deployment path; it does not mean the application has
been deployed. Use synthetic data during setup.

## Suggested architecture

- Frontend: Cloudflare Pages (static Vite build).
- Backend: Render (FastAPI web service).
- Database/auth: Supabase (optional account and metadata history).
- AI: Gemini API called only by the backend.

## 1. Prepare the backend for Render

Create a Render Web Service from the repository and set:

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Set environment variables in Render's dashboard:

- `APP_NAME=ReportSaathi`
- `DEBUG=false`
- `FRONTEND_URL=https://YOUR-FRONTEND-DOMAIN`
- `GEMINI_API_KEY` (secret)
- `GEMINI_MODEL` (choose a model available to the key)
- `GEMINI_TIMEOUT_SECONDS=45`

Do not commit or paste secrets into source files. Configure a persistent and
secure file-handling strategy before production; this app currently processes
uploads temporarily and is not designed for durable document storage.

After deployment, check `/api/health`, `/api/ready` and `/docs`. Do not expose
interactive API docs publicly in a sensitive production deployment without
reviewing whether they should be disabled or protected.

## 2. Prepare the frontend for Cloudflare Pages

Build settings:

- Root directory: `frontend`
- Build command: `npm ci && npm run build`
- Output directory: `dist`

Set build environment variables:

- `VITE_API_BASE_URL=https://YOUR-BACKEND-DOMAIN`
- `VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co` (optional)
- `VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY` (optional)

Vite variables are embedded in the browser bundle. Only the Supabase public
anon/publishable key belongs in `VITE_` variables. Never put Gemini keys,
Supabase service-role keys, database passwords or private tokens in the frontend.

After deployment, set `FRONTEND_URL` on the backend to the exact frontend origin.
If using a custom domain, update it there too. Configure Supabase authentication
redirect URLs for the exact production frontend origin.

## 3. Before making the app public

- Enable HTTPS and verify CORS permits only the intended frontend origins.
- Review rate limiting, upload abuse protection, file-size/page limits and request
  timeouts. Add production-grade rate limiting before public exposure.
- Redact personal and medical information from application logs and error traces.
- Review Gemini provider data handling, terms, retention and applicable regional
  requirements before sending any patient data.
- Review consent, privacy notice, deletion/retention policy and incident response.
- Run the complete `docs/qa-checklist.md`, including Supabase RLS checks.
- Have qualified clinical and security reviewers assess all user-facing content.
- Do not market the product as a diagnostic, triage or treatment system.

## 4. Rollback

Keep the last known-good frontend and backend releases. If an issue affects
privacy, authentication, source verification or medical safety, disable the
affected AI feature or roll back the release while investigating. Do not delete
user data or change database policies as an ad-hoc fix.
