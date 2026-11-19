import { prisma } from '@/lib/db'
import { formatDistanceToNow } from '@/lib/utils/date'

async function getUploads() {
  const uploads = await prisma.upload.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return uploads
}

const formatBytes = (bytes: bigint | null) => {
  if (!bytes) return 'Unknown'
  const num = Number(bytes)
  if (num === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(num) / Math.log(k))
  return Math.round((num / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export default async function UploadsPage() {
  const uploads = await getUploads()

  // Calculate total storage
  const totalStorage = uploads.reduce(
    (sum, u) => sum + Number(u.sizeBytes || 0),
    0,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          Uploads
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          All files uploaded to storage
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm font-medium text-zinc-400">Total Files</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-100">
            {uploads.length}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm font-medium text-zinc-400">Total Storage</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-100">
            {formatBytes(BigInt(totalStorage))}
          </p>
        </div>
      </div>

      {/* Uploads Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-800 bg-zinc-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Folder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Uploaded
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {uploads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <p className="text-sm text-zinc-400">No uploads yet</p>
                  </td>
                </tr>
              ) : (
                uploads.map((upload) => (
                  <tr
                    key={upload.id}
                    className="transition-colors hover:bg-zinc-800/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            upload.folder === 'videos'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {upload.folder === 'videos' ? '🎬' : '🖼️'}
                        </div>
                        <span className="text-sm font-medium text-zinc-100 truncate">
                          {upload.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
                        {upload.contentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-300">
                      {upload.folder}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-300">
                      {formatBytes(upload.sizeBytes)}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {formatDistanceToNow(upload.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
