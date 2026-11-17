import { ok, serverError } from '@/lib/api/responses'
import { getCatalog } from '@/lib/catalog'

/**
 * GET /api/media/collections
 *
 * Lists all media collections (alphabetical), each with an item count.
 */
export async function GET() {
  try {
    const catalog = await getCatalog()
    const collections = await catalog.getCollections()
    return ok(collections)
  } catch (error) {
    return serverError('GET /api/media/collections', error)
  }
}
