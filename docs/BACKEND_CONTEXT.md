# Dokvanta backend (v2) - project context

Written from the working session that built Milestones 1 to 3. It reflects the state after the
Milestone 3 verification pass. Anything marked "not verified" has not been proven in practice.

## 1. What this project is

**Dokvanta** is a PDF-first AI document platform (Create. Understand. Edit. Transform.) with three
capabilities: AI Document Intelligence, **AI Visual Edit**, and Document Creator.
The current priority is **AI Visual Edit**.

The user uploads a PDF, selects text, and describes a change in natural language. The AI turns
that into structured edit proposals. The user reviews them and accepts or rejects each one. Only
accepted changes are committed into a new PDF revision. The original PDF is never modified.

**Core principle: AI proposes. The user decides. The backend validates and commits.**

- Repository: `C:\Users\khann\OneDrive\Desktop\Dokvanta` (GitHub: parthkhanna121000/Dokvanta)
- Working branch: `feature/dokvanta`
- Backend: Node.js, Express 5, TypeScript, MongoDB/Mongoose 9, Zod 4, Vitest
- Frontend: Next.js, React, TypeScript, Tailwind (not modified so far)
- Future AI service (not built): Python, FastAPI, LangGraph, Gemini. For now the AI runs behind an
  `AiProvider` interface inside the Node backend.

## 2. Working agreements

- Work in the existing repo. No separate demo app. Prefer small, focused changes.
- Never run `git reset --hard`, `git clean`, `git checkout -- .`, `git restore .`, force push, or
  `git add .`. Do not commit or push unless explicitly told to.
- Do not delete or restore the legacy JavaScript backend files. Do not remove either
  `node_modules` (including the stray `backend/src/node_modules`). Do not touch `.env`.
- Deliver code as a PowerShell script with complete file contents, an explanation of the logic,
  verification commands, and git commit messages. Show code directly in chat (no zip bundles).
- Existing files are changed with exact-match anchors; new files are skipped if they exist.
- Stop at the end of each milestone with a report: Completed, Verification, Outstanding, Next.
- Never claim something works if it is only a mock. Never fake a PDF modification.
- No PDF implementation until the PDF-engine evaluation is approved.

## 3. Status

| Milestone | Scope | Status |
|---|---|---|
| 1 | Backend foundation: app factory, env, logging, errors, validation, health | Done, verified on the user's machine |
| 2 | Auth, PDF upload, immutable storage, documents, initial revision | Done, verified (75 tests at the time) |
| 3 | Editing sessions, operations, AI provider interface, accept/reject | Done, verified in sandbox; user-machine run pending (see 13) |
| 3 verification | 40 extra tests, one defect fixed | Done in sandbox |
| 4 | PDF engine evaluation and preview | Not started, waiting on two decisions (see 15) |
| 5 | Commit, revisions, stale-revision conflict, restore | Not started |
| 6 | Frontend workspace (three panels, PDF.js) | Not started |
| 7 | Integration, quality, docs | Not started |

Test suite: 14 files, 193 tests (192 pass, 1 intentional expected-fail recorded with `it.fails`).

## 4. Repository layout

