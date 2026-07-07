"use client";

import { useState } from "react";

interface AgentSetupPromptProps {
  apiKey?: string;
}

export default function AgentSetupPrompt({ apiKey }: AgentSetupPromptProps) {
  const keyText = apiKey || "YOUR_API_KEY_HERE";
  const [copied, setCopied] = useState(false);

  const prompt = `You have access to PostHTML — a service that uploads HTML plans and returns shareable URLs.

## Setup
The human has provided you with an API key.

### Option A: Environment variables (recommended)
PTD_API_KEY=${keyText}

### Option B: CLI config file
npm i -g @androff/posthtml-cli
ptd setup --key ${keyText}

The config file (~/.ptd/config.json) stores the key as "api_key".

## CLI commands
- ptd upload <file>      — upload HTML, get back { id, url }
- ptd list or ptd ls     — list plans
- ptd delete <id>        — delete a plan
- ptd replace <id> <file> — update content, same URL

## Plan URLs
Uploaded plans are publicly viewable at /p/{id} on the server.

## Reference docs
- /SKILL.md — agent skill guide
- /llms.txt — LLM-friendly docs
- /AGENTS.md — architecture`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <details className="group">
      <summary className="cursor-pointer text-xs text-text-secondary hover:text-text-primary transition-colors select-none">
        Show setup prompt
      </summary>
      <div className="mt-4 relative">
        <pre className="overflow-x-auto rounded-sm border border-border-default bg-bg-elevated p-4 text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
          <code>{prompt}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 rounded-sm border border-border-default bg-bg-card px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
        >
          {copied ? "Copied!" : "Copy prompt"}
        </button>
      </div>
    </details>
  );
}
