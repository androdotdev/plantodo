# PostHTML

Share HTML posts via short, shareable URLs — built for AI agents and developers.

```bash
npm i -g @androff/posthtml-cli
post upload index.html
# → https://posthtml.vercel.app/p/abc123
```

## Overview

PostHTML lets you upload raw HTML, get a permanent URL, and share it. Think pastebin for HTML — built with a dark terminal aesthetic, designed to be automated via CLI, API, or MCP.

**Key features:**
- Upload HTML → get a shareable `posthtml.vercel.app/p/<id>` URL
- CLI (`post`) — upload, list, replace, delete from terminal
- API — auth via API keys, integrate into any workflow
- **MCP (Model Context Protocol) — Beta** — URL-based auth, works with Claude Desktop, Cursor, and any MCP client
- Google OAuth dashboard — manage keys, MCP tokens, posts

## Quick Start

### CLI
```bash
npm i -g @androff/posthtml-cli
post setup --key <your-api-key>
post upload index.html
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
    "posthtml": {
      "url": "https://posthtml.vercel.app/api/mcp/mcp_xxx..."
    }
  }
}
```

## Architecture

Monorepo (Bun workspaces):

- **`web/`** — Next.js 16 (App Router) — API routes, MCP server, dashboard, public viewer
- **`cli/`** — `post` CLI — Commander.js, published as `@androff/posthtml-cli`

## Tech Stack

| Layer | What |
|-------|------|
| Runtime | Node 20+ |
| Framework | Next.js 16 (App Router) |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle ORM |
| Auth | Better Auth — Google OAuth + API keys |
| MCP | `@modelcontextprotocol/sdk` — Streamable HTTP transport |
| CLI | Commander.js, published as `@androff/posthtml-cli` |
| Package mgr | Bun |

## Links

- [Dashboard](https://posthtml.vercel.app/dashboard) — manage keys, MCP URL, posts
- [CLI package](https://www.npmjs.com/package/@androff/posthtml-cli)
- [AGENTS.md](AGENTS.md) — full agent reference
