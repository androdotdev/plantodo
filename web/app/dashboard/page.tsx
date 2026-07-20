"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient, SessionData } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
import Link from "next/link";
import AgentSetupPrompt from "./components/AgentSetupPrompt";

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
  isPrivate: boolean;
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
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  function runBusy(key: string, fn: () => Promise<void>) {
    setBusy((prev) => ({ ...prev, [key]: true }));
    return fn().finally(() => setBusy((prev) => ({ ...prev, [key]: false })));
  }

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<NewKeyForm>({
    defaultValues: {
      name: "",
      unlimited: false,
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
    await runBusy(`del-plan-${id}`, async () => {
      const res = await fetch(`/api/plans/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
      }
    });
  }

  async function togglePrivate(p: Plan) {
    await runBusy(`toggle-${p.id}`, async () => {
      const res = await fetch(`/api/plans/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrivate: !p.isPrivate }),
      });
      if (res.ok) {
        setPlans((prev) =>
          prev.map((plan) => (plan.id === p.id ? { ...plan, isPrivate: !p.isPrivate } : plan)),
        );
      }
    });
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
    await runBusy(`del-key-${id}`, async () => {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== id));
      }
    });
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-default border-t-text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary"
      style={{
        backgroundImage: `radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    >
      <header className="border-b border-border-default bg-bg-elevated backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/icon.svg" alt="" className="h-6 w-6" />
            <span className="font-semibold text-sm">PostHTML</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden sm:inline text-xs text-text-secondary">{session?.user?.email}</span>
            <button
              onClick={() => authClient.signOut()}
              className="rounded-sm border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 sm:px-8 py-10 space-y-8">
        {/* API Keys Section */}
        <div className="border-b border-border-default pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-sm font-semibold uppercase tracking-wider text-text-primary">API Keys</h1>
            <p className="mt-1 text-xs text-text-secondary">
              Manage your API keys for the CLI and programmatic access.
            </p>
          </div>
        </div>

        {newKey && (
          <div className="rounded-md border border-border-accent bg-bg-accent p-5">
            <p className="text-xs font-medium text-text-accent uppercase tracking-wider">
              Key generated — copy it now. You won&apos;t see it again.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <code className="flex-1 rounded-sm border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary select-all">
                {newKey}
              </code>
              <button
                onClick={() => copy(newKey)}
                className="rounded-sm border border-border-accent px-3 py-2 text-xs font-medium text-text-accent hover:bg-bg-accent transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="rounded-md border border-border-default bg-bg-card p-6">
          <h2 className="text-sm font-medium">Generate New Key</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  {...register("name")}
                  placeholder="Key name (optional)"
                  className="w-full rounded-sm border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-border-hover"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-sm bg-accent px-5 py-2.5 text-sm font-medium text-accent-text hover:bg-accent-hover disabled:opacity-50 transition-colors shrink-0"
              >
                {submitting ? "Generating\u2026" : "Generate Key"}
              </button>
            </div>

            <details className="group">
              <summary className="cursor-pointer text-xs text-text-secondary hover:text-text-primary transition-colors select-none">
                Advanced settings
              </summary>
              <div className="mt-4 space-y-4 pl-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("unlimited")}
                    className="rounded-sm border-border-default bg-bg-elevated text-text-primary focus:ring-border-hover"
                  />
                  <span className="text-sm text-text-primary">Unlimited usage (no cap)</span>
                </label>

                {!unlimited && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-text-muted w-28 shrink-0">Max uses</label>
                    <input
                      type="number"
                      {...register("remaining", { valueAsNumber: true })}
                      min={1}
                      className="w-28 rounded-sm border border-border-default bg-bg-elevated px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-border-hover"
                    />
                  </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("rateLimitEnabled")}
                    className="rounded-sm border-border-default bg-bg-elevated text-text-primary focus:ring-border-hover"
                  />
                  <span className="text-sm text-text-primary">Rate limiting</span>
                </label>

                {rateLimitEnabled && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-text-muted w-28 shrink-0">Max per window</label>
                    <input
                      type="number"
                      {...register("rateLimitMax", { valueAsNumber: true })}
                      min={1}
                      className="w-28 rounded-sm border border-border-default bg-bg-elevated px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-border-hover"
                    />
                    <label className="text-xs text-text-muted">requests per</label>
                    <select
                      {...register("rateLimitTimeWindow", { valueAsNumber: true })}
                      className="rounded-sm border border-border-default bg-bg-elevated px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-border-hover"
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
          {error && <p className="mt-2 text-xs text-text-danger">{error}</p>}
        </div>

        {keys.length === 0 ? (
          <div className="rounded-md border border-border-default p-10 text-center">
            <p className="text-sm text-text-secondary">No API keys yet. Generate one above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {keys.map((k) => (
              <div
                key={k.id}
                className="rounded-md border border-border-default bg-bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="text-sm font-medium truncate">
                      {k.name || <span className="text-text-muted italic">unnamed</span>}
                    </span>
                    <code className="text-xs text-text-muted select-all">
                      {k.start}
                    </code>
                    {k.enabled && (
                      <span className="inline-block px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-bg-accent text-text-accent">
                        active
                      </span>
                    )}
                    {!k.enabled && (
                      <span className="inline-block px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-bg-danger text-text-danger">
                        revoked
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    Created {formatDate(k.createdAt)}
                    {k.lastRequest && ` · Last used ${formatDate(k.lastRequest)}`}
                  </p>
                  {k.remaining !== null && (
                    <p className="mt-0.5 text-xs text-text-muted">
                      {k.remaining} uses remaining
                    </p>
                  )}
                  {k.rateLimitEnabled && (
                    <p className="mt-0.5 text-xs text-text-muted">
                      Rate limit: {k.rateLimitMax}/{formatTimeWindow(k.rateLimitTimeWindow)}
                    </p>
                  )}
                  {k.lastRequest && (
                    <p className="mt-0.5 text-xs text-text-accent">
                      Last action: ptd upload via <span className="font-semibold">{k.name || "unnamed"}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copy(k.start)}
                    className="rounded-sm border border-border-accent px-3 py-1.5 text-xs font-medium text-text-accent hover:bg-bg-accent transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => deleteKey(k.id)}
                    disabled={busy[`del-key-${k.id}`]}
                    className="rounded-sm border border-border-danger px-3 py-1.5 text-xs font-medium text-text-danger hover:bg-bg-danger-hover transition-colors disabled:opacity-50"
                  >
                    {busy[`del-key-${k.id}`] ? "Revoking…" : "Revoke"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Plans Section */}
        <div className="border-b border-border-default pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-primary">Plans</h2>
            <p className="mt-1 text-xs text-text-secondary">
              Your uploaded HTML plans. Deleting a plan breaks its URL.
            </p>
          </div>
          <button
            onClick={async () => {
              if (busy["new-plan"]) return;
              await runBusy("new-plan", async () => {
                const res = await fetch("/api/plans", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ html: "<!DOCTYPE html>\n<html>\n<head><title>Plan</title></head>\n<body>\n\n</body>\n</html>" }),
                });
                if (res.ok) {
                  const { id } = await res.json();
                  router.push(`/plan/edit/${id}`);
                }
              });
            }}
            disabled={busy["new-plan"]}
            className="rounded-sm bg-accent px-4 py-2 text-sm font-medium text-accent-text hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {busy["new-plan"] ? "Creating…" : "New Plan"}
          </button>
        </div>

        {plansLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-default border-t-text-accent" />
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-md border border-border-default p-10 text-center">
            <p className="text-sm text-text-secondary">No plans yet. Click &ldquo;New Plan&rdquo; to create one.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((p) => (
              <div
                key={p.id}
                className="rounded-md border border-border-default bg-bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium truncate">
                      {p.title || <span className="text-text-muted italic">untitled</span>}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {p.id} · Created {formatDate(p.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => togglePrivate(p)}
                    disabled={busy[`toggle-${p.id}`]}
                    className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                      p.isPrivate
                        ? "border-border-accent text-text-accent hover:bg-bg-accent-hover"
                        : "border-border-default text-text-secondary hover:text-text-primary hover:border-border-hover"
                    }`}
                  >
                    {busy[`toggle-${p.id}`] ? "…" : p.isPrivate ? "Private" : "Public"}
                  </button>
                  <button
                    onClick={() => window.open(`/p/${p.id}`, "_blank")}
                    className="rounded-sm border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => router.push(`/plan/edit/${p.id}`)}
                    className="rounded-sm border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deletePlan(p.id)}
                    disabled={busy[`del-plan-${p.id}`]}
                    className="rounded-sm border border-border-danger px-3 py-1.5 text-xs font-medium text-text-danger hover:bg-bg-danger-hover transition-colors disabled:opacity-50"
                  >
                    {busy[`del-plan-${p.id}`] ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agent setup prompt */}
        <div className="rounded-md border border-border-default bg-bg-card p-6">
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-xs">&#9881;</span>
            <h2 className="text-sm font-medium text-text-primary">Agent setup prompt</h2>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
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
