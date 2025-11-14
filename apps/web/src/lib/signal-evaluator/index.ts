/**
 * Signal evaluation pipeline
 * Applies user's filter chain to signals and stores results
 */

import { FilterChain } from '@snub/core'
import { KeywordFilter, EngagementBaitFilter } from '@snub/filter-social'
import type { Signal, FilterResult, FilterConfig as CoreFilterConfig } from '@snub/core'
import type { FilterConfig } from '@prisma/client'
import prisma from '../prisma'

/**
 * Evaluate a signal using a user's filter configurations
 */
export async function evaluateSignal(
  signal: Signal,
  userId: string
): Promise<FilterResult> {
  // Fetch user's filter configs from database
  const filterConfigs = await prisma.filterConfig.findMany({
    where: {
      userId,
      enabled: true,
    },
    orderBy: {
      priority: 'desc',
    },
  })

  // Build filter chain
  const filters = filterConfigs.map(config => createFilterFromConfig(config))
  const chain = new FilterChain(filters)

  // Evaluate signal
  const result = await chain.evaluate(signal)

  return result
}

/**
 * Create a filter instance from database configuration
 */
function createFilterFromConfig(config: FilterConfig) {
  const coreConfig: CoreFilterConfig = {
    id: config.id,
    name: config.name,
    enabled: config.enabled,
    priority: config.priority,
    config: config.config as Record<string, unknown>,
  }

  switch (config.filterType) {
    case 'keyword':
      return new KeywordFilter(coreConfig)
    case 'engagement_bait':
      return new EngagementBaitFilter(coreConfig)
    default:
      throw new Error(`Unknown filter type: ${config.filterType}`)
  }
}

/**
 * Create default filters for a new user
 */
export async function createDefaultFilters(userId: string): Promise<void> {
  // Create a default engagement bait filter
  await prisma.filterConfig.create({
    data: {
      userId,
      filterType: 'engagement_bait',
      name: 'Engagement Bait Detector',
      config: {},
      enabled: true,
      priority: 90,
    },
  })

  // Create a default keyword filter with common noise keywords
  await prisma.filterConfig.create({
    data: {
      userId,
      filterType: 'keyword',
      name: 'Common Noise Keywords',
      config: {
        noiseKeywords: [
          'breaking',
          'shocking',
          'you won\'t believe',
          'this will blow your mind',
        ],
        signalKeywords: [
          'research',
          'study',
          'analysis',
          'data',
        ],
      },
      enabled: true,
      priority: 80,
    },
  })
}
