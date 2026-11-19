import Link from 'next/link'

/**
 * Not Found Page for Collections
 *
 * Displayed when a collection with the given ID doesn't exist.
 */
export default function CollectionNotFound() {
  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10">
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <svg
          viewBox="0 0 24 24"
          className="mb-4 h-20 w-20 text-zinc-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <h1 className="mb-2 text-3xl font-bold text-zinc-100">
          Collection not found
        </h1>
        <p className="mb-8 text-lg text-zinc-400">
          The collection you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <div className="flex gap-4">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
          >
            Browse Collections
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/20"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
