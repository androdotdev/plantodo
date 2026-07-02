# planToDO Agent Skill

An AI agent can interact with planToDO via its HTTP API.

## Authentication

All plan API requests require `Authorization: Bearer <key>` header.
Get a key from the dashboard at `/dashboard`.

## Available Commands

### Upload a plan
```
POST /api/plans
Authorization: Bearer <key>
Content-Type: application/json

{ "html": "<!DOCTYPE html>…", "title?": "My Plan" }
```

### List plans
```
GET /api/plans
Authorization: Bearer <key>
```

### Delete one plan
```
DELETE /api/plans/:id
Authorization: Bearer <key>
```

### Delete all plans
```
DELETE /api/plans
Authorization: Bearer <key>
```

## Plan URL

After upload, the plan is available at `https://plantodo.vercel.app/p/{id}`.
