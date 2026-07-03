"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useForm } from "react-hook-form";

interface ApiKey {
  id: string;
  name: string | null;
  key: string;
  start: string;
  lastRequest: string | null;
  createdAt: string;
  enabled: boolean;
}

interface NewKeyForm {
  name: string;
}
function maskKey(key: string): string {
  if (key.length <= 10) return key;
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewKeyForm>();

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (!data) {
        router.push("/");
      } else {
        setSession(data);
        fetchKeys();
      }
    });
  }, [router]);

  async function fetchKeys() {
    const res = await fetch("/api/keys");
    if (res.ok) {
      const data = await res.json();
      setKeys(data.keys ?? []);
    }
    setLoading(false);
  }

  const onSubmit = useCallback(async (data: NewKeyForm) => {
    setSubmitting(true);
    setError(null);
    setNewKey(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name || undefined }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to generate key");
      }
      const key = await res.json();
      setNewKey(key.key);
      reset();
      fetchKeys();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }, [reset]);

  async function deleteKey(id: string) {
    if (!confirm("Revoke this key? Any service using it will lose access.")) return;
    const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
    if (res.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== id));
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans"
      style={{
        backgroundImage: `radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    >
      {/* Header */}
      <header className="border-b border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="" className="h-6 w-6" />
            <span className="font-semibold text-sm">planToDO</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500">{session?.user?.email}</span>
            <button
              onClick={() => authClient.signOut()}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        {/* Page title */}
        <div>
          <h1 className="text-lg font-semibold">API Keys</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your API keys for the CLI and programmatic access.
          </p>
        </div>

        {/* New key banner */}
        {newKey && (
          <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 p-4">
            <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              Key generated — copy it now. You won&apos;t see it again.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-200 select-all">
                {newKey}
              </code>
              <button
                onClick={() => copy(newKey)}
                className="shrink-0 rounded border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Generate form */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-medium">Generate New Key</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex items-end gap-3">
            <div className="flex-1">
              <input
                type="text"
                {...register("name")}
                placeholder="Key name (optional)"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 transition-colors shrink-0"
            >
              {submitting ? "Generating…" : "Generate Key"}
            </button>
          </form>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>

        {/* Keys list */}
        {keys.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 p-8 text-center">
            <p className="text-sm text-zinc-500">No API keys yet. Generate one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((k) => (
              <div
                key={k.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium truncate">
                      {k.name || <span className="text-zinc-500 italic">unnamed</span>}
                    </span>
                    <code className="text-xs font-mono text-zinc-500 select-all">
                      {k.key.length > 10 ? maskKey(k.key) : k.key}
                    </code>
                  </div>
                  <p className="mt-1 text-xs text-zinc-600">
                    Created {formatDate(k.createdAt)}
                    {k.lastRequest && ` · Last used ${formatDate(k.lastRequest)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copy(k.key)}
                    className="rounded border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => deleteKey(k.id)}
                    className="rounded border border-zinc-800 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:border-red-900/50 transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
