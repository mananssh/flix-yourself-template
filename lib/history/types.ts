/**
 * Types for viewing history feature.
 */

import type { MediaType } from '@prisma/client'

export interface HistoryItem {
  id: string
  mediaId: string
  episodeId: string | null
  title: string
  subtitle?: string
  posterUrl: string | null
  type: MediaType
  progressSeconds: number
  durationSec: number | null
  lastWatchedAt: Date
  releaseYear: number | null
}
