import Link from 'next/link'

/**
 * Shown when `notFound()` is called from the media detail page (unknown id).
 * Keeps the user on a branded page with a clear way back to the catalog.
 */
export default function MediaNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-accent">
        404
      </p>
      <h1 className="mt-2 text-2xl font-bold text-white">Title not found</h1>
      <p className="mt-2 text-sm text-white/60">
        We couldn&apos;t find that title. It may have been removed, or the link
        is incorrect.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/85"
      >
        Back to browse
      </Link>
    </main>
  )
}
