/**
 * Chrome storage utilities
 */

import type { ExtensionConfig, FilterStats } from './types'
import { DEFAULT_CONFIG } from './types'

export class Storage {
  /**
   * Get extension configuration
   */
  static async getConfig(): Promise<ExtensionConfig> {
    const result = await chrome.storage.sync.get('config')
    return result.config || DEFAULT_CONFIG
  }

  /**
   * Update extension configuration
   */
  static async setConfig(config: Partial<ExtensionConfig>): Promise<void> {
    const current = await this.getConfig()
    await chrome.storage.sync.set({
      config: { ...current, ...config },
    })
  }

  /**
   * Get filter stats for current tab
   */
  static async getStats(tabId: number): Promise<FilterStats> {
    const result = await chrome.storage.local.get(`stats_${tabId}`)
    return result[`stats_${tabId}`] || {
      blocked: 0,
      reduced: 0,
      highlighted: 0,
      total: 0,
    }
  }

  /**
   * Update filter stats for current tab
   */
  static async updateStats(tabId: number, stats: FilterStats): Promise<void> {
    await chrome.storage.local.set({
      [`stats_${tabId}`]: stats,
    })
  }

  /**
   * Clear stats for a tab
   */
  static async clearStats(tabId: number): Promise<void> {
    await chrome.storage.local.remove(`stats_${tabId}`)
  }

  /**
   * Get filter configurations (synced from web app)
   */
  static async getFilterConfigs(): Promise<any[]> {
    const result = await chrome.storage.local.get('filterConfigs')
    return result.filterConfigs || []
  }

  /**
   * Set filter configurations
   */
  static async setFilterConfigs(configs: any[]): Promise<void> {
    await chrome.storage.local.set({ filterConfigs: configs })
  }
}
