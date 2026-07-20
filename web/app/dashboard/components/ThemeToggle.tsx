"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="flex items-center gap-1.5 rounded-sm border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
    >
      {resolvedTheme ? (isDark ? <Sun size={14} /> : <Moon size={14} />) : <Moon size={14} />}
      {resolvedTheme ? (isDark ? "Light" : "Dark") : "Theme"}
    </button>
  );
}
