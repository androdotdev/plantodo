# planToDO — AGENTS.md

## Overview

Upload HTML plans and get a shareable URL. Manage drafts via CLI or API.

## Architecture

Monorepo (pnpm workspace, `@ptd` scope):

- **web/** — `@ptd/web` — Next.js 16 (App Router). API routes + dashboard + public plan viewer.
- **cli/** — `@ptd/cli` — npm package (`plantodo` / `ptd`). `upload`/`delete`/`list`/`replace`.

## Tech Stack

- **Runtime:** Node 20+
- **Framework:** Next.js 16 (App Router)
- **Database:** Neon (serverless Postgres)
- **ORM:** Drizzle ORM v0.45 + drizzle-kit v0.31
- **Auth:** Better Auth — Google OAuth only (no email/password)
- **API Keys:** Better Auth `@better-auth/api-key` plugin (rate limiting, expiry)
- **Object storage:** Backblaze B2 (S3-compatible)
- **CLI:** Node.js native fetch, published as `ptd` / `plantodo`
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
| `id` | TEXT PK | nanoid |
| `b2_key` | TEXT | B2 object key (e.g. `plans/{id}.html`) |
| `key_id` | TEXT FK → apikey.id | Owner API key (cascade delete) |
| `created_at` | TIMESTAMP | auto-set |
| `updated_at` | TIMESTAMP | auto-updated |

## API Endpoints

### Auth (Better Auth — see [docs](https://better-auth.com))

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/api/auth/*` | — | Google OAuth, session, callback |

### API Key Management (dashboard)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/keys` | Session | Create a new API key |
| GET | `/api/keys` | Session | List user's API keys |
| DELETE | `/api/keys/:id` | Session | Revoke an API key |

### Plans

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/plans` | Bearer token | Upload plan HTML |
| GET | `/api/plans` | Bearer token | List plans |
| DELETE | `/api/plans/:id` | Bearer token | Delete one plan |
| DELETE | `/api/plans` | Bearer token | Delete all plans |
| GET | `/p/:slug` | public | Serve plan HTML from B2 |

## CLI Usage

```bash
npm i -g plantodo
ptd upload index.html
ptd ls
ptd replace <plan-id> <new-index.html>
ptd del <plan-id>
```

## Page Routes

| Path | Auth | Content |
|------|------|---------|
| `/` | public | Landing page + Google sign-in |
| `/dashboard` | session | API key management (generate, list, revoke) |

## Env Vars

### Required
- `DATABASE_URL` — Neon Postgres connection string
- `BETTER_AUTH_SECRET` — Better Auth secret
- `BETTER_AUTH_URL` — e.g. `http://localhost:3000`
- `NEXT_PUBLIC_BETTER_AUTH_URL` — same for client
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
- `B2_REGION` / `B2_BUCKET` — Backblaze B2 config
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — B2 application key

### Orphan (can remove)
- `RESEND_API_KEY` — no longer used
- `EMAIL_FROM` — no longer used
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — unused

## Key Conventions

- API keys use Better Auth `apikey` plugin — dashboard creates them, plan API routes verify via `auth.api.verifyApiKey()`
- Plan HTML stored in B2, DB only holds `b2_key`
- Google OAuth is the only sign-in method
- Rate limiting built into API key plugin (default: 10 req/day window)

## Dev Workflow

```bash
pnpm install
pnpm -C web db:generate    # generate Drizzle migration
pnpm -C web db:migrate     # apply migration to DB
pnpm -C web dev            # Next.js dev server
pnpm -C cli build          # build CLI
pnpm -r test               # run all tests
```

## Deployment

- **Web:** `vercel --prod` from `web/` — ensure all env vars set on Vercel
- **CLI:** `npm publish` from `cli/`
