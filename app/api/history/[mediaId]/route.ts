import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { removeFromHistory } from '@/lib/history'

/**
 * DELETE /api/history/[mediaId]
 * Remove a single item from viewing history.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mediaId } = await params

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Missing mediaId parameter' },
        { status: 400 },
      )
    }

    await removeFromHistory(user.id, mediaId)

    return NextResponse.json({
      success: true,
      message: 'Item removed from history',
    })
  } catch (error) {
    console.error('Error removing item from history:', error)
    return NextResponse.json(
      { error: 'Failed to remove item from history' },
      { status: 500 },
    )
  }
}
