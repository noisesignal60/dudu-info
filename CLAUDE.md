# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start Next.js dev server
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — ESLint (flat config via `eslint-config-next`)
- `npx tsx scripts/seed-admin.ts <username> <password> [<displayName>]` — create or reset a back-office admin (requires `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY`)
- Database schema lives in `supabase/migrations/` (CLI-compatible format) but is applied **manually via Supabase SQL Editor** — no CLI installed. Workflow: `npm run db:bundle` concatenates all migrations into `supabase/_combined.sql`, user copy-pastes that into Dashboard → SQL Editor → Run. Each migration is idempotent. `supabase/schema.sql` is **reference-only**; never run it. Full from-zero bootstrap in `docs/database-setup.md`.
- No test runner is configured.

## Required env (see `.env.example`)

`AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`, `AUTH_LINE_ID`, `AUTH_LINE_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_BUCKET_PASSBOOK` (default `passbooks`), `ADMIN_SESSION_SECRET` (≥32 chars — iron-session won't start otherwise). The Supabase code also accepts the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` names as fallbacks for old `.env.local` files.

## Architecture

This is **Next.js 16 App Router** with `cacheComponents: true` (see `next.config.ts`) — the new explicit-cache model. Treat every async DAL function that's safe to cache as needing `"use cache"` + a `cacheTag`, and pair every mutating server action with `updateTag(tag)` for each tag it touches. Anything dynamic must be wrapped in `<Suspense>` (the dashboard and admin pages do this for every section).

**Use `updateTag`, not `revalidateTag`, for read-your-writes.** `revalidateTag(tag, "max")` is stale-while-revalidate — it marks the cache stale but the in-flight refresh after the action still serves the OLD value, so the user doesn't see their change until a later request/navigation (this caused a "new department doesn't appear in the menu" bug). `updateTag(tag)` immediately expires the cache and the same request re-reads fresh data, so the change shows instantly. `updateTag` takes a single tag string (no `"max"`), can only be called inside a Server Action, and is the default for every mutation here. Reserve `revalidateTag(tag, "max")` for the rare case where eventual consistency is acceptable and the user need not see the change in the current request (and note why at the call site); use it (not `updateTag`) in Route Handlers, where `updateTag` is unavailable.

The project name is 嘟嘟資訊網 — a Taiwan-Chinese commission / profit-sharing dashboard for taxi drivers, with a LINE-login member side and a username/password admin back office. UI copy and validation messages are in Traditional Chinese; preserve that when editing user-facing strings.

### Two parallel auth systems

There are **two independent session mechanisms** running side by side — do not conflate them.

1. **Member side** (`/dashboard`, `/onboarding`): Auth.js v5 (`src/auth.ts`) with the LINE provider, JWT strategy. The `signIn` callback upserts `public.members` keyed on `line_user_id`, the `jwt` callback enriches the token with `memberId` + `profileCompleted`, and `session` exposes them to server code. DAL functions read `session.user.memberId` to scope queries.
2. **Admin side** (`/admin/**`, `/reports/**`): `iron-session` cookie (`dudu-admin-session`) with argon2id-hashed passwords stored in `public.admins`. Helpers are in `src/lib/admin-session.ts`; the login/logout server actions are in `src/actions/admin-auth.ts`.

`src/proxy.ts` is the Next.js 16 **Proxy** (the file formerly known as `middleware.ts` — naming changed in v16, keep it as `proxy.ts`). It performs only **optimistic** route guarding: it can read the Auth.js JWT but **cannot decrypt iron-session at the edge**, so for admin routes it merely checks cookie presence. Real admin authorization happens in `src/app/admin/(panel)/layout.tsx` via `getCurrentAdmin()`, and every admin server action calls `requireAdmin()` first. When adding new admin-protected routes, both the proxy matcher *and* a server-side `getCurrentAdmin()` check are required.

### Data access pattern

- **All Supabase calls go through `supabaseAdmin()` (`src/lib/supabase/admin.ts`) using the service-role key.** RLS is enabled on every table as defense-in-depth, but service_role bypasses it — authorization is the application's job. The anon key exists in env but is unused; do not introduce client-side Supabase queries.
- `src/data/**` is the read DAL — server-only modules (`import "server-only"`) with `"use cache"` + `cacheTag(...)`. Tags follow the pattern `member-<id>`, `stats-<id>`, `wd-<id>`, `admin-members`, `admin-member-<id>`, `admin-stats`. When you change a mutation, list every tag it invalidates.
- `src/actions/**` is the write layer — `"use server"` modules that validate with Zod, mutate via `supabaseAdmin()`, call `updateTag` for every tag they touch (see the caching note above — `updateTag` not `revalidateTag`, so changes show instantly), then optionally `redirect()`. The state shape is consistently `{ ok: false, fieldErrors?, error? } | { ok: true, message? }` — match it for new actions so `useActionState` consumers stay uniform.
- Balances are denormalized: `public.balances` holds `total_earned / pending / withdrawn / locked` snapshots. Withdrawal flow moves money `pending → locked` on request; admin approval/rejection (not yet implemented as of writing) moves `locked → withdrawn` or back. Don't compute these from `transactions` on the fly — update the snapshot in the same action that writes the transaction.
- Passbook uploads (`src/actions/onboarding.ts` + `src/lib/watermark.ts`): images are watermarked with `sharp` before upload to the private `passbooks` bucket, and `members.passbook_url` is **write-once** — the action refuses to overwrite. Signed URLs for admin viewing come from `getPassbookSignedUrl()`.

### Routing layout

- `src/app/(default)` — root pages, `/login`, `/onboarding`, `/dashboard/**`.
- `src/app/admin/login` — public admin login (outside the panel group).
- `src/app/admin/(panel)/**` — route group with shared sidebar/topbar; entering this group implies an authenticated admin (enforced by the layout).
- `src/app/api/auth/[...nextauth]/route.ts` — Auth.js handler; LINE callback URL is `{AUTH_URL}/api/auth/callback/line`.

### Styling

Tailwind v4 (`@import "tailwindcss"` + `@theme` block in `globals.css`). Brand color is LINE green `#06C755` exposed as `--color-brand` / `bg-brand`. Base font is set to a single large fixed size (`html { font-size: 34px }` in `globals.css`) — the target audience is older taxi drivers. The former user-toggleable `data-font-scale` (A/A+/A++) system has been removed. Form controls should keep `min-height: 3rem` and the `btn-primary` / `input-base` utility classes for touch-friendliness.

### Next.js 16 caveats

`AGENTS.md` warns that this is **not** the Next.js in your training data. Things that bit prior sessions:

- The proxy file is `src/proxy.ts`, not `middleware.ts`.
- `cacheComponents: true` makes the `"use cache"` directive and `cacheTag` / `updateTag(tag)` (read-your-writes; `revalidateTag(tag, "max")` only for eventual-consistency cases or Route Handlers) the canonical caching API — don't reach for `unstable_cache` or `revalidatePath` first.
- Before touching anything Next-version-sensitive (caching, routing, server actions, image config, fonts), read the relevant page under `node_modules/next/dist/docs/` rather than relying on memory.
