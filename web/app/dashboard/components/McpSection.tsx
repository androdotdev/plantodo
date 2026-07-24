"use client";

import { useState, useEffect } from "react";
import { Cable } from "lucide-react";

interface McpKey {
  id: string;
  start: string;
  prefix: string;
  createdAt: string;
  enabled: boolean;
}

export default function McpSection() {
  const [mcpKey, setMcpKey] = useState<McpKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newUrl, setNewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/keys");
      if (res.ok) {
        const data = await res.json();
        const mcp = (data.keys ?? []).find(
          (k: McpKey) => k.prefix === "mcp"
        );
        setMcpKey(mcp ?? null);
        setNewUrl(null);
      }
      setLoading(false);
    })();
  }, []);

  async function generateMcpKey() {
    setGenerating(true);
    setError(null);
    setNewUrl(null);

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "MCP connector", purpose: "mcp" }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to generate MCP key");
      }

      const key = await res.json();
      setMcpKey({
        id: key.id,
        start: key.start,
        prefix: "mcp",
        createdAt: new Date().toISOString(),
        enabled: true,
      });
      setNewUrl(key.mcpUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function regenerateMcpKey() {
    if (
      !confirm(
        "Regenerating will disconnect any existing MCP connector using the current URL. Continue?"
      )
    )
      return;

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "MCP connector", purpose: "mcp" }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to generate MCP key");
      }

      const key = await res.json();

      if (mcpKey) {
        await fetch(`/api/keys/${mcpKey.id}`, { method: "DELETE" });
      }

      setMcpKey({
        id: key.id,
        start: key.start,
        prefix: "mcp",
        createdAt: new Date().toISOString(),
        enabled: true,
      });
      setNewUrl(key.mcpUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  const hasUrlToShow = newUrl !== null;

  async function copyUrl() {
    if (!newUrl) return;
    await navigator.clipboard.writeText(newUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-4">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-default border-t-text-accent" />
        <span className="text-xs text-text-secondary">Loading MCP config...</span>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-border-default pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-sm font-semibold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Cable size={16} /> MCP Server <span className="text-[10px] font-bold uppercase tracking-wider bg-bg-accent text-text-accent px-1.5 py-0.5 rounded-sm">Beta</span>
          </h1>
          <p className="mt-1 text-xs text-text-secondary">
            Use this URL to connect PostHTML to any MCP-compatible client (Claude Desktop, Cursor, etc.).
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-border-danger bg-bg-danger p-4">
          <p className="text-xs text-text-danger">{error}</p>
        </div>
      )}

      <div className="rounded-md border border-border-default bg-bg-card p-6 space-y-4">
        {hasUrlToShow ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-sm border border-border-default bg-bg-elevated px-3 py-2.5 text-sm text-text-primary select-all break-all">
              {newUrl}
            </code>
            <button
              onClick={copyUrl}
              className="rounded-sm border border-border-default bg-bg-card px-4 py-2.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors shrink-0"
            >
              {copied ? "Copied!" : "Copy URL"}
            </button>
          </div>
        ) : mcpKey ? (
          <p className="text-xs text-text-muted leading-relaxed">
            An MCP key already exists <span className="text-text-primary">(starts with <code className="text-text-primary">{mcpKey.start}</code>)</span>.
            The full URL was only shown once at creation. Click{" "}
            <span className="text-text-accent">Regenerate</span> below to get a new one.
          </p>
        ) : (
          <p className="text-xs text-text-muted">
            No MCP URL generated yet. Click below to create one.
          </p>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-border-default">
          <button
            onClick={generateMcpKey}
            disabled={generating}
            className="rounded-sm bg-accent px-4 py-2 text-xs font-medium text-accent-text hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {generating ? "Generating..." : mcpKey ? "Generate New URL" : "Generate URL"}
          </button>
          {mcpKey && (
            <button
              onClick={regenerateMcpKey}
              disabled={generating}
              className="rounded-sm border border-border-danger px-4 py-2 text-xs font-medium text-text-danger hover:bg-bg-danger disabled:opacity-50 transition-colors"
            >
              Regenerate
            </button>
          )}
        </div>
      </div>

      {newUrl && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-text-secondary hover:text-text-primary transition-colors select-none">
            How to use
          </summary>
          <div className="mt-3 rounded-md border border-border-default bg-bg-card p-4 space-y-2">
            <p className="text-xs text-text-secondary">
              <span className="text-text-primary">Claude Desktop:</span> Add to your{" "}
              <code className="text-text-primary">claude_desktop_config.json</code>
            </p>
            <pre className="rounded-sm border border-border-default bg-bg-elevated p-3 text-xs text-text-primary overflow-x-auto">
{`{
  "mcpServers": {
    "posthtml": {
      "url": "${newUrl}"
    }
  }
}`}
            </pre>
            <p className="text-xs text-text-danger mt-2">
              ⚠ Regenerating the URL will disconnect any active connector using it.
            </p>
          </div>
        </details>
      )}
    </>
  );
}
