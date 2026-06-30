"use client";

import { useState } from "react";

export default function Home() {
  const [keyName, setKeyName] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateKey() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      setApiKey(data.key ?? data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  const prompt = `You are connected to the planToDO API.

Your API key: ${apiKey ?? "<your-key>"}

## CLI Usage

\`\`\`bash
# Upload a plan
ptd upload index.html

# List your plans
ptd ls

# Replace a plan's HTML
ptd replace <plan-id> <new-index.html>

# Delete a plan
ptd del <plan-id>
\`\`\`

## API Endpoints

Base URL: \`https://plantodo.vercel.app\`

All requests require \`Authorization: Bearer <key>\`.

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/plans | Upload plan HTML |
| GET | /api/plans | List your plans |
| DELETE | /api/plans/:id | Delete one plan |
| DELETE | /api/plans | Delete all plans |

**POST /api/plans** expects JSON body: \`{ "html": "<!DOCTYPE html>…", "slug?": "my-plan", "title?": "My Plan" }\`.
Returns \`{ "url": "https://plantodo.vercel.app/p/my-plan", "id": "abc123" }\`.

Slug rules: \`/^[a-z0-9-]{1,48}$/\`. Auto-generated as nanoid(8) if omitted.`;

  return (
    <div className="flex flex-col items-center flex-1 w-full">
      {/* Hero */}
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            planToDO
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Upload HTML plans &mdash; get a shareable URL. Manage drafts via
            CLI or API.
          </p>
          <code className="mt-6 inline-block rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 font-mono">
            npm i -g plantodo &amp;&amp; ptd upload index.html
          </code>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-2xl px-6 py-12 space-y-10">
        {/* API Key Generator */}
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Generate an API Key
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Create a key to use with the CLI or API.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Key name (optional)"
              className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
            />
            <button
              onClick={generateKey}
              disabled={generating}
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors shrink-0"
            >
              {generating ? "Generating…" : "Generate Key"}
            </button>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {apiKey && (
            <div className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Your API Key
              </label>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm font-mono text-zinc-800 dark:text-zinc-200 select-all">
                  {apiKey}
                </code>
                <button
                  onClick={() => copy(apiKey)}
                  className="shrink-0 rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                ⓘ This is the only time you&apos;ll see it. Save it securely.
              </p>
            </div>
          )}
        </section>

        {/* Agent Prompt */}
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Agent Instructions
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Copy this prompt to give an AI agent access to your drafts.
          </p>

          <div className="mt-6">
            <pre className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4 text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 font-mono whitespace-pre-wrap">
              {prompt}
            </pre>
          </div>

          <button
            onClick={() => copy(prompt)}
            className="mt-4 rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Copy Prompt
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
        planToDO
      </footer>
    </div>
  );
}
