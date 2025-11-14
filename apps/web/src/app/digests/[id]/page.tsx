'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { use } from 'react'

interface DigestItem {
  id: string
  title: string
  content: string
  url?: string
  author?: string
  publishedAt: string
  signalScore?: number
  noiseScore?: number
  decision?: string
  feed: {
    title: string
  }
}

interface Digest {
  id: string
  type: string
  startDate: string
  endDate: string
  itemCount: number
  items: DigestItem[]
  metadata?: {
    avgSignalScore?: number
    topSource?: string
  }
  createdAt: string
}

export default function DigestViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [digest, setDigest] = useState<Digest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDigest()
  }, [resolvedParams.id])

  async function loadDigest() {
    setLoading(true)
    try {
      const response = await fetch(`/api/digests/${resolvedParams.id}`)
      const data = await response.json()
      setDigest(data.digest)
    } catch (error) {
      console.error('Error loading digest:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <p className="font-mono text-gray-500 animate-pulse">Loading digest...</p>
      </div>
    )
  }

  if (!digest) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-gray-500 mb-4">Digest not found</p>
          <Link
            href="/digests"
            className="px-6 py-3 border border-neon-cyan text-neon-cyan font-mono hover:bg-neon-cyan hover:text-void-black transition-colors"
          >
            Back to Digests
          </Link>
        </div>
      </div>
    )
  }

  const typeColors = {
    HOURLY: 'neon-green',
    DAILY: 'neon-cyan',
    WEEKLY: 'neon-purple',
  }

  const color = typeColors[digest.type as keyof typeof typeColors] || 'gray-500'

  return (
    <div className="min-h-screen bg-void-black">
      {/* Header */}
      <header className="border-b border-void-gray">
        <div className="section-container py-6">
          <div className="flex items-center justify-between">
            <Link href="/digests" className="text-gray-400 hover:text-gray-100 font-mono text-sm">
              ← Back to Digests
            </Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-100 font-mono text-sm">
              Dashboard →
            </Link>
          </div>
        </div>
      </header>

      {/* Digest Header */}
      <div className={`border-b border-${color}/30 bg-void-dark`}>
        <div className="section-container py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-4 py-2 font-mono uppercase text-lg bg-${color}/20 text-${color} border border-${color}/50`}>
                  {digest.type} Digest
                </span>
              </div>
              <p className="text-gray-400 font-mono text-sm mb-2">
                {new Date(digest.startDate).toLocaleDateString()} - {new Date(digest.endDate).toLocaleDateString()}
              </p>
              <div className="flex gap-6 text-sm font-mono text-gray-500">
                <span>{digest.itemCount} items</span>
                {digest.metadata?.avgSignalScore && (
                  <span>Avg signal: {(digest.metadata.avgSignalScore * 100).toFixed(0)}%</span>
                )}
              </div>
            </div>
            <div className="text-right text-xs text-gray-500 font-mono">
              <p>Generated: {new Date(digest.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="section-container py-8">
        <div className="space-y-4">
          {digest.items.map((item, index) => (
            <div key={item.id} className="border border-neon-cyan/30 bg-void-dark p-6 hover:border-neon-cyan transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 text-xs font-mono bg-neon-green/20 text-neon-green border border-neon-green/50">
                      #{index + 1}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">{item.feed.title}</span>
                  </div>

                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-bold text-gray-100 hover:text-neon-cyan transition-colors block mb-2"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <h3 className="text-lg font-bold text-gray-100 mb-2">{item.title}</h3>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500 font-mono mb-3">
                    {item.author && <span>{item.author}</span>}
                    <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                  </div>

                  <p className="text-gray-400 text-sm">
                    {item.content.replace(/<[^>]*>/g, '').substring(0, 250)}...
                  </p>
                </div>

                <div className="text-right text-sm font-mono">
                  <div className="text-neon-green">
                    Signal: {((item.signalScore || 0) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
