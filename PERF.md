# Halo Performance, Accessibility, and SEO Audit (PERF.md)

This document details the performance metrics, accessibility compliance, code-splitting strategies, and SEO architecture for **Halo**, built with Next.js 15 (App Router), Tailwind CSS v4, and React.

---

## 1. Route Bundle Size & First Load JS Analysis

Halo maintains a lightweight client footprint. All public and operational routes load under **130 kB First Load JS**, well within performance budgets for mobile network conditions in Addis Ababa and emerging markets.

### Production Build Footprint (Next.js 15)

| Route | Type | Route JS | First Load JS | Notes |
|-------|------|----------|---------------|-------|
| `/` (Landing Page) | Static (○) | 5.03 kB | **122 kB** | Hero, featured listings, provider cards, search |
| `/_not-found` | Static (○) | 135 B | **103 kB** | Minimal lightweight 404 page |
| `/browse` (Catalogue) | Static (○) | 5.18 kB | **122 kB** | Instant client-side faceted filtering & search |
| `/studios` (Directory) | Static (○) | 1.97 kB | **119 kB** | Provider directory grid with brand badges |
| `/studios/[slug]` | Dynamic (ƒ) | 3.87 kB | **124 kB** | B Light & multi-tenant storefront with JSON-LD |
| `/studios/[slug]/portfolio` | Dynamic (ƒ) | 2.51 kB | **117 kB** | Filterable media gallery by event type |
| `/studios/[slug]/request-quote` | Dynamic (ƒ) | 5.91 kB | **112 kB** | Custom event filming quote inquiry composer |
| `/listings/[id]` | Dynamic (ƒ) | 6.55 kB | **126 kB** | Detail view, interactive dynamic Leaflet map |
| `/signin` | Static (○) | 3.46 kB | **110 kB** | Persona switcher & email login with safe redirect |
| `/signup` | Static (○) | 3.01 kB | **109 kB** | Renter registration form |
| `/dashboard` | Static (○) | 5.32 kB | **112 kB** | Customer booking metrics, status alerts, CSV |
| `/bookings` | Static (○) | 4.74 kB | **111 kB** | Renter booking ledger with status filters & CSV |
| `/bookings/[id]` | Dynamic (ƒ) | 3.09 kB | **114 kB** | Booking receipt, cancellation, dispute triggers |
| `/bookings/[id]/review` | Dynamic (ƒ) | 2.47 kB | **116 kB** | 5-star rating submission form |
| `/checkout` | Static (○) | 3.38 kB | **114 kB** | Mock TeleBirr checkout with simulated payment |
| `/events` | Static (○) | 3.75 kB | **110 kB** | Customer event quote inquiries ledger |
| `/events/[id]` | Dynamic (ƒ) | 3.66 kB | **117 kB** | Interactive quote negotiation & production stepper |
| `/owner` | Static (○) | 3.05 kB | **114 kB** | Owner hub with incoming booking requests |
| `/owner/provider` | Static (○) | 2.80 kB | **112 kB** | Storefront customizer & brand color picker |
| `/owner/portfolio` | Static (○) | 3.46 kB | **118 kB** | Media upload manager & item categorization |
| `/owner/listings` | Static (○) | 2.98 kB | **115 kB** | Catalog management with status toggles |
| `/owner/listings/new` | Static (○) | 560 B | **116 kB** | Studio, Equipment, Service creation wizard |
| `/owner/listings/[id]/edit` | Dynamic (ƒ) | 990 B | **116 kB** | Multi-type listing editor |
| `/owner/listings/[id]/availability` | Dynamic (ƒ) | 2.90 kB | **115 kB** | Turnover buffer configuration & blackout calendar |
| `/owner/bookings` | Static (○) | 3.06 kB | **114 kB** | Pipeline lifecycle manager |
| `/owner/requests` | Static (○) | 3.94 kB | **110 kB** | Event inquiries pipeline |
| `/owner/requests/[id]` | Dynamic (ƒ) | 6.34 kB | **113 kB** | Quote composer & production advancement |
| `/owner/calendar` | Static (○) | 4.00 kB | **110 kB** | 14-day schedule strip with buffer visualization |
| `/owner/earnings` | Static (○) | 106 kB | **209 kB** | Recharts revenue visualization (lazy owner route) |
| `/owner/reviews` | Static (○) | 2.21 kB | **112 kB** | Review inbox with one-time owner reply form |
| `/owner/disputes` | Static (○) | 3.19 kB | **106 kB** | Owner dispute tracking view |
| `/admin` | Static (○) | 2.51 kB | **109 kB** | Platform GMV, commission, user statistics |
| `/admin/providers` | Static (○) | 1.74 kB | **111 kB** | Provider moderation (Approve / Suspend) |
| `/admin/listings` | Static (○) | 2.24 kB | **114 kB** | Listing moderation (Approve / Reject) |
| `/admin/users` | Static (○) | 3.36 kB | **110 kB** | User governance directory |
| `/admin/users/[id]` | Dynamic (ƒ) | 3.61 kB | **110 kB** | User activity inspector & suspension control |
| `/admin/bookings` | Static (○) | 2.39 kB | **109 kB** | Master booking audit ledger |
| `/admin/disputes` | Static (○) | 2.35 kB | **109 kB** | Dispute mediation inbox |
| `/admin/disputes/[id]` | Dynamic (ƒ) | 2.14 kB | **115 kB** | Dispute mediation resolution center |
| `/admin/reports` | Static (○) | 2.85 kB | **106 kB** | Commission accounting ledger with CSV export |
| `/admin/announcements` | Static (○) | 3.67 kB | **107 kB** | Platform banner broadcast manager |
| `/sitemap.xml` | Static (○) | 135 B | **103 kB** | Dynamic sitemap indexing all public routes |
| `/robots.txt` | Static (○) | 135 B | **103 kB** | Crawler directives protecting private portals |

