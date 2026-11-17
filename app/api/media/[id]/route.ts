import { notFound, ok, serverError } from '@/lib/api/responses'
import { getCatalog } from '@/lib/catalog'

/**
 * GET /api/media/[id]
 *
 * Returns a single media item with all relations (images, videos, genres,
 * people, episodes), or 404 if no media has that id.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const catalog = await getCatalog()
    const media = await catalog.getMediaById(id)
    if (!media) {
      return notFound(`Media "${id}" not found`)
    }
    return ok(media)
  } catch (error) {
    return serverError(`GET /api/media/${id}`, error)
  }
}
