# ReportSaathi architecture (Phases 1-7)

```text
React + Vite browser
  |
  +--> FastAPI: upload -> PyMuPDF/Tesseract -> extracted text
  |
  +--> FastAPI: explicit explanation request -> Gemini structured response
  |
  +--> Supabase Auth: email/password session
          |
          +--> report_history table (only after explicit user click)
                 - generic title
                 - source type
                 - extraction method
                 - page count
                 - created_at
                 - user_id
                 |
                 +--> RLS: auth.uid() must equal user_id
                 +--> user can read/delete only their own rows
```

The browser uses only the Supabase public anon/publishable key. No service-role key is used in the frontend. Supabase RLS is enabled on both tables. Uploaded files, extracted text, test values and AI explanations are not persisted. If Supabase credentials are absent, account/history features are disabled and the rest of the app can still be used.


## Phase 6: report-specific chat

The browser sends the selected report's in-memory extracted text, question,
language and at most six short recent messages to `POST /api/reports/chat`.
FastAPI validates payload sizes and calls the Gemini service with a report-only
educational system instruction. The service checks any returned source excerpt
against the exact submitted report text. The frontend displays the excerpt and
whether the answer is supported. No chat transcript or report text is persisted.
The conversation context is held only in the browser and is cleared when a new
file is selected. The model is not permitted to diagnose, prescribe or recommend
medication changes. Telegram is not implemented.
