'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface FeedItem {
  id: string
  title: string
  content: string
  url?: string
  author?: string
  publishedAt: string
  signalScore?: number
  noiseScore?: number
  confidence?: number
  decision?: string
  userFeedback?: string
  feed: {
    title: string
    url: string
  }
  metadata?: {
    reasons?: string[]
  }
}

export default function ReaderPage() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadItems()
  }, [filter])

  async function loadItems() {
    setLoading(true)
    try {
      const decision = filter === 'all' ? '' : filter
      const response = await fetch(`/api/items?decision=${decision}&limit=50`)
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  async function provideFeedback(itemId: string, feedback: 'NOISE' | 'SIGNAL') {
    try {
      await fetch(`/api/items/${itemId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      })
      // Reload items to show updated feedback
      loadItems()
    } catch (error) {
      console.error('Error providing feedback:', error)
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
              <p className="text-sm text-gray-500 font-mono mt-1">Feed Reader</p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 border border-neon-purple text-neon-purple font-mono text-sm hover:bg-neon-purple hover:text-void-black transition-colors"
            >
              Manage Feeds
            </Link>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="border-b border-void-gray bg-void-dark">
        <div className="section-container py-4">
          <div className="flex gap-2">
            {['all', 'highlight', 'allow', 'defer', 'reduce', 'block'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 font-mono text-sm uppercase tracking-wider transition-colors ${
                  filter === f
                    ? 'bg-neon-cyan text-void-black'
                    : 'bg-void-gray text-gray-400 hover:text-gray-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="section-container py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="font-mono text-gray-500 animate-pulse">Loading signals...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-mono text-gray-500">No items found.</p>
            <Link
              href="/dashboard"
              className="inline-block mt-4 px-6 py-3 border border-neon-cyan text-neon-cyan font-mono text-sm hover:bg-neon-cyan hover:text-void-black transition-colors"
            >
              Add Feeds
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onFeedback={(feedback) => provideFeedback(item.id, feedback)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ItemCard({ item, onFeedback }: { item: FeedItem; onFeedback: (feedback: 'NOISE' | 'SIGNAL') => void }) {
  const [expanded, setExpanded] = useState(false)

  const decisionColor = {
    HIGHLIGHT: 'neon-green',
    ALLOW: 'neon-cyan',
    DEFER: 'neon-purple',
    REDUCE: 'yellow-500',
    BLOCK: 'neon-pink',
  }[item.decision || 'ALLOW'] || 'gray-500'

  const signalPercentage = ((item.signalScore || 0) * 100).toFixed(0)
  const noisePercentage = ((item.noiseScore || 0) * 100).toFixed(0)

  return (
    <div className={`border border-${decisionColor}/30 bg-void-dark p-6 hover:border-${decisionColor} transition-colors`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs font-mono uppercase bg-${decisionColor}/20 text-${decisionColor} border border-${decisionColor}/50`}>
              {item.decision}
            </span>
            <span className="text-xs text-gray-500 font-mono">{item.feed.title}</span>
          </div>

          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-bold text-gray-100 hover:text-neon-cyan transition-colors"
            >
              {item.title}
            </a>
          ) : (
            <h3 className="text-lg font-bold text-gray-100">{item.title}</h3>
          )}

          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 font-mono">
            {item.author && <span>{item.author}</span>}
            <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Signal/Noise Scores */}
        <div className="text-right">
          <div className="text-sm font-mono">
            <div className="text-neon-green">Signal: {signalPercentage}%</div>
            <div className="text-neon-pink">Noise: {noisePercentage}%</div>
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div className="mt-4 text-gray-400 text-sm">
        {expanded ? (
          <div dangerouslySetInnerHTML={{ __html: item.content.substring(0, 500) }} />
        ) : (
          <p>{item.content.replace(/<[^>]*>/g, '').substring(0, 200)}...</p>
        )}
      </div>

      {/* Reasons */}
      {expanded && item.metadata?.reasons && item.metadata.reasons.length > 0 && (
        <div className="mt-4 p-3 bg-void-black border border-void-gray">
          <p className="text-xs font-mono text-gray-500 uppercase mb-2">Filter Reasoning:</p>
          <ul className="text-xs text-gray-400 space-y-1">
            {item.metadata.reasons.map((reason, i) => (
              <li key={i}>• {reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="px-3 py-1 text-xs font-mono border border-gray-600 text-gray-400 hover:text-gray-100 hover:border-gray-400 transition-colors"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => onFeedback('SIGNAL')}
            className={`px-3 py-1 text-xs font-mono border transition-colors ${
              item.userFeedback === 'SIGNAL'
                ? 'border-neon-green text-neon-green bg-neon-green/20'
                : 'border-gray-600 text-gray-400 hover:border-neon-green hover:text-neon-green'
            }`}
          >
            👍 Signal
          </button>
          <button
            onClick={() => onFeedback('NOISE')}
            className={`px-3 py-1 text-xs font-mono border transition-colors ${
              item.userFeedback === 'NOISE'
                ? 'border-neon-pink text-neon-pink bg-neon-pink/20'
                : 'border-gray-600 text-gray-400 hover:border-neon-pink hover:text-neon-pink'
            }`}
          >
            👎 Noise
          </button>
        </div>
      </div>
    </div>
  )
}
