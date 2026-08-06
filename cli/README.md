# @androff/posthtml-cli

CLI tool to upload HTML posts and get a shareable URL.

```
npm install -g @androff/posthtml-cli
```

## Setup

```bash
# Interactive — prompts for key, input is hidden
post setup

# Non-interactive (env var is safer than --key on multi-user systems)
POST_API_KEY=post_xxx post setup
```

Get your API key from: [posthtml.vercel.app/dashboard](https://posthtml.vercel.app/dashboard)

Configuration saved to `~/.post/config.json` (owner read/write only).

## Commands

### `post upload <file>`

Upload an HTML or Markdown file as a new post.

```bash
post upload index.html
post upload index.html --private                    # owner-only access
post upload README.md --mark                        # Markdown → HTML server-side
post upload index.html --data '{"status":"draft"}'  # attach JSON data
post upload index.html --data-file meta.json        # merge data from file
```

| Option | Description |
|---|---|
| `-d, --data <json>` | JSON data string to merge into post.data |
| `--data-file <path>` | JSON file to merge into post.data |
| `--mark` | Treat the file as Markdown (converted to HTML server-side) |
| `--private` | Restrict to owner-only access |
| `--public` | Make shareable (default) |

### `post list` / `post ls`

List your posts.

```bash
post list
post ls
```

### `post replace <id> <file>`

Replace an existing post's HTML while preserving its ID and URL. Accepts Markdown with `--mark`.

```bash
post replace abc123 index.html
post replace abc123 README.md --mark
post replace abc123 index.html --private
post replace abc123 index.html --public
```

| Option | Description |
|---|---|
| `--mark` | Treat the file as Markdown (converted to HTML server-side) |
| `--private` | Restrict to owner-only access |
| `--public` | Make shareable (default) |

### `post delete <id>`

Delete a post.

```bash
post delete abc123
```

### `post data get <id>`

Get the JSON data attached to a post.

```bash
post data get abc123
```

### `post data set <id>`

Merge JSON data into a post. Provide either `--key` + `--value` (one key) or `--file` (whole object).

```bash
# Set a single key
post data set abc123 --key status --value '"draft"'

# Merge entire JSON file
post data set abc123 --file meta.json
```

| Option | Description |
|---|---|
| `-k, --key <key>` | JSON key to set |
| `-v, --value <value>` | JSON value (required with `--key`) |
| `-f, --file <path>` | JSON file to merge (whole object) |

### `post setup`

Save your API key to `~/.post/config.json`.

```bash
post setup
post setup --key post_xxx    # pass directly (avoid on shared systems)
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `POST_URL` | `https://posthtml.vercel.app` | Server base URL (used if not set in config file) |
| `POST_API_KEY` | — | API key (used if no config file exists) |
| `POSTHTML_API_KEY` | — | Legacy alias for `POST_API_KEY` |

Priority: config file (`~/.post/config.json`) > `POST_API_KEY` > `POSTHTML_API_KEY` > error.
`post setup` itself resolves `--key` > `POST_API_KEY` > `POSTHTML_API_KEY` > interactive prompt.
