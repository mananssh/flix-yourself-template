/**
 * Search results page at /search?q={query}
 *
 * Displays all results matching the search query in a grid layout,
 * using the existing MediaCard and MediaGrid components.
 */

import { notFound } from 'next/navigation'

import { MediaGrid } from '@/components/catalog/MediaGrid'
import { SearchBar } from '@/components/catalog/SearchBar'
import { getCatalog } from '@/lib/catalog'
import { createSearchIndex, search, toMediaSummary } from '@/lib/search'

// Always render dynamically since results depend on the query
export const dynamic = 'force-dynamic'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query } = await searchParams

  // Redirect to home if no query
  if (!query) {
    notFound()
  }

  const trimmedQuery = query.trim()

  // Build search index
  const catalog = await getCatalog()
  const allMedia = await catalog.listMedia({})
  
  // Fetch full details for search
  const mediaDetails = await Promise.all(
    allMedia.map((m) => catalog.getMediaById(m.id))
  )
  
  const validMedia = mediaDetails.filter(
    (m): m is NonNullable<typeof m> => m !== null
  )

  const index = createSearchIndex(validMedia)
  
  // Perform search with higher limit for full results page
  const results = search(index, trimmedQuery, 100)
  
  // Convert to MediaSummary for MediaCard compatibility
  const mediaSummaries = results.map(toMediaSummary)

  return (
    <main className="mx-auto min-h-screen max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10">
      {/* Header with Search Bar */}
      <header className="mb-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">
            <a href="/" className="transition-colors hover:text-rose-600">
              <span className="text-rose-600">FLIX</span> YOURSELF
            </a>
          </h1>
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar />
        </div>

        {/* Results header */}
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-semibold text-white">
            Search results for "{trimmedQuery}"
          </h2>
          <span className="text-sm text-zinc-400">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </header>

      {/* Results Grid */}
      <section>
        {results.length > 0 ? (
          <MediaGrid
            media={mediaSummaries}
            emptyMessage={`No results found for "${trimmedQuery}".`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-6xl">🔍</div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              No results found
            </h3>
            <p className="mb-6 max-w-md text-zinc-400">
              We couldn't find any titles matching "{trimmedQuery}".
              <br />
              Try different keywords or browse the catalog.
            </p>
            <a
              href="/"
              className="rounded-lg bg-rose-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700"
            >
              Browse Catalog
            </a>
          </div>
        )}
      </section>
    </main>
  )
}

// Generate metadata for the search page
export async function generateMetadata({
  searchParams,
}: SearchPageProps) {
  const { q: query } = await searchParams
  
  return {
    title: query ? `Search: ${query} - Flix Yourself` : 'Search - Flix Yourself',
    description: query
      ? `Search results for "${query}" in the Flix Yourself catalog`
      : 'Search the Flix Yourself catalog',
  }
}
