# AGENTS.md

## What this is

A **Payload 3 CMS** project (Next.js 16 app router underneath). Payload drives the admin, API, auth, and database via a single `payload.config.ts`. It is not a plain Next.js app — treat Payload as the source of truth for data models.

## Commands

Package manager is **pnpm** (use `pnpm`, never `npm`/`yarn`).

- `pnpm dev` — start dev server on `http://localhost:3000`
- `pnpm devsafe` — rm -rf `.next` then dev (use if dev server behaves oddly)
- `pnpm build` / `pnpm start` — production build/serve (build uses a large `--max-old-space-size=8000` flag)
- `pnpm lint` — ESLint (runs over whole repo)
- `pnpm generate:types` — regenerate `src/payload-types.ts` from collections (**must run after editing collections**)
- `pnpm generate:importmap` — regenerate the admin import map
- `pnpm test` — runs `test:int` then `test:e2e` (in order)
- `pnpm test:int` — Vitest (all files matching `tests/int/**/*.int.spec.ts`)
- `pnpm test:e2e` — Playwright (`tests/e2e`); auto-starts the dev server (`pnpm dev`, port 3000) and requires it to be running/available

No CI workflows are configured in this repo.

## Architecture

- `src/payload.config.ts` — central Payload config: declares the DB adapter (MongoDB), collections, admin user, editor, generated-types output. New collections must be registered here.
- `src/collections/` — data models (currently `Users.ts` auth-enabled, `Media.ts` upload-enabled). Define all data models here as `CollectionConfig`.
- `src/app/(payload)/` — Payload internal routes (admin panel, API, GraphQL). Do not edit unless you know what you're doing.
- `src/app/(frontend)/` — the public website/frontend (default `page.tsx` is the homepage, route group `(frontend)`).
- `src/app/my-route/` — example API route.
- Generated (do NOT hand-edit): `src/payload-types.ts`, `src/app/(payload)/admin/importMap.js` (ESLint ignores these). Regenerate via the `generate:*` scripts; edits get overwritten.

## Generated code gotcha

After adding/renaming/changing a collection's fields, run `pnpm generate:types` so `src/payload-types.ts` and the import map stay in sync. Hand-editing these files is pointless — they're overwritten. Payload's TS types drive most query code; stale types cause confusing errors.

## Paths & aliases

- `@/*` → `./src/*`
- `@payload-config` → `./src/payload.config.ts`

## Environment

- `.env` is gitignored. Create it from `.env.example`; it must contain:
  - `DATABASE_URL` — MongoDB connection string (e.g. `mongodb://127.0.0.1/nobatstyle`)
  - `PAYLOAD_SECRET` — any long random string
- Dev and int tests require a **running MongoDB**. Use `docker compose up -d` (the repo's `docker-compose.yml` starts a `mongo` service on `localhost:27017`) or a local instance. The REST/int API tests connect to it via `getPayload`.


## Conventions

- TypeScript strict; `@/*` imports preferred.
- ESLint downgrades common TS lint issues to warnings (no-unused-vars, no-explicit-any, etc.).
- Prettier config lives in `.prettierrc.json`; match existing formatting.
- **Modals on mobile open as bottom drawers.** Every new modal must render as a `Sheet side="bottom"` below `md` and a centered `Dialog` from `md` up. Use `ResponsiveModal` (`src/components/ui/responsive-modal.tsx`) instead of raw `Dialog`/`Sheet`.
