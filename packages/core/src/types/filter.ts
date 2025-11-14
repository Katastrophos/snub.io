import type { Signal, FilterScore, FilterResult } from './signal'

/**
 * Configuration for a filter
 */
export interface FilterConfig {
  id: string
  name: string
  enabled: boolean
  priority: number  // Higher priority filters run first
  config: Record<string, unknown>
}

/**
 * Base interface for all noise filters
 */
export interface NoiseFilter {
  readonly id: string
  readonly name: string
  readonly description: string

  /**
   * Evaluate a signal and return a score
   */
  evaluate(signal: Signal): Promise<FilterScore> | FilterScore

  /**
   * Determine if a signal should be blocked
   */
  shouldBlock(signal: Signal): Promise<boolean> | boolean

  /**
   * Configure the filter with new settings
   */
  configure(config: FilterConfig): void

  /**
   * Get current configuration
   */
  getConfig(): FilterConfig
}

/**
 * A filter that can learn from user behavior
 */
export interface AdaptiveFilter extends NoiseFilter {
  /**
   * Train the filter based on user feedback
   */
  train(signal: Signal, isNoise: boolean): Promise<void> | void

  /**
   * Reset the filter to its initial state
   */
  reset(): void
}

/**
 * Chain of filters that evaluate signals in sequence
 */
export interface FilterChain {
  readonly filters: NoiseFilter[]

  /**
   * Add a filter to the chain
   */
  addFilter(filter: NoiseFilter): void

  /**
   * Remove a filter from the chain
   */
  removeFilter(filterId: string): void

  /**
   * Evaluate a signal through all filters
   */
  evaluate(signal: Signal): Promise<FilterResult>

  /**
   * Get all filters in the chain
   */
  getFilters(): NoiseFilter[]
}
