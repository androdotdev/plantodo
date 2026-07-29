"use client"

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import type { editor } from "monaco-editor"

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] rounded-sm border border-border-default bg-bg-elevated flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-text-muted" />
      </div>
    ),
  },
)

export function PostEditor({ value, onChange, height = "300px", language = "html", onMount }: {
  value: string
  onChange: (v: string) => void
  height?: string
  language?: string
  onMount?: (editor: editor.IStandaloneCodeEditor) => void
}) {
  return (
    <MonacoEditor
      height={height}
      defaultLanguage={language}
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v ?? "")}
      onMount={(editor) => {
        setTimeout(() => {
          editor.getAction("editor.action.formatDocument")?.run()
        }, 200)
        onMount?.(editor)
      }}
      options={{ minimap: { enabled: false }, fontSize: 13 }}
    />
  )
}
