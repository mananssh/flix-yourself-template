import Link from 'next/link'

import { ContinueWatchingRow } from '@/components/catalog/ContinueWatchingRow'
import { MediaGrid } from '@/components/catalog/MediaGrid'
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
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">
          <span className="text-accent">FLIX</span> YOURSELF
        </h1>
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
