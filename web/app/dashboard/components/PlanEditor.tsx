"use client"

import dynamic from "next/dynamic"
import type { editor } from "monaco-editor"

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] bg-zinc-900 rounded-lg animate-pulse flex items-center justify-center text-zinc-500 text-sm">
        Loading editor...
      </div>
    ),
  },
)

export function PlanEditor({ value, onChange, height = "300px", onMount }: {
  value: string
  onChange: (v: string) => void
  height?: string
  onMount?: (editor: editor.IStandaloneCodeEditor) => void
}) {
  return (
    <MonacoEditor
      height={height}
      defaultLanguage="html"
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
