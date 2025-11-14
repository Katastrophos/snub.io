import { BaseFilter } from '@snub/core'
import type { Signal, FilterScore, FilterConfig } from '@snub/core'

/**
 * Detects and filters engagement bait patterns in social media
 * (e.g., "like if you agree", "share this", clickbait patterns)
 */
export class EngagementBaitFilter extends BaseFilter {
  // Common engagement bait patterns
  private readonly baitPatterns = [
    /like if you/i,
    /share if you/i,
    /tag someone who/i,
    /comment below/i,
    /drop a .* if/i,
    /you won't believe/i,
    /what happened next/i,
    /shocking/i,
    /this will blow your mind/i,
    /number \d+ will shock you/i,
    /doctors hate (him|her|this)/i,
    /^agree\?$/i,
    /^this\.$/i,
  ]

  get description(): string {
    return 'Detects and filters engagement bait and clickbait patterns'
  }

  evaluate(signal: Signal): FilterScore {
    const text = signal.content.text || ''
    const reasons: string[] = []
    let baitCount = 0

    // Check for bait patterns
    for (const pattern of this.baitPatterns) {
      if (pattern.test(text)) {
        baitCount++
        reasons.push(`Matched engagement bait pattern: ${pattern.source}`)
      }
    }

    // Check for excessive emojis (another bait indicator)
    const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length
    const wordCount = text.split(/\s+/).length
    const emojiRatio = wordCount > 0 ? emojiCount / wordCount : 0

    if (emojiRatio > 0.3) {
      baitCount++
      reasons.push(`Excessive emoji usage: ${(emojiRatio * 100).toFixed(0)}%`)
    }

    // Check for excessive capitalization
    const capsCount = (text.match(/[A-Z]/g) || []).length
    const letterCount = (text.match(/[a-zA-Z]/g) || []).length
    const capsRatio = letterCount > 0 ? capsCount / letterCount : 0

    if (capsRatio > 0.5 && letterCount > 10) {
      baitCount++
      reasons.push(`Excessive capitalization: ${(capsRatio * 100).toFixed(0)}%`)
    }

    // Calculate score
    const noiseScore = Math.min(1, baitCount / 3) // Normalize to 0-1
    const signalScore = 1 - noiseScore
    const confidence = baitCount > 0 ? 0.8 : 0.3

    if (baitCount === 0) {
      reasons.push('No engagement bait detected')
    }

    return this.createScore(signalScore, noiseScore, confidence, reasons)
  }
}
