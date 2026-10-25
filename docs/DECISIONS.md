# Decisions Log

Each entry records a design decision with a one-line rationale.

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Use Tailwind CSS v4 with `@tailwindcss/postcss` | Latest stable; simpler config with CSS-first approach |
| 2 | readStorage returns `{ data, recovered }` instead of raw value | Allows UI to show recovery messages when malformed JSON is detected |
| 3 | All seed user IDs are hardcoded UUIDs | Stable references across sessions and for seed bookings/events |
| 4 | Brand colour applied via CSS custom property `--brand-color` on provider layouts | Avoids Tailwind config changes per provider; works with any hex value |
| 5 | Vitest with node environment and storage mocks | Lightweight, fast execution without heavy external jsdom binaries |
| 6 | next/font with Inter as default, provider layouts can override | Clean default that works well at all sizes |
| 7 | No TypeScript — JSDoc type comments throughout | Per spec requirement |
| 8 | Manual project setup instead of create-next-app | Folder name "Halo" has capital letter; npm rejects it |
| 9 | Local git repository initialized directly in Halo folder | Isolates project history, branches, and commits from parent Desktop workspace |
| 10 | Server page with generateMetadata delegating to client component | Allows SEO metadata generation while preserving client storage reactivity |
| 11 | Leaflet dynamic import (ssr: false) with permanent text fallback | Avoids SSR window errors while guaranteeing accessibility if maps fail to load |
| 13 | Native ESLint 9 flat config with eslint-plugin-react | Eliminates legacy FlatCompat Windows resolution hangs and enables core jsx linting |
| 14 | SessionStorage checkout draft with automatic expiration warning | Preserves selected slots and add-on equipment without polluting durable storage |
| 15 | Studio buffer conflict interval [start - buffer, end + buffer] | Accurately prevents back-to-back studio rental clashes across cleanup windows |
| 16 | Equipment availability bounded by active overlapping rentals | Accurately enforces physical stock limits (quantity minus concurrent bookings) |
| 17 | Unified ListingForm component supporting studio, equipment, and service modes | Maximizes code reuse across creation and editing workflows while enforcing strict type validations |
| 18 | Strict ownership checks at domain level returning `{ ok: false, error: 'Not yours' }` | Guarantees non-owners and suspended users cannot edit storefronts, listings, or portfolio assets even if URL is manipulated |
| 19 | 14-day horizon strip with blackout indicators in owner calendar | Delivers instant visibility into upcoming rental activity, turnover cleanup buffers, and maintenance dates |

