# Relay

Share HTML pages via short, shareable URLs — built for AI agents and developers.

```bash
npm i -g @androff/relay-cli
relay publish index.html
# → https://posthtml.vercel.app/p/abc123
```

## Overview

Relay lets you publish raw HTML, get a permanent URL, and share it. Think pastebin for HTML — built with a dark terminal aesthetic, designed to be automated via CLI, API, or MCP.

**Key features:**
- Publish HTML → get a shareable `posthtml.vercel.app/p/<id>` URL
- **Data injection** — attach JSON data to pages, use `{{path}}` in HTML for server-side rendering
- CLI (`relay`) — publish, list, update, delete from terminal
- API — auth via API keys, integrate into any workflow
- **MCP (Model Context Protocol) — Beta** — URL-based auth, works with Claude Desktop, Cursor, and any MCP client (tools include `publish_page`, `update_page`, `get_post_data`, `set_post_data`)
- Google OAuth dashboard — manage keys, MCP tokens, pages

## Quick Start

### CLI
```bash
npm i -g @androff/relay-cli
relay setup --key <your-api-key>
relay publish index.html
```

### MCP (for AI agents) — Beta

> ⚠ MCP is in beta. Backward compatibility may break as the protocol evolves.

**Recommended — URL token from dashboard:**
1. Sign in at [posthtml.vercel.app](https://posthtml.vercel.app)
2. Dashboard → MCP Server (Beta) → Generate URL
3. Paste URL into your MCP client config

**Alternative — header auth with API key:**
Use your existing API key as `x-api-key` header on `https://posthtml.vercel.app/api/mcp`.

```json
{
  "mcpServers": {
    "relay": {
      "url": "https://posthtml.vercel.app/api/mcp/mcp_xxx..."
    }
  }
}
```

## Architecture

Monorepo (Bun workspaces):

- **`web/`** — Next.js 16 (App Router) — API routes, MCP server, dashboard, public viewer (`@posthtml/web`)
- **`cli/`** — `relay` CLI — Commander.js, published as `@androff/relay-cli`

## Tech Stack

| Layer | What |
|-------|------|
| Runtime | Node 20+ |
| Framework | Next.js 16 (App Router) |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle ORM |
| Auth | Better Auth — Google OAuth + API keys |
| MCP | `@modelcontextprotocol/sdk` — Streamable HTTP transport |
| CLI | Commander.js, published as `@androff/relay-cli` |
| Package mgr | Bun |

## Links

- [Dashboard](https://posthtml.vercel.app/dashboard) — manage keys, MCP URL, pages
- [CLI package](https://www.npmjs.com/package/@androff/relay-cli)
- [AGENTS.md](AGENTS.md) — full agent reference
