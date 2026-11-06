# Dokvanta

**The Document Technology Platform.** Create. Understand. Edit. Transform.

Dokvanta is a browser-based, PDF-first document platform with three product pillars:

1. **AI Document Intelligence**: read a document, ask questions, and get answers with page-level source references.
2. **AI Visual Edit**: describe a change in plain language, review each proposed edit, and commit a new revision. The original document is never overwritten.
3. **Document Creator**: start from a prompt, a template or plain text; edit in a rich-text editor; preview and export a PDF.

> **V1 is a frontend prototype.** There is no backend, database, real authentication or AI model behind the app. All AI responses, documents, revisions and sessions are **simulated** with mock data and mock services. The UI says so wherever it matters.

---

## Status

V1 is built in phases. This table is updated as each phase is completed and verified.

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundation: scaffold, design tokens, UI primitives, route-group layouts | Done |
| 2A | Marketing: header, hero, product preview, pillars, footer | Code written; verification pending |
| 2B | Marketing: demo, how it works, use cases, pricing, FAQ | Not started |
| 3 | Authentication (mock) | Not started |
| 4 | Workspace shell and dashboard | Not started |
| 5 | Document management and PDF viewer | Not started |
| 6 | AI Document Intelligence | Not started |
| 7 | AI Visual Edit | Not started |
| 8 | Document Creator, templates, rich-text editor | Not started |
| 9 | Settings, accessibility, responsive polish, tests | Not started |
| 10 | Final review | Not started |

---

## Repository layout

```text
Dokvanta/
├── frontend/     Dokvanta V1 (Next.js app, active development)
├── backend/      Legacy PDF Chat Companion API (kept untouched, NOT used by V1)
├── LICENSE
└── README.md
```

Work happens on the `feature/dokvanta` branch. `main` is not modified.

---

## Tech stack (frontend)

| Area | Choice |
|---|---|
| Framework | Next.js 16.4 (App Router, Turbopack), React 19.3 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (wired through `@tailwindcss/turbopack`), CSS variable design tokens |
| UI | Hand-written shadcn-style primitives on Radix UI, Lucide icons |
| Variants and utilities | class-variance-authority, clsx, tailwind-merge |
| Fonts | Newsreader (serif), Geist (sans), Geist Mono, via `next/font` |

Planned for later phases: Zod, React Hook Form, PDF.js / react-pdf, Tiptap, Vitest, React Testing Library, Playwright.

### Next.js configuration notes

`frontend/next.config.ts` enables `cacheComponents` and `partialPrefetching` (they must be enabled together). With Cache Components:

- Rendering is dynamic by default; a static shell is prerendered and dynamic parts stream in behind `<Suspense>`.
- Navigating away keeps a route mounted but hidden (React `<Activity>`), so effects clean up and re-run. Object URLs, timers and listeners must be released in effect cleanups.
- Route files must not export `runtime`.

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

Open http://localhost:3000.

No environment variables are required for V1. Do not commit `.env*` files.

### Checks

```powershell
cd frontend
npx tsc --noEmit
npm run lint
```

Do not run `npm audit fix --force`; it can break the dependency set.

---

## Frontend structure

```text
frontend/src/
├── app/                     Routes and layouts only
│   ├── layout.tsx           Root layout: fonts, metadata
│   ├── globals.css          Design tokens
│   ├── not-found.tsx
│   ├── error.tsx
│   ├── (marketing)/         Public site (header + footer layout)
│   ├── (auth)/              Authentication screens (centered layout)
│   └── (workspace)/         Authenticated app (shell layout)
├── components/
│   ├── ui/                  Button, Input, Label, Badge, Separator, Skeleton,
│   │                        Tooltip, DropdownMenu, Dialog, Sheet
│   ├── feedback/            EmptyState, ErrorState
│   └── layout/              Logo, MarketingHeader, MobileNav, MarketingFooter
├── features/
│   └── marketing/           Landing-page content and sections
└── lib/
    ├── constants/           site.ts, navigation.ts
    └── utils/               cn.ts
```

Rules:

- `app/` contains routes and layouts only. Shared UI goes in `components/`; feature code goes in `features/<feature>/`.
- Feature folders are created when their phase begins.
- Server Components by default. `"use client"` only where state, effects or browser APIs are needed (currently the Tooltip, Dropdown Menu, Dialog, Sheet and `MobileNav`).

### Planned service layer

Components will depend on typed service interfaces, never on mock data directly.

```text
src/services/
├── interfaces/    Contracts (DocumentService, AuthService, ...)
├── mock/          Mock implementations and mock data
└── index.ts       The single place that wires implementations
```

Replacing the mock implementations with real ones should not require UI changes. Mock authentication will store only non-sensitive session fields (never a password) in browser storage and is **not real security**; real authentication and authorization must be implemented by a backend.

---

## Design system

Editorial typography, Swiss-style structure, restrained minimalism. Light theme first; a dark token set is stubbed but not yet designed or used.

- **Color tokens:** warm paper background (`#faf8f4`), ink text (`#1b1a17`), one brand blue (`#2c4a7c`) for links, focus and highlights. Status colors (success, warning, danger, info) are used for function only and always accompanied by a text label.
- **Type:** Newsreader for headings and long-form document content, Geist for the interface. Custom scale: `text-display`, `text-title`, `text-heading`, `text-subheading`.
- **Shape and elevation:** small radii (`--radius: 0.375rem`), borders over shadows; shadows only for floating layers (`shadow-popover`, `shadow-dialog`).
- **Accessibility:** visible focus rings, labelled landmarks, dialogs with required titles, meaning never conveyed by color alone.

All tokens are defined in `frontend/src/app/globals.css`.

---

## Routes

Currently implemented: `/` (marketing home), `/login` (placeholder), `/dashboard` (placeholder), plus the 404 and error pages.

Planned: `/features`, `/pricing`, `/about`, `/signup`, `/forgot-password`, `/documents`, `/documents/[documentId]`, `/intelligence`, `/visual-edit`, `/creator`, `/creator/ai`, `/creator/from-text`, `/creator/editor/[documentId]`, `/templates`, `/settings`.

---

## Principles for the Visual Edit feature (design contract)

The original document is never overwritten.

```text
Original document -> Proposed operations -> Temporary document state
                  -> Individual review (accept / reject) -> Commit new revision
```

Accepting an operation and committing a revision are separate actions. Each operation has an id, type (insert, delete, replace, rewrite paragraph, expand section, move section, modify heading), target page, target text, proposed content, status (pending, accepted, rejected) and a human-readable explanation.

---

## Legacy backend (not part of V1)

`backend/` holds the earlier **PDF Chat Companion** prototype: an Express 5 API with MongoDB (Mongoose), Google Gemini for chat and embeddings, and a from-scratch RAG pipeline (chunking, embeddings, cosine similarity search, SSE streaming). It is kept untouched for a future backend phase and is **not called by the V1 frontend**.

Its own configuration uses `backend/.env` (`MONGODB_URI`, `GEMINI_API_KEY`, `PORT`), which is git-ignored. Known limitations of that prototype: no authentication, no per-chunk page attribution, linear vector search, background processing not safe across multiple instances.

---

## Contributing and workflow

- Develop on `feature/dokvanta`; do not commit to `main`.
- Never commit `.env*`, `node_modules` or `.next`.
- Use conventional-style commit messages, for example `feat(frontend): add marketing header, hero, pillars and footer`.
- Update the Status table in this README when a phase is completed and verified.

## License

See [LICENSE](./LICENSE).