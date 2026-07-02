# planToDO Agent Skill

An AI agent can interact with planToDO via its HTTP API.

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

Returns `[{ id, title, b2Key, createdAt, updatedAt }]`.

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

### Delete all plans for this key
```
DELETE /api/plans
x-api-key: <key>
```

## Plan URL

After upload, the plan is viewable at `https://plantodo.vercel.app/p/{id}` (no auth needed).

## CLI

```bash
npm i -g plantodo

ptd setup --key <key>    # save key to ~/.ptd/config.json
ptd upload index.html     # upload and get URL
ptd list                  # list plans
ptd delete <id>           # delete plan
ptd replace <id> file.html # replace content, same URL
```
