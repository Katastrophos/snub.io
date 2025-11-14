import type { Signal, FilterScore } from '../types/signal'
import type { NoiseFilter, FilterConfig } from '../types/filter'

/**
 * Abstract base class for implementing noise filters
 */
export abstract class BaseFilter implements NoiseFilter {
  protected config: FilterConfig

  constructor(config: FilterConfig) {
    this.config = config
  }

  get id(): string {
    return this.config.id
  }

  get name(): string {
    return this.config.name
  }

  abstract get description(): string

  /**
   * Evaluate a signal - must be implemented by subclasses
   */
  abstract evaluate(signal: Signal): Promise<FilterScore> | FilterScore

  /**
   * Default implementation: block if noise > signal
   */
  shouldBlock(signal: Signal): boolean | Promise<boolean> {
    const score = this.evaluate(signal)
    if (score instanceof Promise) {
      return score.then(s => s.noise > s.signal)
    }
    return score.noise > score.signal
  }

  /**
   * Update filter configuration
   */
  configure(config: FilterConfig): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): FilterConfig {
    return { ...this.config }
  }

  /**
   * Helper: Create a score object
   */
  protected createScore(
    signal: number,
    noise: number,
    confidence: number,
    reasons?: string[]
  ): FilterScore {
    return {
      signal: Math.max(0, Math.min(1, signal)),
      noise: Math.max(0, Math.min(1, noise)),
      confidence: Math.max(0, Math.min(1, confidence)),
      reasons,
    }
  }
}
