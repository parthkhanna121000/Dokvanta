# Dokvanta

**The Document Technology Platform.** Create. Understand. Edit. Transform.

Dokvanta is a browser-based, PDF-first document platform that brings reading, editing and creating documents into one workspace.

> **Current state: V1 is a frontend prototype.** There is no database, real authentication or AI model behind the app yet. Documents, sessions, uploads and (planned) AI responses are **simulated** by mock services, and the UI says so wherever it matters. A real backend is planned (see [Roadmap](#roadmap)).

---

## The problem

Working with documents today means juggling disconnected tools:

- **Reading** long PDFs is slow, and finding an answer means searching manually.
- **Editing** a PDF usually means a heavy desktop editor, or retyping the content elsewhere.
- **AI editing is risky.** Tools that rewrite a document in one step give you no way to review each change, and some overwrite the original.
- **Creating** a document from scratch happens in yet another tool, with no link back to the PDFs you already have.

## The solution

One workspace built around three pillars that are meant to feel like a single product, with one rule underneath them: **the original document is never overwritten**.

1. **AI Document Intelligence**: read a document, ask questions, and get answers with page-level source references.
2. **AI Visual Edit**: describe a change in plain language, review each proposed edit, and commit a new revision.
3. **Document Creator**: start from a prompt, a template or plain text; edit in a rich-text editor; preview and export a PDF.

```text
Original document -> Proposed operations -> Temporary document state
                  -> Individual review (accept / reject) -> Commit new revision
```

Accepting an operation and committing a revision are separate actions, so nothing becomes permanent without an explicit step.

---

## How much is built

Phases 1 to 4 are complete. Phase 5 (documents and upload) is in progress. Phases 6 to 10 have not started.

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundation: scaffold, design tokens, UI primitives, route-group layouts | Done |
| 2 | Marketing site: header, hero, pillars, demo, how it works, use cases, pricing, FAQ, footer | Done |
| 3 | Authentication (mock): login, signup, forgot password, session guard | Done |
| 4 | Workspace shell and dashboard | Done |
| 5A | Documents library: search, filter, sort, list/grid, rename, delete | Done |
| 5B | PDF upload | In progress: service contract, validation, mock upload, state machine and animation components written; upload dialog and page wiring not yet built |
| 5C | PDF viewer and `/documents/[documentId]` | Not started |
| 6 | AI Document Intelligence | Not started |
| 7 | AI Visual Edit | Not started |
| 8 | Document Creator, templates, rich-text editor | Not started |
| 9 | Settings, accessibility pass, responsive polish, end-to-end tests | Not started |
| 10 | Final review | Not started |

**Tests:** unit tests run with Vitest (`npm test`). 37 passed at the last confirmed run; later batches add more. Update this number after each phase.

---

## Features

### Available now

| Area | What works |
|---|---|
| **Marketing site** | Responsive header with mobile drawer, hero with product illustration, pillars, demo panels, how it works, use cases, pricing (illustrative), FAQ, footer |
| **Authentication (mock)** | Login, signup and forgot-password with schema validation, password strength meter, show/hide password, Remember me, and a guard that redirects signed-out users. Only non-sensitive session fields are stored in the browser; passwords are never stored or checked. **This is not real security.** |
| **Workspace shell** | Collapsible sidebar, top bar, breadcrumbs, notifications, profile menu with Sign out, mobile drawer, skip link |
| **Dashboard** | Welcome header, recent documents, activity feed, storage usage, quick-access cards, loading and error states |
| **Documents library** | Search by name, filter by type, six sort orders (natural name ordering), list and grid views, rename and delete with confirmation dialogs, status badges with text labels, loading, error, empty and no-results states |

### Built but not yet visible in the UI

| Area | What exists |
|---|---|
| **PDF upload logic** | Validation (PDF only, non-empty, 20 MB limit), a mock upload with progress, processing and cancellation, and a tested state machine where success is reported only after the service confirms it |
| **"Living Document" animation** | Idle, scanning, processing, success and error states in CSS and SVG, with `prefers-reduced-motion` support. Waiting on the upload dialog that will display it. |

### Planned

- **PDF viewer** with page navigation, zoom, search and download.
- **AI Document Intelligence:** chat with page-numbered citations that jump to the page, history, summarize, explain, rewrite, translate and key points.
- **AI Visual Edit:** typed operations (insert, delete, replace, rewrite paragraph, expand section, move section, modify heading), per-operation accept or reject, bulk decisions, revision history and restore.
- **Document Creator:** prompt-to-document, template gallery, text-to-PDF with page formatting and print export, and a Tiptap editor.
- **Settings**, an accessibility pass, and Playwright flows.

---

## Roadmap

Visual Edit and Intelligence need a real backend to be more than a demo (document ownership, revisions, background jobs, an AI provider). The current direction is to build it inside Next.js using route handlers rather than a separate service. Open decisions: data store, job processing, a real authentication provider, and which edit operations are supported in the first real release. This section will be updated as those are decided.

---

## Repository layout

```text
Dokvanta/
├── frontend/     Dokvanta V1 (Next.js app, active development)
├── LICENSE
└── README.md
```

An earlier Express prototype ("PDF Chat Companion") has been retired and is not used. It remains in Git history.

Work happens on the `feature/dokvanta` branch. `main` is not modified.

---

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16.4 (App Router, Turbopack), React 19.3 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (via `@tailwindcss/turbopack`), CSS variable design tokens |
| UI | Hand-written shadcn-style primitives on Radix UI, Lucide icons |
| Forms and validation | React Hook Form, Zod |
| Variants and utilities | class-variance-authority, clsx, tailwind-merge |
| Fonts | Newsreader (serif), Geist (sans), Geist Mono, via `next/font` |
| Testing | Vitest |

Planned: PDF.js or react-pdf, Tiptap, React Testing Library, Playwright.

### Next.js configuration notes

`frontend/next.config.ts` enables `cacheComponents` and `partialPrefetching` (they must be enabled together). With Cache Components:

- Rendering is dynamic by default; a static shell is prerendered and dynamic parts stream in behind `<Suspense>`.
- Navigating away keeps a route mounted but hidden (React `<Activity>`), so effects clean up and re-run. Object URLs, timers and listeners must be released in effect cleanups.
- Route files must not export `runtime`.
- Workspace pages export `instant = false`, because the mock session lives in browser storage and cannot be prerendered.
- Mock data uses fixed timestamps, so rendering never depends on the clock.

Tailwind is loaded by a Turbopack rule in `next.config.ts`. There is intentionally no `postcss.config.mjs`.

The bundled Next.js docs live in `frontend/node_modules/next/dist/docs/` and should be consulted before writing framework-specific code (see `frontend/AGENTS.md`).

---

## Getting started

Requirements: Node.js 20.9 or newer, npm.

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. Any email works on the login page, and `demo@dokvanta.app` is a ready-made demo account. No environment variables are required for V1. Do not commit `.env*` files.

### Checks

```powershell
cd frontend
npx tsc --noEmit
npm run lint
npm test
```

Do not run `npm audit fix --force`; it can break the dependency set.

---

## Frontend structure

```text
frontend/src/
├── app/                     Routes and layouts only
│   ├── (marketing)/         Public site
│   ├── (auth)/              login, signup, forgot-password
│   └── (workspace)/         dashboard, documents, and placeholders for later phases
├── components/
│   ├── ui/                  Button, Input, Label, Badge, Separator, Skeleton,
│   │                        Tooltip, DropdownMenu, Dialog, Sheet
│   ├── feedback/            EmptyState, ErrorState
│   └── layout/              Logo, headers, navigation, footer, workspace guard
├── features/
│   ├── marketing/  auth/  workspace/  dashboard/
│   └── documents/           components, hooks, lib (filter/sort, upload state), upload animation
├── services/
│   ├── interfaces/          Contracts (auth, documents, dashboard)
│   ├── mock/                In-memory implementations
│   └── index.ts             The only file that imports mocks
├── providers/               AuthProvider
├── types/                   Shared types
└── lib/                     constants, utils, validations
```

Rules:

- `app/` contains routes and layouts only. Shared UI goes in `components/`; feature code goes in `features/<feature>/`.
- UI imports typed services from `@/services`, never from the mocks, so replacing a mock with a real implementation should not require UI changes.
- Pure logic (filtering, sorting, validation, state machines) lives in plain TypeScript with unit tests.
- Server Components by default. `"use client"` only where state, effects or browser APIs are needed.
- No dead buttons or links to routes that do not exist.

---

## Design system

Editorial typography, Swiss-style structure, restrained minimalism. Light theme first; a dark token set is stubbed but not yet designed or used.

- **Color tokens:** warm paper background (`#faf8f4`), ink text (`#1b1a17`), one brand blue (`#2c4a7c`) for links, focus and highlights. Status colors are used for function only and always paired with a text label.
- **Type:** Newsreader for headings and document content, Geist for the interface.
- **Shape and elevation:** small radii, borders over shadows; shadows only for floating layers.
- **Motion:** minimal, never decorative, and always disabled under `prefers-reduced-motion`.
- **Accessibility:** visible focus rings, labelled landmarks, live regions for status changes, keyboard support, meaning never conveyed by color alone.

All tokens are defined in `frontend/src/app/globals.css`.

---

## Routes

| Route | Status |
|---|---|
| `/` | Built |
| `/login`, `/signup`, `/forgot-password` | Built (mock auth) |
| `/dashboard`, `/documents` | Built |
| `/intelligence`, `/visual-edit`, `/creator`, `/templates`, `/settings` | Placeholder ("Not built yet") |
| `/documents/[documentId]`, `/creator/ai`, `/creator/from-text`, `/creator/editor/[documentId]` | Planned |
| `/features`, `/pricing`, `/about` | Planned |

---

## Contributing and workflow

- Develop on `feature/dokvanta`; do not commit to `main`.
- Never commit `.env*`, `node_modules` or `.next`.
- Use conventional-style commit messages, for example `feat(frontend): add rename and delete for documents`.
- Update the Status table in this README when a phase is completed and verified.

## License

See [LICENSE](./LICENSE).
