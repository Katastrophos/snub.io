/**
 * Feed items API
 * GET /api/items - List filtered items
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const DEMO_USER_ID = 'demo-user'

/**
 * GET /api/items - List feed items with optional filters
 * Query params:
 *  - feedId: Filter by feed
 *  - decision: Filter by decision (allow, block, highlight, etc.)
 *  - limit: Number of items per page (default: 50)
 *  - offset: Pagination offset (default: 0)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const feedId = searchParams.get('feedId')
    const decision = searchParams.get('decision')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      userId: DEMO_USER_ID,
    }

    if (feedId) {
      where.feedId = feedId
    }

    if (decision) {
      where.decision = decision.toUpperCase()
    }

    const [items, total] = await Promise.all([
      prisma.feedItem.findMany({
        where,
        orderBy: [
          { signalScore: 'desc' },
          { publishedAt: 'desc' },
        ],
        take: limit,
        skip: offset,
        include: {
          feed: {
            select: {
              title: true,
              url: true,
            },
          },
        },
      }),
      prisma.feedItem.count({ where }),
    ])

    return NextResponse.json({
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    })
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}
