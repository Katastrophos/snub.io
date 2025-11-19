/**
 * Reddit content filtering
 */

import { BasePlatformFilter } from './base-filter'
import type { Signal, SignalSource } from '@snub/core'

export class RedditFilter extends BasePlatformFilter {
  protected getPlatformName(): string {
    return 'Reddit'
  }

  protected getSignalSource(): SignalSource {
    return 'SOCIAL_MEDIA' as SignalSource
  }

  protected findPostElements(): HTMLElement[] {
    // Reddit uses different selectors for old/new design
    const newReddit = Array.from(document.querySelectorAll('div[data-testid="post-container"]'))
    const oldReddit = Array.from(document.querySelectorAll('.thing.link'))
    return [...newReddit, ...oldReddit] as HTMLElement[]
  }

  protected isPostElement(element: HTMLElement): boolean {
    return element.matches('div[data-testid="post-container"]') ||
           element.matches('.thing.link')
  }

  protected findPostInElement(element: HTMLElement): HTMLElement | null {
    return element.querySelector('div[data-testid="post-container"]') ||
           element.querySelector('.thing.link')
  }

  protected extractSignal(element: HTMLElement): Signal | null {
    try {
      // Check if new or old Reddit
      const isNewReddit = element.hasAttribute('data-testid')

      let title = ''
      let selftext = ''
      let author = 'Unknown'
      let subreddit = ''
      let url = ''
      let postId = ''

      if (isNewReddit) {
        // New Reddit
        const titleElement = element.querySelector('h3')
        title = titleElement?.textContent || ''

        const selftextElement = element.querySelector('[data-test-id="post-content-text"]')
        selftext = selftextElement?.textContent || ''

        const authorElement = element.querySelector('[data-testid="post_author_link"]')
        author = authorElement?.textContent || 'Unknown'

        const subredditElement = element.querySelector('[data-testid="subreddit-name"]')
        subreddit = subredditElement?.textContent || ''

        const linkElement = element.querySelector('a[data-click-id="body"]') as HTMLAnchorElement
        url = linkElement?.href || ''

        postId = element.getAttribute('data-post-id') || crypto.randomUUID()
      } else {
        // Old Reddit
        const titleElement = element.querySelector('.title a.title')
        title = titleElement?.textContent || ''

        const authorElement = element.querySelector('.author')
        author = authorElement?.textContent || 'Unknown'

        const subredditElement = element.querySelector('.subreddit')
        subreddit = subredditElement?.textContent || ''

        const linkElement = element.querySelector('.title a.title') as HTMLAnchorElement
        url = linkElement?.href || ''

        postId = element.getAttribute('data-fullname') || crypto.randomUUID()
      }

      const text = `${title}\n${selftext}`.trim()

      return {
        id: postId,
        source: this.getSignalSource(),
        content: {
          text,
          links: url ? [url] : [],
        },
        metadata: {
          timestamp: Date.now(),
          source: this.getSignalSource(),
          author,
          platform: 'reddit',
          subreddit,
          url,
        },
        timestamp: Date.now(),
      }
    } catch (error) {
      console.error('[snub.io] Error extracting Reddit signal:', error)
      return null
    }
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new RedditFilter())
} else {
  new RedditFilter()
}
