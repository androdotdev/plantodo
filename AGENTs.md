# planToDO — AGENTS.md

## Overview

planToDO lets users upload HTML plans and get a shareable URL. v2 adds:
- DB-backed auth (API tokens) via `tokens` table
- Draft limits per token
- User-defined slugs
- **Object storage** for plan HTML (R2 or B2) instead of cramming blobs into Postgres

## Architecture

Monorepo (pnpm workspace, `@ptd` scope):

- **web/** — `@ptd/web` — Next.js 15 app (App Router). Contains all API routes + public plan viewer.
- **cli/** — `@ptd/cli` — npm package (`plantodo` / `ptd`). `npx plantodo upload/delete/list`.
- **db/** — `@ptd/db` — shared Drizzle ORM schema + S3-compatible (R2/B2) storage helpers.

## Tech Stack

- **Runtime:** Node 20+, Vercel Edge Runtime
- **Framework (web):** Next.js 16 (App Router)
- **Database:** Neon / Vercel Postgres (serverless Postgres)
- **ORM:** Drizzle ORM v0.45 + drizzle-kit v0.31
- **Object storage:** Cloudflare R2 (primary) / Backblaze B2 (fallback) — S3-compatible SDK
- **CLI:** Node.js with native fetch, published to npm as both `ptd` and `plantodo`
- **Package mgr:** pnpm v11
- **Build:** tsup (cli, db), Next.js (web)
- **Language:** TypeScript 6.0.3 (catalog)

## Database

Two tables — `tokens` and `plans`.

### `tokens`
| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | nanoid, acts as Bearer token value |
| `name` | TEXT | "personal", "project-x" |
| `plan_limit` | INT DEFAULT 50 | draft limit for this token |
| `created` | TIMESTAMP | auto-set |

### `plans`
| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | nanoid |
| `slug` | TEXT UNIQUE | user-provided or nanoid(8) |
| `title` | TEXT DEFAULT '' | |
| `html_key` | TEXT | S3 object key (e.g. `plans/{id}.html`) — HTML lives in R2/B2 |
| `token_id` | TEXT FK → tokens.id | owner |
| `created` | TIMESTAMP | auto-set |
| `updated` | TIMESTAMP | set to NOW() on upsert |
| `views` | INT DEFAULT 0 | incremented on every `GET /p/:slug` |

> **Note:** `html` column was originally a TEXT blob in Postgres. Moving to object storage keeps the DB lean and saves on row size limits / cost.

## API Endpoints

All mutating endpoints require `Authorization: Bearer <token>` header.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/upload` | Bearer token | Upload plan HTML → `{ url, id }`. Writes HTML to R2/B2, inserts row. |
| DELETE | `/api/delete` | Bearer token | Delete plan by slug. Removes object from R2/B2 + deletes row. |
| GET | `/api/plans` | Bearer token | List user's plans (metadata only, no HTML body). |
| GET | `/p/:slug` | public | Fetch HTML from R2/B2 by `html_key` and serve it. |

## Slug Rules

- Must match `/^[a-z0-9-]{1,48}$/`
- Must be unique per DB
- Falls back to nanoid(8) if not provided

## CLI Usage

```bash
npx plantodo upload plan.html --slug my-plan
npx plantodo delete my-plan
npx plantodo list
# or the shorter alias:
npx ptd upload plan.html --slug my-plan
```

## Key Conventions

- Plan HTML is stored in **R2 (preferred) or B2** — the DB only holds the S3 object key (`html_key`).
- URL format: `https://plantodo.vercel.app/p/{slug}`
- Token is generated as nanoid and stored in the `tokens` table — user shares it via env var.
- Draft limit enforced per token (not globally).
- `updated` timestamp is set to `NOW()` on upsert.
- Views counter is incremented on every `GET /p/:slug`.
- `@aws-sdk/client-s3` used for S3-compatible object storage (R2 / B2).
- Env vars: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT` (or `B2_*` equivalents).

## Dev Workflow

```bash
pnpm install
pnpm -C db build          # build shared schema + storage helpers
pnpm -C db db:generate    # generate Drizzle migrations
pnpm -C db db:push        # push schema to local Postgres
pnpm -C web dev           # Next.js dev server
pnpm -C cli build         # build CLI
tsup
pnpm -r test              # run all tests
```

## Deployment

- **Web:** `vercel --prod` from `web/` — deploys Next.js app (ensure R2/B2 env vars are set)
- **CLI:** `npm publish` from `cli/` — publishes CLI to npm

## Related

- Agent usage: see `SKILL.md` for how Hermes interacts with planToDO.
- llms.txt at repo root for LLM context.



