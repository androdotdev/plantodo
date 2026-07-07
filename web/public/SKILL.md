---
name: posthtml-agent
description: Give AI agents the ability to upload, edit, and share HTML plans programmatically via CLI.
version: 1.0.0
author: PostHTML
tags: [html, sharing, plans, cli, agent]
---

# PostHTML Agent Skill

Use PostHTML's CLI tool to upload, edit, and share HTML plans.
Each uploaded plan gets a permanent shareable URL.

## Setup

1. Get an API key at `/dashboard`
2. Install the CLI: `npm i -g @androff/posthtml-cli`
3. Save your key: `ptd setup --key <your-key>`

## Commands

### Upload a plan
```bash
ptd upload index.html
```

Returns `{ id, url }` — the URL is shareable immediately.

### List plans
```bash
ptd list
```

Returns `[{ id, title, createdAt, updatedAt }]`.

### Replace plan content (preserves URL)
```bash
ptd replace <plan-id> file.html
```

### Delete a plan
```bash
ptd delete <plan-id>
```

## Plan URL

After upload, the plan is viewable at `https://posthtml.vercel.app/p/{id}` (no auth needed).

## Quick test
```bash
PTD_URL=https://posthtml.vercel.app PTD_API_KEY=<your-key> ptd list
```

## Env overrides
- `PTD_API_KEY` — API key (overrides config file)
- `PTD_URL` — server URL (default https://posthtml.vercel.app)
