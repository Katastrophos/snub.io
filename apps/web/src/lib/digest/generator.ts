/**
 * Digest generation service
 * Creates curated summaries of high-signal content
 */

import prisma from '../prisma'
import type { DigestType } from '@prisma/client'

export interface DigestOptions {
  type: DigestType
  userId: string
  signalThreshold?: number
  minItems?: number
  maxItems?: number
}

export interface GeneratedDigest {
  id: string
  type: DigestType
  itemCount: number
  items: any[]
}

/**
 * Generate a digest for a user
 */
export async function generateDigest(
  options: DigestOptions
): Promise<GeneratedDigest | null> {
  const {
    type,
    userId,
    signalThreshold = 0.7,
    minItems = 3,
    maxItems = 50,
  } = options

  // Calculate date range based on digest type
  const { startDate, endDate } = getDateRange(type)

  // Find high-signal items in the date range
  const items = await prisma.feedItem.findMany({
    where: {
      userId,
      publishedAt: {
        gte: startDate,
        lte: endDate,
      },
      OR: [
        { decision: 'HIGHLIGHT' },
        { signalScore: { gte: signalThreshold } },
      ],
    },
    orderBy: [
      { signalScore: 'desc' },
      { publishedAt: 'desc' },
    ],
    take: maxItems,
    include: {
      feed: {
        select: {
          title: true,
          url: true,
        },
      },
    },
  })

  // Check if we have enough items
  if (items.length < minItems) {
    return null
  }

  // Create digest in database
  const digest = await prisma.digest.create({
    data: {
      userId,
      type,
      startDate,
      endDate,
      itemCount: items.length,
      items: items.map(item => item.id), // Store item IDs
      metadata: {
        avgSignalScore: items.reduce((sum, i) => sum + (i.signalScore || 0), 0) / items.length,
        topSource: getMostFrequentSource(items),
      },
    },
  })

  return {
    id: digest.id,
    type: digest.type,
    itemCount: items.length,
    items,
  }
}

/**
 * Generate digests for all users
 */
export async function generateDigestsForAllUsers(
  type: DigestType
): Promise<{ generated: number; skipped: number }> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      notificationPrefs: true,
    },
  })

  let generated = 0
  let skipped = 0

  for (const user of users) {
    const prefs = user.notificationPrefs as any || {}

    // Check if user wants this digest type
    if (prefs.autoFetch === false || prefs.digestFrequency !== type.toLowerCase()) {
      skipped++
      continue
    }

    const digest = await generateDigest({
      type,
      userId: user.id,
      signalThreshold: prefs.highSignalThreshold || 0.7,
      minItems: prefs.digestMinItems || 3,
    })

    if (digest) {
      generated++
    } else {
      skipped++
    }
  }

  return { generated, skipped }
}

/**
 * Get digest with full item details
 */
export async function getDigestWithItems(digestId: string) {
  const digest = await prisma.digest.findUnique({
    where: { id: digestId },
  })

  if (!digest) {
    return null
  }

  const itemIds = digest.items as string[]
  const items = await prisma.feedItem.findMany({
    where: {
      id: { in: itemIds },
    },
    include: {
      feed: {
        select: {
          title: true,
          url: true,
        },
      },
    },
    orderBy: {
      signalScore: 'desc',
    },
  })

  return {
    ...digest,
    items,
  }
}

/**
 * Mark digest as viewed
 */
export async function markDigestAsViewed(digestId: string) {
  await prisma.digest.update({
    where: { id: digestId },
    data: { viewedAt: new Date() },
  })
}

/**
 * Get date range for digest type
 */
function getDateRange(type: DigestType): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  let startDate: Date

  switch (type) {
    case 'HOURLY':
      startDate = new Date(endDate.getTime() - 60 * 60 * 1000) // 1 hour
      break
    case 'DAILY':
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000) // 24 hours
      break
    case 'WEEKLY':
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days
      break
    default:
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)
  }

  return { startDate, endDate }
}

/**
 * Get most frequent source from items
 */
function getMostFrequentSource(items: any[]): string {
  const sources: Record<string, number> = {}

  for (const item of items) {
    const source = item.feed?.title || 'Unknown'
    sources[source] = (sources[source] || 0) + 1
  }

  return Object.entries(sources).sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown'
}
