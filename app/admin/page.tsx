import { prisma } from '@/lib/db'
import { getStorage } from '@/lib/storage'
import { StatsCards } from '@/components/admin/StatsCards'
import { RecentUploads } from '@/components/admin/RecentUploads'

async function getStats() {
  const [totalMedia, totalEpisodes, totalUploads, recentUploads] =
    await Promise.all([
      prisma.media.count(),
      prisma.episode.count(),
      prisma.upload.count(),
      prisma.upload.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

  // Calculate total storage used
  const uploads = await prisma.upload.findMany({
    select: { sizeBytes: true },
  })
  const totalStorage = uploads.reduce(
    (sum, u) => sum + Number(u.sizeBytes || 0),
    0,
  )

  return {
    totalMedia,
    totalEpisodes,
    totalUploads,
    totalStorage,
    recentUploads,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Overview of your streaming platform
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Recent Uploads */}
      <RecentUploads uploads={stats.recentUploads} />
    </div>
  )
}