```
Dokvanta/
|-- .gitignore            ignores node_modules, .env, dist, uploads, backend/storage, etc.
|-- README.md, LICENSE
|-- frontend/             Next.js app: workspace shell, mock services, /visual-edit placeholder
|-- docs/                 project documentation (this file lives here)
|-- print-tree.js         untracked helper script (not touched)
|-- write-m1-files.ps1    untracked, empty (not touched)
`-- backend/
    |-- index.js          LEGACY plain-JS server (quarantined, see LEGACY.md)
    |-- config/ middleware/ models/ routers/ services/   LEGACY folders (many files deleted in
    |                     the working tree but still tracked in git; do not restore/delete)
    |-- LEGACY.md         rules and known issues of the legacy backend
    |-- package.json, package-lock.json
    |-- tsconfig.json         type-check config (src + tests + vitest config)
    |-- tsconfig.build.json   build config (src only, output to dist/)
    |-- vitest.config.mts     test config (node env, timeouts, mongoose dedupe)
    |-- .env.example          documented variables (the real .env is never committed)
    |-- src/
    |   |-- app.ts
    |   |-- server.ts
    |   |-- config/
    |   |   |-- env.ts
    |   |   `-- database.ts
    |   |-- middleware/
    |   |   |-- request-id.ts
    |   |   |-- request-logger.ts
    |   |   |-- validate.ts
    |   |   `-- error-handler.ts
    |   |-- routes/
    |   |   |-- index.ts
    |   |   `-- health.routes.ts
    |   |-- utils/
    |   |   |-- app-error.ts
    |   |   `-- logger.ts
    |   |-- storage/
    |   |   |-- file-storage.ts
    |   |   `-- local-file-storage.ts
    |   |-- modules/
    |   |   |-- users/user.model.ts
    |   |   |-- auth/
    |   |   |   |-- auth.config.ts
    |   |   |   |-- token.ts
    |   |   |   |-- auth.middleware.ts
    |   |   |   |-- auth.schemas.ts
    |   |   |   |-- auth.service.ts
    |   |   |   `-- auth.routes.ts
    |   |   |-- documents/
    |   |   |   |-- document.model.ts
    |   |   |   |-- artifact.model.ts
    |   |   |   |-- revision.model.ts
    |   |   |   |-- pdf-validation.ts
    |   |   |   |-- upload.middleware.ts
    |   |   |   |-- document.service.ts
    |   |   |   `-- document.routes.ts
    |   |   |-- ai/
    |   |   |   |-- ai-provider.ts
    |   |   |   |-- mock-ai-provider.ts
    |   |   |   |-- gemini-ai-provider.ts
    |   |   |   `-- create-ai-provider.ts
    |   |   `-- editing/
    |   |       |-- operation.schemas.ts
    |   |       |-- operation-validation.ts
    |   |       |-- session-state.ts
    |   |       |-- with-timeout.ts
    |   |       |-- edit-session.model.ts
    |   |       |-- edit-operation.model.ts
    |   |       |-- editing.service.ts
    |   |       `-- editing.routes.ts
    |   `-- node_modules/     STRAY second install (kept on purpose; see section 13)
    |-- tests/
    |   |-- helpers/          test-context.ts db.ts pdf-fixtures.ts fake-ai.ts api.ts test-app.ts
    |   `-- 14 *.test.ts files (section 11)
    |-- storage/              runtime PDF files (git-ignored, created on first upload)
    `-- dist/                 build output (git-ignored)
```

## 5. What every backend file does

### Root of backend/

| File | Purpose |
|---|---|
| `package.json` | Scripts: `test` (vitest), `typecheck`, `build` (tsc with tsconfig.build.json), `dev:v2` (tsx watch src/server.ts), `start:v2` (node dist/server.js). `start` and `dev` still run the legacy `index.js`. |
| `tsconfig.json` | Strict TypeScript (NodeNext, `noUncheckedIndexedAccess`). Includes src, tests and the vitest config so tests are type-checked. |
| `tsconfig.build.json` | Extends the above but compiles only `src/` into `dist/`, so tests never ship. |
| `vitest.config.mts` | Node environment, `tests/**/*.test.ts`, long hook timeout for the first mongod download, `resolve.dedupe: ["mongoose"]` so tests and app share one mongoose copy. |
| `.env.example` | Documents every variable. The real `.env` is never read or edited by our scripts. |
| `LEGACY.md` | Quarantine rules for the old backend: run locally only, synthetic PDFs only, treat as insecure, do not delete without approval. |

### src/ entry and config

