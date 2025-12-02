/**
 * Background service worker
 * Handles cross-tab communication, storage sync, and stats aggregation
 */

import { Storage } from '../shared/storage'

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TAB_ID') {
    sendResponse({ tabId: sender.tab?.id })
    return true
  }

  if (message.type === 'GET_STATS') {
    handleGetStats(sender.tab?.id, sendResponse)
    return true
  }

  if (message.type === 'SYNC_FILTERS') {
    handleSyncFilters(sendResponse)
    return true
  }

  return false
})

/**
 * Get stats for a tab
 */
async function handleGetStats(tabId: number | undefined, sendResponse: (response: any) => void) {
  if (!tabId) {
    sendResponse({ error: 'No tab ID' })
    return
  }

  const stats = await Storage.getStats(tabId)
  sendResponse({ stats })
}

/**
 * Sync filters from web app
 */
async function handleSyncFilters(sendResponse: (response: any) => void) {
  try {
    const config = await Storage.getConfig()

    if (!config.syncWithWebApp || !config.webAppUrl) {
      sendResponse({ error: 'Sync not configured' })
      return
    }

    if (!config.extensionToken) {
      sendResponse({ error: 'No extension token. Generate one in Settings.' })
      return
    }

    // Fetch filters from web app API using token
    const response = await fetch(`${config.webAppUrl}/api/extension/sync`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Extension-Token': config.extensionToken,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid token. Regenerate in Settings.')
      }
      throw new Error('Failed to fetch filters')
    }

    const data = await response.json()
    await Storage.setFilterConfigs(data.filters || [])

    // Update last synced time
    await Storage.setConfig({
      lastSyncedAt: data.syncedAt,
      userId: data.userId,
    })

    // Notify all tabs to reload filters
    const tabs = await chrome.tabs.query({})
    for (const tab of tabs) {
      if (tab.id) {
        try {
          chrome.tabs.sendMessage(tab.id, { type: 'FILTERS_UPDATED' })
        } catch (e) {
          // Tab may not have content script
        }
      }
    }

    sendResponse({ success: true, filterCount: data.filters?.length || 0 })
  } catch (error) {
    console.error('[snub.io] Error syncing filters:', error)
    sendResponse({ error: (error as Error).message })
  }
}

/**
 * Clear stats when tab is closed
 */
chrome.tabs.onRemoved.addListener(async (tabId) => {
  await Storage.clearStats(tabId)
})

/**
 * Periodic sync with web app (every 5 minutes)
 */
async function periodicSync() {
  const config = await Storage.getConfig()

  if (config.syncWithWebApp && config.webAppUrl && config.userId) {
    chrome.runtime.sendMessage({ type: 'SYNC_FILTERS' })
  }
}

// Set up periodic sync
chrome.alarms.create('periodicSync', { periodInMinutes: 5 })
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodicSync') {
    periodicSync()
  }
})

// Initialize
console.log('[snub.io] Background service worker initialized')
