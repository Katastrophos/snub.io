/**
 * Hacker News content filtering
 */

import { BasePlatformFilter } from './base-filter'
import type { Signal, SignalSource } from '@snub/core'

export class HackerNewsFilter extends BasePlatformFilter {
  protected getPlatformName(): string {
    return 'Hacker News'
  }

  protected getSignalSource(): SignalSource {
    return 'NEWS' as SignalSource
  }

  protected findPostElements(): HTMLElement[] {
    return Array.from(document.querySelectorAll('tr.athing'))
  }

  protected isPostElement(element: HTMLElement): boolean {
    return element.matches('tr.athing')
  }

  protected findPostInElement(element: HTMLElement): HTMLElement | null {
    return element.querySelector('tr.athing')
  }

  protected extractSignal(element: HTMLElement): Signal | null {
    try {
      // Extract title and URL
      const titleElement = element.querySelector('.titleline > a')
      const title = titleElement?.textContent || ''
      const url = (titleElement as HTMLAnchorElement)?.href || ''

      // Extract submitter from next sibling
      const metadataRow = element.nextElementSibling
      const authorElement = metadataRow?.querySelector('.hnuser')
      const author = authorElement?.textContent || 'Unknown'

      // Extract points
      const scoreElement = metadataRow?.querySelector('.score')
      const scoreText = scoreElement?.textContent || '0 points'
      const points = parseInt(scoreText.split(' ')[0]) || 0

      // Get post ID
      const postId = element.getAttribute('id') || crypto.randomUUID()

      return {
        id: postId,
        source: this.getSignalSource(),
        content: {
          text: title,
          links: [url],
        },
        metadata: {
          timestamp: Date.now(),
          source: this.getSignalSource(),
          author,
          platform: 'hackernews',
          url,
          points,
        },
        timestamp: Date.now(),
      }
    } catch (error) {
      console.error('[snub.io] Error extracting HN signal:', error)
      return null
    }
  }

  /**
   * Override: Also apply to subtext row (metadata)
   */
  protected applyFilterDecision(element: HTMLElement, result: any) {
    super.applyFilterDecision(element, result)

    // Apply same class to metadata row
    const metadataRow = element.nextElementSibling as HTMLElement
    if (metadataRow) {
      metadataRow.classList.add(`snub-${result.decision.toLowerCase()}`)
    }
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new HackerNewsFilter())
} else {
  new HackerNewsFilter()
}
