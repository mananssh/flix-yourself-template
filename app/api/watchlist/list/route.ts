import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getWatchlist } from '@/lib/watchlist'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const items = await getWatchlist(user.id)

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 },
    )
  }
}
