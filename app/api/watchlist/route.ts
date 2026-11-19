import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { updateProgress } from '@/lib/watchlist'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { mediaId, episodeId, progressSeconds } = body

    if (!mediaId || typeof progressSeconds !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: mediaId, progressSeconds' },
        { status: 400 },
      )
    }

    await updateProgress({
      userId: user.id,
      mediaId,
      episodeId: episodeId ?? undefined,
      progressSeconds,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to update watchlist' },
      { status: 500 },
    )
  }
}
