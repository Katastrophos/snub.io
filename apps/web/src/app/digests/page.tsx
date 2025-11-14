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
            <div className="flex gap-4">
              <Link
                href="/reader"
                className="px-4 py-2 border border-gray-600 text-gray-400 font-mono text-sm hover:border-gray-400 hover:text-gray-100 transition-colors"
              >
                Reader
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-neon-purple text-neon-purple font-mono text-sm hover:bg-neon-purple hover:text-void-black transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="section-container py-8">
        {/* Generate Digest Section */}
        <div className="mb-8 p-6 border border-neon-cyan bg-void-dark">
          <h2 className="text-xl font-mono text-neon-cyan mb-4">Generate Digest</h2>
          <p className="text-sm text-gray-400 mb-4">
            Manually create a curated summary of your high-signal content
          </p>
          <div className="flex gap-3">
            {['HOURLY', 'DAILY', 'WEEKLY'].map((type) => (
              <button
                key={type}
                onClick={() => generateDigest(type as any)}
                disabled={generating}
                className="px-6 py-3 bg-neon-green text-void-black font-mono uppercase tracking-wider hover:bg-neon-green/80 transition-colors disabled:opacity-50"
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 flex gap-2">
          {['all', 'hourly', 'daily', 'weekly'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 font-mono text-sm uppercase tracking-wider transition-colors ${
                filterType === type
                  ? 'bg-neon-cyan text-void-black'
                  : 'bg-void-gray text-gray-400 hover:text-gray-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Digests List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="font-mono text-gray-500 animate-pulse">Loading digests...</p>
          </div>
        ) : digests.length === 0 ? (
          <div className="text-center py-12 border border-void-gray p-8">
            <p className="font-mono text-gray-500 mb-4">
              No digests yet. Generate one or wait for automatic digests.
            </p>
            <p className="text-sm text-gray-600 font-mono">
              Digests are automatically generated hourly, daily (8 AM), and weekly (Monday 8 AM)
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

function DigestCard({ digest }: { digest: Digest }) {
  const typeColors = {
    HOURLY: 'neon-green',
    DAILY: 'neon-cyan',
    WEEKLY: 'neon-purple',
  }

  const color = typeColors[digest.type as keyof typeof typeColors] || 'gray-500'

  return (
    <Link href={`/digests/${digest.id}`}>
      <div className={`border border-${color}/30 bg-void-dark p-6 hover:border-${color} transition-colors cursor-pointer`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 text-sm font-mono uppercase bg-${color}/20 text-${color} border border-${color}/50`}>
                {digest.type}
              </span>
              {!digest.viewedAt && (
                <span className="px-2 py-1 text-xs font-mono bg-neon-pink/20 text-neon-pink border border-neon-pink/50">
                  NEW
                </span>
              )}
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
