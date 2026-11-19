import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getHistory, clearHistory } from '@/lib/history'

/**
 * GET /api/history
 * Get viewing history for the current user.
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params for limit
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 50

    const items = await getHistory(user.id, limit)

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/history
 * Clear all viewing history for the current user.
 */
export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await clearHistory(user.id)

    return NextResponse.json({
      success: true,
      message: 'History cleared',
      count,
    })
  } catch (error) {
    console.error('Error clearing history:', error)
    return NextResponse.json(
      { error: 'Failed to clear history' },
      { status: 500 },
    )
  }
}
