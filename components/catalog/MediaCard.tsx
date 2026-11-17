import Image from 'next/image'

import type { MediaSummary } from '@/lib/catalog'

/** Human-readable labels for each media type. */
const TYPE_LABEL: Record<MediaSummary['type'], string> = {
  MOVIE: 'Film',
  SERIES: 'Series',
  CLIP: 'Clip',
}

/** Responsive sizes hint matching the browse grid's column counts. */
const CARD_SIZES =
  '(max-width: 640px) 45vw, (max-width: 1024px) 30vw, (max-width: 1280px) 22vw, 15vw'

/**
 * A single poster card: poster image (2:3), title, and year. Presentational
 * only — no player or navigation yet. Falls back to a titled placeholder when a
 * media item has no poster URL.
 */
export function MediaCard({ media }: { media: MediaSummary }) {
  return (
    <article className="group">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-[1.04] group-hover:ring-white/30">
        {media.posterUrl ? (
          <Image
            src={media.posterUrl}
            alt={`${media.title} poster`}
            fill
            sizes={CARD_SIZES}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-sm font-medium text-white/60">
            {media.title}
          </div>
        )}
        <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
          {TYPE_LABEL[media.type]}
        </span>
      </div>
      <h3 className="mt-2 truncate text-sm font-medium text-white" title={media.title}>
        {media.title}
      </h3>
      <p className="text-xs text-white/50">{media.releaseYear ?? '—'}</p>
    </article>
  )
}
