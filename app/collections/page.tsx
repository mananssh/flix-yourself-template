import Link from 'next/link'

import { CollectionCard } from '@/components/catalog/CollectionCard'
import { getCatalog } from '@/lib/catalog'

export const dynamic = 'force-dynamic'

/**
 * Collections Browse Page
 *
 * Displays a grid of all collections. Each collection card shows a preview
 * grid of poster thumbnails, the collection name, description, and item count.
 */
export default async function CollectionsPage() {
  const catalog = await getCatalog()
  const collections = await catalog.getCollections()

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10">
      <header className="mb-8 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
              Collections
            </h1>
            <p className="mt-2 text-lg text-zinc-400">
              Curated selections of movies and shows
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/20"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Browse
          </Link>
        </div>
      </header>

      <section>
        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              viewBox="0 0 24 24"
              className="mb-4 h-16 w-16 text-zinc-600"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <h2 className="mb-2 text-xl font-semibold text-zinc-300">
              No collections available yet
            </h2>
            <p className="mb-6 text-zinc-500">
              Collections will appear here once created
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
