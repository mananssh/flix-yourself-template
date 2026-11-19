import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function EditMediaPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  // Check admin
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  const isAdmin =
    user.email && adminEmails.includes(user.email.toLowerCase())

  if (!isAdmin) {
    redirect('/admin')
  }

  const media = await prisma.media.findUnique({
    where: { id: params.id },
    include: {
      videos: true,
      images: true,
      genres: { include: { genre: true } },
      people: { include: { person: true } },
      episodes: true,
    },
  })

  if (!media) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
        <h1 className="text-xl font-semibold text-zinc-100">Media Not Found</h1>
        <p className="mt-2 text-sm text-zinc-400">
          The media you're looking for doesn't exist.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          Edit Media
        </h1>
        <p className="mt-2 text-sm text-zinc-400">{media.title}</p>
      </div>

      {/* Media Details */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-300">Title</label>
            <p className="mt-1 text-zinc-100">{media.title}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-zinc-300">Type</label>
              <p className="mt-1 text-zinc-100">{media.type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-300">
                Release Year
              </label>
              <p className="mt-1 text-zinc-100">
                {media.releaseYear || 'Not specified'}
              </p>
            </div>
          </div>

          {media.description && (
            <div>
              <label className="text-sm font-medium text-zinc-300">
                Description
              </label>
              <p className="mt-1 text-zinc-100">{media.description}</p>
            </div>
          )}

          {media.genres.length > 0 && (
            <div>
              <label className="text-sm font-medium text-zinc-300">
                Genres
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {media.genres.map((g) => (
                  <span
                    key={g.genreId}
                    className="rounded-full bg-rose-500/10 px-3 py-1 text-sm text-rose-400"
                  >
                    {g.genre.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {media.people.length > 0 && (
            <div>
              <label className="text-sm font-medium text-zinc-300">
                Cast & Crew
              </label>
              <div className="mt-2 space-y-2">
                {media.people.map((p) => (
                  <div
                    key={`${p.personId}-${p.role}`}
                    className="flex items-center justify-between rounded-lg bg-zinc-800 px-3 py-2"
                  >
                    <span className="text-sm text-zinc-100">
                      {p.person.name}
                    </span>
                    <span className="text-xs text-zinc-500">{p.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Media Files */}
      <div className="space-y-4">
        {media.videos.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-100">
              Video Files
            </h2>
            <div className="space-y-2">
              {media.videos.map((video) => (
                <div
                  key={video.id}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 p-4"
                >
                  <p className="text-sm font-medium text-zinc-100">
                    {video.storagePath}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {video.container} • {video.language}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {media.images.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-100">
              Images
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {media.images.map((image) => (
                <div
                  key={image.id}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 p-3"
                >
                  <img
                    src={`/api/media/file/${image.storagePath}`}
                    alt={image.type}
                    className="h-32 w-full rounded object-cover"
                  />
                  <p className="mt-2 text-xs text-zinc-400">{image.type}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
