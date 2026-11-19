'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { MediaCard } from '@/components/catalog/MediaCard'
import type { MediaSummary } from '@/lib/catalog'

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 opacity-20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

interface MediaCardWithRemoveProps {
  media: MediaSummary
  onRemove: (id: string) => void
  isRemoving: boolean
}

function MediaCardWithRemove({ media, onRemove, isRemoving }: MediaCardWithRemoveProps) {
  return (
    <div className="group/card relative">
      <MediaCard media={media} />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          onRemove(media.id)
        }}
        disabled={isRemoving}
        className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-1.5 text-white opacity-0 backdrop-blur transition-opacity hover:bg-red-600 group-hover/card:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Remove ${media.title} from My List`}
      >
        <XIcon />
      </button>
    </div>
  )
}

export default function WatchlistPage() {
  const [items, setItems] = useState<MediaSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchWatchlist() {
      try {
        const response = await fetch('/api/watchlist/list')
        
        if (response.status === 401) {
          // Not authenticated, redirect to login
          router.push('/login')
          return
        }

        if (response.ok) {
          const data = await response.json()
          setItems(data.items)
        } else {
          console.error('Failed to fetch watchlist')
        }
      } catch (error) {
        console.error('Error fetching watchlist:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWatchlist()
  }, [router])

  async function handleRemove(mediaId: string) {
    if (removingId) return

    setRemovingId(mediaId)
    // Optimistic update
    setItems((prev) => prev.filter((item) => item.id !== mediaId))

    try {
      const response = await fetch('/api/watchlist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId }),
      })

      if (!response.ok) {
        // Revert on error - refetch the list
        const refetchResponse = await fetch('/api/watchlist/list')
        if (refetchResponse.ok) {
          const data = await refetchResponse.json()
          setItems(data.items)
        }
        console.error('Failed to remove from watchlist')
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      // Revert on error - refetch the list
      const refetchResponse = await fetch('/api/watchlist/list')
      if (refetchResponse.ok) {
        const data = await refetchResponse.json()
        setItems(data.items)
      }
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Back Link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to Browse
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">My List</h1>
          <p className="mt-2 text-sm text-white/60 sm:text-base">
            Your saved movies and shows
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <HeartIcon />
            <h2 className="mt-4 text-xl font-semibold text-white">
              Your list is empty
            </h2>
            <p className="mt-2 max-w-sm text-sm text-white/60">
              Browse content and add your favorites to watch later.
            </p>
            <Link
              href="/browse"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Browse Catalog
            </Link>
          </div>
        )}

        {/* Grid */}
        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {items.map((media) => (
              <MediaCardWithRemove
                key={media.id}
                media={media}
                onRemove={handleRemove}
                isRemoving={removingId === media.id}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
