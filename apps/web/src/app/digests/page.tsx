'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Digest {
  id: string
  type: string
  startDate: string
  endDate: string
  itemCount: number
  createdAt: string
  viewedAt?: string
  metadata?: {
    avgSignalScore?: number
    topSource?: string
  }
}

export default function DigestsPage() {
  const [digests, setDigests] = useState<Digest[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    loadDigests()
  }, [filterType])

  async function loadDigests() {
    setLoading(true)
    try {
      const type = filterType === 'all' ? '' : filterType
      const response = await fetch(`/api/digests?type=${type}`)
      const data = await response.json()
      setDigests(data.digests || [])
    } catch (error) {
      console.error('Error loading digests:', error)
    } finally {
      setLoading(false)
    }
  }

  async function generateDigest(type: 'HOURLY' | 'DAILY' | 'WEEKLY') {
    setGenerating(true)
    try {
      const response = await fetch('/api/digests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Failed to generate digest')
        return
      }

      loadDigests()
    } catch (error) {
      console.error('Error generating digest:', error)
      alert('Failed to generate digest')
    } finally {
      setGenerating(false)
    }
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
              <p className="text-sm text-gray-500 font-mono mt-1">Signal Digests</p>
            </div>
            <div className="flex gap-3">
              <Link href="/reader" className="btn-outline-cyan btn-sm">Reader</Link>
              <Link href="/dashboard" className="btn-outline-purple btn-sm">Dashboard</Link>
              <Link href="/settings" className="btn-secondary btn-sm">Settings</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="section-container py-8">
        {/* Generate Digest Section */}
        <div className="card-cyan mb-8">
          <h2 className="section-title-cyan mb-4">Generate Digest</h2>
          <p className="text-sm text-gray-400 mb-4">
            Manually create a curated summary of your high-signal content
          </p>
          <div className="flex flex-wrap gap-3">
            {['HOURLY', 'DAILY', 'WEEKLY'].map((type) => (
              <button
                key={type}
                onClick={() => generateDigest(type as any)}
                disabled={generating}
                className="btn-success"
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'hourly', 'daily', 'weekly'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={filterType === type ? 'filter-pill-active' : 'filter-pill'}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Digests List */}
        {loading ? (
          <div className="empty-state">
            <div className="spinner mx-auto mb-4"></div>
            <p className="empty-state-title">Loading digests...</p>
          </div>
        ) : digests.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">📊</div>
            <p className="empty-state-title">No digests yet</p>
            <p className="empty-state-description">
              Generate one above or wait for automatic digests (hourly, daily at 8 AM, weekly on Monday)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {digests.map((digest) => (
              <DigestCard key={digest.id} digest={digest} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Digest type styles with full Tailwind classes
const digestTypeStyles = {
  HOURLY: {
    card: 'border-neon-green/30 hover:border-neon-green',
    badge: 'badge-green',
  },
  DAILY: {
    card: 'border-neon-cyan/30 hover:border-neon-cyan',
    badge: 'badge-cyan',
  },
  WEEKLY: {
    card: 'border-neon-purple/30 hover:border-neon-purple',
    badge: 'badge-purple',
  },
} as const

function DigestCard({ digest }: { digest: Digest }) {
  const styles = digestTypeStyles[digest.type as keyof typeof digestTypeStyles] || digestTypeStyles.DAILY

  return (
    <Link href={`/digests/${digest.id}`}>
      <div className={`card transition-colors cursor-pointer ${styles.card}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={styles.badge}>{digest.type}</span>
              {!digest.viewedAt && <span className="badge-pink">NEW</span>}
            </div>

            <div className="text-sm text-gray-400 font-mono space-y-1">
              <p>
                {new Date(digest.startDate).toLocaleDateString()} - {new Date(digest.endDate).toLocaleDateString()}
              </p>
              <p>{digest.itemCount} high-signal items</p>
              {digest.metadata?.avgSignalScore && (
                <p>Avg signal: {(digest.metadata.avgSignalScore * 100).toFixed(0)}%</p>
              )}
              {digest.metadata?.topSource && (
                <p>Top source: {digest.metadata.topSource}</p>
              )}
            </div>
          </div>

          <div className="text-right text-xs text-gray-500 font-mono">
            <p>Generated:</p>
            <p>{new Date(digest.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
