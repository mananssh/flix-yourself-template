/**
 * Small, dependency-free formatting helpers shared by catalog UI.
 *
 * These are pure functions over the JSON-safe DTO fields exposed by the catalog
 * seam (see `lib/catalog/types.ts`), so both server and client components can use
 * them without pulling in Prisma or a date library.
 */

const SECONDS_PER_HOUR = 3600
const SECONDS_PER_MINUTE = 60

/** Human-readable labels for each media type. */
export const MEDIA_TYPE_LABEL = {
  MOVIE: 'Film',
  SERIES: 'Series',
  CLIP: 'Clip',
} as const satisfies Record<string, string>

/**
 * Format a duration in seconds as `"2h 15m"`, `"45m"`, or `"1h"`.
 * Returns `null` for a missing or non-positive duration so callers can omit it.
 */
export function formatDuration(durationSec: number | null): string | null {
  if (durationSec === null || durationSec <= 0) return null

  const hours = Math.floor(durationSec / SECONDS_PER_HOUR)
  const minutes = Math.round((durationSec % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  // Show minutes unless they're zero and we already have an hours part.
  if (minutes > 0 || hours === 0) parts.push(`${minutes}m`)
  return parts.join(' ')
}

/**
 * Count episodes per series in a short label, e.g. `"8 episodes"` / `"1 episode"`.
 * Returns `null` when there are none.
 */
export function formatEpisodeCount(count: number): string | null {
  if (count <= 0) return null
  return `${count} episode${count === 1 ? '' : 's'}`
}
