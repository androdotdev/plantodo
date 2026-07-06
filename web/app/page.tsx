"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Key, Bot, Link2, Terminal, LayoutDashboard, LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import AgentSetupPrompt from "@/app/dashboard/components/AgentSetupPrompt";

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      setSession(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#09090b] text-zinc-100 font-sans"
      style={{
        backgroundImage: `radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    >
      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        {/* Hero */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <img src="/icon.svg" alt="PostHTML logo" className="h-10 w-10" />
            <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
              PostHTML
            </h1>
          </div>
          <p className="mt-6 text-2xl font-semibold text-zinc-200">
            The HTML sharing tool for AI agents
          </p>
          <p className="mt-3 text-base text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Give your agent the ability to upload, share, and manage HTML plans
            with a single CLI command.
          </p>
        </div>

        {/* CLI install */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-3">
            <Terminal size={14} className="text-zinc-500" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Install</span>
          </div>
          <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 px-5 py-4 text-sm text-zinc-300 font-mono leading-relaxed">
            <code>{`npm i -g @androff/posthtml-cli\nptd upload index.html`}</code>
          </pre>
        </div>

        {/* How it works */}
        <div className="mt-16">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider text-center">
            How it works
          </h2>
          <div className="mt-6 grid gap-4">
            {[
              { icon: Key, title: "Get an API key", desc: "Sign in with Google to generate a key for your agent." },
              { icon: Bot, title: "Give key to your agent", desc: "Configure your agent with ptd setup --key or set PTD_API_KEY." },
              { icon: Link2, title: "Agent creates plans", desc: "Your agent can now upload, list, and manage HTML plans. Each upload returns a shareable URL." },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 shrink-0">
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{step.title}</p>
                    <p className="mt-0.5 text-sm text-zinc-500">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agent setup prompt */}
        <div className="mt-16 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-zinc-400" />
            <h2 className="text-sm font-medium text-zinc-300">Agent setup prompt</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Copy this prompt into your agent&apos;s system configuration.
          </p>
          <div className="mt-4">
            <AgentSetupPrompt />
          </div>
        </div>

        {/* Docs */}
        <div className="mt-16 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-500">
          <a href="/AGENTS.md" className="underline hover:text-zinc-300 transition-colors">
            Architecture
          </a>
          <a href="/SKILL.md" className="underline hover:text-zinc-300 transition-colors">
            Agent skill
          </a>
          <a href="/llms.txt" className="underline hover:text-zinc-300 transition-colors">
            LLM docs
          </a>
        </div>

        {/* CTA */}
        <div className="mt-16 border-t border-zinc-800 pt-10 text-center">
          {session ? (
            <>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center justify-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <LayoutDashboard size={18} />
                Go to Dashboard
              </button>
              <p className="mt-3 text-xs text-zinc-500">
                Manage your API keys and plans.
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => authClient.signIn.social({ provider: "google" })}
                className="inline-flex items-center justify-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <LogIn size={18} />
                Continue with Google
              </button>
              <p className="mt-3 text-xs text-zinc-500">
                Sign in to generate API keys for your agent.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
