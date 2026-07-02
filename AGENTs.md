# planToDO — AGENTS.md

## Overview

Upload HTML plans and get a shareable URL. Manage drafts via CLI or API.

## Architecture

Monorepo (pnpm workspace, `@ptd` scope):

- **web/** — `@ptd/web` — Next.js 16 (App Router). API routes + dashboard + public plan viewer.
- **cli/** — `@ptd/cli` — npm package (`plantodo` / `ptd`). `upload`/`list`/`delete`/`replace`/`setup`.

## Tech Stack

- **Runtime:** Node 20+
- **Framework:** Next.js 16 (App Router)
- **Database:** Neon (serverless Postgres)
- **ORM:** Drizzle ORM v0.45 + drizzle-kit v0.31
- **Auth:** Better Auth — Google OAuth only (no email/password)
- **API Keys:** Better Auth `@better-auth/api-key` plugin (rate limiting, expiry, refill)
- **Object storage:** Backblaze B2 (S3-compatible)
- **CLI:** Commander.js, Node.js fetch, published as `ptd` / `plantodo`
- **Package mgr:** pnpm v11
- **Build:** tsup (cli), Next.js (web)
- **Language:** TypeScript 6.0.3

## Database

5 tables from Better Auth + 1 custom:

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
| `b2_key` | TEXT | B2 object key (e.g. `plans/{id}.html`) |
| `key_id` | TEXT FK → apikey.id | Owner API key (cascade delete) |
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
| PATCH | `/api/keys/:id` | Session cookie | Update an API key (name, etc.) |
| DELETE | `/api/keys/:id` | Session cookie | Revoke an API key |

### Plans (CLI/API — key auth via `x-api-key` header)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/plans` | x-api-key | Upload plan HTML, returns `{ id, url }` |
| GET | `/api/plans` | x-api-key | List plans for this API key |
| DELETE | `/api/plans/:id` | x-api-key | Delete one plan (owner only) |
| PATCH | `/api/plans/:id` | x-api-key | Replace plan HTML (preserves ID/URL) |
| DELETE | `/api/plans` | x-api-key | Delete ALL plans for this key |
| GET | `/p/:id` | public | Serve plan HTML from B2 |

## CLI Usage

```bash
npm i -g plantodo

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
| `/` | public | Hero + Google sign-in button |
| `/dashboard` | session | API key management (generate, list, copy, revoke) |
| `/p/:id` | public | Serves uploaded plan HTML |

## Auth Flow

1. User signs in via Google on landing page
2. Better Auth creates user + session, redirects to `/dashboard`
3. User generates API keys from dashboard
4. CLI uses `x-api-key` header → server calls `auth.api.verifyApiKey()` to authenticate plan API calls

## Env Vars (`web/.env`)

```
DATABASE_URL             — Neon Postgres connection string
B2_REGION                — Backblaze B2 region
B2_BUCKET                — B2 bucket name
AWS_ACCESS_KEY_ID        — B2 application key ID
AWS_SECRET_ACCESS_KEY    — B2 application key secret
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

4 migrations generated (`drizzle/0000`–`0003`). Apply with:

```bash
pnpm -C web db:migrate
```

## Dev Workflow

```bash
pnpm install
pnpm -C web db:migrate        # apply migrations to Neon
pnpm -C web dev               # Next.js dev server on :3000
pnpm -C cli build             # build CLI dist/
pnpm -r test                  # run all tests
```

## Deployment

- **Web:** `vercel --prod` from `web/`
- **CLI:** `npm publish` from `cli/`
