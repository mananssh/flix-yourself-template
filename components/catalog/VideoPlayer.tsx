'use client'

/**
 * Custom HTML5 video player.
 *
 * A single `<video>` element wrapped in a bespoke control surface — play/pause,
 * a scrubbable seek bar with buffered indicator, volume, elapsed/total
 * timestamps, and fullscreen — rather than the browser's default `controls`
 * chrome, so the look matches the rest of the app and behaves the same across
 * browsers.
 *
 * Features:
 *  - Keyboard shortcuts: Space/K play-pause, ←/→ seek 10s, ↑/↓ volume, M mute,
 *    F fullscreen.
 *  - Responsive: controls scale and reflow for touch/mobile.
 *  - Loading + error states.
 *  - Remembers playback position per source (localStorage), resuming where the
 *    viewer left off.
 *  - Playlist aware: for a series it advances through episodes (prev/next +
 *    auto-advance), so one component serves both movies and episodes.
 *
 * The `url` of each source is produced by the storage seam
 * (`getStorage().getSignedUrl()`): the app's streaming route for local storage,
 * or a direct presigned URL for a cloud provider.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export interface PlayableSource {
  /** Stable id (media or episode id) — also the resume-position key. */
  id: string
  /** Primary label, e.g. the movie or episode title. */
  title: string
  /** Secondary label, e.g. "Episode 2" or the series name. */
  subtitle?: string
  /** Playable URL from the storage seam. */
  url: string
}

interface VideoPlayerProps {
  sources: PlayableSource[]
  /** Index within `sources` to start on. Defaults to 0. */
  startIndex?: number
  /** Called when the viewer dismisses the player. */
  onClose?: () => void
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                   */
/* -------------------------------------------------------------------------- */

const SEEK_STEP_SECONDS = 10
const VOLUME_STEP = 0.1
/** Below this, treat as "basically the start" and don't offer to resume. */
const RESUME_MIN_SECONDS = 5
/** Don't resume within this many seconds of the end (treat as finished). */
const RESUME_END_PAD_SECONDS = 10
const CONTROLS_HIDE_MS = 2800

const progressStorageKey = (id: string) => `flix:progress:${id}`

function readSavedPosition(id: string): number {
  try {
    const raw = localStorage.getItem(progressStorageKey(id))
    if (!raw) return 0
    const value = Number(raw)
    return Number.isFinite(value) && value > 0 ? value : 0
  } catch {
    return 0
  }
}

function savePosition(id: string, seconds: number): void {
  try {
    localStorage.setItem(progressStorageKey(id), String(Math.floor(seconds)))
  } catch {
    // Storage may be unavailable (private mode, blocked) — resume is best-effort.
  }
}

function clearPosition(id: string): void {
  try {
    localStorage.removeItem(progressStorageKey(id))
  } catch {
    // ignore
  }
}

/** Format seconds as `m:ss` or `h:mm:ss`. */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/* -------------------------------------------------------------------------- */
/*                                    Icons                                    */
/* -------------------------------------------------------------------------- */

function Icon({ path, className = 'h-6 w-6' }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={path} />
    </svg>
  )
}

const ICONS = {
  play: 'M8 5v14l11-7z',
  pause: 'M6 5h4v14H6zM14 5h4v14h-4z',
  volume: 'M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12z',
  muted: 'M3 10v4h4l5 5V5L7 10H3zm13.59 2L19 9.41 17.59 8 15 10.59 12.41 8 11 9.41 13.59 12 11 14.59 12.41 16 15 13.41 17.59 16 19 14.59 16.41 12z',
  enterFullscreen:
    'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z',
  exitFullscreen:
    'M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z',
  prev: 'M6 6h2v12H6zm3.5 6l8.5 6V6z',
  next: 'M16 6h2v12h-2zM6 18l8.5-6L6 6z',
  close: 'M18.3 5.71 12 12.01l-6.3-6.3-1.41 1.41L10.59 13.4l-6.3 6.3 1.41 1.41 6.3-6.3 6.29 6.3 1.41-1.41-6.3-6.3 6.3-6.29z',
  replay:
    'M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z',
} as const

/* -------------------------------------------------------------------------- */
/*                                  Component                                  */
/* -------------------------------------------------------------------------- */

