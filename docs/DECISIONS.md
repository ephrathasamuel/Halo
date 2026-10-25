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

