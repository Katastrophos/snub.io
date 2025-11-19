/**
 * Popup UI logic
 */

import { Storage } from '../shared/storage'

// Get current tab
async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  return tabs[0]
}

// Load stats
async function loadStats() {
  const tab = await getCurrentTab()
  if (!tab.id) return

  chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
    if (response?.stats) {
      const stats = response.stats
      document.getElementById('stat-total')!.textContent = stats.total.toString()
      document.getElementById('stat-blocked')!.textContent = stats.blocked.toString()
      document.getElementById('stat-reduced')!.textContent = stats.reduced.toString()
      document.getElementById('stat-highlighted')!.textContent = stats.highlighted.toString()
    }
  })

  // Detect platform
  if (tab.url) {
    let platform = 'this page'
    if (tab.url.includes('twitter.com') || tab.url.includes('x.com')) {
      platform = 'Twitter/X'
    } else if (tab.url.includes('reddit.com')) {
      platform = 'Reddit'
    } else if (tab.url.includes('news.ycombinator.com')) {
      platform = 'Hacker News'
    }
    document.getElementById('platform')!.textContent = platform
  }
}

// Toggle extension
async function toggleExtension() {
  const config = await Storage.getConfig()
  const newState = !config.enabled

  await Storage.setConfig({ enabled: newState })

  const btn = document.getElementById('toggle-btn')!
  if (newState) {
    btn.textContent = 'Enabled'
    btn.className = 'toggle-btn enabled'
  } else {
    btn.textContent = 'Disabled'
    btn.className = 'toggle-btn disabled'
  }

  // Reload current tab
  const tab = await getCurrentTab()
  if (tab.id) {
    chrome.tabs.reload(tab.id)
  }
}

// Open dashboard
async function openDashboard() {
  const config = await Storage.getConfig()
  chrome.tabs.create({ url: `${config.webAppUrl}/dashboard` })
}

// Sync filters
async function syncFilters() {
  const btn = document.getElementById('sync-filters')!
  btn.textContent = 'Syncing...'

  chrome.runtime.sendMessage({ type: 'SYNC_FILTERS' }, (response) => {
    if (response?.success) {
      btn.textContent = `✓ Synced ${response.filterCount} filters`
      setTimeout(() => {
        btn.textContent = 'Sync Filters'
      }, 2000)
    } else {
      btn.textContent = '✗ Sync Failed'
      setTimeout(() => {
        btn.textContent = 'Sync Filters'
      }, 2000)
    }
  })
}

// Initialize
async function init() {
  // Load current state
  const config = await Storage.getConfig()
  const btn = document.getElementById('toggle-btn')!
  if (config.enabled) {
    btn.textContent = 'Enabled'
    btn.className = 'toggle-btn enabled'
  } else {
    btn.textContent = 'Disabled'
    btn.className = 'toggle-btn disabled'
  }

  // Load stats
  loadStats()

  // Set up event listeners
  btn.addEventListener('click', toggleExtension)
  document.getElementById('open-dashboard')!.addEventListener('click', openDashboard)
  document.getElementById('sync-filters')!.addEventListener('click', syncFilters)

  // Refresh stats every 2 seconds
  setInterval(loadStats, 2000)
}

init()
