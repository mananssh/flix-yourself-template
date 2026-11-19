'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import type { MediaFormData } from '../UploadWizard'

type Props = {
  formData: MediaFormData
  updateFormData: (data: Partial<MediaFormData>) => void
}

const COMMON_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Western',
]

export function MetadataStep({ formData, updateFormData }: Props) {
  const [genreInput, setGenreInput] = useState('')
  const [castName, setCastName] = useState('')
  const [castRole, setCastRole] = useState<'ACTOR' | 'DIRECTOR' | 'CREATOR'>('ACTOR')

  const addGenre = (genre: string) => {
    if (genre && !formData.genres.includes(genre)) {
      updateFormData({ genres: [...formData.genres, genre] })
    }
    setGenreInput('')
  }

  const removeGenre = (genre: string) => {
    updateFormData({
      genres: formData.genres.filter((g) => g !== genre),
    })
  }

  const addCast = () => {
    if (castName.trim()) {
      updateFormData({
        cast: [...formData.cast, { name: castName.trim(), role: castRole }],
      })
      setCastName('')
    }
  }

  const removeCast = (index: number) => {
    updateFormData({
      cast: formData.cast.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">
          Additional Metadata
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Add genres, cast, and description
        </p>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-zinc-300"
        >
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={4}
          className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          placeholder="Enter a brief description of this media..."
        />
      </div>

      {/* Genres */}
      <div>
        <label className="block text-sm font-medium text-zinc-300">
          Genres
        </label>

        {/* Selected Genres */}
        {formData.genres.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.genres.map((genre) => (
              <span
                key={genre}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-sm font-medium text-rose-400"
              >
                {genre}
                <button
                  type="button"
                  onClick={() => removeGenre(genre)}
                  className="hover:text-rose-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Quick Select */}
        <div className="mt-3 flex flex-wrap gap-2">
          {COMMON_GENRES.filter((g) => !formData.genres.includes(g)).map(
            (genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => addGenre(genre)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700"
              >
                + {genre}
              </button>
            ),
          )}
        </div>

        {/* Custom Genre Input */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={genreInput}
            onChange={(e) => setGenreInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addGenre(genreInput)
              }
            }}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            placeholder="Add custom genre"
          />
          <button
            type="button"
            onClick={() => addGenre(genreInput)}
            className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-600"
          >
            Add
          </button>
        </div>
      </div>

      {/* Cast & Crew */}
      <div>
        <label className="block text-sm font-medium text-zinc-300">
          Cast & Crew
        </label>

        {/* Cast List */}
        {formData.cast.length > 0 && (
          <div className="mt-2 space-y-2">
            {formData.cast.map((person, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-zinc-100">{person.name}</p>
                  <p className="text-sm text-zinc-400">{person.role}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeCast(index)}
                  className="rounded-lg bg-zinc-700 p-2 text-zinc-400 transition-colors hover:bg-zinc-600 hover:text-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Cast Form */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={castName}
            onChange={(e) => setCastName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCast()
              }
            }}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            placeholder="Person name"
          />
          <select
            value={castRole}
            onChange={(e) =>
              setCastRole(e.target.value as 'ACTOR' | 'DIRECTOR' | 'CREATOR')
            }
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="ACTOR">Actor</option>
            <option value="DIRECTOR">Director</option>
            <option value="CREATOR">Creator</option>
          </select>
          <button
            type="button"
            onClick={addCast}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
