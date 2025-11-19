/**
 * Filter engine for evaluating posts
 * Uses @snub/core filtering logic
 */

import { FilterChain } from '@snub/core'
import { KeywordFilter, EngagementBaitFilter } from '@snub/filter-social'
import type { Signal, FilterResult, FilterConfig } from '@snub/core'

export class FilterEngine {
  private filterChain: FilterChain

  constructor(filterConfigs: any[] = []) {
    const filters = filterConfigs.length > 0
      ? filterConfigs.map(config => this.createFilter(config))
      : this.getDefaultFilters()

    this.filterChain = new FilterChain(filters)
  }

  /**
   * Evaluate a signal through the filter chain
   */
  async evaluate(signal: Signal): Promise<FilterResult> {
    return await this.filterChain.evaluate(signal)
  }

  /**
   * Create a filter from configuration
   */
  private createFilter(config: any) {
    const filterConfig: FilterConfig = {
      id: config.id || crypto.randomUUID(),
      name: config.name,
      enabled: config.enabled !== false,
      priority: config.priority || 50,
      config: config.config || {},
    }

    switch (config.filterType) {
      case 'keyword':
        return new KeywordFilter(filterConfig)
      case 'engagement_bait':
        return new EngagementBaitFilter(filterConfig)
      default:
        throw new Error(`Unknown filter type: ${config.filterType}`)
    }
  }

  /**
   * Get default filters if none configured
   */
  private getDefaultFilters() {
    return [
      new EngagementBaitFilter({
        id: 'default-engagement-bait',
        name: 'Engagement Bait Detector',
        enabled: true,
        priority: 90,
        config: {},
      }),
      new KeywordFilter({
        id: 'default-keywords',
        name: 'Default Keywords',
        enabled: true,
        priority: 80,
        config: {
          noiseKeywords: [
            'breaking',
            'shocking',
            'you won\'t believe',
            'this will blow your mind',
            'doctors hate',
          ],
          signalKeywords: [
            'research',
            'study',
            'analysis',
            'data',
            'paper',
          ],
        },
      }),
    ]
  }

  /**
   * Update filter configurations
   */
  updateFilters(filterConfigs: any[]) {
    const filters = filterConfigs.map(config => this.createFilter(config))
    this.filterChain = new FilterChain(filters)
  }
}
