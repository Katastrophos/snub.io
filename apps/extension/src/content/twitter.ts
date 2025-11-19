/**
 * Twitter/X content filtering
 */

import { BasePlatformFilter } from './base-filter'
import type { Signal, SignalSource } from '@snub/core'

export class TwitterFilter extends BasePlatformFilter {
  protected getPlatformName(): string {
    return 'Twitter/X'
  }

  protected getSignalSource(): SignalSource {
    return 'SOCIAL_MEDIA' as SignalSource
  }

  protected findPostElements(): HTMLElement[] {
    return Array.from(document.querySelectorAll('article[data-testid="tweet"]'))
  }

  protected isPostElement(element: HTMLElement): boolean {
    return element.matches('article[data-testid="tweet"]')
  }

  protected findPostInElement(element: HTMLElement): HTMLElement | null {
    return element.querySelector('article[data-testid="tweet"]')
  }

  protected extractSignal(element: HTMLElement): Signal | null {
    try {
      // Extract tweet text
      const tweetTextElement = element.querySelector('[data-testid="tweetText"]')
      const text = tweetTextElement?.textContent || ''

      // Extract author
      const authorElement = element.querySelector('[data-testid="User-Name"]')
      const author = authorElement?.textContent || 'Unknown'

      // Extract links
      const linkElements = element.querySelectorAll('a[href^="http"]')
      const links = Array.from(linkElements).map(a => (a as HTMLAnchorElement).href)

      // Get tweet ID from URL
      const tweetLink = element.querySelector('a[href*="/status/"]') as HTMLAnchorElement
      const tweetId = tweetLink?.href.split('/status/')[1]?.split('?')[0] || crypto.randomUUID()

      // Check if promoted
      const isPromoted = element.querySelector('[data-testid="promotedIndicator"]') !== null

      return {
        id: tweetId,
        source: this.getSignalSource(),
        content: {
          text,
          links,
        },
        metadata: {
          timestamp: Date.now(),
          source: this.getSignalSource(),
          author,
          platform: 'twitter',
          url: tweetLink?.href,
          isPromoted,
        },
        timestamp: Date.now(),
      }
    } catch (error) {
      console.error('[snub.io] Error extracting Twitter signal:', error)
      return null
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new TwitterFilter())
} else {
  new TwitterFilter()
}
