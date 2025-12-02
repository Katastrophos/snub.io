/**
 * Learning stats API
 * GET /api/learning/stats - Get adaptive learning stats for user
 */

import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/get-user'
import { getLearningStats } from '@/lib/adaptive-learning'

/**
 * GET /api/learning/stats - Get learning statistics
 */
export async function GET() {
  try {
    const userId = await getAuthenticatedUser()
    const stats = await getLearningStats(userId)

    return NextResponse.json({ stats })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching learning stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch learning stats' },
      { status: 500 }
    )
  }
}
