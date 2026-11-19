'use client'

/**
 * SearchDropdown component for showing search suggestions.
 *
 * Displays up to 5 results with poster, title, year, and type.
 * Includes "View all results" link at the bottom.
 */

import Image from 'next/image'
import { ChevronRight } from 'lucide-react'

import type { SearchResult } from '@/lib/search'
import { MEDIA_TYPE_LABEL } from '@/lib/format'

interface SearchDropdownProps {
  results: SearchResult[]
  selectedIndex: number
  onResultClick: (id: string) => void
  onViewAll: () => void
  query: string
}

export function SearchDropdown({
  results,
  selectedIndex,
  onResultClick,
  onViewAll,
  query,
}: SearchDropdownProps) {
  return (
    <div
      id="search-results"
      className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl animate-in fade-in-0 slide-in-from-top-2 duration-200"
      role="listbox"
    >
      {/* Results */}
      <ul className="max-h-[400px] overflow-y-auto">
        {results.map((result, index) => (
          <li key={result.id} role="option" aria-selected={index === selectedIndex}>
            <button
              onClick={() => onResultClick(result.id)}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
              }`}
            >
              {/* Poster */}
              <div className="relative h-14 w-10 flex-shrink-0 overflow-hidden rounded bg-white/5">
                {result.posterUrl ? (
                  <Image
                    src={result.posterUrl}
                    alt={`${result.title} poster`}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                    N/A
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{result.title}</span>
                  {result.releaseYear && (
                    <span className="flex-shrink-0 text-xs text-zinc-500">
                      {result.releaseYear}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    {MEDIA_TYPE_LABEL[result.type]}
                  </span>
                  {result.genres.length > 0 && (
                    <span className="truncate">{result.genres.slice(0, 2).join(', ')}</span>
                  )}
                </div>
              </div>

              {/* Arrow indicator on selected */}
              {index === selectedIndex && (
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-rose-600" />
              )}
            </button>
          </li>
        ))}
      </ul>

      {/* View All link */}
      <div className="border-t border-zinc-800 bg-zinc-900/80 backdrop-blur">
        <button
          onClick={onViewAll}
          className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-zinc-800/50 hover:text-rose-500"
        >
          <span>View all results for "{query}"</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
