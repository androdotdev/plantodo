"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data) {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row flex-1 w-full">
      <div className="flex flex-col justify-center px-6 py-12 lg:px-16 lg:py-0 lg:flex-1 bg-zinc-50 dark:bg-zinc-950 lg:border-r border-zinc-200 dark:border-zinc-800">
        <div className="max-w-md mx-auto lg:mx-0">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="PostHTML logo" className="h-10 w-10" />
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              PostHTML
            </h1>
          </div>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Upload HTML plans and get a shareable URL. Manage drafts via the
            CLI or API.
          </p>

          <div className="mt-8 space-y-3">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Quick start</p>
            <code className="block rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 font-mono">
              npm i -g @androff/posthtml-cli &amp;&amp; ptd upload index.html
            </code>
          </div>

          <div className="mt-8 space-y-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">CLI commands</p>
            <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400 font-mono">
              <div>ptd <span className="text-zinc-500">setup</span> <span className="text-zinc-400"># save API key</span></div>
              <div>ptd <span className="text-zinc-500">upload</span> <span className="text-zinc-400">index.html</span></div>
              <div>ptd <span className="text-zinc-500">list</span></div>
              <div>ptd <span className="text-zinc-500">delete</span> <span className="text-zinc-400">&lt;plan-id&gt;</span></div>
              <div>ptd <span className="text-zinc-500">replace</span> <span className="text-zinc-400">&lt;plan-id&gt; &lt;file&gt;</span></div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
            <span>
              <a href="/AGENTS.md" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">Architecture</a>
            </span>
            <span>
              <a href="/llms.txt" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">/llms.txt</a>
            </span>
            <span>
              <a href="/SKILL.md" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">Agent skill</a>
            </span>
          </div>

          <p className="mt-8 text-xs text-zinc-400 leading-relaxed">
            PostHTML stores HTML content directly in the database. Plans are
            publicly viewable at <code className="text-zinc-500">/p/{"{id}"}</code>.
            Authentication via Google OAuth + API keys.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <button
            type="button"
            onClick={() => authClient.signIn.social({ provider: "google" })}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <p className="mt-3 text-xs text-zinc-500 text-center">
            Sign in to generate API keys for the CLI.
          </p>
        </div>
      </div>
    </div>
  );
}