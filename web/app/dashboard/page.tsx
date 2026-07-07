"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
import AgentSetupPrompt from "./components/AgentSetupPrompt";
import { UploadPlan } from "./components/UploadPlan";

interface ApiKey {
  id: string;
  name: string | null;
  start: string;
  remaining: number | null;
  rateLimitEnabled: boolean | null;
  rateLimitMax: number | null;
  rateLimitTimeWindow: number | null;
  expiresAt: string | null;
  lastRequest: string | null;
  createdAt: string;
  enabled: boolean;
}

interface Plan {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface NewKeyForm {
  name: string;
  unlimited: boolean;
  remaining: number;
  rateLimitEnabled: boolean;
  rateLimitMax: number;
  rateLimitTimeWindow: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeWindow(ms: number | null): string {
  if (!ms) return "";
  const hours = ms / 3600000;
  if (hours >= 24) return `${hours / 24}d`;
  return `${hours}h`;
}

export default function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<{ id: string; title: string; html: string } | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<NewKeyForm>({
    defaultValues: {
      name: "",
      unlimited: true,
      remaining: 100,
      rateLimitEnabled: false,
      rateLimitMax: 100,
      rateLimitTimeWindow: 86400000,
    }
  });

  const unlimited = watch("unlimited");
  const rateLimitEnabled = watch("rateLimitEnabled");

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (!data) {
        router.push("/");
      } else {
        setSession(data);
        fetchKeys();
        fetchPlans();
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

  async function fetchPlans() {
    const res = await fetch("/api/plans");
    if (res.ok) {
      const data = await res.json();
      setPlans(data ?? []);
    }
    setPlansLoading(false);
  }

  async function deletePlan(id: string) {
    if (!confirm("Delete this plan? The URL will stop working.")) return;
    const res = await fetch(`/api/plans/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPlans((prev) => prev.filter((p) => p.id !== id));
    }
  }

  async function startReplace(plan: Plan) {
    setShowUpload(false)
    setEditingPlan({ id: plan.id, title: plan.title, html: "" })
    const res = await fetch(`/api/plans/${plan.id}`)
    if (res.ok) {
      const data = await res.json()
      setEditingPlan({ id: plan.id, title: data.title, html: data.html })
    }
  }

  function afterPlanSaved() {
    setEditingPlan(null)
    setShowUpload(false)
    fetchPlans()
  }

  const onSubmit = useCallback(async (data: NewKeyForm) => {
    setSubmitting(true);
    setError(null);
    setNewKey(null);
    try {
      const body: Record<string, unknown> = { name: data.name || undefined };

      if (data.unlimited) {
        body.unlimited = true;
      } else {
        body.unlimited = false;
        body.remaining = data.remaining;
      }

      if (data.rateLimitEnabled) {
        body.rateLimitEnabled = true;
        body.rateLimitMax = data.rateLimitMax;
        body.rateLimitTimeWindow = data.rateLimitTimeWindow;
      } else {
        body.rateLimitEnabled = false;
      }

      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      <header className="border-b border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="" className="h-6 w-6" />
            <span className="font-semibold text-sm">PostHTML</span>
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
        <div>
          <h1 className="text-lg font-semibold">API Keys</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your API keys for the CLI and programmatic access.
          </p>
        </div>

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

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-medium">Generate New Key</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div className="flex items-end gap-3">
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
                {submitting ? "Generating\u2026" : "Generate Key"}
              </button>
            </div>

            <details className="group">
              <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 transition-colors select-none">
                Advanced settings
              </summary>
              <div className="mt-4 space-y-4 pl-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("unlimited")}
                    className="rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-zinc-600"
                  />
                  <span className="text-sm text-zinc-300">Unlimited usage (no cap)</span>
                </label>

                {!unlimited && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-zinc-500 w-28 shrink-0">Max uses</label>
                    <input
                      type="number"
                      {...register("remaining", { valueAsNumber: true })}
                      min={1}
                      className="w-28 rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                    />
                  </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("rateLimitEnabled")}
                    className="rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-zinc-600"
                  />
                  <span className="text-sm text-zinc-300">Rate limiting</span>
                </label>

                {rateLimitEnabled && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-zinc-500 w-28 shrink-0">Max per window</label>
                    <input
                      type="number"
                      {...register("rateLimitMax", { valueAsNumber: true })}
                      min={1}
                      className="w-28 rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                    />
                    <label className="text-xs text-zinc-500">requests per</label>
                    <select
                      {...register("rateLimitTimeWindow", { valueAsNumber: true })}
                      className="rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                    >
                      <option value={3600000}>hour</option>
                      <option value={86400000}>day</option>
                      <option value={604800000}>week</option>
                    </select>
                  </div>
                )}
              </div>
            </details>
          </form>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>

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
                      {k.start}
                    </code>
                  </div>
                  <p className="mt-1 text-xs text-zinc-600">
                    Created {formatDate(k.createdAt)}
                    {k.lastRequest && ` \u00b7 Last used ${formatDate(k.lastRequest)}`}
                  </p>
                  {k.remaining !== null && (
                    <p className="mt-0.5 text-xs text-zinc-600">
                      {k.remaining} uses remaining
                    </p>
                  )}
                  {k.rateLimitEnabled && (
                    <p className="mt-0.5 text-xs text-zinc-600">
                      Rate limit: {k.rateLimitMax}/{formatTimeWindow(k.rateLimitTimeWindow)}
                    </p>
                  )}
                  {!k.enabled && (
                    <p className="mt-0.5 text-xs text-amber-400">Disabled</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copy(k.start)}
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

        {/* Plans */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Plans</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Your uploaded HTML plans. Deleting a plan breaks its URL.
            </p>
          </div>
          <button
            onClick={() => { setShowUpload(true); setEditingPlan(null) }}
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
          >
            New Plan
          </button>
        </div>

        {(showUpload || editingPlan) && (
          <UploadPlan
            key={editingPlan?.id ?? "new"}
            editingPlan={editingPlan}
            onDone={afterPlanSaved}
          />
        )}

        {plansLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 p-8 text-center">
            <p className="text-sm text-zinc-500">No plans yet. Click &ldquo;New Plan&rdquo; to create one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium truncate">
                      {p.title || <span className="text-zinc-500 italic">untitled</span>}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-600">
                    {p.id} &middot; Created {formatDate(p.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => window.open(`/p/${p.id}`, "_blank")}
                    className="rounded border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => startReplace(p)}
                    className="rounded border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => deletePlan(p.id)}
                    className="rounded border border-zinc-800 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:border-red-900/50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agent setup prompt */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
          <h2 className="text-sm font-medium text-zinc-300">Agent setup prompt</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Copy this prompt into your agent&apos;s system configuration.
          </p>
          <div className="mt-4">
            <AgentSetupPrompt apiKey={newKey ?? undefined} />
          </div>
        </div>
      </main>
    </div>
  );
}