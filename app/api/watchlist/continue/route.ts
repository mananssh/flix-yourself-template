import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getContinueWatching } from '@/lib/watchlist'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const items = await getContinueWatching(user.id)

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching continue watching:', error)
    return NextResponse.json(
      { error: 'Failed to fetch continue watching' },
      { status: 500 },
    )
  }
}
