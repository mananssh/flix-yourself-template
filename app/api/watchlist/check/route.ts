import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { isInWatchlist } from '@/lib/watchlist'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get('mediaId')

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Missing required parameter: mediaId' },
        { status: 400 },
      )
    }

    const inWatchlist = await isInWatchlist(user.id, mediaId)

    return NextResponse.json({ inWatchlist })
  } catch (error) {
    console.error('Error checking watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to check watchlist' },
      { status: 500 },
    )
  }
}
