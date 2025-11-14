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

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    autoFetch: true,
    digestFrequency: 'daily',
    digestDelivery: 'web',
    highSignalThreshold: 0.7,
    digestMinItems: 3,
    mutedFeeds: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  async function loadPreferences() {
    setLoading(true)
    try {
      const response = await fetch('/api/preferences')
      const data = await response.json()
      if (data.notificationPrefs) {
        setPrefs(data.notificationPrefs)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
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

  function updatePref<K extends keyof NotificationPrefs>(
    key: K,
    value: NotificationPrefs[K]
  ) {
    setPrefs(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <p className="font-mono text-gray-500 animate-pulse">Loading settings...</p>
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
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-600 text-gray-400 font-mono text-sm hover:border-gray-400 hover:text-gray-100 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="section-container py-8 max-w-3xl">
        <div className="space-y-8">
          {/* Automation Settings */}
          <section className="border border-neon-cyan bg-void-dark p-6">
            <h2 className="text-xl font-mono text-neon-cyan mb-6">Automation Settings</h2>

            <div className="space-y-6">
              {/* Auto Fetch */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-mono text-gray-100 mb-1">
                    Automatic Feed Fetching
                  </label>
                  <p className="text-xs text-gray-500 font-mono">
                    Automatically fetch new items from your feeds in the background
                  </p>
                </div>
                <button
                  onClick={() => updatePref('autoFetch', !prefs.autoFetch)}
                  className={`px-4 py-2 font-mono text-sm transition-colors ${
                    prefs.autoFetch
                      ? 'bg-neon-green text-void-black'
                      : 'bg-void-gray text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {prefs.autoFetch ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Digest Frequency */}
              <div>
                <label className="block text-sm font-mono text-gray-100 mb-2">
                  Digest Frequency
                </label>
                <p className="text-xs text-gray-500 font-mono mb-3">
                  How often to generate curated high-signal summaries
                </p>
                <div className="flex gap-2">
                  {(['hourly', 'daily', 'weekly'] as const).map(freq => (
                    <button
                      key={freq}
                      onClick={() => updatePref('digestFrequency', freq)}
                      className={`px-4 py-2 font-mono text-sm uppercase transition-colors ${
                        prefs.digestFrequency === freq
                          ? 'bg-neon-cyan text-void-black'
                          : 'bg-void-gray text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Signal Threshold */}
              <div>
                <label className="block text-sm font-mono text-gray-100 mb-2">
                  High-Signal Threshold: {(prefs.highSignalThreshold * 100).toFixed(0)}%
                </label>
                <p className="text-xs text-gray-500 font-mono mb-3">
                  Minimum signal score for items to be included in digests
                </p>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={prefs.highSignalThreshold}
                  onChange={(e) => updatePref('highSignalThreshold', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 font-mono mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Minimum Items */}
              <div>
                <label className="block text-sm font-mono text-gray-100 mb-2">
                  Minimum Items: {prefs.digestMinItems}
                </label>
                <p className="text-xs text-gray-500 font-mono mb-3">
                  Only generate digest if there are at least this many high-signal items
                </p>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={prefs.digestMinItems}
                  onChange={(e) => updatePref('digestMinItems', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 font-mono mt-1">
                  <span>1</span>
                  <span>10</span>
                  <span>20</span>
                </div>
              </div>

              {/* Digest Delivery */}
              <div>
                <label className="block text-sm font-mono text-gray-100 mb-2">
                  Digest Delivery
                </label>
                <p className="text-xs text-gray-500 font-mono mb-3">
                  Where to deliver generated digests (email coming soon)
                </p>
                <div className="flex gap-2">
                  {(['web', 'email', 'both'] as const).map(delivery => (
                    <button
                      key={delivery}
                      onClick={() => updatePref('digestDelivery', delivery)}
                      disabled={delivery !== 'web'}
                      className={`px-4 py-2 font-mono text-sm uppercase transition-colors ${
                        prefs.digestDelivery === delivery
                          ? 'bg-neon-purple text-void-black'
                          : 'bg-void-gray text-gray-400 hover:bg-gray-700'
                      } ${delivery !== 'web' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              <button
                onClick={savePreferences}
                disabled={saving}
                className="px-8 py-3 bg-neon-green text-void-black font-mono uppercase tracking-wider hover:bg-neon-green/80 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={loadPreferences}
                className="px-6 py-3 border border-gray-600 text-gray-400 font-mono uppercase tracking-wider hover:border-gray-400 hover:text-gray-100 transition-colors"
              >
                Reset
              </button>
            </div>
            {saved && (
              <span className="text-neon-green font-mono text-sm">✓ Saved successfully</span>
            )}
          </div>

          {/* Info Panel */}
          <div className="border border-void-gray bg-void-gray/30 p-6">
            <h3 className="text-sm font-mono text-gray-300 mb-3 uppercase">How Automation Works</h3>
            <ul className="text-xs text-gray-500 font-mono space-y-2">
              <li>• Feeds are automatically fetched based on their individual fetch intervals</li>
              <li>• Digests are generated hourly, daily (8 AM), and weekly (Monday 8 AM)</li>
              <li>• Only items meeting your signal threshold are included in digests</li>
              <li>• You can manually generate digests at any time from the Digests page</li>
              <li>• Email delivery and push notifications coming soon</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
