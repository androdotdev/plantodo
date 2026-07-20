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
- ptd upload <file> [--data '<json>' | --data-file x.json] [--private|--public]  — upload, get {id,url}
- ptd list / ptd ls            — list plans
- ptd delete <id>             — delete a plan
- ptd replace <id> <file>      — update content (same URL)
- ptd data get <id>            — read a plan's JSON data
- ptd data set <id> --key <k> --value '<json>'   — merge one key
- ptd data set <id> --file x.json                — merge whole file

## Reference docs
>>> MANDATORY: read /SKILL.md before performing any action. It is the authoritative guide (privacy, data merge, rate limits).`;

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
