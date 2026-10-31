# Halo: Creative Space & Equipment Marketplace

Halo is a marketplace for booking photo and film studios, renting production gear and hiring event filming crews from independent providers. It started as a frontend capstone for the **IBT-QIYAS Full-Stack Software Development Program** and now runs on a real backend: shared data in Supabase (PostgreSQL), password and Google sign-in, and every change checked on the server.

**Live site:** https://halo-seven-orcin.vercel.app · **Setup status:** https://halo-seven-orcin.vercel.app/api/halo/status

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill it in (see "Settings" below)
npm run dev                  # http://localhost:3000
npm test                     # 134 tests across 14 files
npm run lint
npm run build
```

Without Supabase settings Halo still runs: it keeps its data in `.halo-data/` files on your computer.

---

## Who uses Halo

| Account | How it is created | Signs in at | Area |
|---|---|---|---|
| **Customer** | Signs up at `/signup`, or with Google | `/signin` | `/dashboard`, bookings, quotes, purchases, profile |
| **Provider** (storefront owner) | Registers a studio at `/signup`, or an admin gives them an existing storefront | `/signin` | `/owner`: bookings, calendar, listings, portfolio, earnings, reviews, storefront settings |
| **Regional admin** | Created by the admin at `/admin/team` with a first password | `/staff/signin` | `/admin`, limited to their own country |
| **Admin** | From `HALO_ADMIN_EMAIL` / `HALO_ADMIN_PASSWORD` | `/staff/signin` | `/admin`: everything |

- **Admins and providers are separate accounts.** An admin owns no storefront.
- **`/staff/signin` is for admins only.** It is a page of its own, with no site header and no Google button. Customers and providers use `/signin`, and each lands in their own area.
- **Passwords set by an admin are temporary.** When an admin creates a regional admin, gives a storefront to a new owner, or resets someone's password, that person must choose their own password before doing anything else.
- **Continue with Google** (on `/signin`) signs into the Halo account with the same verified email, or creates a new customer account. Admin accounts are never created through Google. A Google-only account can set a password later in its profile.

---

## Starting data

A brand-new database starts with the storefront catalogue only: 7 studios, their listings and portfolio photos. There are no made-up customers, bookings, reviews, quotes, disputes or announcements, and the storefronts' contact details start empty.

The starting storefronts have **no owner**. People can browse them, but they can't book them until an admin gives each one to its real owner: **Admin → Storefronts → Add owner** (the owner's name, email and a first password; leave the password empty if they already have a Halo account).

---

## Features

### Customers
- Browse and search studios, equipment and filming services, with filters for type, country, region, city, price and capacity. Filters live in the URL, so a search can be shared.
- Book studios and equipment by the hour, with live availability (studio turnover buffers, equipment stock).
- Request event-filming quotes, accept a quote version, and follow the job to delivery.
- Buy items providers list for sale, leave reviews, and open disputes.

### Providers
- Storefront with its own brand colour, logo, cover, hours, map location and contact buttons.
- Listings of four kinds (studio, equipment, service, item for sale), with photos and custom details.
- Bookings inbox, 14-day calendar with buffers and blackouts, versioned quote composer, reviews and replies.
- Earnings chart (gross, 10% Halo fee, net) and CSV export.
- An account with several storefronts switches between them on the dashboard.

### Admins
- **Taking bookings** switch: pause new bookings, quote requests and purchases across Halo, with a message for customers. Bookings already made carry on.
- Storefront approval, giving storefronts to their owners, listing moderation, user suspension, password resets.
- Disputes, announcements (shown as a full-width bar under the header on the home page), reports and per-country overview.
- Regional admins for each country, each seeing only their own country.

### Site
- Privacy policy (`/privacy`) and terms of use (`/terms`), linked in the footer.
- `/api/halo/status` shows in plain words whether the database, Google sign-in, admin account and session secret are set up. It never shows keys or personal data.

### Not built yet
- **Real payments.** Checkout is still a simulated TeleBirr flow (`SIM-TB-…` references). Chapa is planned.

---

## How it works

1. **One source of truth on the server.** All records live in Supabase, in the table `halo_records` (see `supabase/setup.sql`), or in `.halo-data/` files when Supabase isn't set up. If the database can't be reached, the site keeps working on files and retries every minute.
2. **Every change runs on the server.** Browsers call `callDomain` in `app/actions/halo.js`, which runs Halo's domain functions (`lib/domain/*`) as the user in the signed `halo_session` cookie. Only allowlisted functions can be called.
3. **Guarded writes.** Each write checks, in order: session, role, ownership, state-machine transition, then input. Prices, deposits and owners always come from stored records, never from what the browser sent.
4. **Each role reads only what it may see** (`lib/server/visibility.js`). For example, other people's bookings reach a customer only as anonymous busy times, and visitors who aren't signed in never receive emails or phone numbers. Password hashes never leave the server.
5. **Sign-in.** Passwords are stored as scrypt hashes, and sign-in locks for 10 minutes after 5 wrong passwords. Changing a password signs out the account's other devices. Google sign-in goes through Supabase Auth (PKCE flow), and Supabase only confirms the email; the account and its roles stay in Halo.

---

## Settings

The Supabase project address and publishable key are public by design, so they live in `lib/supabaseProject.js`. Everything else goes in `.env.local` locally, and under **Vercel → Settings → Environment Variables** for the live site:

| Variable | What it is |
|---|---|
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys → secret key. Without it, data stays in `.halo-data/`. |
| `HALO_SESSION_SECRET` | Long random text that signs sign-in cookies: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `HALO_ADMIN_EMAIL`, `HALO_ADMIN_PASSWORD` | The global admin account. Write `$` as `\$`. |
| `NEXT_PUBLIC_SITE_URL` | The site's address (`http://localhost:3000` locally). |
| `NEXT_PUBLIC_HALO_CONTACT_EMAIL` | Optional public contact email shown on the privacy and terms pages. |

**Supabase setup, once:**
1. **SQL Editor → New query:** paste `supabase/setup.sql` and click **Run**.
2. **Google sign-in:** go to Authentication → Sign In / Providers → Google, switch it on, and paste the Client ID and secret. They come from a Google Cloud OAuth client (Web application) whose redirect URI is the callback URL shown on that Supabase page.
3. **URL Configuration:** set **Site URL** to the live address, and add `https://<your-site>/auth/callback` and `http://localhost:3000/auth/callback` under Redirect URLs.

---

## Tests

```bash
npm test   # Vitest: 134 tests, 14 files
```

- **Storage** (`storage.test.js`): safe reads, quota handling, recovery from corrupted data.
- **State machines** (`transitions.test.js`): booking and event-request lifecycles.
- **Availability** (`bookings.test.js`): studio buffer windows and equipment stock.
- **Public visibility** (`publicListings.test.js`): pending or suspended storefronts and draft listings never show publicly.
- **Owners and customers** (`ownerCustomer.test.js`, `providerTools.test.js`): storefront editing, portfolio, listings, bookings.
- **Quotes, reviews, disputes, admin** (`phase5.test.js`, `regional.test.js`): quote versions, review limits, disputes, suspensions, regional scope.
- **Server rules** (`serverRules.test.js`, `bookingsPause.test.js`): prices taken from stored listings, and the pause switch.
- **Negative matrix** (`negative.test.js`): unauthorised writes, cross-user changes, suspended users, expired quotes, stock conflicts.
- Plus `format`, `geo` and `safeReturnPath` helpers.

A Playwright end-to-end run (more than 40 checks) covers sign-up, booking, Google sign-in, roles, data visibility, giving a storefront to its owner, forced password change, the pause switch and the announcement bar. It runs against both file storage and a stand-in for Supabase.

---

## License & attribution

Created for the **IBT-QIYAS Full-Stack Software Development Program**.
All rights reserved © 2026 Halo Marketplace.
