/**
 * Core type definitions for the snub.io signal filtering system
 */

/**
 * Represents the source of a signal (content that may be noise or valuable)
 */
export enum SignalSource {
  SOCIAL_MEDIA = 'social_media',
  EMAIL = 'email',
  NOTIFICATION = 'notification',
  NEWS = 'news',
  FEED = 'feed',
  WEB_PAGE = 'web_page',
  CUSTOM = 'custom',
}

/**
 * Content types that can be filtered
 */
export interface Content {
  text?: string
  html?: string
  images?: string[]
  links?: string[]
  metadata?: Record<string, unknown>
}

/**
 * Metadata associated with a signal
 */
export interface Metadata {
  timestamp: number
  source: SignalSource
  url?: string
  author?: string
  platform?: string
  tags?: string[]
  [key: string]: unknown
}

/**
 * A signal represents any piece of content that could be noise or valuable information
 */
export interface Signal {
  id: string
  source: SignalSource
  content: Content
  metadata: Metadata
  timestamp: number
}

/**
 * The result of evaluating a signal through a filter
 */
export interface FilterScore {
  /** Signal strength (0-1, higher = more valuable) */
  signal: number
  /** Noise level (0-1, higher = more noisy) */
  noise: number
  /** Confidence in the score (0-1, higher = more certain) */
  confidence: number
  /** Reasons for the score */
  reasons?: string[]
}

/**
 * Decision on what to do with a signal
 */
export enum FilterDecision {
  ALLOW = 'allow',           // Show the signal
  BLOCK = 'block',           // Hide the signal completely
  DEFER = 'defer',           // Show later (e.g., in a digest)
  HIGHLIGHT = 'highlight',   // Emphasize as high-value
  REDUCE = 'reduce',         // Show but de-emphasize
}

/**
 * Result of filtering a signal
 */
export interface FilterResult {
  decision: FilterDecision
  score: FilterScore
  filterId: string
  timestamp: number
}
