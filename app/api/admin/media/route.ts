import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getStorage } from '@/lib/storage'

// Check if user is admin
async function isAdmin(email: string | null): Promise<boolean> {
  if (!email) return false
  
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  return adminEmails.includes(email.toLowerCase())
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !(await isAdmin(user.email))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const storage = await getStorage()

    // Parse form data
    const title = formData.get('title') as string
    const type = formData.get('type') as 'MOVIE' | 'SERIES' | 'CLIP'
    const releaseYear = formData.get('releaseYear')
      ? parseInt(formData.get('releaseYear') as string)
      : null
    const maturityRating = (formData.get('maturityRating') as string) || null
    const durationSec = formData.get('durationSec')
      ? parseInt(formData.get('durationSec') as string)
      : null
    const description = (formData.get('description') as string) || null
    const genres = JSON.parse(
      (formData.get('genres') as string) || '[]',
    ) as string[]
    const cast = JSON.parse((formData.get('cast') as string) || '[]') as Array<{
      name: string
      role: 'ACTOR' | 'DIRECTOR' | 'CREATOR'
    }>

    const videoFile = formData.get('video') as File | null
    const posterFile = formData.get('poster') as File | null
    const backdropFile = formData.get('backdrop') as File | null

    // Create media record
    const media = await prisma.media.create({
      data: {
        title,
        type,
        releaseYear,
        maturityRating,
        durationSec,
        description,
      },
    })

    // Upload and link video
    if (videoFile) {
      const videoPath = `videos/${media.id}/${videoFile.name}`
      const videoBuffer = Buffer.from(await videoFile.arrayBuffer())
      await storage.put(videoPath, videoBuffer, {
        contentType: videoFile.type,
      })

      await prisma.mediaVideo.create({
        data: {
          mediaId: media.id,
          storagePath: videoPath,
          container: videoFile.name.split('.').pop() || 'mp4',
          language: 'en',
          sizeBytes: BigInt(videoFile.size),
        },
      })

      // Create upload record
      await prisma.upload.create({
        data: {
          storagePath: videoPath,
          fileName: videoFile.name,
          contentType: videoFile.type,
          folder: 'videos',
          sizeBytes: BigInt(videoFile.size),
        },
      })
    }

    // Upload and link images
    if (posterFile) {
      const posterPath = `images/posters/${media.id}/${posterFile.name}`
      const posterBuffer = Buffer.from(await posterFile.arrayBuffer())
      await storage.put(posterPath, posterBuffer, {
        contentType: posterFile.type,
      })

      await prisma.mediaImage.create({
        data: {
          mediaId: media.id,
          type: 'POSTER',
          storagePath: posterPath,
        },
      })

      await prisma.upload.create({
        data: {
          storagePath: posterPath,
          fileName: posterFile.name,
          contentType: posterFile.type,
          folder: 'images',
          sizeBytes: BigInt(posterFile.size),
        },
      })
    }

    if (backdropFile) {
      const backdropPath = `images/backdrops/${media.id}/${backdropFile.name}`
      const backdropBuffer = Buffer.from(await backdropFile.arrayBuffer())
      await storage.put(backdropPath, backdropBuffer, {
        contentType: backdropFile.type,
      })

      await prisma.mediaImage.create({
        data: {
          mediaId: media.id,
          type: 'BACKDROP',
          storagePath: backdropPath,
        },
      })

      await prisma.upload.create({
        data: {
          storagePath: backdropPath,
          fileName: backdropFile.name,
          contentType: backdropFile.type,
          folder: 'images',
          sizeBytes: BigInt(backdropFile.size),
        },
      })
    }

    // Create genres
    for (const genreName of genres) {
      let genre = await prisma.genre.findUnique({
        where: { name: genreName },
      })
      if (!genre) {
        genre = await prisma.genre.create({
          data: { name: genreName },
        })
      }
      await prisma.mediaGenre.create({
        data: {
          mediaId: media.id,
          genreId: genre.id,
        },
      })
    }

    // Create cast/crew
    for (const castMember of cast) {
      let person = await prisma.person.findFirst({
        where: { name: castMember.name },
      })
      if (!person) {
        person = await prisma.person.create({
          data: { name: castMember.name },
        })
      }
      await prisma.mediaPerson.create({
        data: {
          mediaId: media.id,
          personId: person.id,
          role: castMember.role,
        },
      })
    }

    return NextResponse.json({ id: media.id, success: true })
  } catch (error) {
    console.error('Error creating media:', error)
    return NextResponse.json(
      { error: 'Failed to create media' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !(await isAdmin(user.email))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const media = await prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        videos: { take: 1 },
        images: { where: { type: 'POSTER' }, take: 1 },
        genres: { include: { genre: true } },
        people: { include: { person: true } },
        _count: { select: { episodes: true } },
      },
    })

    return NextResponse.json(media)
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 },
    )
  }
}
