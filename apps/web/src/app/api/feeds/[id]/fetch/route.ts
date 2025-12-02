/**
 * Feed fetching API
 * POST /api/feeds/:id/fetch - Manually trigger feed fetch
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { parseFeed, feedItemToSignal } from '@/lib/feed-parser'
import { evaluateSignal } from '@/lib/signal-evaluator'
import { getAuthenticatedUser } from '@/lib/get-user'

/**
 * POST /api/feeds/:id/fetch - Fetch and process feed items
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthenticatedUser()

    // Get feed from database
    const feed = await prisma.feed.findUnique({
      where: {
        id: params.id,
        userId,
      },
    })

    if (!feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 })
    }

    if (!feed.enabled) {
      return NextResponse.json({ error: 'Feed is disabled' }, { status: 400 })
    }

    // Parse feed
    const parsedFeed = await parseFeed(feed.url)

    let newItemsCount = 0
    let processedCount = 0

    // Process each item
    for (const item of parsedFeed.items) {
      // Check if item already exists
      const existing = await prisma.feedItem.findUnique({
        where: {
          feedId_externalId: {
            feedId: feed.id,
            externalId: item.id,
          },
        },
      })

      if (existing) {
        processedCount++
        continue
      }

      // Convert to signal and evaluate
      const signal = feedItemToSignal(item, userId)
      const result = await evaluateSignal(signal, userId)

      // Store item with evaluation results
      await prisma.feedItem.create({
        data: {
          feedId: feed.id,
          userId,
          externalId: item.id,
          title: item.title,
          content: item.content,
          url: item.url,
          author: item.author,
          publishedAt: item.publishedAt,
          signalScore: result.score.signal,
          noiseScore: result.score.noise,
          confidence: result.score.confidence,
          decision: result.decision,
          metadata: {
            reasons: result.score.reasons,
          },
        },
      })

      newItemsCount++
      processedCount++
    }

    // Update feed's last fetched timestamp
    await prisma.feed.update({
      where: { id: feed.id },
      data: { lastFetchedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      newItems: newItemsCount,
      totalProcessed: processedCount,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
