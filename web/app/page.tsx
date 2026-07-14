"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Terminal, LayoutDashboard, LogIn } from "lucide-react";
import { authClient, SessionData } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      setSession(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-default border-t-text-accent" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-bg-base text-text-primary"
      style={{
        backgroundImage: `radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    >
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        {/* Hero */}
        <div className="text-center border-b border-border-default pb-8 mb-12">
          <div className="flex items-center justify-center gap-3">
            <img src="/icon.svg" alt="PostHTML logo" className="h-10 w-10" />
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              PostHTML
            </h1>
          </div>
          <p className="mt-4 text-sm text-text-secondary">
            The HTML sharing tool for AI agents
          </p>
          <p className="mt-3 text-xs text-text-muted max-w-lg mx-auto leading-relaxed">
            Give your agent the ability to upload, share, and manage HTML plans
            with a single CLI command.
          </p>
        </div>

        {/* Terminal install block */}
        <div className="rounded-md border border-border-default bg-bg-card p-6 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Terminal size={14} className="text-text-secondary" />
            <span className="text-xs text-text-secondary uppercase tracking-wider">Install</span>
          </div>
          <div className="font-mono text-sm leading-relaxed">
            <p><span className="text-text-muted">$</span> <span className="text-text-primary">npm i -g @androff/posthtml-cli</span></p>
            <p className="mt-1"><span className="text-text-muted">$</span> <span className="text-text-primary">ptd upload <span className="text-text-accent">index.html</span></span></p>
          </div>
        </div>

        {/* Numbered steps */}
        <div className="mb-12 space-y-10">
          {[
            {
              num: "01",
              title: "Get an API key",
              desc: "Sign in with Google to generate a key for your agent.",
              code: "ptd setup --key ptd_xxx",
            },
            {
              num: "02",
              title: "Configure your agent",
              desc: "Set the API key as an environment variable.",
              code: 'export PTD_API_KEY="ptd_..."',
            },
            {
              num: "03",
              title: "Upload & share plans",
              desc: "Your agent can now upload HTML plans and get shareable URLs instantly.",
              code: "ptd upload plan.html",
            },
          ].map((step, i) => (
            <div key={i} className="flex gap-5">
              <span className="text-text-muted text-sm font-semibold w-8 shrink-0">
                {step.num}
              </span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-text-primary">{step.title}</h3>
                <p className="mt-1 text-xs text-text-secondary leading-relaxed">{step.desc}</p>
                <div className="mt-2 rounded-sm border-l-2 border-border-accent bg-bg-elevated py-2 px-3 font-mono text-xs text-text-accent">
                  {step.code}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Execution output */}
        <div className="rounded-md border border-border-default bg-bg-card p-6 mb-12">
          <div className="font-mono text-xs leading-relaxed space-y-1.5">
            <p><span className="text-text-muted">$</span> <span className="text-text-primary">ptd upload <span className="text-text-accent">workflow.html</span></span></p>
            <p className="text-text-muted">→ Validating HTML structure...</p>
            <p className="text-text-accent">✓ Valid markup</p>
            <p className="text-text-muted">→ Uploading to PostHTML...</p>
            <p className="text-text-accent">✓ Upload complete</p>
            <p className="mt-2"><span className="text-text-accent">Plan URL:</span> <span className="text-text-primary">https://posthtml.vercel.app/p/xyz789</span></p>
            <p><span className="text-text-accent">Shareable:</span> <span className="inline-block px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-bg-accent text-text-accent ml-1">public</span></p>
          </div>
        </div>

        {/* Docs links */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-text-secondary">
          <a href="/SKILL.md" className="underline hover:text-text-accent transition-colors">
            Agent skill
          </a>
          <a href="/llms.txt" className="underline hover:text-text-accent transition-colors">
            LLM docs
          </a>
        </div>

        {/* CTA */}
        <div className="mt-12 border-t border-border-default pt-8 text-center">
          {session ? (
            <>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center justify-center gap-3 rounded-sm border border-border-default bg-bg-card px-6 py-3 text-sm text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
              >
                <LayoutDashboard size={18} />
                Go to Dashboard
              </button>
              <p className="mt-3 text-xs text-text-muted">
                Manage your API keys and plans.
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => authClient.signIn.social({ provider: "google" })}
                className="rounded-sm bg-accent px-6 py-3 text-sm font-medium text-accent-text hover:bg-accent-hover transition-colors"
              >
                <span className="flex items-center justify-center gap-3">
                  <LogIn size={18} />
                  <span>Continue with Google</span>
                </span>
              </button>
              <p className="mt-3 text-xs text-text-muted">
                Sign in to generate API keys for your agent.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
