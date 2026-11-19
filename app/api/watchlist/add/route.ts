import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { addToWatchlist } from '@/lib/watchlist'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { mediaId } = body

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Missing required field: mediaId' },
        { status: 400 },
      )
    }

    await addToWatchlist(user.id, mediaId)

    return NextResponse.json({ success: true, inWatchlist: true })
  } catch (error) {
    console.error('Error adding to watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 },
    )
  }
}
