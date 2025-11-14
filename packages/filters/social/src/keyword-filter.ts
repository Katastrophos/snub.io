import { BaseFilter } from '@snub/core'
import type { Signal, FilterScore, FilterConfig } from '@snub/core'

/**
 * Simple keyword-based filter for social media content
 * Blocks content containing specified noise keywords
 */
export class KeywordFilter extends BaseFilter {
  private noiseKeywords: Set<string> = new Set()
  private signalKeywords: Set<string> = new Set()

  constructor(config: FilterConfig) {
    super(config)
    this.updateKeywords()
  }

  get description(): string {
    return 'Filters social media content based on keyword matching'
  }

  private updateKeywords(): void {
    const cfg = this.config.config as {
      noiseKeywords?: string[]
      signalKeywords?: string[]
    }

    this.noiseKeywords = new Set(
      (cfg.noiseKeywords || []).map(k => k.toLowerCase())
    )
    this.signalKeywords = new Set(
      (cfg.signalKeywords || []).map(k => k.toLowerCase())
    )
  }

  configure(config: FilterConfig): void {
    super.configure(config)
    this.updateKeywords()
  }

  evaluate(signal: Signal): FilterScore {
    const text = (signal.content.text || '').toLowerCase()
    const reasons: string[] = []

    // Count keyword matches
    let noiseMatches = 0
    let signalMatches = 0

    for (const keyword of this.noiseKeywords) {
      if (text.includes(keyword)) {
        noiseMatches++
        reasons.push(`Contains noise keyword: "${keyword}"`)
      }
    }

    for (const keyword of this.signalKeywords) {
      if (text.includes(keyword)) {
        signalMatches++
        reasons.push(`Contains signal keyword: "${keyword}"`)
      }
    }

    // Calculate scores
    const totalKeywords = this.noiseKeywords.size + this.signalKeywords.size
    const hasContent = text.length > 0

    if (totalKeywords === 0 || !hasContent) {
      return this.createScore(0.5, 0.5, 0.1, ['No keywords configured or no content'])
    }

    const noiseRatio = noiseMatches / Math.max(1, this.noiseKeywords.size)
    const signalRatio = signalMatches / Math.max(1, this.signalKeywords.size)

    const noiseScore = Math.min(1, noiseRatio)
    const signalScore = Math.min(1, signalRatio)
    const confidence = (noiseMatches + signalMatches) / totalKeywords

    return this.createScore(signalScore, noiseScore, confidence, reasons)
  }
}
