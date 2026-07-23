# @posthtml/web

Next.js 16 web app — dashboard, MCP server, API routes, and public post viewer.

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing page + Google sign-in |
| `/dashboard` | Manage API keys, MCP URL, posts |
| `/p/:id` | Public post viewer |
| `/api/mcp` | MCP server (header-based auth) |
| `/api/mcp/{token}` | MCP server (URL-based auth) |
| `/api/posts` | Post CRUD API |
| `/api/keys` | API key management |

## Env

See `web/.env` or `AGENTS.md` in the project root.
