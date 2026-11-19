'use client'

/**
 * SearchBar component with as-you-type suggestions and keyboard shortcuts.
 *
 * Features:
 * - Debounced input (300ms)
 * - "/" keyboard shortcut to focus
 * - Escape to clear/blur
 * - Arrow keys to navigate suggestions
 * - Enter to go to full results or selected item
 * - Clear button when text present
 */

import { Search, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'

import { SearchDropdown } from './SearchDropdown'
import type { SearchResult } from '@/lib/search'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize from URL query param if present
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  // Debounce the query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query])

  // Fetch results when debounced query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`
        )
        
        if (response.ok) {
          const data = await response.json()
          setResults(data.results ?? [])
          setIsOpen(data.results.length > 0)
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery])

  // Global "/" keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on "/" (unless already focused in an input)
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle input key events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        // Clear and blur on escape
        setQuery('')
        setIsOpen(false)
        inputRef.current?.blur()
      } else if (e.key === 'ArrowDown') {
        // Navigate down
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        // Navigate up
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, -1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        
        if (selectedIndex >= 0 && results[selectedIndex]) {
          // Navigate to selected item
          router.push(`/media/${results[selectedIndex].id}`)
          setIsOpen(false)
          inputRef.current?.blur()
        } else if (query.trim()) {
          // Navigate to full results page
          router.push(`/search?q=${encodeURIComponent(query.trim())}`)
          setIsOpen(false)
          inputRef.current?.blur()
        }
      }
    },
    [query, results, selectedIndex, router]
  )

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleResultClick = (id: string) => {
    router.push(`/media/${id}`)
    setIsOpen(false)
    setQuery('')
  }

  const handleViewAll = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative w-full max-w-xl">
      {/* Search Input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelectedIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 && query.trim()) {
              setIsOpen(true)
            }
          }}
          placeholder="Search movies, shows, cast..."
          className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-10 pr-10 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-600/20"
          aria-label="Search catalog"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={isOpen}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-100"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-rose-600" />
          </div>
        )}
      </div>

      {/* Keyboard shortcut hint */}
      {!query && (
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:block">
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
            /
          </kbd>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <SearchDropdown
          results={results}
          selectedIndex={selectedIndex}
          onResultClick={handleResultClick}
          onViewAll={handleViewAll}
          query={query}
        />
      )}
    </div>
  )
}
