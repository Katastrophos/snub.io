/**
 * Adaptive Learning Module
 * Learns from user feedback to improve filter accuracy
 */

import prisma from '../prisma'

interface FeedbackStats {
  totalFeedback: number
  signalFeedback: number
  noiseFeedback: number
  accuracyRate: number
  suggestedKeywords: {
    noise: string[]
    signal: string[]
  }
}

/**
 * Analyze user feedback and extract keywords from misclassified items
 */
export async function analyzeFeedback(userId: string): Promise<FeedbackStats> {
  // Get items with user feedback
  const items = await prisma.feedItem.findMany({
    where: {
      userId,
      userFeedback: { not: null },
    },
    select: {
      id: true,
      title: true,
      content: true,
      decision: true,
      userFeedback: true,
      signalScore: true,
    },
  })

  const signalFeedback = items.filter((i: { userFeedback: string | null }) => i.userFeedback === 'SIGNAL').length
  const noiseFeedback = items.filter((i: { userFeedback: string | null }) => i.userFeedback === 'NOISE').length

  // Find misclassified items (where user disagreed with filter)
  const misclassified = items.filter((item: { userFeedback: string | null; decision: string | null }) => {
    if (item.userFeedback === 'SIGNAL') {
      // User said signal but filter blocked/reduced
      return item.decision === 'BLOCK' || item.decision === 'REDUCE'
    }
    if (item.userFeedback === 'NOISE') {
      // User said noise but filter allowed/highlighted
      return item.decision === 'ALLOW' || item.decision === 'HIGHLIGHT'
    }
    return false
  })

  // Calculate accuracy
  const correctlyClassified = items.length - misclassified.length
  const accuracyRate = items.length > 0 ? correctlyClassified / items.length : 1

  // Extract common words from misclassified items
  const suggestedKeywords = extractKeywords(misclassified)

  return {
    totalFeedback: items.length,
    signalFeedback,
    noiseFeedback,
    accuracyRate,
    suggestedKeywords,
  }
}

/**
 * Extract potential keywords from misclassified items
 */
function extractKeywords(items: Array<{ title: string; content: string; userFeedback: string | null }>) {
  const noiseWords: Map<string, number> = new Map()
  const signalWords: Map<string, number> = new Map()

  // Common stop words to ignore
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'under', 'again',
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    's', 't', 'just', 'don', 'now', 'and', 'but', 'or', 'if', 'this', 'that',
    'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom',
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
  ])

  for (const item of items) {
    const text = `${item.title} ${item.content}`.toLowerCase()
    const words = text.match(/\b[a-z]{4,}\b/g) || [] // Words 4+ chars

    const targetMap = item.userFeedback === 'NOISE' ? noiseWords : signalWords

    for (const word of words) {
      if (!stopWords.has(word)) {
        targetMap.set(word, (targetMap.get(word) || 0) + 1)
      }
    }
  }

  // Get top keywords (appearing at least twice)
  const sortByCount = (map: Map<string, number>) =>
    Array.from(map.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)

  return {
    noise: sortByCount(noiseWords),
    signal: sortByCount(signalWords),
  }
}

/**
 * Process feedback and update filter weights
 * Called after user provides feedback on an item
 */
export async function processItemFeedback(
  userId: string,
  itemId: string,
  feedback: 'NOISE' | 'SIGNAL'
): Promise<void> {
  // Get the item details
  const item = await prisma.feedItem.findUnique({
    where: { id: itemId },
    select: {
      title: true,
      content: true,
      decision: true,
      metadata: true,
    },
  })

  if (!item) return

  // Check if this was a misclassification
  const wasMisclassified =
    (feedback === 'SIGNAL' && (item.decision === 'BLOCK' || item.decision === 'REDUCE')) ||
    (feedback === 'NOISE' && (item.decision === 'ALLOW' || item.decision === 'HIGHLIGHT'))

  if (!wasMisclassified) return

  // Get user's keyword filter
  const keywordFilter = await prisma.filterConfig.findFirst({
    where: {
      userId,
      filterType: 'keyword',
      enabled: true,
    },
    orderBy: { priority: 'desc' },
  })

  if (!keywordFilter) return

  // Extract potential keyword from item
  const text = `${item.title} ${item.content}`.toLowerCase()
  const words = text.match(/\b[a-z]{4,15}\b/g) || []

  // Find the most distinctive word (not already in keywords)
  const currentConfig = keywordFilter.config as { noiseKeywords?: string[]; signalKeywords?: string[] }
  const existingKeywords = [
    ...(currentConfig.noiseKeywords || []),
    ...(currentConfig.signalKeywords || []),
  ].map(k => k.toLowerCase())

  const newWord = words.find(w =>
    !existingKeywords.includes(w) &&
    w.length >= 4 &&
    w.length <= 15
  )

  if (newWord) {
    // Auto-add the keyword to the appropriate list
    const key = feedback === 'NOISE' ? 'noiseKeywords' : 'signalKeywords'
    const currentList = currentConfig[key] || []

    // Limit auto-added keywords to prevent bloat
    if (currentList.length < 50) {
      await prisma.filterConfig.update({
        where: { id: keywordFilter.id },
        data: {
          config: {
            ...currentConfig,
            [key]: [...currentList, newWord],
          },
        },
      })
    }
  }
}

/**
 * Get learning stats for a user
 */
export async function getLearningStats(userId: string) {
  const stats = await analyzeFeedback(userId)

  return {
    ...stats,
    isLearning: stats.totalFeedback >= 5,
    needsMoreFeedback: stats.totalFeedback < 5,
    feedbackNeeded: Math.max(0, 5 - stats.totalFeedback),
  }
}
