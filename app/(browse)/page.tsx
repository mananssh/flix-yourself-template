import Link from 'next/link'

import { ContinueWatchingRow } from '@/components/catalog/ContinueWatchingRow'
import { MediaGrid } from '@/components/catalog/MediaGrid'
import { SearchBar } from '@/components/catalog/SearchBar'
import { getCatalog, type MediaFilters } from '@/lib/catalog'

// Catalog data is read from the database per request, so render dynamically
// rather than attempting static generation at build time.
export const dynamic = 'force-dynamic'

/** Filter tabs shown above the grid. `type` undefined means "all". */
const FILTERS: Array<{ label: string; type?: MediaFilters['type'] }> = [
  { label: 'All' },
  { label: 'Movies', type: 'MOVIE' },
  { label: 'Series', type: 'SERIES' },
]

const MEDIA_TYPES = ['MOVIE', 'SERIES', 'CLIP'] as const
function parseType(value: string | undefined): MediaFilters['type'] | undefined {
  if (!value) return undefined
  const normalized = value.toUpperCase()
  return (MEDIA_TYPES as readonly string[]).includes(normalized)
    ? (normalized as MediaFilters['type'])
    : undefined
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const activeType = parseType(type)

  const catalog = await getCatalog()
  const media = await catalog.listMedia(activeType ? { type: activeType } : {})

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10">
      <header className="mb-8 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="text-accent">FLIX</span> YOURSELF
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex gap-2" aria-label="Filter by type">
              {FILTERS.map((filter) => {
                const isActive = filter.type === activeType
                const href = filter.type ? `/?type=${filter.type.toLowerCase()}` : '/'
                return (
                  <Link
                    key={filter.label}
                    href={href}
                    className={
                      'rounded-full px-4 py-1.5 text-sm font-medium transition-colors ' +
                      (isActive
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white/80 hover:bg-white/20')
                    }
                  >
                    {filter.label}
                  </Link>
                )
              })}
            </nav>
            <Link
              href="/collections"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/20"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              Collections
            </Link>
            <Link
              href="/watchlist"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/20"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              My List
            </Link>
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/20"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              History
            </Link>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="flex justify-center sm:justify-start">
          <SearchBar />
        </div>
      </header>

      <ContinueWatchingRow />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white/90">
          Browse the catalog
        </h2>
        <MediaGrid
          media={media}
          emptyMessage="No titles match this filter yet."
        />
      </section>
    </main>
  )
}