| File | Purpose |
|---|---|
| `app.ts` | `createApp(options)` builds the Express app without listening (so tests use it directly). Order: request id, request logger, helmet, CORS (credentials), JSON body (100 kb), `/api` health, `/api/v1` editing, `/api/v1/auth`, `/api/v1/documents`, 404 handler, error handler. Options carry CORS origin, auth config, file storage, upload limit, AI provider and AI timeout. |
| `server.ts` | Loads `.env`, validates config, connects MongoDB, creates the app with a local file storage and the chosen AI provider, listens, shuts down gracefully on SIGINT/SIGTERM. |
| `config/env.ts` | Zod-validated environment. Fails fast with one readable list of problems. Refuses a v2 database URI equal to the legacy one. Requires `GEMINI_API_KEY` when `AI_PROVIDER=gemini`. |
| `config/database.ts` | `connectDatabase(uri)` and `disconnectDatabase()`. Tests also connect through this module so they share the app's mongoose instance. |

### src/middleware, routes, utils

| File | Purpose |
|---|---|
| `middleware/request-id.ts` | Reuses a safe incoming `x-request-id` (letters, digits, `_`, `-`, up to 64) or generates a UUID; echoes it in the response header. |
| `middleware/request-logger.ts` | One structured log line per finished request: id, method, path (no query string), status, duration. Never logs headers or bodies. |
| `middleware/validate.ts` | Validates body, query and params with Zod. Parsed body replaces `req.body`; parsed query and params go to `res.locals` (Express 5 makes `req.query` read-only). All issues are returned together as a 400. |
| `middleware/error-handler.ts` | `notFoundHandler` plus `errorHandler`: maps `AppError`, bad JSON, oversized bodies; hides internals on unexpected errors (500). |
| `routes/index.ts`, `routes/health.routes.ts` | `GET /api/health` (liveness) and `GET /api/health/ready` (503 when the database is down). |
| `utils/app-error.ts` | The one error type thrown on purpose: status, code, message, optional details. Helpers: badRequest, unauthorized, forbidden, notFound, conflict. |
| `utils/logger.ts` | pino logger; silent in tests; redacts authorization and cookie headers. |

### src/storage

| File | Purpose |
|---|---|
| `file-storage.ts` | Interface `put/get/exists`. Keys are backend-generated. `put` must fail if the key exists (immutable artifacts). An S3-compatible version can replace the local one later. |
| `local-file-storage.ts` | Writes under a root folder with flag `wx` (never overwrite) and mode `0o444` (read-only). The key pattern allows only letters, digits, `_`, `-` and `/` plus `.pdf`, so `..` and traversal are impossible. |

### src/modules/users and auth

| File | Purpose |
|---|---|
| `users/user.model.ts` | `v2_users`: unique lowercase email, name, `passwordHash` (excluded from queries by default). |
| `auth/auth.config.ts` | Secret, token lifetime, cookie secure flag, bcrypt cost (4 in tests, 12 otherwise), derived from env. |
| `auth/token.ts` | Signs and verifies HS256 JWTs (any other algorithm, including `none`, is rejected), cookie read/set/clear helpers. Cookie name `dokvanta_token`, httpOnly, SameSite=Lax. |
| `auth/auth.middleware.ts` | `requireAuth` verifies the cookie, loads the user, sets `req.user`; `currentUser(req)` for handlers. |
| `auth/auth.schemas.ts` | Zod: email trimmed and lowercased; password 12 to 72 characters. |
| `auth/auth.service.ts` | `registerUser` (bcrypt, duplicate email gives 409) and `loginUser` (same 401 for wrong password and unknown email, with comparable work). |
| `auth/auth.routes.ts` | register, login, logout, me. |

### src/modules/documents

