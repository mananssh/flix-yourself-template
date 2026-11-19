'use client'

import type { MediaFormData } from '../UploadWizard'

type Props = {
  formData: MediaFormData
  updateFormData: (data: Partial<MediaFormData>) => void
}

export function BasicInfoStep({ formData, updateFormData }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Basic Information</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Enter the essential details about your media
        </p>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-zinc-300"
          >
            Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            placeholder="Enter media title"
            required
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-zinc-300">
            Type <span className="text-rose-400">*</span>
          </label>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {(['MOVIE', 'SERIES', 'CLIP'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => updateFormData({ type })}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  formData.type === type
                    ? 'border-rose-600 bg-rose-600/10 text-rose-400 ring-2 ring-rose-600/20'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Release Year */}
        <div>
          <label
            htmlFor="releaseYear"
            className="block text-sm font-medium text-zinc-300"
          >
            Release Year
          </label>
          <input
            type="number"
            id="releaseYear"
            value={formData.releaseYear || ''}
            onChange={(e) =>
              updateFormData({
                releaseYear: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            placeholder="2024"
            min="1900"
            max={new Date().getFullYear() + 5}
          />
        </div>

        {/* Maturity Rating */}
        <div>
          <label
            htmlFor="maturityRating"
            className="block text-sm font-medium text-zinc-300"
          >
            Maturity Rating
          </label>
          <select
            id="maturityRating"
            value={formData.maturityRating || ''}
            onChange={(e) =>
              updateFormData({
                maturityRating: e.target.value || null,
              })
            }
            className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-zinc-100 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="">Select rating</option>
            <option value="G">G - General Audiences</option>
            <option value="PG">PG - Parental Guidance</option>
            <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
            <option value="R">R - Restricted</option>
            <option value="NC-17">NC-17 - Adults Only</option>
            <option value="TV-Y">TV-Y - All Children</option>
            <option value="TV-Y7">TV-Y7 - Directed to Older Children</option>
            <option value="TV-G">TV-G - General Audience</option>
            <option value="TV-PG">TV-PG - Parental Guidance Suggested</option>
            <option value="TV-14">TV-14 - Parents Strongly Cautioned</option>
            <option value="TV-MA">TV-MA - Mature Audience Only</option>
          </select>
        </div>

        {/* Duration (for movies) */}
        {formData.type === 'MOVIE' && (
          <div>
            <label
              htmlFor="durationSec"
              className="block text-sm font-medium text-zinc-300"
            >
              Duration (minutes)
            </label>
            <input
              type="number"
              id="durationSec"
              value={
                formData.durationSec ? Math.floor(formData.durationSec / 60) : ''
              }
              onChange={(e) =>
                updateFormData({
                  durationSec: e.target.value
                    ? parseInt(e.target.value) * 60
                    : null,
                })
              }
              className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              placeholder="120"
              min="1"
            />
          </div>
        )}
      </div>
    </div>
  )
}
