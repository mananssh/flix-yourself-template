/**
 * Catalog read-layer seam.
 *
 * The rest of the app reads media and collections only through {@link getCatalog}
 * and the {@link CatalogService} interface — never Prisma directly. This keeps a
 * single, swappable boundary around catalog queries (mirroring the db, storage,
 * and auth seams) so the backing implementation can change without touching
 * callers.
 *
 * Prisma is the only ORM in this project (see agent-kit/conventions.md), so there
 * is a single `prisma` provider today; the provider indirection exists so tests
 * (or future read models) can substitute an alternative without edits upstream.
 */

import type { CatalogProviderName, CatalogService } from './types'

export type {
  CatalogProviderName,
  CatalogService,
  CollectionSummary,
  CollectionWithMedia,
  EpisodeDTO,
  GenreDTO,
  ImageDTO,
  MediaDetail,
  MediaFilters,
  MediaSummary,
  PersonDTO,
  VideoDTO,
} from './types'

/**
 * Instantiates the catalog provider named by `CATALOG_PROVIDER` (default
 * `prisma`). The provider module is imported lazily so only the selected
 * implementation is loaded.
 */
async function createCatalog(
  provider: CatalogProviderName,
): Promise<CatalogService> {
  switch (provider) {
    case 'prisma': {
      const { PrismaCatalogService } = await import('./providers/prisma')
      return new PrismaCatalogService()
    }
    default: {
      // Exhaustiveness guard: a new provider name forces a case here.
      const _exhaustive: never = provider
      throw new Error(`Unhandled catalog provider: ${JSON.stringify(_exhaustive)}`)
    }
  }
}

/** Resolve and validate the configured catalog provider name. */
function resolveCatalogProvider(): CatalogProviderName {
  const provider = process.env.CATALOG_PROVIDER ?? 'prisma'
  if (provider !== 'prisma') {
    throw new Error(
      `Unknown CATALOG_PROVIDER: "${provider}". Expected one of: prisma.`,
    )
  }
  return provider
}

// Cache the resolved provider across calls within a runtime. In development we
// also cache on globalThis so hot-reloads don't re-instantiate it.
const globalForCatalog = globalThis as unknown as {
  catalog: Promise<CatalogService> | undefined
}

/**
 * Returns the configured catalog service, instantiated once and reused.
 *
 * @example
 * const catalog = await getCatalog()
 * const media = await catalog.listMedia({ type: 'MOVIE' })
 */
export function getCatalog(): Promise<CatalogService> {
  if (!globalForCatalog.catalog) {
    globalForCatalog.catalog = createCatalog(resolveCatalogProvider())
  }
  return globalForCatalog.catalog
}
