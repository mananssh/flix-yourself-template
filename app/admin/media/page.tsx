import { prisma } from '@/lib/db'
import { MediaLibraryTable } from '@/components/admin/MediaLibraryTable'
import Link from 'next/link'
import { Plus } from 'lucide-react'

async function getMedia() {
  const media = await prisma.media.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      videos: { take: 1 },
      images: { where: { type: 'POSTER' }, take: 1 },
      episodes: { select: { id: true } },
      _count: { select: { episodes: true } },
    },
  })

  return media
}

export default async function MediaLibraryPage() {
  const media = await getMedia()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
            Media Library
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Manage your movies, series, and clips
          </p>
        </div>
        <Link
          href="/admin/media/new"
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-600/20 transition-all duration-200 hover:bg-rose-700"
        >
          <Plus className="h-4 w-4" />
          Add Media
        </Link>
      </div>

      {/* Table */}
      <MediaLibraryTable media={media} />
    </div>
  )
}