export function VideoPlayer({ sources, startIndex = 0, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clampedStart = Math.min(Math.max(startIndex, 0), sources.length - 1)
  const [index, setIndex] = useState(clampedStart)
  const source = sources[index]
  const hasPrev = index > 0
  const hasNext = index < sources.length - 1

  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [ended, setEnded] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)

  /* --------------------------- Playback controls -------------------------- */

  const play = useCallback(() => {
    videoRef.current?.play().catch(() => {
      /* Autoplay/gesture rejection is non-fatal; the user can press play. */
    })
  }, [])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused || video.ended) {
      void video.play().catch(() => undefined)
    } else {
      video.pause()
    }
  }, [])

  const seekBy = useCallback((delta: number) => {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration)) return
    video.currentTime = Math.min(
      Math.max(video.currentTime + delta, 0),
      video.duration,
    )
  }, [])

  const seekTo = useCallback((seconds: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = seconds
  }, [])

  const changeVolume = useCallback((delta: number) => {
    const video = videoRef.current
    if (!video) return
    const next = Math.min(Math.max(video.volume + delta, 0), 1)
    video.volume = next
    video.muted = next === 0
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
  }, [])

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined)
    } else {
      void container.requestFullscreen().catch(() => undefined)
    }
  }, [])

  const goTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= sources.length || nextIndex === index) {
        return
      }
      // Persist where we are before switching away.
      const video = videoRef.current
      if (
        video &&
        source &&
        Number.isFinite(video.duration) &&
        video.currentTime > RESUME_MIN_SECONDS
      ) {
        savePosition(source.id, video.currentTime)
      }
      // Reset per-source UI for the incoming source (the <video> remounts via
      // its `key`). Done here rather than in an effect to avoid cascading
      // renders.
      setIsLoading(true)
      setError(false)
      setEnded(false)
      setCurrent(0)
      setDuration(0)
      setBuffered(0)
      setControlsVisible(true)
      setIndex(nextIndex)
    },
    [sources.length, index, source],
  )

  /* ----------------------------- Controls UI ------------------------------ */

  const revealControls = useCallback(() => {
    setControlsVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      // Only auto-hide while actively playing.
      if (!videoRef.current?.paused) setControlsVisible(false)
    }, CONTROLS_HIDE_MS)
  }, [])

  /* ------------------------------ Lifecycle ------------------------------- */

  // Keyboard shortcuts (scoped to while the player is mounted).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Don't hijack typing in inputs.
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return

      switch (event.key) {
        case ' ':
        case 'k':
        case 'K':
          event.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          event.preventDefault()
          seekBy(SEEK_STEP_SECONDS)
          break
        case 'ArrowLeft':
          event.preventDefault()
          seekBy(-SEEK_STEP_SECONDS)
          break
        case 'ArrowUp':
          event.preventDefault()
          changeVolume(VOLUME_STEP)
          break
        case 'ArrowDown':
          event.preventDefault()
          changeVolume(-VOLUME_STEP)
          break
        case 'f':
        case 'F':
          event.preventDefault()
          toggleFullscreen()
          break
        case 'm':
        case 'M':
          event.preventDefault()
          toggleMute()
          break
        case 'Escape':
          // Let the browser handle exiting native fullscreen; otherwise close.
          if (!document.fullscreenElement && onClose) onClose()
          break
        default:
          return
      }
      revealControls()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    togglePlay,
    seekBy,
    changeVolume,
    toggleFullscreen,
    toggleMute,
    revealControls,
    onClose,
  ])

  // Track fullscreen changes (incl. user pressing Esc / F11).
  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // Clear the auto-hide timer on unmount. (Resume position is persisted
  // continuously via `timeupdate`/`pause`, so no save is needed here.)
  useEffect(() => {
    const timer = hideTimer
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  /* --------------------------- Media element events ----------------------- */

  const onLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    setDuration(video.duration)
    video.volume = volume
    video.muted = muted
    // Resume if we have a meaningful saved position.
    const saved = readSavedPosition(source.id)
    if (
      saved > RESUME_MIN_SECONDS &&
      saved < video.duration - RESUME_END_PAD_SECONDS
    ) {
      video.currentTime = saved
    }
  }, [volume, muted, source.id])

  const onTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    setCurrent(video.currentTime)
    // Throttle persistence to whole-second boundaries.
    if (source && Math.floor(video.currentTime) % 5 === 0) {
      savePosition(source.id, video.currentTime)
    }
  }, [source])

  const onProgress = useCallback(() => {
    const video = videoRef.current
    if (!video || video.buffered.length === 0) return
    setBuffered(video.buffered.end(video.buffered.length - 1))
  }, [])

  const onEnded = useCallback(() => {
    if (source) clearPosition(source.id)
    if (hasNext) {
      goTo(index + 1)
    } else {
      setEnded(true)
      setIsPlaying(false)
      setControlsVisible(true)
    }
  }, [source, hasNext, goTo, index])

  const replay = useCallback(() => {
    setEnded(false)
    seekTo(0)
    play()
  }, [seekTo, play])

  /* ------------------------------- Seek bar ------------------------------- */

  const onScrub = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value)
      seekTo(value)
      setCurrent(value)
    },
    [seekTo],
  )

  const progressPct = duration > 0 ? (current / duration) * 100 : 0
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0

  /* -------------------------------- Render -------------------------------- */

  return (
    <div
      ref={containerRef}
      className="group relative flex h-full w-full items-center justify-center bg-black select-none"
      onMouseMove={revealControls}
      onMouseLeave={() => {
        if (!videoRef.current?.paused) setControlsVisible(false)
      }}
    >
      <video
        ref={videoRef}
        key={source.url}
        src={source.url}
        className="h-full w-full bg-black"
        playsInline
        autoPlay
        preload="metadata"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onPlay={() => {
          setIsPlaying(true)
          setEnded(false)
        }}
        onPause={() => {
          setIsPlaying(false)
          const video = videoRef.current
          if (video && source && video.currentTime > RESUME_MIN_SECONDS && !video.ended) {
            savePosition(source.id, video.currentTime)
          }
        }}
        onVolumeChange={() => {
          const video = videoRef.current
          if (!video) return
          setVolume(video.volume)
          setMuted(video.muted)
        }}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onPlaying={() => setIsLoading(false)}
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onProgress={onProgress}
        onEnded={onEnded}
        onError={() => {
          setError(true)
          setIsLoading(false)
        }}
      />

      {/* Loading spinner */}
      {isLoading && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="h-12 w-12 animate-spin rounded-full border-4 border-white/25 border-t-white"
            role="status"
            aria-label="Loading video"
          />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center">
          <p className="text-base font-semibold text-white">
            This video couldn&apos;t be played.
          </p>
          <p className="max-w-sm text-sm text-white/60">
            The file may be missing or in an unsupported format. Try again or
            pick another title.
          </p>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-white/85"
            >
              Close
            </button>
          )}
        </div>
      )}

      {/* Center replay overlay when finished */}
      {ended && !error && (
        <button
          type="button"
          onClick={replay}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-white transition-colors hover:bg-black/60"
          aria-label="Replay"
        >
          <Icon path={ICONS.replay} className="h-14 w-14" />
          <span className="text-sm font-semibold">Replay</span>
        </button>
      )}

      {/* Big center play/pause tap target on touch (visible when paused) */}
      {!isPlaying && !isLoading && !error && !ended && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Play"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-transform hover:scale-105 sm:h-20 sm:w-20">
            <Icon path={ICONS.play} className="h-8 w-8 translate-x-0.5 sm:h-10 sm:w-10" />
          </span>
        </button>
      )}

      {/* Top bar: title + close */}
      <div
        className={`absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent p-3 transition-opacity duration-300 sm:p-4 ${
          controlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-white sm:text-base">
            {source.title}
          </h2>
          {source.subtitle && (
            <p className="truncate text-xs text-white/70">{source.subtitle}</p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close player"
          >
            <Icon path={ICONS.close} className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Bottom control bar */}
      <div
        className={`absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-8 transition-opacity duration-300 sm:px-4 sm:pb-3 ${
          controlsVisible || !isPlaying ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {/* Seek bar */}
        <div className="relative flex items-center">
          {/* Track + buffered + progress (visual), with a range input on top. */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/25">
            <div
              className="absolute inset-y-0 left-0 bg-white/40"
              style={{ width: `${bufferedPct}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-accent"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step="any"
            value={current}
            onChange={onScrub}
            aria-label="Seek"
            className="player-range relative z-10 h-4 w-full cursor-pointer appearance-none bg-transparent"
          />
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-1 text-white sm:gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="rounded p-1.5 transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <Icon path={isPlaying ? ICONS.pause : ICONS.play} />
          </button>

          {sources.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={!hasPrev}
                className="rounded p-1.5 transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous episode"
              >
                <Icon path={ICONS.prev} className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                disabled={!hasNext}
                className="rounded p-1.5 transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next episode"
              >
                <Icon path={ICONS.next} className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Volume */}
          <div className="group/vol flex items-center">
            <button
              type="button"
              onClick={toggleMute}
              className="rounded p-1.5 transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={muted || volume === 0 ? 'Unmute' : 'Mute'}
            >
              <Icon path={muted || volume === 0 ? ICONS.muted : ICONS.volume} />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(event) => {
                const value = Number(event.target.value)
                const video = videoRef.current
                if (video) {
                  video.volume = value
                  video.muted = value === 0
                }
              }}
              aria-label="Volume"
              className="player-range player-range--track ml-1 hidden h-4 w-16 cursor-pointer appearance-none bg-transparent sm:block sm:w-20"
            />
          </div>

          {/* Timestamp */}
          <div className="ml-1 text-xs font-medium tabular-nums text-white/90 sm:text-sm">
            {formatTime(current)}
            <span className="text-white/50"> / {formatTime(duration)}</span>
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded p-1.5 transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              <Icon
                path={isFullscreen ? ICONS.exitFullscreen : ICONS.enterFullscreen}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
