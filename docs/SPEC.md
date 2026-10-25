# Halo & B Light — Full Specification

## Master Prompt

You are a senior frontend engineer building Halo, a marketplace for studio rental, equipment rental and event or wedding filming in Addis Ababa, as a frontend-only capstone for the IBT-QIYAS Full-Stack Software Development Program. Halo hosts independent provider storefronts. B Light is the flagship provider at /studios/b-light and must be built as if it were its own small site (own branding, header, sections, portfolio, contact) that lives inside Halo and uses the same storefront template as every other provider.

## 1.1 Hard Rules

1. **No database and no backend.** Persistence is localStorage (durable demo data) and sessionStorage (session and checkout draft). Never store passwords, payment credentials or secrets.
2. **Safe storage.** All reads go through `readStorage(key, fallback)`, which never throws; malformed or missing JSON recovers to the fallback and shows a clear recovery or reset message. Writes go through `writeStorage(key, value)`, which handles quota and storage errors.
3. **Guarded writes.** Every write is a function in `lib/domain`. Each function checks in this order: session exists, role is correct, record ownership matches, current state allows the action, input is valid. Each returns `{ ok: true, data }` or `{ ok: false, error }` with clear messages such as *Not signed in*, *Not yours*, *Not allowed*, *Invalid transition*, *Time slot unavailable*. Hiding UI is never the only check.
4. **No business logic in page components.** Pages call hooks and domain functions only.
5. **Server/client boundary.** Server code cannot read browser storage. Server Components are used only for layouts, static content, metadata, sitemap and robots. Anything that reads stored data is a Client Component. Document this in BOUNDARY.md.
6. **Label simulations.** A visible *Demo data* badge on every page; mock TeleBirr checkout with a clearly fake transaction reference and a *Complete demo payment* button; seeded locations; any trip or crew status labelled *Simulation*.
7. **Truthful documentation.** Docs describe only code that exists. Never claim real security, database queries, real payments or real-time infrastructure. State that frontend checks are not production security.
8. **Accessibility baseline.** Semantic elements, labelled inputs, visible focus rings, controls at least 44×44 CSS pixels, everything keyboard-operable, no horizontal overflow on narrow screens.
9. **Small verified steps.** Run `npm run lint`, `npm test` and `npm run build` before each commit. Fix failures instead of skipping them. Commit once per phase with a clear message.
10. **Ambiguity.** Choose the simplest option consistent with the spec, record it in `docs/DECISIONS.md` with a one-line reason, and continue. Ask me only if you are blocked.
11. **Scope discipline.** Build no feature outside the spec. Stretch items (packages, equipment handover checklist, simulated crew status on event day) start only after Phase 5 passes verification.

## 1.2 Stack

Next.js (latest stable, App Router), React, JavaScript with JSDoc type comments (no TypeScript), Tailwind CSS, SWR, Recharts, Leaflet (loaded with a dynamic import, `ssr: false`), next/image, next/font, Vitest for domain tests, ESLint. Deploy to Vercel. npm scripts: `dev`, `build`, `start`, `lint`, `test`.

## 1.3 Conventions

- IDs from `lib/ids.js` (`crypto.randomUUID()` with a small fallback).
- Dates `YYYY-MM-DD`, times `HH:mm`, timestamps ISO strings. Fixed local zone `Africa/Addis_Ababa`; no timezone conversion.
- Currency is ETB. `lib/format.js` exports `formatETB`, `formatDate`, `formatTime`, `relativeTime`.
- Platform commission is a mock 10 percent of subtotal. Owner earnings equal subtotal minus commission. Equipment deposit is separate and refundable.
- Storage key prefix is `halo_` and every key ends in `_v1`.
- Components in PascalCase, hooks `useXxx`, domain files grouped by entity.

## 1.4 Folder Structure

