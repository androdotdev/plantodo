# PostHTML — AGENTS.md

## Overview

Give AI agents the ability to upload, edit, and share HTML posts programmatically via CLI. Manage drafts via CLI or API.

## Architecture

Monorepo (Turbo + Bun workspaces, `@posthtml` scope):

- **web/** — `@posthtml/web` — Next.js 16 (App Router). API routes + dashboard + public post viewer.
- **cli/** — `@posthtml/cli` — npm package (`post`). `upload`/`list`/`delete`/`replace`/`setup`.

## Tech Stack

- **Runtime:** Node 20+
- **Framework:** Next.js 16 (App Router)
- **Database:** Neon (serverless Postgres)
- **ORM:** Drizzle ORM v1.0.0-rc.4 + drizzle-kit v1.0.0-rc.4
- **Auth:** Better Auth — Google OAuth only (no email/password)
- **API Keys:** Better Auth `@better-auth/api-key` plugin (rate limiting, expiry, refill)
- **CLI:** Commander.js, Node.js fetch, published as `post`
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

### `posts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | nanoid(16) |
| `html` | TEXT | Full HTML content stored directly in DB |
| `user_id` | TEXT FK → user.id | Owner user (cascade delete on user deletion) |
| `title` | TEXT | Optional display name, default `""` |
| `data` | JSONB | Arbitrary JSON data for partial updates, default `{}` |
| `is_private` | BOOLEAN | Visibility flag, default false |
| `created_at` | TIMESTAMP | auto-set |
| `updated_at` | TIMESTAMP | auto-updated |

## API Endpoints

### Auth (Better Auth)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/api/auth/*` | — | Google OAuth, session, callback |

### MCP (Model Context Protocol)

Use the MCP URL to connect PostHTML to any MCP-compatible client (Claude Desktop, Cursor, etc.).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/api/mcp` | `x-api-key` header | MCP server (header auth, backward compat) |
| GET/POST | `/api/mcp/{token}` | URL path token | MCP server (URL-based auth) |

**MCP URL format:** `https://posthtml.vercel.app/api/mcp/<mcp_...token>`

**How to set up:**
1. Sign in at `posthtml.vercel.app` → Dashboard
2. Go to **MCP Server** section in the sidebar
3. Click **Generate URL** — creates a dedicated `mcp_` prefixed token
4. Copy the URL and paste it into your MCP client config

**Example Claude Desktop config:**
```json
{
  "mcpServers": {
    "posthtml": {
      "url": "https://posthtml.vercel.app/api/mcp/mcp_xxx..."
    }
  }
}
```

**Design notes:**
- MCP tokens are separate from CLI API keys — revoking one doesn't affect the other
- Tokens are identified by `mcp_` prefix for recognizability in logs
- Only one active MCP token per user — regenerate replaces it in place
- The old `/api/mcp` route with `x-api-key` header remains supported
- URL path tokens appear in access logs (unlike headers) — dedicated token + easy regenerate is the mitigation

### API Key Management (dashboard — session auth)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/keys` | Session cookie | Create a new API key |
| GET | `/api/keys` | Session cookie | List user's API keys |
| GET | `/api/keys/:id` | Session cookie | Get one API key |
| PATCH | `/api/keys/:id` | Session cookie | Update an API key (name, rate limit, etc.) |
| DELETE | `/api/keys/:id` | Session cookie | Revoke an API key |

### Posts (CLI/API — key auth via `x-api-key`, browser via session)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/posts` | x-api-key / session | Upload post HTML, returns `{ id, url }` |
| GET | `/api/posts` | x-api-key / session | List posts for this user |
| GET | `/api/posts/:id` | **public** | Get post with HTML content (share-link model) |
| DELETE | `/api/posts/:id` | x-api-key / session | Delete one post (owner only) |
| PATCH | `/api/posts/:id` | x-api-key / session | Replace post HTML (preserves ID/URL) |
| DELETE | `/api/posts` | x-api-key / session | Delete ALL posts for this user |
| GET | `/p/:id` | public | Serve post HTML directly from DB |
| GET | `/api/posts/:id/data` | public | Get post JSON data |
| PATCH | `/api/posts/:id/data` | x-api-key | Merge JSON data into post (keys override, atomic merge) |

## CLI Usage

```bash
npm i -g @androff/posthtml-cli

post setup                  # save API key from dashboard
post setup --key post_xxx    # or pass directly

post data get <id>           # get post json data
post data set <id> --key <k> --value '<json>'  # set one key in data
post data set <id> --file data.json  # merge whole object into data

post upload index.html
post upload index.html --data '{"status":"draft"}'   # attach data in the same call
post upload index.html --data-file meta.json         # or merge a whole JSON file
post ls                     # list posts
post list                   # same
post delete <post-id>
post replace <post-id> <file.html>
```

Configuration saved to `~/.post/config.json`. Key override via `POST_API_KEY` or `POSTHTML_API_KEY` env var.

## Page Routes

| Path | Auth | Content |
|------|------|---------|
| `/` | public | Hero + Google sign-in + agent docs links |
| `/dashboard` | session | API keys, MCP setup, post management |
| `/p/:id` | public | Serves uploaded post HTML |

## Auth Flow

1. User signs in via Google on landing page
2. Better Auth creates user + session, redirects to `/dashboard`
3. User generates API keys from dashboard
4. `web/proxy.ts` (Next.js middleware) converts `x-api-key` or session cookie → `x-user-id` header:
   - **Always strips** any client-supplied `x-user-id` first
   - Sets it only if `verifyApiKey()` or `getSession()` succeeds
   - Every path — success or failure — produces a request where `x-user-id` is either the verified value or absent entirely
5. Route handlers read `x-user-id` from the forwarded request
6. **Defense-in-depth**: sensitive mutating routes (POST, DELETE, PATCH) call `getAuthenticatedUserId()` directly instead of trusting the forwarded header — re-verifying auth independently via `verifyApiKey()`/`getSession()`

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
POST_API_KEY              — API key (overrides config file)
POST_URL                  — Server URL (default http://localhost:3000)
```

## Design System

Design tokens are defined as CSS custom properties in `web/app/globals.css` using Tailwind v4's `@theme inline` directive. Never hardcode hex values in components — always use token names.

### Token Reference

| Category | Token | Value | Usage |
|----------|-------|-------|-------|
| Bg | `bg-bg-base` | `#0a0a0a` | Page background |
| Bg | `bg-bg-card` | `#111111` | Card/panel backgrounds |
| Bg | `bg-bg-card-hover` | `#1a1a1a` | Card hover state |
| Bg | `bg-bg-elevated` | `#1a1a1a` | Elevated surfaces (code blocks, inputs) |
| Bg | `bg-bg-accent` | `#1a3a2a` | Muted green badge bg |
| Bg | `bg-bg-danger` | `#3a1a1a` | Muted danger bg |
| Text | `text-text-primary` | `#e8e8e8` | Primary content |
| Text | `text-text-secondary` | `#888888` | Secondary/subtle |
| Text | `text-text-muted` | `#666666` | Muted/disabled |
| Text | `text-text-accent` | `#00d96a` | Green accent |
| Text | `text-text-danger` | `#ff4444` | Danger/delete |
| Border | `border-border-default` | `#333333` | Card borders |
| Border | `border-border-hover` | `#444444` | Hover border |
| Border | `border-border-accent` | `#00d96a` | Green border |
| Border | `border-border-danger` | `#ff4444` | Danger border |
| Action | `bg-accent` | `#00d96a` | Primary button bg |
| Action | `bg-accent-hover` | `#00ff7f` | Primary button hover |
| Action | `text-accent` | `#00d96a` | Green link/icon |
| Action | `bg-danger` | `#ff4444` | Danger button |

### Radius

- `rounded-sm` — 2px
- `rounded-md` — 4px (default card radius)

### Font

The app uses `'Courier New', monospace` for both sans and mono, giving a terminal aesthetic. Applied globally via the `@theme` block.

### Adding tokens

Add new tokens to the `@theme inline` block in `globals.css`. Use the naming convention:
- `bg-*` for backgrounds
- `text-*` for text colors
- `border-*` for border colors

```css
@theme inline {
  --color-bg-example: #hex;
  --color-text-example: #hex;
}
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
