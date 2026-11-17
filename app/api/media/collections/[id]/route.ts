import { notFound, ok, serverError } from '@/lib/api/responses'
import { getCatalog } from '@/lib/catalog'

/**
 * GET /api/media/collections/[id]
 *
 * Returns a collection and its media (ordered by sortOrder, then title), or 404
 * if no collection has that id.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const catalog = await getCatalog()
    const collection = await catalog.getMediaByCollection(id)
    if (!collection) {
      return notFound(`Collection "${id}" not found`)
    }
    return ok(collection)
  } catch (error) {
    return serverError(`GET /api/media/collections/${id}`, error)
  }
}
