'use client'

/**
 * Primary call-to-action row for the detail page, and the seam the video-player
 * feature plugs into.
 *
 * The Play button opens a modal overlay containing the custom {@link VideoPlayer}.
 * It is enabled only when the title has at least one playable source. The parent
 * (a server component) resolves each source's URL through the storage seam
 * (`getStorage().getSignedUrl()`) and passes them in, so this component stays
 * free of any storage/provider knowledge.
 *
 * Movies pass a single source; a series passes one source per playable episode,
 * which the player treats as a playlist (prev/next + auto-advance).
 */

import { useCallback, useEffect, useState } from 'react'

import { VideoPlayer, type PlayableSource } from '@/components/catalog/VideoPlayer'

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function PlaybackActions({ sources }: { sources: PlayableSource[] }) {
  const canPlay = sources.length > 0
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  // Lock background scroll while the player is open.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canPlay}
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:bg-white/25 disabled:text-white/60"
        >
          <PlayIcon />
          {canPlay ? 'Play' : 'Unavailable'}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/25"
        >
          <PlusIcon />
          My List
        </button>
      </div>

      {open && canPlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Video player"
          onClick={close}
        >
          <div
            className="relative aspect-video max-h-full w-full max-w-5xl overflow-hidden bg-black shadow-2xl sm:rounded-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <VideoPlayer sources={sources} onClose={close} />
          </div>
        </div>
      )}
    </>
  )
}
