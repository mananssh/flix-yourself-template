'use client'

import { Film, Image, Users, Calendar, Clock } from 'lucide-react'
import type { MediaFormData } from '../UploadWizard'

type Props = {
  formData: MediaFormData
  updateFormData: (data: Partial<MediaFormData>) => void
}

export function ReviewStep({ formData }: Props) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Not specified'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} minutes`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">
          Review & Publish
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Review your media details before publishing
        </p>
      </div>

      <div className="space-y-4">
        {/* Basic Info */}
        <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-zinc-400">
            <Film className="h-4 w-4" />
            Basic Information
          </h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-400">Title</dt>
              <dd className="text-sm font-medium text-zinc-100">
                {formData.title || 'Not specified'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-400">Type</dt>
              <dd className="text-sm font-medium text-zinc-100">
                {formData.type}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-400">Release Year</dt>
              <dd className="text-sm font-medium text-zinc-100">
                {formData.releaseYear || 'Not specified'}
              </dd>
            </div>
            {formData.maturityRating && (
              <div className="flex justify-between">
                <dt className="text-sm text-zinc-400">Rating</dt>
                <dd className="text-sm font-medium text-zinc-100">
                  {formData.maturityRating}
                </dd>
              </div>
            )}
            {formData.durationSec && (
              <div className="flex justify-between">
                <dt className="text-sm text-zinc-400">Duration</dt>
                <dd className="text-sm font-medium text-zinc-100">
                  {formatDuration(formData.durationSec)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Files */}
        <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-zinc-400">
            <Image className="h-4 w-4" />
            Uploaded Files
          </h3>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-zinc-400">Video File</dt>
              <dd
                className={`text-sm font-medium ${
                  formData.videoFile ? 'text-green-400' : 'text-zinc-500'
                }`}
              >
                {formData.videoFile ? '✓ Uploaded' : '✗ Not uploaded'}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-zinc-400">Poster Image</dt>
              <dd
                className={`text-sm font-medium ${
                  formData.posterFile ? 'text-green-400' : 'text-zinc-500'
                }`}
              >
                {formData.posterFile ? '✓ Uploaded' : '✗ Not uploaded'}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-zinc-400">Backdrop Image</dt>
              <dd
                className={`text-sm font-medium ${
                  formData.backdropFile ? 'text-green-400' : 'text-zinc-500'
                }`}
              >
                {formData.backdropFile ? '✓ Uploaded' : '✗ Not uploaded'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Metadata */}
        {(formData.genres.length > 0 ||
          formData.cast.length > 0 ||
          formData.description) && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-zinc-400">
              <Users className="h-4 w-4" />
              Metadata
            </h3>
            <dl className="space-y-4">
              {formData.description && (
                <div>
                  <dt className="mb-2 text-sm text-zinc-400">Description</dt>
                  <dd className="text-sm text-zinc-100">
                    {formData.description}
                  </dd>
                </div>
              )}
              {formData.genres.length > 0 && (
                <div>
                  <dt className="mb-2 text-sm text-zinc-400">Genres</dt>
                  <dd className="flex flex-wrap gap-2">
                    {formData.genres.map((genre) => (
                      <span
                        key={genre}
                        className="inline-flex rounded-full bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400"
                      >
                        {genre}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {formData.cast.length > 0 && (
                <div>
                  <dt className="mb-2 text-sm text-zinc-400">Cast & Crew</dt>
                  <dd className="space-y-2">
                    {formData.cast.map((person, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-zinc-900 px-3 py-2"
                      >
                        <span className="text-sm text-zinc-100">
                          {person.name}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {person.role}
                        </span>
                      </div>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-blue-700 bg-blue-900/20 p-4">
        <p className="text-sm text-blue-200">
          Once published, this media will be visible in your catalog. You can
          always edit it later from the media library.
        </p>
      </div>
    </div>
  )
}