```
projects/halo/
  app/
    (public)/            page.js  browse/  studios/[slug]/  listings/[id]/  signin/  signup/
    (customer)/          dashboard/  bookings/[id]/  events/[id]/  checkout/
    (owner)/owner/       provider/  portfolio/  listings/  bookings/  requests/  calendar/  earnings/  reviews/  disputes/
    (admin)/admin/       providers/  listings/  users/[id]/  bookings/  disputes/[id]/  reports/  announcements/
    sitemap.js  robots.js  layout.js  not-found.js
  components/            ui/  listings/  booking/  quotes/  owner/  admin/  maps/  charts/  states/
  lib/
    storage/             readStorage.js  writeStorage.js  keys.js  seed.js  initializeDemoData.js
    domain/              auth.js  bookings.js  events.js  quotes.js  listings.js  providers.js  reviews.js  disputes.js  users.js  announcements.js
    rules/               transitions.js  availability.js  pricing.js
    format.js  csv.js  safeReturnPath.js  ids.js
  hooks/                 useSession.js  useListings.js  useBookings.js  useStorageSync.js
  public/images/
  docs/                  SPEC.md  DECISIONS.md
  README.md STRATEGY.md BOUNDARY.md AUTH.md DATA.md PERF.md FUTURE.md .env.example .gitignore
```

## 2.1 Actors

| Actor | Access |
|-------|--------|
| **Visitor / Customer** | Public browsing without sign-in. After demo sign-in or sign-up the same person can book, request quotes, view dashboard, cancel own bookings, review, open disputes. |
| **Owner** | Requires an owner demo session. Manages own provider storefront, portfolio, listings, requests, quotes, calendar, earnings, reviews and disputes. An account may have both roles (`roles: ['renter','owner']`). |
| **Admin** | Only through the clearly labelled seeded demo admin. Public sign-up can never choose admin. Moderates providers and listings, manages users, resolves disputes, sees commission and reports, publishes announcements. |

Suspended users see an access-blocked message and cannot perform demo actions.

## 2.2 Data Model

Plain objects with stable IDs.

### User
| Field | Type |
|-------|------|
| id, name, email, phone, roles[], status, createdAt | — |
| Rules: Unique email; no password; status `active` or `suspended` | — |

### Provider
| Field | Type |
|-------|------|
| id, ownerId, slug, name, tagline, about, logo, cover, brandColor, city, neighbourhood, latitude, longitude, contact{phone, whatsapp, telegram}, hours, status, createdAt | — |
| Rules: status `pending`, `approved`, `suspended`; unique slug; only approved providers are public | — |

### Listing
| Field | Type |
|-------|------|
| id, providerId, ownerId, type, title, description, photos[], status, createdAt | — |
| type: `studio`, `equipment`, `service`; status: `draft`, `pending`, `approved`, `rejected`, `inactive`; only approved and active are public | — |

**Studio fields:** hourlyRate, minHours, capacity, amenities[], bufferMinutes, blockedDates[]

**Equipment fields:** category, hourlyRate, deposit, quantity, condition

**Service fields:** eventTypes[], startingFromHint, pricingModel: 'quote' (never has a fixed price)

### PortfolioItem
| Field | Type |
|-------|------|
| id, providerId, title, mediaUrl, eventType, createdAt | — |

### Booking
| Field | Type |
|-------|------|
| id, providerId, renterId, ownerId, date, startTime, endTime, hours, items[{listingId, type, qty, rateSnapshot, lineTotal}], subtotal, deposit, fee, total, paymentStatus, status, createdAt, updatedAt | — |

### EventRequest
| Field | Type |
|-------|------|
| id, providerId, listingId, renterId, ownerId, eventType, date, startTime, durationHours, location, coverage, budgetHint, notes, agreedAmount, status, createdAt, updatedAt | — |

### Quote
| Field | Type |
|-------|------|
| id, requestId, amount, inclusions[], validUntil, version, status | — |
| status: `sent`, `accepted`, `revised`, `expired`, `withdrawn` | — |

### Review
| Field | Type |
|-------|------|
| id, targetType, targetId, providerId, renterId, ownerId, rating, comment, ownerReply, createdAt | — |

