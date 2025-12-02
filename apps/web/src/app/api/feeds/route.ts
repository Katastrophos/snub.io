/**
 * Feed management API
 * GET  /api/feeds - List user's feeds
 * POST /api/feeds - Add new feed
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { parseFeed, validateFeedUrl } from '@/lib/feed-parser'
import { getAuthenticatedUser } from '@/lib/get-user'

const createFeedSchema = z.object({
  url: z.string().url(),
  fetchInterval: z.number().min(5).max(1440).optional().default(60),
})

/**
 * GET /api/feeds - List all feeds for user
 */
export async function GET() {
  try {
    const userId = await getAuthenticatedUser()

    const feeds = await prisma.feed.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    })

    return NextResponse.json({ feeds })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching feeds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feeds' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/feeds - Add new feed
 */
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUser()

    const body = await request.json()
    const data = createFeedSchema.parse(body)

    // Validate feed URL
    const isValid = await validateFeedUrl(data.url)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid feed URL or feed cannot be accessed' },
        { status: 400 }
      )
    }

    // Parse feed to get metadata
    const parsedFeed = await parseFeed(data.url)

    // Create feed in database
    const feed = await prisma.feed.create({
      data: {
        userId,
        url: data.url,
        title: parsedFeed.title || 'Untitled Feed',
        description: parsedFeed.description,
        type: 'RSS',
        fetchInterval: data.fetchInterval,
        enabled: true,
      },
    })

    return NextResponse.json({ feed }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating feed:', error)
    return NextResponse.json(
      { error: 'Failed to create feed' },
      { status: 500 }
    )
  }
}
