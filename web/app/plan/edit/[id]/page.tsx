"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { PlanEditor } from "@/app/dashboard/components/PlanEditor"
import { ArrowLeft, Save, Edit3 } from "lucide-react"

export default function PlanEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [html, setHtml] = useState("")
  const [titleSaving, setTitleSaving] = useState(false)
  const [htmlSaving, setHtmlSaving] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [htmlError, setHtmlError] = useState<string | null>(null)
  const [titleSaved, setTitleSaved] = useState(false)
  const [htmlSaved, setHtmlSaved] = useState(false)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    authClient.getSession().then(({ data }) => {
      if (!data) {
        router.push("/")
        return
      }
      setSession(data)
      fetch(`/api/plans/${id}`).then((res) => {
        if (!res.ok) {
          router.push("/dashboard")
          return
        }
        res.json().then((data) => {
          setPlan(data)
          setTitle(data.title ?? "")
          setHtml(data.html ?? "")
          setLoading(false)
        })
      })
    })
  }, [id, router])

  async function saveTitle() {
    setTitleSaving(true)
    setTitleError(null)
    setTitleSaved(false)
    try {
      const res = await fetch(`/api/plans/${id}/setting`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "Failed to save title")
      }
      setTitleSaved(true)
      setTimeout(() => setTitleSaved(false), 2000)
    } catch (e) {
      setTitleError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setTitleSaving(false)
    }
  }

  async function saveHtml() {
    setHtmlSaving(true)
    setHtmlError(null)
    setHtmlSaved(false)
    try {
      const res = await fetch(`/api/plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "Failed to save plan")
      }
      setHtmlSaved(true)
      setTimeout(() => setHtmlSaved(false), 2000)
    } catch (e) {
      setHtmlError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setHtmlSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
      </div>
    )
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
        <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3">
              <img src="/icon.svg" alt="" className="h-6 w-6" />
              <span className="font-semibold text-sm">PostHTML</span>
            </a>
            <span className="text-zinc-700 mx-2">/</span>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft size={14} />
              Dashboard
            </button>
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

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Title section */}
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <Edit3 size={18} className="text-zinc-500 shrink-0" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Plan title"
                className="flex-1 bg-transparent text-xl font-semibold text-zinc-100 placeholder-zinc-600 focus:outline-none border-b border-transparent focus:border-zinc-600 pb-1 transition-colors"
              />
            </div>
            <p className="mt-1.5 ml-8 text-xs text-zinc-600">
              {id}
            </p>
          </div>
          <button
            onClick={saveTitle}
            disabled={titleSaving}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors shrink-0"
          >
            <Save size={14} />
            {titleSaving ? "Saving..." : titleSaved ? "Saved!" : "Save Title"}
          </button>
        </div>
        {titleError && <p className="text-xs text-red-400 ml-8">{titleError}</p>}

        {/* HTML editor */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">HTML</span>
            <button
              onClick={saveHtml}
              disabled={htmlSaving}
              className="flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              <Save size={14} />
              {htmlSaving ? "Saving..." : htmlSaved ? "Saved!" : "Save Edit"}
            </button>
          </div>
          <PlanEditor value={html} onChange={setHtml} height="500px" />
          {htmlError && <p className="text-xs text-red-400 px-5 py-2">{htmlError}</p>}
        </div>
      </main>
    </div>
  )
}
