import Image from 'next/image'
import Link from 'next/link'

interface CollectionCardProps {
  collection: {
    id: string
    name: string
    description: string | null
    itemCount: number
    previewItems?: Array<{ posterUrl: string | null }>
  }
}

/**
 * A collection card showing the collection name, description, item count,
 * and a preview grid of poster images. Clicking navigates to the collection
 * detail page.
 */
export function CollectionCard({ collection }: CollectionCardProps) {
  const previewImages = collection.previewItems
    ?.slice(0, 4)
    .map((item) => item.posterUrl)
    .filter(Boolean) as string[] | undefined

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`View ${collection.name} collection`}
    >
      <article className="h-full overflow-hidden rounded-lg bg-zinc-900 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-2xl">
        {/* Thumbnail grid preview */}
        <div className="relative aspect-video overflow-hidden bg-zinc-800">
          {previewImages && previewImages.length > 0 ? (
            <div
              className={`grid h-full ${
                previewImages.length === 1
                  ? 'grid-cols-1'
                  : previewImages.length === 2
                    ? 'grid-cols-2'
                    : previewImages.length === 3
                      ? 'grid-cols-3'
                      : 'grid-cols-2 grid-rows-2'
              } gap-1 p-2`}
            >
              {previewImages.map((url, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden rounded bg-zinc-700"
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="h-16 w-16 text-zinc-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" />
                <path d="M16 3v4M8 3v4M2 11h20" />
              </svg>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/40 to-transparent" />
        </div>

        {/* Collection info */}
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-lg font-semibold text-zinc-100 transition-colors group-hover:text-white">
              {collection.name}
            </h3>
            <span className="shrink-0 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
              {collection.itemCount} {collection.itemCount === 1 ? 'title' : 'titles'}
            </span>
          </div>
          {collection.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-zinc-300">
              {collection.description}
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}
