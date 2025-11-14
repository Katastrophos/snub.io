/**
 * Smart feed fetching service
 * Automatically fetches feeds based on their fetch intervals
 */

import prisma from '../prisma'
import { parseFeed, feedItemToSignal } from '../feed-parser'
import { evaluateSignal } from '../signal-evaluator'

export interface FetchResult {
  feedId: string
  success: boolean
  newItems: number
  error?: string
}

export interface FetchSummary {
  totalFeeds: number
  fetchedFeeds: number
  totalNewItems: number
  errors: number
  results: FetchResult[]
}

/**
 * Fetch all feeds that are due for an update
 */
export async function fetchDueFeeds(): Promise<FetchSummary> {
  const now = new Date()

  // Find all enabled feeds that are due for fetching
  const dueFeeds = await prisma.feed.findMany({
    where: {
      enabled: true,
      OR: [
        { lastFetchedAt: null },
        {
          lastFetchedAt: {
            // Feed is due if: now - lastFetchedAt >= fetchInterval
            lte: new Date(now.getTime() - 15 * 60 * 1000), // At minimum 15 min ago
          },
        },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          notificationPrefs: true,
        },
      },
    },
  })

  // Filter by actual fetch interval
  const feedsToFetch = dueFeeds.filter(feed => {
    if (!feed.lastFetchedAt) return true
    const minutesSinceLastFetch = (now.getTime() - feed.lastFetchedAt.getTime()) / (1000 * 60)
    return minutesSinceLastFetch >= feed.fetchInterval
  })

  const results: FetchResult[] = []
  let totalNewItems = 0
  let errors = 0

  // Process feeds in batches to avoid overwhelming
  const BATCH_SIZE = 10
  const BATCH_DELAY_MS = 100

  for (let i = 0; i < feedsToFetch.length; i += BATCH_SIZE) {
    const batch = feedsToFetch.slice(i, i + BATCH_SIZE)

    const batchResults = await Promise.all(
      batch.map(feed => fetchAndProcessFeed(feed.id, feed.userId))
    )

    results.push(...batchResults)
    totalNewItems += batchResults.reduce((sum, r) => sum + r.newItems, 0)
    errors += batchResults.filter(r => !r.success).length

    // Delay between batches
    if (i + BATCH_SIZE < feedsToFetch.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  return {
    totalFeeds: dueFeeds.length,
    fetchedFeeds: feedsToFetch.length,
    totalNewItems,
    errors,
    results,
  }
}

/**
 * Fetch and process a single feed
 */
export async function fetchAndProcessFeed(
  feedId: string,
  userId: string
): Promise<FetchResult> {
  try {
    const feed = await prisma.feed.findUnique({
      where: { id: feedId },
    })

    if (!feed || !feed.enabled) {
      return {
        feedId,
        success: false,
        newItems: 0,
        error: 'Feed not found or disabled',
      }
    }

    // Parse feed
    const parsedFeed = await parseFeed(feed.url)
    let newItemsCount = 0

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
    }

    // Update feed's last fetched timestamp
    await prisma.feed.update({
      where: { id: feed.id },
      data: { lastFetchedAt: new Date() },
    })

    return {
      feedId,
      success: true,
      newItems: newItemsCount,
    }
  } catch (error) {
    console.error(`Error fetching feed ${feedId}:`, error)
    return {
      feedId,
      success: false,
      newItems: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get default notification preferences
 */
export function getDefaultNotificationPrefs() {
  return {
    autoFetch: true,
    digestFrequency: 'daily' as const,
    digestDelivery: 'web' as const,
    highSignalThreshold: 0.7,
    digestMinItems: 3,
    mutedFeeds: [],
  }
}
