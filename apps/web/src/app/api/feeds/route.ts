/**
 * Feed management API
 * GET  /api/feeds - List user's feeds
 * POST /api/feeds - Add new feed
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { parseFeed, validateFeedUrl } from '@/lib/feed-parser'

// For now, use a hardcoded demo user
// TODO: Add proper authentication
const DEMO_USER_ID = 'demo-user'

const createFeedSchema = z.object({
  url: z.string().url(),
  fetchInterval: z.number().min(5).max(1440).optional().default(60),
})

/**
 * GET /api/feeds - List all feeds for user
 */
export async function GET() {
  try {
    // Ensure demo user exists
    await ensureDemoUser()

    const feeds = await prisma.feed.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    })

    return NextResponse.json({ feeds })
  } catch (error) {
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
    // Ensure demo user exists
    await ensureDemoUser()

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
        userId: DEMO_USER_ID,
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

/**
 * Ensure demo user exists in database
 */
async function ensureDemoUser() {
  const user = await prisma.user.findUnique({
    where: { id: DEMO_USER_ID },
  })

  if (!user) {
    await prisma.user.create({
      data: {
        id: DEMO_USER_ID,
        email: 'demo@snub.io',
        name: 'Demo User',
        password: 'demo', // Not used for demo
      },
    })

    // Create default filters
    const { createDefaultFilters } = await import('@/lib/signal-evaluator')
    await createDefaultFilters(DEMO_USER_ID)
  }
}
