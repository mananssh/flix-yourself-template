import type { MediaSummary } from '@/lib/catalog'

import { MediaCard } from './MediaCard'

/**
 * Responsive poster grid. Renders an empty-state message when there is nothing
 * to show, so callers don't have to special-case it.
 */
export function MediaGrid({
  media,
  emptyMessage = 'Nothing here yet.',
}: {
  media: MediaSummary[]
  emptyMessage?: string
}) {
  if (media.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-white/50">{emptyMessage}</p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {media.map((item) => (
        <MediaCard key={item.id} media={item} />
      ))}
    </div>
  )
}
