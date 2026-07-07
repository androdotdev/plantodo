"use client"

import { useState } from "react"
import { PlanEditor } from "./PlanEditor"

interface UploadPlanProps {
  onDone: () => void
  editingPlan?: { id: string; title: string; html: string } | null
}

export function UploadPlan({ onDone, editingPlan }: UploadPlanProps) {
  const [title, setTitle] = useState(editingPlan?.title ?? "")
  const [html, setHtml] = useState(editingPlan?.html ?? "<!DOCTYPE html>\n<html>\n<head><title>Plan</title></head>\n<body>\n\n</body>\n</html>")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      if (editingPlan) {
        const res = await fetch(`/api/plans/${editingPlan.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html }),
        })
        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? "Failed to save")
        }
      } else {
        const res = await fetch("/api/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html, title: title || undefined }),
        })
        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? "Failed to upload")
        }
      }
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
      <h2 className="text-sm font-medium">
        {editingPlan ? `Replace: ${editingPlan.title || editingPlan.id}` : "Upload New Plan"}
      </h2>

      {!editingPlan && (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Plan title (optional)"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        />
      )}

      <PlanEditor value={html} onChange={setHtml} />

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center gap-3 justify-end">
        <button
          onClick={onDone}
          className="rounded border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving\u2026" : editingPlan ? "Save" : "Upload"}
        </button>
      </div>
    </div>
  )
}
