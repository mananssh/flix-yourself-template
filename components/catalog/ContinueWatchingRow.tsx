'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { MEDIA_TYPE_LABEL } from '@/lib/format'
import type { WatchlistItem } from '@/lib/watchlist'

/** Responsive sizes hint for horizontal scroll items. */
const CARD_SIZES = '(max-width: 640px) 40vw, (max-width: 1024px) 28vw, 20vw'

/**
 * Continue Watching row component.
 * Displays media with progress indicators in a horizontal scrollable row.
 */
export function ContinueWatchingRow() {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContinueWatching() {
      try {
        const response = await fetch('/api/watchlist/continue')
        if (response.ok) {
          const data = await response.json()
          setItems(data.items ?? [])
        }
      } catch (error) {
        console.error('Failed to fetch continue watching:', error)
      } finally {
        setLoading(false)
      }
    }

    void fetchContinueWatching()
  }, [])

  // Don't render if no items or still loading
  if (loading || items.length === 0) {
    return null
  }

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-zinc-100">
        Continue Watching
      </h2>
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent sm:gap-4">
          {items.map((item) => (
            <ContinueWatchingCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ContinueWatchingCard({ item }: { item: WatchlistItem }) {
  const href = `/media/${item.mediaId}`
  const remainingMinutes = Math.ceil(
    (item.durationSec - item.progressSeconds) / 60,
  )

  return (
    <Link
      href={href}
      className="group block shrink-0 w-[160px] rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-[200px]"
      aria-label={`Continue watching ${item.title}`}
    >
      <article>
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-zinc-800 transition-all duration-300 group-hover:scale-[1.03] group-hover:ring-zinc-600">
          {item.posterUrl ? (
            <Image
              src={item.posterUrl}
              alt={`${item.title} poster`}
              fill
              sizes={CARD_SIZES}
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-3 text-center text-sm font-medium text-zinc-400">
              {item.title}
            </div>
          )}
          
          {/* Type badge */}
          <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
            {MEDIA_TYPE_LABEL[item.type]}
          </span>

          {/* Progress bar overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
            <div
              className="h-full bg-rose-600 transition-all"
              style={{ width: `${item.progressPercent}%` }}
            />
          </div>

          {/* Progress info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 pt-6">
            <p className="text-xs font-medium text-white/90">
              {item.progressPercent}% watched
            </p>
            <p className="text-[10px] text-white/60">
              {remainingMinutes} min left
            </p>
          </div>
        </div>

        <h3
          className="mt-2 truncate text-sm font-medium text-zinc-100 transition-colors group-hover:text-white"
          title={item.title}
        >
          {item.title}
        </h3>
        {item.subtitle && (
          <p className="truncate text-xs text-zinc-500" title={item.subtitle}>
            {item.subtitle}
          </p>
        )}
      </article>
    </Link>
  )
}
