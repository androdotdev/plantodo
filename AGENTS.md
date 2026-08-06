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
| `type` | TEXT | Content format: `html` (default) or `markdown`; markdown is converted to HTML at write time, so `html` always holds rendered HTML |
| `token_version` | INTEGER | Capability-token version, default 1; bumped on visibility toggle to revoke old `?key=` tokens |
| `created_at` | TIMESTAMP | auto-set |
| `updated_at` | TIMESTAMP | auto-updated |

## API Endpoints

### Auth (Better Auth)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/api/auth/*` | — | Google OAuth, session, callback |

### MCP (Model Context Protocol) — Beta

> **⚠ Beta:** The MCP integration is stable and functional but may see breaking changes as the protocol evolves.

Use the MCP URL to connect PostHTML to any MCP-compatible client (Claude Desktop, Cursor, etc.).

**Available MCP tools:**
- `list_posts` — list your posts
- `get_post` — get post HTML by ID
- `upload_post` — create a new post (`{ html, title?, type?, isPrivate? }`, `type`: `html`|`markdown`)
- `replace_post` — update post content (`{ id, html, title?, type?, isPrivate? }`)
- `delete_post` — delete a post
- `get_post_data` — get a post's JSON data
- `set_post_data` — merge JSON data into a post (`{ id, data: {...} }`)

MCP works two ways:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/api/mcp` | `x-api-key` header | MCP server (header auth, backward compat) |
| GET/POST | `/api/mcp/{token}` | URL path token | MCP server (URL-based auth) |

**How to set up (recommended — token from dashboard):**
1. Sign in at `posthtml.vercel.app` → Dashboard
2. Go to **MCP Server** (Beta) section in the sidebar
3. Click **Generate URL** — creates a dedicated `mcp_` prefixed token
4. Copy the URL and paste it into your MCP client config

**Alternative — header auth with API key:**
If you prefer, use your existing API key directly as the `x-api-key` header on `https://posthtml.vercel.app/api/mcp`.

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
- Only one active MCP token per user — generating a new one **server-side revokes the previous** (enforced in `POST /api/keys`, not just the UI)
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
post upload README.md --mark                         # Markdown → HTML server-side
post ls                     # list posts
post list                   # same
post delete <post-id>
post replace <post-id> <file.html>
```

Configuration saved to `~/.post/config.json`. Key resolution priority: config file > `POST_API_KEY` > `POSTHTML_API_KEY` > error.

## Template interpolation

When serving `/p/:id`, PostHTML resolves `{{path}}` placeholders in the post HTML
with values from the post's `data` JSON object. Values are HTML-escaped — safe against XSS.

```html
<!-- Upload this HTML -->
<h1>{{title}}</h1>
<p>⭐ {{stars}} stars</p>

<!-- With data: { "title": "Cardfoi", "stars": 42 } -->
<!-- Viewer receives fully rendered: -->
<h1>Cardfoi</h1>
<p>⭐ 42 stars</p>
```

The raw data is also injected as `window.__PH_DATA` for custom JS:
```html
<script>console.log(window.__PH_DATA)</script>
```

Both paths are ALWAYS applied to every served post: `{{}}` interpolation (HTML-escaped, missing values stay as literal `{{path}}`) and `__PH_DATA` injection (escaped JSON). Authors never "pick one" — see SKILL.md "Rendering contract".

## Page Routes

| Path | Auth | Content |
|------|------|---------|
| `/` | public | Hero + Google sign-in + agent docs links |
| `/dashboard` | session | API keys, MCP setup, post management |
| `/p/:id` | public | Serves uploaded post HTML (with server-side data interpolation)

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
POSTS_DOMAIN             — separate origin for /p/:id (cookie isolation); unset in dev
POST_TOKEN_SECRET        — HMAC secret for private-post capability tokens (openssl rand -hex 32)
```

## CLI Env Vars

```
POST_API_KEY              — API key (fallback if not in config file)
POST_URL                  — Server URL (default https://posthtml.vercel.app)
```

## Design System

Design tokens are defined as CSS custom properties in `web/app/globals.css` (Tailwind v4 `@theme` block — plain `@theme`, not `inline`, so utilities resolve `var(--color-*)`). Dark theme is **Catppuccin Mocha**; never hardcode hex values in components — always use token names.

### Token Reference

| Category | Token | Value | Usage |
|----------|-------|-------|-------|
| Bg | `bg-bg-base` | `#1e1e2e` | Page background |
| Bg | `bg-bg-card` | `#181825` | Card/panel backgrounds |
| Bg | `bg-bg-card-hover` | `#313244` | Card hover state |
| Bg | `bg-bg-elevated` | `#11111b` | Elevated surfaces (code blocks, inputs) |
| Bg | `bg-bg-accent` | `#302d41` | Muted accent badge bg |
| Bg | `bg-bg-danger` | `#352024` | Muted danger bg |
| Text | `text-text-primary` | `#cdd6f4` | Primary content |
| Text | `text-text-secondary` | `#a6adc8` | Secondary/subtle |
| Text | `text-text-muted` | `#6c7086` | Muted/disabled |
| Text | `text-text-accent` | `#cba6f7` | Mauve accent |
| Text | `text-text-danger` | `#f38ba8` | Danger/delete |
| Border | `border-border-default` | `#45475a` | Card borders |
| Border | `border-border-hover` | `#585b70` | Hover border |
| Border | `border-border-accent` | `#cba6f7` | Mauve border |
| Border | `border-border-danger` | `#f38ba8` | Danger border |
| Action | `bg-accent` | `#cba6f7` | Primary button bg |
| Action | `bg-accent-hover` | `#b4befe` | Primary button hover |
| Action | `text-accent-text` | `#1e1e2e` | Text on primary buttons |
| Action | `bg-danger` | `#f38ba8` | Danger button |

### Radius

- `rounded-sm` — 2px
- `rounded-md` — 4px (default card radius)

### Font

The app uses `'Courier New', monospace` for both sans and mono, giving a terminal aesthetic. Applied globally via the `@theme` block.

### Adding tokens

Add new tokens to the `@theme` block in `globals.css`. Use the naming convention:
- `bg-*` for backgrounds
- `text-*` for text colors
- `border-*` for border colors

```css
@theme {
  --color-bg-example: #hex;
  --color-text-example: #hex;
}
```

## Migrations

Migration folders live in `web/drizzle/` (7 so far, latest: `20260806062500_add_token_version`).

> `drizzle/meta/_journal.json` is absent, so `db:migrate` doesn't run. Schema changes
> are applied with `db:push`, which diffs `db/schema.ts` against the live database:

```bash
bun -C web db:push          # apply schema diff to Neon (current workflow)
```

Rebuilding the journal + switching to `db:migrate` is a tracked TODO item.

## Dev Workflow

```bash
bun install
bun -C web db:push          # apply schema diff to Neon
bun -C web dev               # Next.js dev server on :3000
bun -C cli build             # build CLI dist/
bun run test                  # run all tests
```

## Deployment

- **Web:** `vercel --prod` from `web/`
- **CLI:** `npm publish` from `cli/`
