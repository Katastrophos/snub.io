import type { Signal, FilterResult, FilterDecision } from '../types/signal'
import type { NoiseFilter, FilterChain as IFilterChain } from '../types/filter'

/**
 * Implementation of a filter chain that processes signals through multiple filters
 */
export class FilterChain implements IFilterChain {
  private _filters: NoiseFilter[] = []

  constructor(filters: NoiseFilter[] = []) {
    this._filters = [...filters].sort((a, b) => {
      const priorityA = a.getConfig().priority || 0
      const priorityB = b.getConfig().priority || 0
      return priorityB - priorityA // Higher priority first
    })
  }

  get filters(): NoiseFilter[] {
    return [...this._filters]
  }

  addFilter(filter: NoiseFilter): void {
    this._filters.push(filter)
    this._filters.sort((a, b) => {
      const priorityA = a.getConfig().priority || 0
      const priorityB = b.getConfig().priority || 0
      return priorityB - priorityA
    })
  }

  removeFilter(filterId: string): void {
    this._filters = this._filters.filter(f => f.id !== filterId)
  }

  async evaluate(signal: Signal): Promise<FilterResult> {
    if (this._filters.length === 0) {
      return {
        decision: 'allow' as FilterDecision,
        score: {
          signal: 0.5,
          noise: 0.5,
          confidence: 0,
          reasons: ['No filters configured'],
        },
        filterId: 'none',
        timestamp: Date.now(),
      }
    }

    // Evaluate through all filters and aggregate scores
    const scores = await Promise.all(
      this._filters.map(async filter => ({
        filter,
        score: await Promise.resolve(filter.evaluate(signal)),
      }))
    )

    // Aggregate scores (weighted by confidence)
    const totalConfidence = scores.reduce((sum, { score }) => sum + score.confidence, 0)
    const aggregatedSignal = scores.reduce(
      (sum, { score }) => sum + score.signal * score.confidence,
      0
    ) / (totalConfidence || 1)
    const aggregatedNoise = scores.reduce(
      (sum, { score }) => sum + score.noise * score.confidence,
      0
    ) / (totalConfidence || 1)
    const aggregatedConfidence = totalConfidence / scores.length

    // Collect all reasons
    const reasons = scores.flatMap(({ filter, score }) =>
      (score.reasons || []).map(r => `[${filter.name}] ${r}`)
    )

    // Determine decision
    let decision: FilterDecision
    const noiseRatio = aggregatedNoise / (aggregatedSignal + aggregatedNoise)

    if (noiseRatio > 0.8) {
      decision = 'block' as FilterDecision
    } else if (noiseRatio > 0.6) {
      decision = 'reduce' as FilterDecision
    } else if (aggregatedSignal > 0.8) {
      decision = 'highlight' as FilterDecision
    } else if (noiseRatio > 0.4) {
      decision = 'defer' as FilterDecision
    } else {
      decision = 'allow' as FilterDecision
    }

    return {
      decision,
      score: {
        signal: aggregatedSignal,
        noise: aggregatedNoise,
        confidence: aggregatedConfidence,
        reasons,
      },
      filterId: 'chain',
      timestamp: Date.now(),
    }
  }

  getFilters(): NoiseFilter[] {
    return this.filters
  }
}
