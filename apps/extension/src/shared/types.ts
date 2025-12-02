/**
 * Shared types for browser extension
 */

import type { FilterDecision } from '@snub/core'

export interface FilterStats {
  blocked: number
  reduced: number
  highlighted: number
  total: number
}

export interface ExtensionConfig {
  enabled: boolean
  syncWithWebApp: boolean
  webAppUrl: string
  extensionToken?: string
  userId?: string
  showStats: boolean
  visualMode: 'hide' | 'dim' | 'blur'
  lastSyncedAt?: string
}

export interface FilteredPost {
  id: string
  platform: 'twitter' | 'reddit' | 'hackernews'
  decision: FilterDecision
  signalScore: number
  noiseScore: number
  url: string
  timestamp: number
}

export const DEFAULT_CONFIG: ExtensionConfig = {
  enabled: true,
  syncWithWebApp: true,
  webAppUrl: 'http://localhost:3000',
  showStats: true,
  visualMode: 'dim',
}
