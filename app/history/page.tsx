'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { MediaCard } from '@/components/catalog/MediaCard'
import { ClearHistoryModal } from '@/components/history/ClearHistoryModal'
import type { MediaSummary } from '@/lib/catalog'
import { formatDistanceToNow } from '@/lib/utils/date'

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

function ClockIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function Trash2Icon() {
  return (
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
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
    </svg>
  )
}

interface HistoryItem extends MediaSummary {
  lastWatchedAt: string
  progressSeconds: number
  durationSec: number | null
}

interface HistoryCardProps {
  item: HistoryItem
  onRemove: (mediaId: string) => void
  isRemoving: boolean
}

function HistoryCard({ item, onRemove, isRemoving }: HistoryCardProps) {
  const progressPercent = item.durationSec
    ? Math.min(100, Math.floor((item.progressSeconds / item.durationSec) * 100))
    : 0

  return (
    <div className="group/card relative">
      <MediaCard media={item} />
      
      {/* Remove Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          onRemove(item.id)
        }}
        disabled={isRemoving}
        className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-1.5 text-white opacity-0 backdrop-blur transition-opacity hover:bg-red-600 group-hover/card:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Remove ${item.title} from history`}
      >
        <XIcon />
      </button>

      {/* Watched Badge & Progress */}
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
            Watched {formatDistanceToNow(new Date(item.lastWatchedAt))}
          </span>
        </div>
        
        {/* Progress Bar (only if not finished) */}
        {progressPercent > 0 && progressPercent < 95 && (
          <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-red-600 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [showClearModal, setShowClearModal] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch('/api/history')

        if (response.status === 401) {
          // Not authenticated, redirect to login
          router.push('/login')
          return
        }

        if (response.ok) {
          const data = await response.json()
          setItems(data.items)
        } else {
          console.error('Failed to fetch history')
        }
      } catch (error) {
        console.error('Error fetching history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [router])

  async function handleRemove(mediaId: string) {
    if (removingId) return

    setRemovingId(mediaId)
    // Optimistic update
    setItems((prev) => prev.filter((item) => item.id !== mediaId))

    try {
      const response = await fetch(`/api/history/${mediaId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        // Revert on error - refetch the list
        const refetchResponse = await fetch('/api/history')
        if (refetchResponse.ok) {
          const data = await refetchResponse.json()
          setItems(data.items)
        }
        console.error('Failed to remove from history')
      }
    } catch (error) {
      console.error('Error removing from history:', error)
      // Revert on error - refetch the list
      const refetchResponse = await fetch('/api/history')
      if (refetchResponse.ok) {
        const data = await refetchResponse.json()
        setItems(data.items)
      }
    } finally {
      setRemovingId(null)
    }
  }

  async function handleClearAll() {
    setIsClearing(true)

    try {
      const response = await fetch('/api/history', {
        method: 'DELETE',
      })

      if (response.ok) {
        setItems([])
        setShowClearModal(false)
      } else {
        console.error('Failed to clear history')
      }
    } catch (error) {
      console.error('Error clearing history:', error)
    } finally {
      setIsClearing(false)
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
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              Watch History
            </h1>
            <p className="mt-2 text-sm text-white/60 sm:text-base">
              Your recently watched content
            </p>
          </div>

          {/* Clear All Button */}
          {!isLoading && items.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearModal(true)}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Trash2Icon />
              <span className="hidden sm:inline">Clear All History</span>
              <span className="sm:hidden">Clear All</span>
            </button>
          )}
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
            <ClockIcon />
            <h2 className="mt-4 text-xl font-semibold text-white">
              No watch history yet
            </h2>
            <p className="mt-2 max-w-sm text-sm text-white/60">
              Start watching to see your history here!
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Browse Catalog
            </Link>
          </div>
        )}

        {/* Grid */}
        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {items.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onRemove={handleRemove}
                isRemoving={removingId === item.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Clear History Modal */}
      <ClearHistoryModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearAll}
        isClearing={isClearing}
      />
    </main>
  )
}