| File | Purpose |
|---|---|
| `document.model.ts` | `v2_documents`: owner, title, original filename, size, status (`uploading`, `processing`, `ready`, `failed`), pointers to the original artifact and current revision. |
| `artifact.model.ts` | `v2_artifacts`: one stored file (kind, storage key, MIME type, size, SHA-256). Write-once. The storage key is internal and never sent to clients. |
| `revision.model.ts` | `v2_revisions`: document, number, parent, artifact, source session, creator. Unique on (document, number). |
| `pdf-validation.ts` | Checks extension, declared MIME type and the real bytes (`%PDF-` header, `%%EOF` near the end). Also sanitizes filenames and derives titles. |
| `upload.middleware.ts` | Multer in memory with a streaming size limit (413) and the standard error envelope. |
| `document.service.ts` | Upload flow: validate, create document (`processing`), write file, create artifact and revision 1, mark `ready`. A failure marks the document `failed` and hides the cause. Owner-scoped get, list and original download. |
| `document.routes.ts` | Upload, list, metadata, download of the original. Everything requires login. |

### src/modules/ai

| File | Purpose |
|---|---|
| `ai-provider.ts` | `AiProvider` interface (`name`, `proposeEdits`), result type (proposal or clarification) and `AiOutputError`. The AI sees only page, selected text, surrounding text and the instruction. |
| `mock-ai-provider.ts` | Rule-based stand-in (NOT a language model). Understands: change/replace X to Y, highlight, insert after/before, note. Asks for clarification when the target is missing or appears more than once. |
| `gemini-ai-provider.ts` | Real provider behind the interface. Treats document text as untrusted data (sent as JSON), asks for JSON only, parses defensively. Not verified against the live API. |
| `create-ai-provider.ts` | Chooses mock or Gemini from env and logs a warning when the mock is used. |

### src/modules/editing

| File | Purpose |
|---|---|
| `operation.schemas.ts` | Zod schemas for the four operation types (`replace_text`, `insert_text`, `add_annotation`, `add_highlight`) and all request bodies and params. Unknown fields are stripped, so AI-supplied ids, owners, paths and revision ids can never reach the database. |
| `operation-validation.ts` | Semantic checks: page matches selection, target text is inside the selection, no ambiguity, real change, no control characters. Builds the stored operation fields; a failed check stores the operation as not applicable. |
| `session-state.ts` | The session state machine and which states allow decisions or cancellation. |
| `with-timeout.ts` | Runs the AI call with an abort signal and a timeout. |
| `edit-session.model.ts` | `v2_edit_sessions`: owner, document, base revision, status, the user's selection, instruction, provider name, failure code and message. |
| `edit-operation.model.ts` | `v2_edit_operations`: one proposal with target, texts, rectangles, explanation, confidence, validation errors, decision and application status. |
| `editing.service.ts` | Create session (calls the provider and validates its output), get, list, cancel, decide one operation, decide in bulk. Unsafe operations can never be accepted. |
| `editing.routes.ts` | The six editing routes. Authentication runs before id validation. |

### tests/

| File | What it proves |
|---|---|
| `helpers/test-context.ts` | Builds an app with a temporary storage folder and a mock (or scripted) AI. |
| `helpers/db.ts` | In-memory MongoDB, or a real `*_test` database via `TEST_MONGODB_URI` (refused unless the name ends in `_test`). |
| `helpers/pdf-fixtures.ts`, `fake-ai.ts`, `api.ts`, `test-app.ts` | Synthetic PDFs, scripted AI, signup/upload helpers, plain app factory. |

## 6. HTTP API

Success: `{ "data": ... }`. Errors: `{ "error": { "code", "message", "details"?, "requestId" } }`.

