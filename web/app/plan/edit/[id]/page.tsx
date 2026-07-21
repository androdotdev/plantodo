"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient, SessionData } from "@/lib/auth-client";
import { usePlansStore } from "@/lib/plans-store";
import { PlanEditor } from "@/app/dashboard/components/PlanEditor";
import { ArrowLeft, Save, Edit3, FileCode, Database } from "lucide-react";
import Link from "next/link";

type Tab = "html" | "data";

export default function PlanEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("html");
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [data, setData] = useState("{}");
  const [titleSaving, setTitleSaving] = useState(false);
  const [htmlSaving, setHtmlSaving] = useState(false);
  const [dataSaving, setDataSaving] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [htmlError, setHtmlError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [titleSaved, setTitleSaved] = useState(false);
  const [htmlSaved, setHtmlSaved] = useState(false);
  const [dataSaved, setDataSaved] = useState(false);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    authClient.getSession().then(({ data }) => {
      if (!data) {
        router.push("/");
        return;
      }
      setSession(data);

      // Prefer store (populated by dashboard) to avoid a redundant refetch.
      const cached = usePlansStore.getState().getDetail(id);
      if (cached) {
        setTitle(cached.title ?? "");
        setHtml(cached.html ?? "");
        setData(JSON.stringify(cached.data ?? {}, null, 2));
        setLoading(false);
        return;
      }

      fetch(`/api/plans/${id}`).then((res) => {
        if (!res.ok) {
          router.push("/dashboard");
          return;
        }
        res.json().then((data) => {
          setTitle(data.title ?? "");
          setHtml(data.html ?? "");
          setData(JSON.stringify(data.data ?? {}, null, 2));
          usePlansStore.getState().setDetail({
            id,
            title: data.title ?? "",
            html: data.html ?? "",
            data: data.data ?? {},
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            isPrivate: data.isPrivate ?? false,
          });
          setLoading(false);
        });
      });
    });
  }, [id, router]);

  async function saveData() {
    setDataSaving(true);
    setDataError(null);
    setDataSaved(false);
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      setDataError("Invalid JSON — fix syntax before saving");
      setDataSaving(false);
      return;
    }
    try {
      const res = await fetch(`/api/plans/${id}/data`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: parsed }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to save data");
      }
      setDataSaved(true);
      if (id) usePlansStore.getState().patchDetail(id, { data: parsed as Record<string, unknown> });
      setTimeout(() => setDataSaved(false), 2000);
    } catch (e) {
      setDataError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setDataSaving(false);
    }
  }

  async function saveTitle() {
    setTitleSaving(true);
    setTitleError(null);
    setTitleSaved(false);
    try {
      const res = await fetch(`/api/plans/${id}/setting`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to save title");
      }
      setTitleSaved(true);
      if (id) usePlansStore.getState().patchDetail(id, { title });
      setTimeout(() => setTitleSaved(false), 2000);
    } catch (e) {
      setTitleError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setTitleSaving(false);
    }
  }

  async function saveHtml() {
    setHtmlSaving(true);
    setHtmlError(null);
    setHtmlSaved(false);
    try {
      const res = await fetch(`/api/plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to save plan");
      }
      setHtmlSaved(true);
      if (id) usePlansStore.getState().patchDetail(id, { html });
      setTimeout(() => setHtmlSaved(false), 2000);
    } catch (e) {
      setHtmlError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setHtmlSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-default border-t-text-accent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary"
      style={{
        backgroundImage: `radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    >
      {/* Header */}
      <header className="border-b border-border-default bg-bg-elevated backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <img src="/icon.svg" alt="" className="h-6 w-6" />
              <span className="font-semibold text-sm">PostHTML</span>
            </Link>
            <span className="text-text-muted mx-2">/</span>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={14} />
              Dashboard
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
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

      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-8 space-y-6">
        {/* Title section */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <Edit3 size={18} className="text-text-muted shrink-0" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Plan title"
                className="flex-1 bg-transparent text-xl font-semibold text-text-primary placeholder-text-muted focus:outline-none border-b border-transparent focus:border-border-hover pb-1 transition-colors"
              />
            </div>
            <p className="mt-1.5 ml-8 text-xs text-text-muted">
              {id}
            </p>
          </div>
          <button
            onClick={saveTitle}
            disabled={titleSaving}
            className="flex items-center justify-center gap-2 rounded-sm border border-border-default bg-bg-card px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border-hover disabled:opacity-50 transition-colors shrink-0"
          >
            <Save size={14} />
            {titleSaving ? "Saving..." : titleSaved ? "Saved!" : "Save Title"}
          </button>
        </div>
        {titleError && <p className="text-xs text-text-danger ml-8">{titleError}</p>}

        {/* File tabs (VS Code-like) */}
        <div className="rounded-md border border-border-default bg-bg-card overflow-hidden">
          <div className="flex items-center justify-between px-3 border-b border-border-default bg-bg-elevated">
            <div className="flex">
              <button
                onClick={() => setTab("html")}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 -mb-px transition-colors ${
                  tab === "html"
                    ? "border-border-accent text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                <FileCode size={14} />
                index.html
              </button>
              <button
                onClick={() => setTab("data")}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 -mb-px transition-colors ${
                  tab === "data"
                    ? "border-border-accent text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                <Database size={14} />
                data.json
              </button>
            </div>
            {tab === "html" ? (
              <button
                onClick={saveHtml}
                disabled={htmlSaving}
                className="flex items-center gap-2 rounded-sm bg-accent px-4 py-1.5 text-sm font-medium text-accent-text hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                <Save size={14} />
                {htmlSaving ? "Saving..." : htmlSaved ? "Saved!" : "Save HTML"}
              </button>
            ) : (
              <button
                onClick={saveData}
                disabled={dataSaving}
                className="flex items-center gap-2 rounded-sm bg-accent px-4 py-1.5 text-sm font-medium text-accent-text hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                <Save size={14} />
                {dataSaving ? "Saving..." : dataSaved ? "Saved!" : "Save Data"}
              </button>
            )}
          </div>

          {tab === "html" ? (
            <>
              <PlanEditor value={html} onChange={setHtml} height="500px" />
              {htmlError && <p className="text-xs text-text-danger px-5 py-2">{htmlError}</p>}
            </>
          ) : (
            <>
              <PlanEditor value={data} onChange={setData} language="json" height="500px" />
              {dataError && <p className="text-xs text-text-danger px-5 py-2">{dataError}</p>}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
