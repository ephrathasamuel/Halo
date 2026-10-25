# Server/Client Component Boundary

## Why Browser Storage Forces Client Components

Halo uses `localStorage` and `sessionStorage` for all persistence. These APIs are only available in the browser — they do not exist on the server. This means:

- **Any component that reads or writes stored data must be a Client Component** (`'use client'` directive).
- **Server Components cannot access user data, session state, or business entities.**

## Server Components (used for)

| Component | Reason |
|-----------|--------|
| `app/layout.js` (root) | Applies fonts, metadata, global CSS. Does not read storage. |
| `app/(public)/layout.js` | Static layout wrapper with Header/Footer. Header is a client component rendered within. |
| `app/(customer)/layout.js` | Static layout wrapper. |
| `app/not-found.js` | Static error page. |
| `app/sitemap.js` | Generates sitemap from hardcoded slugs (cannot read localStorage on server). |
| `app/robots.js` | Static robots config. |
| Placeholder pages (Phase 2+) | Static placeholders until built as client components. |

## Client Components (used for)

| Component | Reason |
|-----------|--------|
| `components/ui/AppInitializer.js` | Calls `initializeDemoData()` which reads/writes `localStorage`. |
| `components/ui/DemoDataBadge.js` | Renders in browser only. |
| `components/ui/Header.js` | Reads session via `useSession()` hook. |
| `components/ui/RequireRole.js` | Reads session, redirects based on auth state. |
| `app/(public)/studios/[slug]/layout.js` | Reads provider data from storage to apply brand colour. |
| `app/(public)/studios/[slug]/page.js` | Reads listings, portfolio, reviews from storage. |
| `app/(owner)/owner/layout.js` | Requires owner role, reads session. |
| `app/(admin)/admin/layout.js` | Requires admin role, reads session. |
| All hooks (`useSession`, `useStorageSync`, etc.) | Read browser storage APIs. |
| All domain functions (`lib/domain/*`) | Read/write browser storage. |

## Key Design Decision

Because there is no backend API, the entire data layer lives in the browser. In a production application, data fetching would happen on the server via API calls or database queries, allowing more Server Components. The current architecture is intentionally frontend-only as specified for this capstone project.

> **Note:** Frontend role checks and route guards are not production security. They are a demo simulation only. A real application would enforce authorization on the server.