| Method and path | Purpose | Notes |
|---|---|---|
| GET `/api/health`, `/api/health/ready` | Liveness / readiness | Ready returns 503 without a database |
| POST `/api/v1/auth/register`, `/login`, `/logout`; GET `/me` | Account and session | Cookie based |
| POST `/api/v1/documents` | Upload (multipart field `file`) | 415 wrong type, 422 truncated, 413 too large |
| GET `/api/v1/documents`, `/:documentId` | List (paged) and metadata | Other users get 404 |
| GET `/api/v1/documents/:documentId/original` | Download the original | Attachment, `no-store` |
| POST `/api/v1/documents/:documentId/edit-sessions` | Start a session from a selection and instruction | 201 even if the AI could not help; read `status` and `failure` |
| GET `/api/v1/edit-sessions/:sessionId` | Session with decision counts | |
| POST `/api/v1/edit-sessions/:sessionId/cancel` | Cancel | 409 if not cancellable |
| GET `/api/v1/edit-sessions/:sessionId/operations` | List proposals | Ordered |
| PATCH `/api/v1/edit-sessions/:sessionId/operations/:operationId` | Accept or reject one | 422 if unsafe, 409 if session not in review |
| POST `/api/v1/edit-sessions/:sessionId/operations/bulk-decision` | Accept or reject many | Skips unsafe ones and lists them |

Not built yet: preview, commit, revision history and restore, revision download.

## 7. Data model (collections are prefixed `v2_` in the `dokvanta_v2` database)

- **v2_users**: email (unique), name, passwordHash, timestamps.
- **v2_documents**: ownerId, title, originalFilename, sizeBytes, status, failureReason, originalArtifactId, currentRevisionId, timestamps.
- **v2_artifacts**: ownerId, documentId, kind, storageKey, mimeType, sizeBytes, sha256, createdAt.
- **v2_revisions**: documentId, number, parentRevisionId, artifactId, sourceSessionId, createdBy, createdAt.
- **v2_edit_sessions**: ownerId, documentId, baseRevisionId, status, selection (page, text, surroundingText, rects), instruction, aiProvider, failureCode, failureMessage.
- **v2_edit_operations**: sessionId, documentId, ownerId, order, type, page, targetText, position, originalText, proposedText, color, rects, explanation, confidence, ambiguity, validationErrors, decision, applicationStatus.

Stored files live under `backend/storage/<ownerId>/<documentId>/<artifactId>.pdf` (git-ignored).

## 8. State machines

- **Document status**: uploading, processing, ready, failed.
- **Session**: `processing` -> `preview_ready` -> `reviewing` -> `committing` -> `completed`; `failed` and `cancelled` are terminal. `committing` may go back to `reviewing` on failure. Cancelling is allowed from `processing`, `preview_ready` and `reviewing`. Decisions are only allowed in `preview_ready` and `reviewing`. `preview_ready` currently means "proposals stored and ready for review"; real preview rendering arrives in Milestone 4.
- **Operation decision**: proposed -> accepted or rejected (changeable until commit). **Application status**: pending (only the future commit step may change it).
- **Clarification** (the AI asks a question) is stored as a `failed` session with code `NEEDS_CLARIFICATION`, because the requested state list has no dedicated state.
- Session failure codes: NEEDS_CLARIFICATION, AI_TIMEOUT, AI_INVALID_OUTPUT, AI_UNAVAILABLE, NO_CHANGES_PROPOSED, INTERNAL_ERROR.
- Operation validation codes: PAGE_MISMATCH, TARGET_NOT_IN_SELECTION, AMBIGUOUS_TARGET, NO_CHANGE, UNSAFE_CHARACTERS.

## 9. Security model

- AI output is untrusted input. It is parsed with strict Zod schemas that strip unknown fields; ids, owners, storage paths and revision ids are always set by the backend.
- Operations that fail semantic validation are stored but flagged and can never be accepted (single or bulk). A database-level test confirms no accepted operation carries a validation error.
- The base revision of a session is always the document's current revision at creation time.
- Ownership is part of every query. Another user's resources look like missing ones (404). Authentication is checked before id validation.
- Passwords use bcrypt. Sessions are HS256 JWTs in an httpOnly, SameSite=Lax cookie.
- Uploads: extension, MIME type and real bytes are all checked, with a streaming size limit. Originals are write-once and read-only. Storage keys and paths never leave the backend.
- Errors: unexpected failures return a generic 500; provider errors and API keys never reach responses.
- Not done yet: rate limiting, account lockout, password change, email verification.

