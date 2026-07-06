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
The human has provided you with an API key. Set it as your environment:
PTD_API_KEY=${keyText}

You can also configure the CLI tool:
npm i -g @androff/posthtml-cli
ptd setup --key ${keyText}

## CLI commands available to you
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
      <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 transition-colors select-none">
        Show setup prompt
      </summary>
      <div className="mt-4 relative">
        <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
          <code>{prompt}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 rounded border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
        >
          {copied ? "Copied!" : "Copy prompt"}
        </button>
      </div>
    </details>
  );
}
