'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface NotificationPrefs {
  autoFetch: boolean
  digestFrequency: 'hourly' | 'daily' | 'weekly'
  digestDelivery: 'web' | 'email' | 'both'
  highSignalThreshold: number
  digestMinItems: number
  mutedFeeds: string[]
}

interface FilterConfig {
  id: string
  filterType: 'keyword' | 'engagement_bait'
  name: string
  config: {
    noiseKeywords?: string[]
    signalKeywords?: string[]
  }
  enabled: boolean
  priority: number
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    autoFetch: true,
    digestFrequency: 'daily',
    digestDelivery: 'web',
    highSignalThreshold: 0.7,
    digestMinItems: 3,
    mutedFeeds: [],
  })
  const [filters, setFilters] = useState<FilterConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editingFilter, setEditingFilter] = useState<string | null>(null)
  const [newKeyword, setNewKeyword] = useState('')
  const [keywordType, setKeywordType] = useState<'noise' | 'signal'>('noise')
  const [showNewFilter, setShowNewFilter] = useState(false)
  const [newFilterName, setNewFilterName] = useState('')
  const [newFilterType, setNewFilterType] = useState<'keyword' | 'engagement_bait'>('keyword')
  const [extensionToken, setExtensionToken] = useState<string | null>(null)
  const [generatingToken, setGeneratingToken] = useState(false)
  const [tokenCopied, setTokenCopied] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [prefsRes, filtersRes] = await Promise.all([
        fetch('/api/preferences'),
        fetch('/api/filters'),
      ])
      const prefsData = await prefsRes.json()
      const filtersData = await filtersRes.json()

      if (prefsData.notificationPrefs) {
        setPrefs(prefsData.notificationPrefs)
      }
      if (filtersData.filters) {
        setFilters(filtersData.filters)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function savePreferences() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationPrefs: prefs }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  async function toggleFilter(filterId: string, enabled: boolean) {
    try {
      await fetch(`/api/filters/${filterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      setFilters(filters.map(f => f.id === filterId ? { ...f, enabled } : f))
    } catch (error) {
      console.error('Error toggling filter:', error)
    }
  }

  async function deleteFilter(filterId: string) {
    if (!confirm('Are you sure you want to delete this filter?')) return
    try {
      await fetch(`/api/filters/${filterId}`, { method: 'DELETE' })
      setFilters(filters.filter(f => f.id !== filterId))
    } catch (error) {
      console.error('Error deleting filter:', error)
    }
  }

  async function addKeyword(filterId: string, keyword: string, type: 'noise' | 'signal') {
    if (!keyword.trim()) return
    const filter = filters.find(f => f.id === filterId)
    if (!filter) return

    const key = type === 'noise' ? 'noiseKeywords' : 'signalKeywords'
    const existingKeywords = filter.config[key] || []
    if (existingKeywords.includes(keyword.trim())) return

    const newConfig = {
      ...filter.config,
      [key]: [...existingKeywords, keyword.trim()],
    }

    try {
      await fetch(`/api/filters/${filterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig }),
      })
      setFilters(filters.map(f => f.id === filterId ? { ...f, config: newConfig } : f))
      setNewKeyword('')
    } catch (error) {
      console.error('Error adding keyword:', error)
    }
  }

  async function removeKeyword(filterId: string, keyword: string, type: 'noise' | 'signal') {
    const filter = filters.find(f => f.id === filterId)
    if (!filter) return

    const key = type === 'noise' ? 'noiseKeywords' : 'signalKeywords'
    const newConfig = {
      ...filter.config,
      [key]: (filter.config[key] || []).filter((k: string) => k !== keyword),
    }

    try {
      await fetch(`/api/filters/${filterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig }),
      })
      setFilters(filters.map(f => f.id === filterId ? { ...f, config: newConfig } : f))
    } catch (error) {
      console.error('Error removing keyword:', error)
    }
  }

  async function createFilter() {
    if (!newFilterName.trim()) return
    try {
      const response = await fetch('/api/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filterType: newFilterType,
          name: newFilterName.trim(),
          config: newFilterType === 'keyword' ? { noiseKeywords: [], signalKeywords: [] } : {},
        }),
      })
      const data = await response.json()
      if (data.filter) {
        setFilters([...filters, data.filter])
        setShowNewFilter(false)
        setNewFilterName('')
        setNewFilterType('keyword')
      }
    } catch (error) {
      console.error('Error creating filter:', error)
    }
  }

  function updatePref<K extends keyof NotificationPrefs>(
    key: K,
    value: NotificationPrefs[K]
  ) {
    setPrefs(prev => ({ ...prev, [key]: value }))
  }

  async function generateExtensionToken() {
    setGeneratingToken(true)
    try {
      const response = await fetch('/api/extension/sync', { method: 'POST' })
      const data = await response.json()
      if (data.token) {
        setExtensionToken(data.token)
      } else {
        alert(data.error || 'Failed to generate token')
      }
    } catch (error) {
      console.error('Error generating token:', error)
      alert('Failed to generate token')
    } finally {
      setGeneratingToken(false)
    }
  }

  function copyToken() {
    if (extensionToken) {
      navigator.clipboard.writeText(extensionToken)
      setTokenCopied(true)
      setTimeout(() => setTokenCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="font-mono text-gray-500">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void-black">
      {/* Header */}
      <header className="border-b border-void-gray">
        <div className="section-container py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-2xl font-mono font-bold text-neon-cyan hover:glow-text">
                snub.io
              </Link>
              <p className="text-sm text-gray-500 font-mono mt-1">Settings</p>
            </div>
            <div className="flex gap-3">
              <Link href="/reader" className="btn-outline-cyan btn-sm">Reader</Link>
              <Link href="/dashboard" className="btn-secondary btn-sm">Dashboard</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="section-container py-8 max-w-3xl">
        <div className="space-y-8">
          {/* Filter Management */}
          <section className="card-purple">
            <div className="section-header">
              <h2 className="section-title-purple">Signal Filters</h2>
              <button onClick={() => setShowNewFilter(true)} className="btn-outline-purple btn-sm">
                + Add Filter
              </button>
            </div>

            {/* New Filter Form */}
            {showNewFilter && (
              <div className="mb-6 p-4 border border-gray-600 bg-void-gray/30">
                <h3 className="text-sm font-mono text-gray-100 mb-4">Create New Filter</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Filter Name</label>
                    <input
                      type="text"
                      value={newFilterName}
                      onChange={(e) => setNewFilterName(e.target.value)}
                      placeholder="My Custom Filter"
                      className="input input-sm"
                    />
                  </div>
                  <div>
                    <label className="label">Filter Type</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNewFilterType('keyword')}
                        className={newFilterType === 'keyword' ? 'filter-pill-active' : 'filter-pill'}
                      >
                        Keyword
                      </button>
                      <button
                        onClick={() => setNewFilterType('engagement_bait')}
                        className={newFilterType === 'engagement_bait' ? 'filter-pill-active' : 'filter-pill'}
                      >
                        Engagement Bait
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={createFilter} className="btn-success btn-sm">Create</button>
                    <button
                      onClick={() => { setShowNewFilter(false); setNewFilterName(''); }}
                      className="btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Filter List */}
            <div className="space-y-4">
              {filters.length === 0 ? (
                <div className="empty-state py-8">
                  <p className="empty-state-description">No filters configured. Add one to start filtering noise.</p>
                </div>
              ) : (
                filters.map(filter => (
                  <div key={filter.id} className="list-item flex-col items-stretch">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-mono text-gray-100">{filter.name}</h3>
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          <span className="badge-gray mr-2">{filter.filterType === 'keyword' ? 'Keyword' : 'Engagement Bait'}</span>
                          Priority: {filter.priority}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleFilter(filter.id, !filter.enabled)}
                          className={filter.enabled ? 'badge-green' : 'badge-gray'}
                        >
                          {filter.enabled ? 'ON' : 'OFF'}
                        </button>
                        {filter.filterType === 'keyword' && (
                          <button
                            onClick={() => setEditingFilter(editingFilter === filter.id ? null : filter.id)}
                            className="btn-ghost btn-sm"
                          >
                            {editingFilter === filter.id ? 'Done' : 'Edit'}
                          </button>
                        )}
                        <button onClick={() => deleteFilter(filter.id)} className="btn-danger btn-sm">
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Keyword Editor */}
                    {filter.filterType === 'keyword' && editingFilter === filter.id && (
                      <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                        {/* Noise Keywords */}
                        <div>
                          <label className="label text-neon-pink">Noise Keywords (block/reduce)</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {(filter.config.noiseKeywords || []).map((keyword: string) => (
                              <span key={keyword} className="keyword-tag-noise">
                                {keyword}
                                <button onClick={() => removeKeyword(filter.id, keyword, 'noise')} className="hover:text-red-200">x</button>
                              </span>
                            ))}
                            {(filter.config.noiseKeywords || []).length === 0 && (
                              <span className="text-xs text-gray-500 font-mono">No noise keywords</span>
                            )}
                          </div>
                        </div>

                        {/* Signal Keywords */}
                        <div>
                          <label className="label text-neon-green">Signal Keywords (highlight)</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {(filter.config.signalKeywords || []).map((keyword: string) => (
                              <span key={keyword} className="keyword-tag-signal">
                                {keyword}
                                <button onClick={() => removeKeyword(filter.id, keyword, 'signal')} className="hover:text-green-200">x</button>
                              </span>
                            ))}
                            {(filter.config.signalKeywords || []).length === 0 && (
                              <span className="text-xs text-gray-500 font-mono">No signal keywords</span>
                            )}
                          </div>
                        </div>

                        {/* Add Keyword */}
                        <div className="flex gap-2">
                          <select
                            value={keywordType}
                            onChange={(e) => setKeywordType(e.target.value as 'noise' | 'signal')}
                            className="select input-sm w-auto"
                          >
                            <option value="noise">Noise</option>
                            <option value="signal">Signal</option>
                          </select>
                          <input
                            type="text"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addKeyword(filter.id, newKeyword, keywordType)
                              }
                            }}
                            placeholder="Enter keyword..."
                            className="input input-sm flex-1"
                          />
                          <button onClick={() => addKeyword(filter.id, newKeyword, keywordType)} className="btn-primary btn-sm">
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show keywords summary when not editing */}
                    {filter.filterType === 'keyword' && editingFilter !== filter.id && (
                      <div className="flex gap-4 text-xs font-mono">
                        <span className="text-red-400">
                          {(filter.config.noiseKeywords || []).length} noise keywords
                        </span>
                        <span className="text-green-400">
                          {(filter.config.signalKeywords || []).length} signal keywords
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Browser Extension */}
          <section className="card-green">
            <h2 className="section-title-green mb-4">Browser Extension</h2>
            <p className="text-sm text-gray-400 font-mono mb-4">
              Connect the snub.io browser extension for real-time filtering on Twitter, Reddit, and Hacker News.
            </p>

            <div className="space-y-4">
              {extensionToken ? (
                <div className="space-y-3">
                  <label className="label">Your Extension Token</label>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={extensionToken} className="input input-sm flex-1 text-neon-green" />
                    <button onClick={copyToken} className="btn-success btn-sm">
                      {tokenCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 font-mono">
                    Keep this token secret. Generating a new token will invalidate the old one.
                  </p>
                </div>
              ) : (
                <button onClick={generateExtensionToken} disabled={generatingToken} className="btn-success btn-lg">
                  {generatingToken ? 'Generating...' : 'Generate Extension Token'}
                </button>
              )}

              <div className="divider-light"></div>
              <div>
                <h3 className="text-sm font-mono text-gray-300 mb-2">How to use:</h3>
                <ol className="text-xs text-gray-500 font-mono space-y-1 list-decimal list-inside">
                  <li>Install the snub.io browser extension</li>
                  <li>Generate a token above</li>
                  <li>Open the extension popup and paste your token</li>
                  <li>Click Sync to load your filters</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Automation Settings */}
          <section className="card-cyan">
            <h2 className="section-title-cyan mb-6">Automation Settings</h2>

            <div className="space-y-6">
              {/* Auto Fetch */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-mono text-gray-100 mb-1">Automatic Feed Fetching</label>
                  <p className="text-xs text-gray-500 font-mono">Automatically fetch new items in the background</p>
                </div>
                <button
                  onClick={() => updatePref('autoFetch', !prefs.autoFetch)}
                  className={prefs.autoFetch ? 'badge-green' : 'badge-gray'}
                >
                  {prefs.autoFetch ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Digest Frequency */}
              <div>
                <label className="label">Digest Frequency</label>
                <p className="text-xs text-gray-500 font-mono mb-3">How often to generate high-signal summaries</p>
                <div className="flex gap-2">
                  {(['hourly', 'daily', 'weekly'] as const).map(freq => (
                    <button
                      key={freq}
                      onClick={() => updatePref('digestFrequency', freq)}
                      className={prefs.digestFrequency === freq ? 'filter-pill-active' : 'filter-pill'}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Signal Threshold */}
              <div>
                <label className="label">High-Signal Threshold: <span className="text-neon-cyan">{(prefs.highSignalThreshold * 100).toFixed(0)}%</span></label>
                <p className="text-xs text-gray-500 font-mono mb-3">Minimum signal score for digest inclusion</p>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={prefs.highSignalThreshold}
                  onChange={(e) => updatePref('highSignalThreshold', parseFloat(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-500 font-mono mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Minimum Items */}
              <div>
                <label className="label">Minimum Items: <span className="text-neon-cyan">{prefs.digestMinItems}</span></label>
                <p className="text-xs text-gray-500 font-mono mb-3">Min high-signal items required to generate digest</p>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={prefs.digestMinItems}
                  onChange={(e) => updatePref('digestMinItems', parseInt(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-500 font-mono mt-1">
                  <span>1</span>
                  <span>10</span>
                  <span>20</span>
                </div>
              </div>

              {/* Digest Delivery */}
              <div>
                <label className="label">Digest Delivery</label>
                <p className="text-xs text-gray-500 font-mono mb-3">Where to deliver digests (email coming soon)</p>
                <div className="flex gap-2">
                  {(['web', 'email', 'both'] as const).map(delivery => (
                    <button
                      key={delivery}
                      onClick={() => updatePref('digestDelivery', delivery)}
                      disabled={delivery !== 'web'}
                      className={`${prefs.digestDelivery === delivery ? 'filter-pill-active' : 'filter-pill'} ${delivery !== 'web' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {delivery}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <button onClick={savePreferences} disabled={saving} className="btn-success btn-lg">
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button onClick={loadData} className="btn-secondary btn-lg">
                Reset
              </button>
            </div>
            {saved && <span className="alert-success py-2 px-4">Settings saved</span>}
          </div>

          {/* Info Panel */}
          <div className="card">
            <h3 className="text-sm font-mono text-gray-300 mb-3 uppercase">How Filters Work</h3>
            <ul className="text-xs text-gray-500 font-mono space-y-2">
              <li>Keyword filters boost or reduce content based on word matches</li>
              <li>Engagement bait detectors identify clickbait patterns automatically</li>
              <li>Higher priority filters are evaluated first</li>
              <li>Signal keywords increase the signal score of matching content</li>
              <li>Noise keywords decrease the score or block content entirely</li>
              <li>Your feedback on items helps improve filter accuracy over time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
