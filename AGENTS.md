# PostHTML — AGENTS.md

## Overview

Upload HTML plans and get a shareable URL. Manage drafts via CLI or API.

## Architecture

Monorepo (Turbo + Bun workspaces, `@posthtml` scope):

- **web/** — `@posthtml/web` — Next.js 16 (App Router). API routes + dashboard + public plan viewer.
- **cli/** — `@posthtml/cli` — npm package (`ptd`). `upload`/`list`/`delete`/`replace`/`setup`.

## Tech Stack

- **Runtime:** Node 20+
- **Framework:** Next.js 16 (App Router)
- **Database:** Neon (serverless Postgres)
- **ORM:** Drizzle ORM v1.0.0-rc.4 + drizzle-kit v1.0.0-rc.4
- **Auth:** Better Auth — Google OAuth only (no email/password)
- **API Keys:** Better Auth `@better-auth/api-key` plugin (rate limiting, expiry, refill)
- **CLI:** Commander.js, Node.js fetch, published as `ptd`
- **Package mgr:** Bun
- **Build:** tsup (cli), Next.js (web)
- **Language:** TypeScript 6.0.3

## Database

6 tables — 5 Better Auth managed + 1 custom:

### Better Auth tables (managed by Drizzle adapter)

| Table | Purpose |
|-------|---------|
| `user` | User accounts (Google OAuth) |
| `session` | Browser sessions |
| `account` | OAuth provider links |
| `verification` | (unused — Google-only auth) |
| `apikey` | API keys with rate limiting, expiry, remaining count |

### `plans`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | nanoid(16) |
| `html` | TEXT | Full HTML content stored directly in DB |
| `user_id` | TEXT FK → user.id | Owner user (cascade delete on user deletion) |
| `title` | TEXT | Optional display name, default `""` |
| `created_at` | TIMESTAMP | auto-set |
| `updated_at` | TIMESTAMP | auto-updated |

## API Endpoints

### Auth (Better Auth)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/api/auth/*` | — | Google OAuth, session, callback |

### API Key Management (dashboard — session auth)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/keys` | Session cookie | Create a new API key |
| GET | `/api/keys` | Session cookie | List user's API keys |
| GET | `/api/keys/:id` | Session cookie | Get one API key |
| PATCH | `/api/keys/:id` | Session cookie | Update an API key (name, rate limit, etc.) |
| DELETE | `/api/keys/:id` | Session cookie | Revoke an API key |

### Plans (CLI/API — key auth via `x-api-key`, browser via session)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/plans` | x-api-key / session | Upload plan HTML, returns `{ id, url }` |
| GET | `/api/plans` | x-api-key / session | List plans for this user |
| GET | `/api/plans/:id` | x-api-key / session | Get plan with HTML content |
| DELETE | `/api/plans/:id` | x-api-key / session | Delete one plan (owner only) |
| PATCH | `/api/plans/:id` | x-api-key / session | Replace plan HTML (preserves ID/URL) |
| DELETE | `/api/plans` | x-api-key / session | Delete ALL plans for this user |
| GET | `/p/:id` | public | Serve plan HTML directly from DB |

## CLI Usage

```bash
npm i -g @androff/posthtml-cli

ptd setup                  # save API key from dashboard
ptd setup --key ptd_xxx    # or pass directly

ptd upload index.html
ptd ls                     # list plans
ptd list                   # same
ptd delete <plan-id>
ptd replace <plan-id> <file.html>
```

Configuration saved to `~/.ptd/config.json`. Key override via `PTD_API_KEY` or `PLANTODO_API_KEY` env var.

## Page Routes

| Path | Auth | Content |
|------|------|---------|
| `/` | public | Hero + Google sign-in + agent docs links |
| `/dashboard` | session | API key management (generate, list, copy, revoke, configure) |
| `/p/:id` | public | Serves uploaded plan HTML |

## Auth Flow

1. User signs in via Google on landing page
2. Better Auth creates user + session, redirects to `/dashboard`
3. User generates API keys from dashboard
4. CLI uses `x-api-key` header → server calls `auth.api.verifyApiKey()` to authenticate plan API calls

## Env Vars (`web/.env`)

```
DATABASE_URL             — Neon Postgres connection string
BETTER_AUTH_SECRET       — Better Auth secret
BETTER_AUTH_URL          — e.g. http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL
GOOGLE_CLIENT_ID         — Google OAuth client ID
GOOGLE_CLIENT_SECRET     — Google OAuth client secret
```

## CLI Env Vars

```
PTD_API_KEY              — API key (overrides config file)
PTD_URL                  — Server URL (default http://localhost:3000)
```

## Migrations

2 migrations (`20260702144151`, `20260704093852`). Apply with:

```bash
bun -C web db:migrate
```

## Dev Workflow

```bash
bun install
bun -C web db:migrate        # apply migrations to Neon
bun -C web dev               # Next.js dev server on :3000
bun -C cli build             # build CLI dist/
bun run test                  # run all tests
```

## Deployment

- **Web:** `vercel --prod` from `web/`
- **CLI:** `npm publish` from `cli/`
