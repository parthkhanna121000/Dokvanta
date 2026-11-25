# Legacy backend (quarantined)

Files: `index.js`, `config/`, `middleware/`, `models/`, `routers/`, `services/`, `uploads/`.
The new TypeScript backend lives in `src/`. Preserved until v2 is verified and replaces it.

## Rules
- Run locally only. Never deploy it or expose it through a tunnel.
- Use only synthetic test PDFs, never real or personal documents.
- Treat every endpoint as unauthenticated and insecure.
- Do not delete it without explicit approval after v2 integration tests pass.

## Known issues (not being fixed)
- No auth or ownership; all chat sessions share "default".
- Path traversal in `DELETE /api/pdf/delete/:filename` and `/force-embed/:filename`.
- `/health` leaks part of the Gemini API key.
- `/uploads` is served publicly.
- Status fields are not persisted; failed uploads look like "processing".
- Mongoose 9 `pre("save")` hooks in `Document` and `Embedding` use `next` and may fail.
