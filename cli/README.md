# posthtml

CLI tool to upload HTML plans and get a shareable URL.

```
npm install -g posthtml
```

## Usage

```
ptd setup --key <key>    # save an API key from https://posthtml.vercel.app/dashboard
ptd upload index.html     # upload a plan → https://posthtml.vercel.app/p/<id>
ptd list                  # list your plans
ptd delete <id>           # delete a plan
ptd replace <id> file.html # replace content, same URL
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PTD_URL` | `http://localhost:3000` | Server base URL |
| `PTD_API_KEY` | — | API key (overrides `ptd setup`) |
| `PLANTODO_API_KEY` | — | Legacy alias for `PTD_API_KEY` |
