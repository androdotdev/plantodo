# posthtml

CLI tool to upload HTML plans and get a shareable URL.

```
npm install -g @androff/posthtml-cli
```

## Usage

```
post setup --key <key>    # save an API key from https://posthtml.vercel.app/dashboard
post upload index.html     # upload a plan → https://posthtml.vercel.app/p/<id>
post list                  # list your plans
post delete <id>           # delete a plan
post replace <id> file.html # replace content, same URL
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `POST_URL` | `http://localhost:3000` | Server base URL |
| `POST_API_KEY` | — | API key (overrides `post setup`) |
| `POSTHTML_API_KEY` | — | Legacy alias for `POST_API_KEY` |
