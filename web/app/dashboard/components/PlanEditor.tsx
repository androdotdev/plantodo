"use client"

import dynamic from "next/dynamic"

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

export function PlanEditor({ value, onChange }: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <MonacoEditor
      height="300px"
      defaultLanguage="html"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v ?? "")}
      options={{ minimap: { enabled: false }, fontSize: 13 }}
    />
  )
}