## 10. Configuration (backend/.env, validated at startup)

| Variable | Default | Notes |
|---|---|---|
| `NODE_ENV` | development | development, test, production |
| `API_PORT` | 5001 | |
| `V2_MONGODB_URI` | required | Must differ from the legacy `MONGODB_URI` (use `dokvanta_v2`) |
| `CORS_ORIGIN` | http://localhost:3000 | |
| `LOG_LEVEL` | info | |
| `JWT_SECRET` | required | At least 32 characters. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `JWT_EXPIRES_IN_SECONDS` | 604800 | |
| `STORAGE_DIR` | storage | Relative to backend/ |
| `MAX_UPLOAD_MB` | 25 | |
| `AI_PROVIDER` | mock | `mock` or `gemini` |
| `GEMINI_API_KEY` | none | Required when `AI_PROVIDER=gemini` |
| `GEMINI_MODEL` | gemini-2.5-flash | Model name not verified against the live API |
| `AI_TIMEOUT_MS` | 30000 | 1000 to 120000 |

## 11. Testing

Run from `backend/`: `npm run typecheck`, `npm test`, `npm run build`.
Database tests start an in-memory MongoDB (the first run downloads a mongod binary; allow the
firewall prompt). To use a real local MongoDB instead, set `TEST_MONGODB_URI` to a database whose
name ends in `_test`; anything else is refused because tests delete all data in it.

| Test file | Tests | Covers |
|---|---|---|
| `health.test.ts` | 8 | Health, request ids, 404, bad JSON, config validation |
| `middleware.test.ts` | 10 | Validation middleware, error mapping, request ids |
| `token.test.ts` | 8 | JWT round trip, wrong secret, expiry, `alg=none`, cookies |
| `pdf-validation.test.ts` | 11 | Extension, MIME type, bytes, truncation, filenames |
| `local-file-storage.test.ts` | 11 | Immutability, traversal, missing files |
| `auth.test.ts` | 11 | Register, login, logout, me, hashes, duplicates (database) |
| `documents.test.ts` | 16 | Upload, rejection cases, ownership, download (database) |
| `editing-schemas.test.ts` | 15 | Operation and request schemas |
| `operation-validation.test.ts` | 10 | Semantic checks and field mapping |
| `session-state.test.ts` | 9 | Legal and illegal transitions |
| `mock-ai-provider.test.ts` | 9 | Rule-based provider and clarifications |
| `gemini-ai-provider.test.ts` | 14 | Prompt, parsing, config (fake model, no live call) |
| `edit-sessions.test.ts` | 21 | Session lifecycle, untrusted AI, decisions (database) |
| `editing-verification.test.ts` | 40 | Field stripping, base revision, auth and ownership on every route, unsafe operations, concurrency (database) |
| **Total** | **193** | 192 pass plus 1 intentional expected-fail |

The expected-fail (`it.fails`) records a known gap (section 14). It starts passing when the gap is closed,
which is the signal to remove the marker.

## 12. How to run

1. `cd backend`, copy `.env.example` to `.env` and fill in `V2_MONGODB_URI` and `JWT_SECRET`.
2. `npm run dev:v2` for development (or `npm run build` then `npm run start:v2`).
3. With the default mock AI, try an instruction like: change "January" to "March".
4. For Gemini set `AI_PROVIDER=gemini` and `GEMINI_API_KEY` (not yet verified against the live service).

## 13. History and lessons from the session

