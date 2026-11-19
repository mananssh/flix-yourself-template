import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Plus, FolderOpen } from 'lucide-react'

async function getCollections() {
  const collections = await prisma.mediaCollection.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { items: true } },
    },
  })

  return collections
}

export default async function CollectionsPage() {
  const collections = await getCollections()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
            Collections
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Organize media into curated collections
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-600/20 transition-all duration-200 hover:bg-rose-700">
          <Plus className="h-4 w-4" />
          New Collection
        </button>
      </div>

      {/* Collections Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.length === 0 ? (
          <div className="col-span-full rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-zinc-600" />
            <p className="mt-4 text-sm font-medium text-zinc-300">
              No collections yet
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Create your first collection to organize media
            </p>
          </div>
        ) : (
          collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/admin/collections/${collection.id}`}
              className="group rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-900/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-500/10">
                  <FolderOpen className="h-6 w-6 text-rose-400" />
                </div>
                <span className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
                  {collection._count.items} items
                </span>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-zinc-100 group-hover:text-rose-400">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
                    {collection.description}
                  </p>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
