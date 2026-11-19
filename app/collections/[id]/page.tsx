import Link from 'next/link'
import { notFound } from 'next/navigation'

import { MediaGrid } from '@/components/catalog/MediaGrid'
import { getCatalog } from '@/lib/catalog'

export const dynamic = 'force-dynamic'

/**
 * Collection Detail Page
 *
 * Displays a single collection with all its media items in a grid.
 * Shows the collection name, description, item count, and a media grid.
 */
export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const catalog = await getCatalog()
  const collection = await catalog.getMediaByCollection(id)

  if (!collection) {
    notFound()
  }

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10">
      <header className="mb-8 space-y-4">
        {/* Back button */}
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100"
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
          Back to Collections
        </Link>

        {/* Collection info */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
              {collection.name}
            </h1>
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm font-medium text-zinc-400">
              {collection.itemCount} {collection.itemCount === 1 ? 'title' : 'titles'}
            </span>
          </div>
          {collection.description && (
            <p className="text-lg leading-relaxed text-zinc-300">
              {collection.description}
            </p>
          )}
        </div>
      </header>

      <section>
        {collection.media.length === 0 ? (
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
              <path d="M9 13h6m-3-3v6m5 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
            </svg>
            <h2 className="mb-2 text-xl font-semibold text-zinc-300">
              This collection is empty
            </h2>
            <p className="mb-6 text-zinc-500">
              No titles have been added to this collection yet
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
            >
              Back to Collections
            </Link>
          </div>
        ) : (
          <MediaGrid
            media={collection.media}
            emptyMessage="This collection has no items."
          />
        )}
      </section>
    </main>
  )
}
