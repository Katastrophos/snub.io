/**
 * RSS/Atom feed parser
 * Fetches and parses feeds, normalizing to internal Signal format
 */

import Parser from 'rss-parser'
import type { Signal, SignalSource } from '@snub/core'

export interface ParsedFeedItem {
  id: string
  title: string
  content: string
  url?: string
  author?: string
  publishedAt: Date
  feedUrl: string
}

export interface ParsedFeed {
  title?: string
  description?: string
  items: ParsedFeedItem[]
}

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ['media:content', 'media'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
})

/**
 * Fetch and parse an RSS/Atom feed
 */
export async function parseFeed(feedUrl: string): Promise<ParsedFeed> {
  try {
    const feed = await parser.parseURL(feedUrl)

    const items: ParsedFeedItem[] = feed.items.map((item) => {
      // Prefer content:encoded over content over description
      const content =
        (item as any).contentEncoded ||
        item.content ||
        item.contentSnippet ||
        item.summary ||
        ''

      // Use guid/id if available, otherwise hash the link
      const id = item.guid || item.id || item.link || generateId(item)

      return {
        id,
        title: item.title || 'Untitled',
        content,
        url: item.link,
        author: item.creator || item.author,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        feedUrl,
      }
    })

    return {
      title: feed.title,
      description: feed.description,
      items,
    }
  } catch (error) {
    throw new Error(`Failed to parse feed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Convert a parsed feed item to a Signal for evaluation
 */
export function feedItemToSignal(item: ParsedFeedItem, userId: string): Signal {
  return {
    id: item.id,
    source: 'FEED' as SignalSource,
    content: {
      text: stripHtml(item.content),
      html: item.content,
      links: extractLinks(item.content),
    },
    metadata: {
      timestamp: item.publishedAt.getTime(),
      source: 'FEED' as SignalSource,
      url: item.url,
      author: item.author,
      platform: 'feed',
      feedUrl: item.feedUrl,
    },
    timestamp: item.publishedAt.getTime(),
  }
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract all links from HTML content
 */
function extractLinks(html: string): string[] {
  const linkRegex = /href=["']([^"']+)["']/g
  const links: string[] = []
  let match

  while ((match = linkRegex.exec(html)) !== null) {
    links.push(match[1])
  }

  return links
}

/**
 * Generate a deterministic ID for an item
 */
function generateId(item: any): string {
  const str = `${item.title}-${item.link}-${item.pubDate}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Validate if a URL is a valid feed
 */
export async function validateFeedUrl(url: string): Promise<boolean> {
  try {
    await parser.parseURL(url)
    return true
  } catch {
    return false
  }
}
