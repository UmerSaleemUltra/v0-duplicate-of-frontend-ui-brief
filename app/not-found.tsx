import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="max-w-md text-muted-foreground">The page you requested does not exist.</p>
      <Link className="rounded-md bg-primary px-4 py-2 text-primary-foreground" href="/">
        Return home
      </Link>
    </main>
  )
}
