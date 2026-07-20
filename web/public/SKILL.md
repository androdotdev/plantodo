---
name: posthtml-agent
description: Give AI agents the ability to upload, edit, and share HTML plans programmatically via CLI.
version: 1.0.0
author: PostHTML
tags: [html, sharing, plans, cli, agent]
---

# PostHTML Agent Skill

> **MANDATORY — read this file before performing any PostHTML action.** It is the
> authoritative guide. The dashboard setup prompt links here for a reason.

## Rules (always)
- Always read this file first — do not guess CLI flags or API behavior.
- API keys are scoped per key. New keys are **limited by default** (not unlimited) —
  if a call 429s, the key hit its cap; tell the human to raise it on `/dashboard`.
- Public plans are viewable by anyone at `/p/{id}`. Mark sensitive plans `--private`
  (owner-only: anon → 401, other users → 403).
- `post data set` **merges** keys — it never wipes existing data. Safe to call repeatedly.

Use PostHTML's CLI tool to upload, edit, and share HTML plans.
Each uploaded plan gets a permanent shareable URL.

## Setup

1. Get an API key at `/dashboard`
2. Install the CLI: `npm i -g @androff/posthtml-cli`
3. Save your key: `post setup --key <your-key>`

## Commands

### Upload a plan
```bash
post upload index.html
```

Returns `{ id, url }` — the URL is shareable immediately.

Attach JSON data in the same call (see "Plan data" below):
```bash
post upload index.html --data '{"status":"draft"}'
post upload index.html --data-file meta.json
```

Mark a plan private (owner-only) at upload time:
```bash
post upload index.html --private
post upload index.html --public        # default; explicitly public/shareable
```

Or set privacy on replace (preserves URL):
```bash
post replace <plan-id> file.html --private
post replace <plan-id> file.html --public
```

### List plans
```bash
post list
```

Returns `[{ id, title, createdAt, updatedAt }]`.

### Replace plan content (preserves URL)
```bash
post replace <plan-id> file.html
```

Only updates `html` — there's no `--data` flag on `replace`. If a plan needs new html
*and* new data at once, upload a fresh plan with `--data` and delete the old one instead
of replacing in place.

### Delete a plan
```bash
post delete <plan-id>
```

## Plan data

Each plan also has a `data` JSON object, separate from its `html` — use this for anything
that isn't markup: status, progress, task metadata, whatever context you want to persist
alongside the plan. It defaults to `{}` and is never set automatically, so attach it
explicitly with `--data`/`--data-file` on `upload`, or update it later:

```bash
post data get <plan-id>                              # read current data
post data set <plan-id> --key status --value '"draft"'   # merge one key
post data set <plan-id> --file meta.json             # merge a whole JSON file
```

`post data set` merges keys into the existing object — it doesn't replace it, so repeated
calls are safe to accumulate state over a plan's lifetime.

## Plan URL

After upload, the plan is viewable at `https://posthtml.vercel.app/p/{id}`.

Public plans (`is_private=false`, the default) need no auth. Private plans
(`is_private=true`, set via `post upload --private` / `post replace --private` or
`PATCH /api/plans/:id` with `{ "isPrivate": true }`) require the owner's session
cookie or `x-api-key` — anonymous requests get 401, other users get 403.

## Quick test
```bash
POST_URL=https://posthtml.vercel.app POST_API_KEY=<your-key> post list
```

## Env overrides
- `POST_API_KEY` — API key (overrides config file)
- `POST_URL` — server URL (default https://posthtml.vercel.app)
