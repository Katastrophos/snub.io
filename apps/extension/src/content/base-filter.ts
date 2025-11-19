/**
 * Base class for platform-specific content filtering
 */

import type { Signal, SignalSource, FilterResult } from '@snub/core'
import type { FilterStats } from '../shared/types'
import { FilterEngine } from '../shared/filter-engine'
import { Storage } from '../shared/storage'

export abstract class BasePlatformFilter {
  protected filterEngine: FilterEngine
  protected observer: MutationObserver | null = null
  protected stats: FilterStats = {
    blocked: 0,
    reduced: 0,
    highlighted: 0,
    total: 0,
  }
  protected processedElements = new Set<HTMLElement>()

  constructor() {
    this.filterEngine = new FilterEngine()
    this.init()
  }

  /**
   * Initialize the filter
   */
  protected async init() {
    // Load filter configs from storage
    const configs = await Storage.getFilterConfigs()
    if (configs.length > 0) {
      this.filterEngine.updateFilters(configs)
    }

    // Check if extension is enabled
    const config = await Storage.getConfig()
    if (!config.enabled) {
      console.log('[snub.io] Extension disabled')
      return
    }

    // Start observing
    this.observe()

    // Process existing elements
    this.processExistingElements()

    console.log('[snub.io] Filtering active on', this.getPlatformName())
  }

  /**
   * Start observing DOM for new content
   */
  protected observe() {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.processElement(node as HTMLElement)
          }
        }
      }
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  /**
   * Process existing elements on page
   */
  protected processExistingElements() {
    const elements = this.findPostElements()
    elements.forEach(el => this.processElement(el))
  }

  /**
   * Process a single element
   */
  protected async processElement(element: HTMLElement) {
    const postElement = this.isPostElement(element)
      ? element
      : this.findPostInElement(element)

    if (!postElement || this.processedElements.has(postElement)) {
      return
    }

    this.processedElements.add(postElement)

    try {
      const signal = this.extractSignal(postElement)
      if (!signal) return

      const result = await this.filterEngine.evaluate(signal)

      this.applyFilterDecision(postElement, result)
      this.updateStats(result)

      // Save stats to storage
      const tabId = await this.getCurrentTabId()
      if (tabId) {
        await Storage.updateStats(tabId, this.stats)
      }
    } catch (error) {
      console.error('[snub.io] Error processing element:', error)
    }
  }

  /**
   * Apply visual modifications based on filter decision
   */
  protected applyFilterDecision(element: HTMLElement, result: FilterResult) {
    const decision = result.decision

    // Remove existing snub classes
    element.classList.remove(
      'snub-blocked',
      'snub-reduced',
      'snub-highlighted',
      'snub-allowed'
    )

    // Apply decision class
    element.classList.add(`snub-${decision.toLowerCase()}`)

    // Add data attributes for debugging
    element.dataset.snubDecision = decision
    element.dataset.snubSignal = result.score.signal.toFixed(2)
    element.dataset.snubNoise = result.score.noise.toFixed(2)

    // Add badge
    this.addBadge(element, decision, result.score.signal)
  }

  /**
   * Add visual badge to filtered content
   */
  protected addBadge(element: HTMLElement, decision: string, signalScore: number) {
    // Remove existing badge
    const existing = element.querySelector('.snub-badge')
    if (existing) existing.remove()

    const badge = document.createElement('div')
    badge.className = `snub-badge snub-badge-${decision.toLowerCase()}`

    switch (decision) {
      case 'BLOCK':
        badge.textContent = '🚫 Blocked'
        break
      case 'REDUCE':
        badge.textContent = '⬇️ Low Signal'
        break
      case 'HIGHLIGHT':
        badge.textContent = '⭐ High Signal'
        break
      case 'DEFER':
        badge.textContent = '📋 Read Later'
        break
      default:
        return // Don't show badge for ALLOW
    }

    element.prepend(badge)
  }

  /**
   * Update filter stats
   */
  protected updateStats(result: FilterResult) {
    this.stats.total++

    switch (result.decision) {
      case 'BLOCK':
        this.stats.blocked++
        break
      case 'REDUCE':
        this.stats.reduced++
        break
      case 'HIGHLIGHT':
        this.stats.highlighted++
        break
    }
  }

  /**
   * Get current tab ID
   */
  protected async getCurrentTabId(): Promise<number | null> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_TAB_ID' }, (response) => {
        resolve(response?.tabId || null)
      })
    })
  }

  /**
   * Platform-specific methods (must be implemented by subclasses)
   */
  protected abstract getPlatformName(): string
  protected abstract findPostElements(): HTMLElement[]
  protected abstract isPostElement(element: HTMLElement): boolean
  protected abstract findPostInElement(element: HTMLElement): HTMLElement | null
  protected abstract extractSignal(element: HTMLElement): Signal | null
  protected abstract getSignalSource(): SignalSource
}
