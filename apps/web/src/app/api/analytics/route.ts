/**
 * Analytics API
 * GET /api/analytics - Get user's analytics and insights
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/get-user'

export async function GET() {
  try {
    const userId = await getAuthenticatedUser()

    const [feeds, items, blocked, highlighted] = await Promise.all([
      prisma.feed.count({ where: { userId } }),
      prisma.feedItem.count({ where: { userId } }),
      prisma.feedItem.count({ where: { userId, decision: 'BLOCK' } }),
      prisma.feedItem.count({ where: { userId, decision: 'HIGHLIGHT' } }),
    ])

    const avgScore = await prisma.feedItem.aggregate({
      where: { userId, signalScore: { not: null } },
      _avg: { signalScore: true },
    })

    const topSources = await prisma.feedItem.groupBy({
      by: ['feedId'],
      where: { userId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })

    const sourcesWithNames = await Promise.all(
      topSources.map(async (s) => {
        const feed = await prisma.feed.findUnique({
          where: { id: s.feedId },
          select: { title: true },
        })
        return {
          source: feed?.title || 'Unknown',
          count: s._count.id,
        }
      })
    )

    return NextResponse.json({
      analytics: {
        totalFeeds: feeds,
        totalItems: items,
        totalBlocked: blocked,
        totalHighlighted: highlighted,
        avgSignalScore: avgScore._avg.signalScore || 0,
        topSources: sourcesWithNames,
        recentActivity: [],
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
