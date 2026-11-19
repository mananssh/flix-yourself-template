'use client'

import Link from 'next/link'
import { Edit, Trash2, Film, Tv } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/utils/date'

type Media = {
  id: string
  title: string
  type: 'MOVIE' | 'SERIES' | 'CLIP'
  releaseYear: number | null
  createdAt: Date
  videos: Array<{ id: string }>
  images: Array<{ id: string; storagePath: string }>
  _count: { episodes: number }
}

export function MediaLibraryTable({ media }: { media: Media[] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-zinc-800 bg-zinc-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Media
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Episodes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {media.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Film className="mx-auto h-12 w-12 text-zinc-600" />
                  <p className="mt-4 text-sm font-medium text-zinc-300">
                    No media yet
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Get started by adding your first movie or series
                  </p>
                </td>
              </tr>
            ) : (
              media.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-zinc-800/30"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.images[0] ? (
                        <img
                          src={`/api/media/file/${item.images[0].storagePath}`}
                          alt={item.title}
                          className="h-12 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-8 items-center justify-center rounded bg-zinc-800 text-zinc-500">
                          {item.type === 'MOVIE' ? (
                            <Film className="h-4 w-4" />
                          ) : (
                            <Tv className="h-4 w-4" />
                          )}
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/admin/media/${item.id}`}
                          className="font-medium text-zinc-100 hover:text-rose-400"
                        >
                          {item.title}
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.type === 'MOVIE'
                          ? 'bg-rose-500/10 text-rose-400'
                          : item.type === 'SERIES'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-green-500/10 text-green-400'
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-300">
                    {item.releaseYear || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-300">
                    {item.type === 'SERIES'
                      ? item._count.episodes
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">
                    {formatDistanceToNow(item.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/media/${item.id}`}
                        className="rounded-lg bg-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        className="rounded-lg bg-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-red-900/20 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
