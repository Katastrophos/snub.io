/**
 * Popup UI logic
 * Enhanced with visual mode, filter list, and sync status
 */

import { Storage } from '../shared/storage'
import type { ExtensionConfig } from '../shared/types'

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

  // Detect platform and update badge
  const platformBadge = document.getElementById('platform')!
  if (tab.url) {
    let platform = ''
    let isActive = false

    if (tab.url.includes('twitter.com') || tab.url.includes('x.com')) {
      platform = 'Twitter/X'
      isActive = true
    } else if (tab.url.includes('reddit.com')) {
      platform = 'Reddit'
      isActive = true
    } else if (tab.url.includes('news.ycombinator.com')) {
      platform = 'Hacker News'
      isActive = true
    }

    if (isActive) {
      platformBadge.textContent = platform
      platformBadge.className = 'platform-badge active'
    } else {
      platformBadge.textContent = 'Not filtering'
      platformBadge.className = 'platform-badge inactive'
    }
  }
}

// Load filter list
async function loadFilters() {
  const filters = await Storage.getFilterConfigs()
  const filterList = document.getElementById('filter-list')!

  if (filters.length === 0) {
    filterList.innerHTML = '<div class="no-filters">No filters loaded - click Sync</div>'
    return
  }

  filterList.innerHTML = filters.map((filter: any) => `
    <div class="filter-item">
      <div>
        <span class="filter-name">${filter.name}</span>
        <span class="filter-type">${filter.filterType}</span>
      </div>
      <span class="filter-status ${filter.enabled ? 'on' : 'off'}">
        ${filter.enabled ? 'ON' : 'OFF'}
      </span>
    </div>
  `).join('')
}

// Toggle extension
async function toggleExtension() {
  const config = await Storage.getConfig()
  const newState = !config.enabled

  await Storage.setConfig({ enabled: newState })
  updateToggleButton(newState)

  // Reload current tab
  const tab = await getCurrentTab()
  if (tab.id) {
    chrome.tabs.reload(tab.id)
  }
}

// Update toggle button UI
function updateToggleButton(enabled: boolean) {
  const btn = document.getElementById('toggle-btn')!
  if (enabled) {
    btn.textContent = 'ON'
    btn.className = 'toggle-btn on'
  } else {
    btn.textContent = 'OFF'
    btn.className = 'toggle-btn off'
  }
}

// Set visual mode
async function setVisualMode(mode: 'hide' | 'dim' | 'blur') {
  await Storage.setConfig({ visualMode: mode })
  updateVisualModeButtons(mode)

  // Notify content scripts
  const tabs = await chrome.tabs.query({})
  for (const tab of tabs) {
    if (tab.id) {
      try {
        chrome.tabs.sendMessage(tab.id, { type: 'VISUAL_MODE_CHANGED', mode })
      } catch (e) {
        // Tab may not have content script
      }
    }
  }
}

// Update visual mode buttons UI
function updateVisualModeButtons(mode: string) {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    const btnMode = btn.getAttribute('data-mode')
    if (btnMode === mode) {
      btn.classList.add('active')
    } else {
      btn.classList.remove('active')
    }
  })
}

// Open dashboard
async function openDashboard() {
  const config = await Storage.getConfig()
  chrome.tabs.create({ url: `${config.webAppUrl}/dashboard` })
}

// Open settings
async function openSettings() {
  const config = await Storage.getConfig()
  chrome.tabs.create({ url: `${config.webAppUrl}/settings` })
}

// Save extension token
async function saveToken() {
  const input = document.getElementById('token-input') as HTMLInputElement
  const status = document.getElementById('token-status')!
  const token = input.value.trim()

  if (!token) {
    status.textContent = 'Please enter a token'
    status.className = 'token-status error'
    return
  }

  await Storage.setConfig({ extensionToken: token })
  input.value = ''
  status.textContent = 'Token saved! Click Sync to load filters.'
  status.className = 'token-status saved'

  // Update token status display
  updateTokenStatus()

  setTimeout(() => {
    status.textContent = ''
    status.className = 'token-status'
  }, 3000)
}

// Update token status display
async function updateTokenStatus() {
  const config = await Storage.getConfig()
  const status = document.getElementById('token-status')!
  const input = document.getElementById('token-input') as HTMLInputElement

  if (config.extensionToken) {
    status.textContent = 'Token configured'
    status.className = 'token-status has-token'
    input.placeholder = 'Token saved (paste new to update)'
  } else {
    status.textContent = ''
    input.placeholder = 'Paste token from Settings...'
  }
}

// Sync filters
async function syncFilters() {
  const btn = document.getElementById('sync-filters')!
  const status = document.getElementById('sync-status')!

  btn.textContent = 'Syncing...'
  status.textContent = ''
  status.className = 'sync-status'

  chrome.runtime.sendMessage({ type: 'SYNC_FILTERS' }, (response) => {
    if (response?.success) {
      btn.textContent = 'Sync'
      status.textContent = `Synced ${response.filterCount} filters`
      status.className = 'sync-status success'
      loadFilters() // Reload filter list
    } else {
      btn.textContent = 'Sync'
      status.textContent = response?.error || 'Sync failed'
      status.className = 'sync-status error'
    }

    setTimeout(() => {
      status.textContent = ''
      status.className = 'sync-status'
    }, 3000)
  })
}

// Initialize
async function init() {
  // Load current state
  const config = await Storage.getConfig()

  // Set toggle button state
  updateToggleButton(config.enabled)

  // Set visual mode buttons
  updateVisualModeButtons(config.visualMode)

  // Load stats and filters
  loadStats()
  loadFilters()

  // Update token status
  updateTokenStatus()

  // Set up event listeners
  document.getElementById('toggle-btn')!.addEventListener('click', toggleExtension)
  document.getElementById('open-dashboard')!.addEventListener('click', openDashboard)
  document.getElementById('open-settings')!.addEventListener('click', openSettings)
  document.getElementById('sync-filters')!.addEventListener('click', syncFilters)
  document.getElementById('save-token')!.addEventListener('click', saveToken)

  // Allow Enter key to save token
  document.getElementById('token-input')!.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveToken()
    }
  })

  // Visual mode buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode') as 'hide' | 'dim' | 'blur'
      setVisualMode(mode)
    })
  })

  // Refresh stats every 2 seconds
  setInterval(loadStats, 2000)
}

init()
