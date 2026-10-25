# Halo: Creative Space & Equipment Marketplace | Addis Ababa

Halo is a multi-tenant creative marketplace for studio rental, equipment hire, and event/wedding filming in Addis Ababa, Ethiopia. Built as a frontend-only capstone for the **IBT-QIYAS Full-Stack Software Development Program**.

Halo hosts independent provider storefronts with custom brand identities. **B Light** is the flagship provider at `/studios/b-light`, featuring an editorial studio space, cinema camera packages, and high-end wedding cinematography services.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev
# Open http://localhost:3000 in your browser

# 3. Run the automated test suite (104 tests across 9 files)
npm test

# 4. Run the code linter (ESLint 9)
npm run lint

# 5. Build for production deployment
npm run build
```

---

## Pre-Seeded Demo Personas

Halo runs without an external database or backend server. All demo data is seeded automatically into `localStorage` on first load. You can switch between personas with 1-click on the `/signin` page or by using their demo emails:

| Persona | Role | Seed Email | Access & Permissions |
|---------|------|------------|-----------------------|
| **Platform Administrator** | `admin` | `admin@halo.demo` | Provider & listing moderation, user governance, dispute resolution, platform commission auditing, and announcements broadcasting. |
| **Meron Tadesse** (Flagship) | `owner` | `meron@blight.demo` | Owner of **B Light** (`/studios/b-light`). Manages studio/equipment listings, turnover buffers, event filming quote composer, calendar, reviews, and earnings. |
| **Dawit Alemu** | `owner`, `renter` | `dawit@merkato.demo` | Dual-role owner of **Merkato Frames** in Arada and active customer renter. |
| **Abebe Kebede** | `renter` | `abebe@renter.demo` | Creative customer. Has booking history, pending requests, and reviews. |
| **Sara Hailu** | `renter` | `sara@renter.demo` | Creative customer with active bookings, quote negotiations, and an open equipment dispute. |
| **Tekle Woldemariam** | `renter` (*suspended*) | `tekle@suspended.demo` | Suspended demo account illustrating access-block security guardrails. |

---

## Core Product Features

### 1. Flagship Provider: B Light (`/studios/b-light`)
- **Independent Identity inside Halo**: Custom gold accent branding (`#D4AF37`), hero banner, opening hours, contact badges (Direct Phone, WhatsApp, Telegram), and neighbourhood coordinates.
- **Three Core Offerings**:
  1. *Main Studio*: 120m² space with cyclorama wall, lighting rigs, makeup room, and 30-minute turnover cleanup buffers.
  2. *Cinema Kits & Audio*: Cinema camera packages, 3-point bi-color LED kits, and shotgun/boom audio kits.
  3. *Weddings & Events Filming*: Full multi-camera event cinematography service with custom quote request workflow.
- **Curated Portfolio Gallery**: Categorized showcase of weddings, fashion editorials, corporate summits, and music video productions.

### 2. Public Catalogue & Filtering (`/browse`)
- Instant faceted search across 6 Addis Ababa neighbourhoods (Bole, Kazanchis, Arada, Megenagna, Sarbet, Piassa).
- Filter by offering type (Studios, Equipment, Filming Services), price range (ETB), capacity, and sorting (Price low/high, newest).
- URL-synchronized query parameters (`?type=...&city=...`) allowing shareable links.

### 3. Studio Availability & Conflict Engine (`lib/rules/availability.js`)
- Studio bookings occupy an expanded window `[start - bufferMinutes, end + bufferMinutes]`. Two confirmed or in-progress bookings cannot overlap.
- Equipment availability dynamically computes physical inventory minus concurrent active bookings.
- Minimum rental duration enforcement (e.g., minimum 2 hours for professional studio spaces).

### 4. Mock TeleBirr Checkout (`/checkout`)
- Simulated Ethiopian mobile payment interface branded with TeleBirr styling.
- Clearly displays mock transaction references (`SIM-TB-XXXXXX`), platform fee calculations (10%), refundable security deposits, and a *Complete Demo Payment* action.

### 5. Event Filming & Versioned Quotes (`/events/[id]` & `/owner/requests/[id]`)
- Multi-step production pipeline: `submitted` → `quoted` (v1, v2...) → `accepted` → `confirmed` → `in_progress` → `completed` → `delivered` → `reviewed`.
- Versioned quote composer allowing provider owners to revise line items, validity windows, and pricing while archiving previous revisions.

### 6. Owner Hub & Recharts Financials (`/owner/*`)
- Visual 14-day schedule carousel with turnover cleanup buffer blocks and maintenance blackouts.
- Storefront settings customizer with live brand color hex picker (`--brand-color`).
- Revenue analytics chart built with Recharts displaying Gross Volume, 10% Platform Fee, and Net Owner Earnings.
- 1-click CSV data export for booking registers and accounting reports.

### 7. Admin Governance Portal (`/admin/*`)
- One-click provider moderation (`pending` → `approved` / `suspended`).
- Listing moderation (`pending` → `approved` / `rejected`).
- User account suspensions and reinstatements.
- Dispute arbitration center linking target records and recording formal resolution notes.
- Broadcast system for platform-wide announcements.

---

## Architectural Hard Rules & Disclaimers

1. **No Database & No Backend**: State is persisted purely in client `localStorage` (`halo_*_v1`) and `sessionStorage` (`halo_session_v1`, `halo_checkout_draft_v1`).
2. **Safe Storage**: Reads go through `readStorage(key, fallback)` which never throws and auto-recovers from corrupted JSON.
3. **Guarded Writes**: Every domain write verifies in strict sequence: Session → Role → Ownership → State Machine Transition (`assertTransition`) → Input Validation.
4. **Server/Client Boundary**: Prerendered layouts, metadata, and sitemaps execute as Server Components; all storage-reactive views are Client Components (see `BOUNDARY.md`).
5. **Truthful Documentation**: **This is a frontend demo prototype.** Frontend role checks, simulated TeleBirr payments, and client-side guards do not represent production-grade security. A real deployment requires an authenticated backend server, PostgreSQL database, and actual TeleBirr merchant gateway credentials.

---

## Verification & Test Suite

The project includes an extensive automated test suite run via **Vitest**:

```bash
npm test
```

- **Storage Layer (`storage.test.js`)**: Tests quota handling, safe fallbacks, and automatic recovery from malformed JSON.
- **Domain State Machines (`transitions.test.js`)**: Validates hourly booking and event request lifecycles.
- **Availability Engine (`bookings.test.js`)**: Tests studio buffer windows and equipment stock limits.
- **Public Visibility (`publicListings.test.js`)**: Confirms pending/suspended providers and draft/rejected listings are never public.
- **Owner & Customer Lifecycles (`ownerCustomer.test.js`)**: Tests storefront customization, portfolio management, and booking transitions.
- **Quotes, Reviews, Disputes & Admin (`phase5.test.js`)**: Tests quote revision counters, 1-review/1-reply limits, dispute mediation, and user suspension.
- **Automated Negative Test Matrix (`negative.test.js`)**: 10 strict negative invariant tests covering unauthorized writes, cross-user cancellations, suspended users, expired quotes, and stock conflicts.

**Current Test Status:** `104 passed` across `9 test files` (0 failures).

---

## 📄 License & Academic Attribution

Created for the **IBT-QIYAS Full-Stack Software Development Program** (Module 3 Frontend Capstone).
All rights reserved © 2026 Halo Marketplace.