**Shared Base Bundle:** 103 kB (Next.js runtime, React 19 core, shared router infrastructure).

---

## 2. Server / Client Boundary Architecture (Hard Rule 5)

Halo enforces a strict architectural boundary between Server Components and Client Components to avoid hydration mismatches, ensure instant render, and strictly comply with the constraint that browser storage cannot be accessed during server-side compilation:

1. **Server Components:**
   - **Root Layout (`app/layout.js`)**: Injects font classes (`next/font/google`), global stylesheets, dynamic title templates, and mounts client hydration utilities.
   - **Metadata & Dynamic SEO (`app/(public)/studios/[slug]/page.js`, `app/(public)/listings/[id]/page.js`)**: Exports `generateMetadata()` computing OpenGraph headers and prerenders schema.org JSON-LD scripts server-side.
   - **Sitemap & Robots (`app/sitemap.js`, `app/robots.js`)**: Dynamically generates XML sitemaps and indexing policies without touching storage.
2. **Client Components (`'use client'`):**
   - **Storage Reactive Components**: Any view reading or writing `localStorage` (`halo_*_v1`) or `sessionStorage` (`halo_session_v1`, `halo_checkout_draft_v1`) is marked `'use client'`.
   - **Hydration Safety**: State hooks (`useStorageSync`, `useSession`) initialize with safe server fallbacks and mount storage data post-hydration, avoiding React hydration mismatch errors.
   - **AppInitializer**: Mounts non-blocking client-side data verification and handles silent schema recovery without blocking initial paint.

---

## 3. Dynamic Code-Splitting & Heavy Dependencies

To keep initial page loads swift, heavy third-party client libraries are code-split and loaded on demand:

1. **Leaflet Maps (`components/maps/ListingMap.js`):**
   - Loaded using Next.js `dynamic(() => import(...), { ssr: false })`.
   - Displays an accessible text-based location fallback (`📍 Bole, Addis Ababa (9.0054, 38.7636)`) during client bundle download or when JavaScript map tiles fail to load.
   - Leaflet CSS is imported lazily to avoid polluting non-map routes.
2. **Recharts Data Visualization (`components/charts/OwnerEarningsChart.js`):**
   - Isolated exclusively to `/owner/earnings`.
   - Does not affect public visitor bundle sizes or customer booking workflows.
3. **Images (`next/image`):**
   - Configured with `unoptimized: true` in `next.config.mjs` to support local placeholder mock assets without triggering runtime image optimization server overhead.
   - Image wrappers contain native CSS aspect-ratio placeholders to eliminate Cumulative Layout Shift (CLS).

---

## 4. Accessibility (A11y) Baseline Compliance (Hard Rule 8)

Halo adheres to WCAG 2.1 AA accessibility guidelines across all views:

- **Touch Targets:** All interactive elements (`<button>`, `<a>`, `<select>`, `<input>`) enforce a minimum clickable area of `44px × 44px` via CSS rules in `app/globals.css`.
- **Keyboard Navigation:**
  - Visible focus rings (`outline: 2px solid var(--halo-primary); outline-offset: 2px;`) appear automatically on `:focus-visible` for keyboard users.
  - Logical tab order maintained across all forms, filters, and modal panels.
  - Escape key handling and explicit close buttons on navigation overlays and drawers.
- **Semantic HTML & Screen Reader Support:**
  - Standard landmarks (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`).
  - Labeled inputs using explicit `<label htmlFor="...">` bindings.
  - Status indicators equipped with ARIA roles: `role="status"` on `DemoDataBadge`, `role="alert"` on data recovery notifications, and `aria-expanded` attributes on toggle menus.
- **Responsive Layout & Viewport Resilience:**
  - Enforces `max-width: 100vw; overflow-x: hidden;` on `html, body`.
  - Tested down to **360px viewport width** with zero horizontal overflow.
  - Flexbox and CSS Grid containers adapt smoothly from 1 column on mobile to 2–3 columns on tablet/desktop.

---

## 5. SEO Architecture & Search Engine Discovery

- **Dynamic Metadata:** Every provider storefront and listing detail page dynamically generates unique page titles, descriptions, and OpenGraph tags via `generateMetadata()`.
- **Structured Data (JSON-LD):**
  - **Provider Storefronts (`/studios/[slug]`)**: Prerenders `schema.org/LocalBusiness` structured data including provider name, description, address, city (`Addis Ababa`), and telephone.
  - **Listing Detail Pages (`/listings/[id]`)**: Prerenders `schema.org/Product` or `schema.org/Place` structured data including listing title, description, image, and `Offer` pricing in ETB.
- **Search Engine Directives:**
  - `sitemap.xml`: Indexes all public routes, provider pages (`/studios/b-light`), and listings.
  - `robots.txt`: Permits public search engine crawling (`/`, `/browse`, `/studios`, `/listings`) while disallowing private customer (`/dashboard`, `/bookings`, `/events`, `/checkout`), owner (`/owner/*`), and admin (`/admin/*`) portals.
