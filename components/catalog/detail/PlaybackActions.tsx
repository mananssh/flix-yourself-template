/**
 * Primary call-to-action row for the detail page.
 *
 * The Play button is the seam the upcoming video-player feature wires into. For
 * now it renders as the primary CTA when the title has at least one playable
 * video, and as a disabled "Unavailable" state otherwise. Keeping it here means
 * the player feature changes one component, not the whole page.
 */
function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden
    >
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

export function PlaybackActions({ canPlay }: { canPlay: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={!canPlay}
        className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/85 disabled:cursor-not-allowed disabled:bg-white/25 disabled:text-white/60"
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
  )
}