### Dispute
| Field | Type |
|-------|------|
| id, targetType, targetId, openedBy, reason, description, status, resolutionNotes, resolvedBy, createdAt, resolvedAt | — |

### Announcement
| Field | Type |
|-------|------|
| id, title, message, active, createdAt, createdBy | — |

Notifications are derived from records and state changes, not stored.

## 2.3 Storage Keys

**localStorage:** `halo_users_v1`, `halo_providers_v1`, `halo_listings_v1`, `halo_portfolio_v1`, `halo_bookings_v1`, `halo_event_requests_v1`, `halo_quotes_v1`, `halo_reviews_v1`, `halo_disputes_v1`, `halo_announcements_v1`.

**sessionStorage:** `halo_session_v1` (signed-in user ID and metadata only), `halo_checkout_draft_v1` (selected slot, items, summary).

`initializeDemoData()` seeds only keys that are absent and never overwrites existing data. `resetDemoData()` is a clearly labelled development-only control.

## 2.4 State Machines

Implement as transition tables in `lib/rules/transitions.js` with one `assertTransition(machine, from, to)` helper. Invalid transitions return an error and change nothing.

### Hourly Booking
```
requested   -> confirmed (owner) | declined (owner) | cancelled (renter)
confirmed   -> in_progress (owner) | cancelled (eligible)
in_progress -> completed (owner) | disputed (renter or owner)
completed   -> reviewed (renter submits review) | disputed
disputed    -> resolved (admin)
Terminal: declined, cancelled, reviewed, resolved
```

### Event Request
```
submitted -> under_review (owner) -> quoted (owner sends quote)
quoted -> quoted (revision, version + 1) | accepted (renter) | declined (renter) | expired (validUntil passed) | cancelled (renter)
accepted -> confirmed (mock deposit paid) -> in_progress -> completed -> delivered (owner marks footage delivered) -> reviewed (renter)
submitted | under_review -> declined (owner)
confirmed | in_progress | completed | delivered -> disputed -> resolved (admin)
Terminal: declined, expired, cancelled, reviewed, resolved
```

## 2.5 Business Rules

- **Studio conflict:** a booking occupies `[start - buffer, end + buffer]`. Two overlapping ranges cannot both be `confirmed` or `in_progress`. Requested bookings do not block, but confirming re-checks conflicts.
- **Equipment stock:** for any overlapping window, the sum of quantities in active bookings must not exceed item quantity.
- **Event days:** a confirmed event blocks the same service listing for that date.
- **Minimum hours:** studio bookings respect `minHours` (default 2) and the provider's opening hours.
- **Pricing:** `subtotal = sum(rateSnapshot × hours × qty)`; `fee = 10% of subtotal`; deposit shown separately; the total is visible before confirmation.
- **Cancellation:** free until 24 hours before start; later cancellations are refused with a clear message.
- **Visibility:** unapproved, rejected or inactive listings, and listings of pending or suspended providers or owners, are never public.
- **Reviews:** one per completed target; owner reply allowed once.

## 2.6 Routes and Access

| Route | Purpose | Access |
|-------|---------|--------|
| `/` | Landing: hero search, featured listings, provider strip, how it works | Public |
| `/browse` | Catalogue: search, filters, sort, pagination, URL query params | Public |
| `/studios` | Provider directory | Public |
| `/studios/[slug]` | Provider storefront with own layout and brand colour | Public |
| `/studios/[slug]/portfolio` | Full portfolio gallery | Public |
| `/studios/[slug]/request-quote` | Event quote request form | Signed-in renter |
| `/listings/[id]` | Listing detail, map with text fallback, booking panel | Public |
| `/signin`, `/signup` | Demo sign-in and sign-up with safe return path | Public |
| `/dashboard` | Upcoming and past trips, alerts, summary | Renter |
| `/bookings`, `/bookings/[id]`, `/bookings/[id]/review` | History with filters and CSV, receipt and actions, review form | Renter, booking owner only |
| `/events`, `/events/[id]` | Quote requests, quote view, accept or revise | Renter, request owner only |
| `/checkout` | Mock payment review and confirmation | Signed-in renter |
| `/owner` | Overview and metrics | Owner |
| `/owner/provider`, `/owner/portfolio` | Edit storefront and portfolio | Owner of that provider |
| `/owner/listings`, `/owner/listings/new`, `/owner/listings/[id]/edit`, `/owner/listings/[id]/availability` | Own listings and availability | Owner of that listing |
| `/owner/bookings`, `/owner/requests`, `/owner/requests/[id]`, `/owner/calendar` | Booking requests, event requests and quote composer, calendar | Owner |
| `/owner/earnings`, `/owner/reviews`, `/owner/disputes` | Earnings chart and table with CSV, reviews and replies, disputes | Owner |
| `/admin`, `/admin/providers`, `/admin/listings`, `/admin/users`, `/admin/users/[id]`, `/admin/bookings`, `/admin/disputes`, `/admin/disputes/[id]`, `/admin/reports`, `/admin/announcements` | Admin tools | Admin |

