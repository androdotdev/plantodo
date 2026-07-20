# PostHTML

Share HTML plans via short, shareable URLs — built for AI agents and developers.

```bash
npm i -g @androff/posthtml-cli
post upload index.html
# → https://posthtml.vercel.app/p/abc123
```

## Overview

PostHTML lets you upload raw HTML, get a permanent URL, and share it. Think pastebin for HTML — built with a dark terminal aesthetic, designed to be automated via CLI or API.

**Key features:**
- Upload HTML → get a shareable `posthtml.vercel.app/p/<id>` URL
- CLI (`post`) — upload, list, replace, delete from terminal
- API — auth via API keys, integrate into any workflow
- Google OAuth dashboard — manage keys, view plans

## Architecture

Monorepo (Bun workspaces):

- **`web/`** — Next.js 16 (App Router) — API routes + dashboard + public viewer
- **`cli/`** — `post` CLI — Commander.js, published as `@androff/posthtml-cli`

## Tech Stack

| Layer | What |
|-------|------|
| Runtime | Node 20+, Bun |
| Web | Next.js 16, Tailwind v4 |
| DB | Neon (serverless Postgres) + Drizzle ORM |
| Auth | Better Auth (Google OAuth + API keys) |
| CLI | Commander.js, `post` |

## Quick Start

```bash
bun install
bun run dev
```

See `web/.env.example` for required env vars.

## Docs

- [`AGENTS.md`](./AGENTS.md) — Architecture, API, auth flows, design tokens
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — How to contribute
- [`SECURITY.md`](./SECURITY.md) — Security policies
- [`LICENSE`](./LICENSE) — ISC

## Project Status

Active development. Built for personal use and small teams. PRs welcome.
