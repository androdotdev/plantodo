---
name: posthtml-agent
*description: BETA — Give AI agents the ability to upload, edit, and share HTML plans programmatically via CLI or MCP.
version: 1.0.0
author: PostHTML
tags: [html, publishing, agent, mcp, cli]
---

# PostHTML Agent Skill

> **BETA** — APIs and behavior may change.
>
> **MANDATORY — read this file before performing any PostHTML action.** It is the
> authoritative guide. The dashboard setup prompt links here for a reason.

PostHTML is a publishing API for AI agents. You create HTML documents, attach JSON data,
and the server merges them into live web pages. Same URL, any number of updates.

## Core concept: templates + data

PostHTML separates structure from content:

1. **Upload a template** — write HTML with `{{placeholder}}` syntax wherever dynamic values go
2. **Attach JSON data** — provide the values for those placeholders (at upload time or later)
3. **Viewer gets the rendered page** — the server replaces `{{path}}` with HTML-escaped data values before serving

```html
<!-- Template: uploaded as index.html -->
<h1>{{title}}</h1>
<p>⭐ {{stars}} stars</p>
```

```bash
# Upload with data — page renders immediately with values filled in
post upload index.html --data '{"title":"Cardfoi","stars":42}'

# Or update data later — same URL, fresh output
post data set <id> --key stars --value '"99"'
```

The raw data is also injected as `window.__PH_DATA` for any custom JS you write in your own `<script>` tags. The `{{}}` placeholders are replaced server-side — no client runtime needed, no flicker.

## Rendering contract

There is ONE contract, and the server applies BOTH sides of it to **every** post, always:

1. **Static fields** — `{{path}}` (dot paths like `{{user.name}}` work) are resolved **server-side** with post data and HTML-escaped before serving. No client runtime required.
2. **Dynamic content** — the raw data object is injected as `window.__PH_DATA` (escaped JSON, safe inside `<script>`). Post authors who need JS read it from their own `<script>` tags.

Consequences you must not fight:

- Do NOT pre-render `{{}}` in your template or data before upload — the server does it at view time. Pre-rendered templates break the contract.
- A placeholder with **no matching data value** is served as the literal `{{path}}` text — the author sees it in the page. That's the missing-data signal; update the data rather than the HTML.
- `{{}}` values are always escaped — you cannot inject raw HTML through a placeholder. If a post needs custom HTML, that HTML belongs in the template, not the data.
- Server-side interpolation and `window.__PH_DATA` are independent: a template with no `{{}}` still gets `__PH_DATA` injected, and data-less templates still interpolate (nothing to replace). Never build a post that depends on only one of the two being applied.

## Rules

- API keys are scoped per key. New keys are **limited by default** (not unlimited) — if a call 429s, the key hit its cap; tell the human to raise it on `/dashboard`.
- Public plans are viewable by anyone at `/p/{id}`. Mark sensitive plans `--private` (owner-only: anon → 401, other users → 403).
- `post data set` **merges** keys — it never wipes existing data. Safe to call repeatedly.

## Privacy

| Flag | Behavior |
|---|---|
| `--public` (default) | Anyone with the URL can view |
| `--private` | Owner only — anon gets 401, other users get 403 |

Set at upload: `post upload file.html --private`
Change later: `post replace <id> file.html --private`

## Setup

1. Get an API key at `/dashboard`
2. Install the CLI: `npm i -g @androff/posthtml-cli`
3. Save your key: `post setup --key <your-key>`

## CLI reference

### Upload
```bash
post upload index.html                                     # returns {id, url}
post upload index.html --data '{"status":"draft"}'          # attach JSON data
post upload index.html --data-file meta.json               # data from file
post upload index.html --private                           # owner-only
post upload README.md --mark                               # Markdown → HTML server-side
```

### List / Replace / Delete
```bash
post list                           # list your posts
post replace <id> file.html         # update content (same URL)
post delete <id>                    # delete a post
```

### Data management
```bash
post data get <id>                                          # read current data
post data set <id> --key stars --value '"99"'                # merge one key
post data set <id> --file data.json                         # merge whole file
```

### Template interpolation details

Use `{{path}}` in your HTML — the server replaces it with the corresponding value from the post's JSON data. Values are HTML-escaped automatically (safe against XSS).

```html
<a href="https://github.com/{{repo}}">View on GitHub</a>
```

Nested paths work: `{{user.name}}`, `{{config.theme.color}}`.

Prototype pollution blocked: `{{__proto__}}`, `{{constructor}}`, `{{prototype}}` are rejected.

Use `{{this}}` to reference the entire data object as a JSON string.

## MCP tools

If you're connected via MCP, available tools: `list_posts`, `get_post`, `upload_post`, `replace_post`, `delete_post`, `get_post_data`, `set_post_data`.

## Env overrides
- `POST_API_KEY` — API key (fallback if not in config file)
- `POST_URL` — server URL (default https://posthtml.vercel.app)
