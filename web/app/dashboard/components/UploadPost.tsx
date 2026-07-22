"use client"

import { useState } from "react"
import { PostEditor } from "./PostEditor"

interface UploadPostProps {
  onDone: () => void
  editingPost?: { id: string; title: string; html: string } | null
}

export function UploadPost({ onDone, editingPost }: UploadPostProps) {
  const [title, setTitle] = useState(editingPost?.title ?? "")
  const [html, setHtml] = useState(editingPost?.html ?? "<!DOCTYPE html>\n<html>\n<head><title>Post</title></head>\n<body>\n\n</body>\n</html>")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      if (editingPost) {
        const res = await fetch(`/api/posts/${editingPost.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html }),
        })
        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? "Failed to save")
        }
      } else {
        const res = await fetch("/api/posts", {
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
        {editingPost ? `Replace: ${editingPost.title || editingPost.id}` : "Upload New Post"}
      </h2>

      {!editingPost && (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title (optional)"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        />
      )}

      <PostEditor value={html} onChange={setHtml} />

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
          {saving ? "Saving\u2026" : editingPost ? "Save" : "Upload"}
        </button>
      </div>
    </div>
  )
}
