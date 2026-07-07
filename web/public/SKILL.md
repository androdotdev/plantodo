---
name: posthtml-agent
description: Give AI agents the ability to upload, edit, and share HTML plans programmatically via CLI or HTTP API. Use when a user needs to create, retrieve, or manage deployable HTML content.
version: 1.0.0
author: PostHTML
tags: [html, sharing, plans, cli, agent]
---

# PostHTML Agent Skill

An AI agent can interact with PostHTML via its HTTP API.

## Authentication

All plan API requests require `x-api-key` header containing a valid API key.
Get a key from `/dashboard`.

## Available Commands

### Upload a plan
```
POST /api/plans
x-api-key: <key>
Content-Type: application/json

{ "html": "<!DOCTYPE html>…", "title?": "My Plan" }
```

Returns `{ id, url }`.

### List plans
```
GET /api/plans
x-api-key: <key>
```

Returns `[{ id, title, createdAt, updatedAt }]`.

### Replace plan content (preserves ID and URL)
```
PATCH /api/plans/:id
x-api-key: <key>
Content-Type: application/json

{ "html": "<!DOCTYPE html>…" }
```

Returns `{ id, url }`.

### Delete one plan
```
DELETE /api/plans/:id
x-api-key: <key>
```

### Get a single plan
```
GET /api/plans/:id
x-api-key: <key>
```

Returns `{ id, html, title, createdAt, updatedAt }`.

### Delete all plans for your account
```
DELETE /api/plans
x-api-key: <key>
```

## Plan URL

After upload, the plan is viewable at `https://posthtml.vercel.app/p/{id}` (no auth needed).

## CLI

```bash
npm i -g @androff/posthtml-cli

ptd setup --key <key>    # save key to ~/.ptd/config.json
ptd upload index.html     # upload and get URL
ptd list                  # list plans
ptd delete <id>           # delete plan
ptd replace <id> file.html # replace content, same URL
```
## Quick test
```bash
PTD_URL=https://posthtml.vercel.app PTD_API_KEY=<your-key> ptd list
```
