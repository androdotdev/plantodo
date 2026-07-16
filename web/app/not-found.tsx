import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base px-5 text-center">
      <h1 className="text-3xl font-bold text-text-primary">404</h1>
      <p className="max-w-sm text-sm text-text-secondary">
        The page or plan you&rsquo;re looking for doesn&rsquo;t exist.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-sm border border-border-default px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
      >
        Go home
      </Link>
    </main>
  )
}