`safeReturnPath(value)` accepts only internal paths that start with a single slash and rejects `//`, backslashes and any scheme or host, falling back to `/`.

## 2.7 Required Domain Functions

- **Auth:** `getCurrentSession()`, `signInAsDemo(userId)`, `signOut()` (clears session keys, navigates to landing), `hasRole(user, role)`, `requireRole(role)`, `safeReturnPath(value)`.
- **Bookings:** `createBooking(input)`, `transitionBooking(id, action)`, `cancelBooking(id)`, `checkAvailability(listingId, date, start, end, qty)`.
- **Events:** `submitEventRequest(input)`, `sendQuote(requestId, quote)`, `respondToQuote(quoteId, decision)`, `advanceEvent(id, action)`.
- **Listings and providers:** `saveListing(listing)`, `deactivateListing(id)`, `saveProvider(provider)`, `savePortfolioItem(item)`, `moderateListing(id, decision)`, `moderateProvider(id, decision)`.
- **Other:** `createReview()`, `replyToReview()`, `openDispute()`, `resolveDispute(id, notes)`, `suspendUser(id)`, `reinstateUser(id)`, `publishAnnouncement()`, `exportCsv(rows, columns)` (quotes commas, quotes and newlines; exports only rows the caller may see).

## 2.8 Seed Data

Six providers with different brand colours, all using one storefront template.

| Provider (slug) | Owner | Focus | Neighbourhood | Status | Listings |
|---|---|---|---|---|---|
| B Light (`b-light`) | Meron Tadesse | Studio, equipment, event filming | Bole | approved | Main Studio (ETB 600/hr, min 2, buffer 30); Cinema Camera Kit (qty 2); LED Light Kit (qty 3); Audio Kit (qty 2); Weddings and Events Filming (quote) |
| Merkato Frames (`merkato-frames`) | Dawit Alemu (also renter) | Natural-light photo studio | Arada | approved | Loft Studio (ETB 450/hr); Backdrop and Props Set (qty 1) |
| Kazanchis Sound House (`kazanchis-sound-house`) | Selam Bekele | Podcast and audio | Kazanchis | approved | Podcast Room (ETB 350/hr); Interview Mic Kit (qty 4) |
| Gear Garage (`gear-garage`) | Yonas Girma | Equipment only | Megenagna | approved | Lens Set (qty 2); Drone (qty 1); Tripod and Gimbal Pack (qty 3); one inactive set |
| Habesha Cine Crew (`habesha-cine-crew`) | Hana Worku | Filming services only | Sarbet | approved | Wedding Film Package (quote); Corporate Event Coverage (quote) |
| Pixel Nest (`pixel-nest`) | Samuel Kebede | New studio | Piassa | pending | Studio Room (pending); one rejected listing |

Also seed: one demo admin (labelled), two renters with history, one suspended user, at least 14 listings, bookings in every status (mostly on B Light), events in submitted, quoted, delivered and expired, B Light portfolio items (4–6), Habesha Cine Crew portfolio items (2), one active announcement. Use fictional names and local placeholder images with a broken-image fallback.