1. **Repository facts.** The GitHub copy only had the legacy JavaScript backend; the TypeScript backend existed only locally. Milestone 1 was found already mostly built.
2. **Milestone 1 additions.** A separate build config so tests no longer ship in `dist`, request logging, and the Vitest config renamed to `.mts`.
3. **Milestone 2.** Auth and uploads. The first database test run failed because mongod took longer than 10 seconds to start on Windows; the timeout was raised and a real-database option added.
4. **Duplicate mongoose.** Tests hung because `backend/src/node_modules` holds a second install of mongoose, so tests and models used different connections. Fixed by deduping mongoose in Vitest and connecting through `src/config/database.ts`. The stray folder was deliberately preserved.
5. **Milestone 3.** Editing sessions, the AI provider interface (mock default, Gemini behind it) and accept/reject workflow.
6. **Verification pass.** 40 more tests. One defect fixed: a bulk accept that decided nothing still moved the session to `reviewing`. One known gap documented (section 14).
7. **Test counts.** 153 versus 140 was explained by two differences between the sandbox copy and the real repo (10 middleware tests plus 3 health tests).
8. **Stray keystrokes.** Two single characters were found in files that no script touched: a `j` before `import` in `document.service.ts` and an `a` after a brace in `auth.middleware.ts`. Both look like Vim-style keystrokes typed into an editor. Vitest did not notice the second one; only the typecheck did. A repair-and-fingerprint script (45 files) was written for this.
9. **Method.** Every script was tested in a sandbox copy with a real mongod before delivery; results from the user's machine are what count.

## 14. Known limitations and open items

- **Concurrency gap (recorded by the `it.fails` test).** The session-state check and the decision write are separate database operations. If the session leaves review between them (for example the future commit moves it to `committing`), the decision still lands. No harm today; the Milestone 5 commit step must close it (MongoDB transaction on a replica set, or a started/finished counter that commit must see balanced).
- The Gemini provider has only been tested with a fake model. The default model name is unverified.
- The mock provider handles only a few fixed phrasings.
- Page numbers are not checked against the real page count until a PDF engine exists.
- No rate limiting on session creation, so AI cost is not capped.
- No preview, commit, revision history or restore yet, and the frontend is not connected.
- A failed multi-insert could leave a few stored operations on a session marked failed.
- The structural PDF check is shallow (signature and end marker only).
- Failed uploads leave `failed` document records with no cleanup job.
- The stray `backend/src/node_modules` is still present and is a trap for tools; removing it needs explicit approval.
- Tests are slower on this machine (about two minutes) because 14 workers each start a database.

## 15. Next: Milestone 4 (PDF engine and preview) - not started

Pending decisions from the owner:
1. Is the AGPL (MuPDF/PyMuPDF) or a paid commercial licence acceptable if it is the only faithful option?
2. Is a Python service acceptable in Milestone 4, or should the first version stay Node-only?
Recommendation: stay Node-only and permissively licensed, and refuse `replace_text` where fidelity cannot be proven.

Evaluation plan:
- Candidates: pdfjs-dist (extraction and rendering), pdf-lib (annotations, highlights, adding content; not a semantic text editor), MuPDF/PyMuPDF (strong but AGPL or paid), pikepdf, pypdf, pdfplumber/pdfminer.six (Python), and commercial SDKs (Apryse, Nutrient, Foxit). Licences must be re-checked from each project's licence file before deciding.
- Edit approaches to test: (1) rewrite text in the content stream (safe only for some fonts), (2) remove the original text and draw new text (changes structure; must be labelled honestly), (3) annotations and highlights (native and safe). No white box over old text presented as an edit.
- Test corpus (synthetic only): Helvetica text, embedded subset TrueType, Type 1, CID/Identity-H, ligatures, multi-column, rotated, image-only scan (expected refusal), encrypted, forms, large file.
- Criteria: text and coordinate extraction, layout preserved, other content bytes unchanged, safe failure on missing glyphs, deterministic output, performance, maintenance, runtime fit.
- Deliverable: a comparison table, one recommendation, and an adapter interface with explicit "unsupported" results.

After that: Milestone 5 (commit with a stale-revision conflict, immutable revision artifacts, history, restore as a new revision, closing the concurrency gap), Milestone 6 (three-panel workspace with PDF.js, selection, proposal review, commit, history), Milestone 7 (integration and documentation).