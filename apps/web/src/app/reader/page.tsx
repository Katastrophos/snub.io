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
            <div className="flex gap-3">
              <Link href="/digests" className="btn-outline-green btn-sm">
                Digests
              </Link>
              <Link href="/dashboard" className="btn-outline-purple btn-sm">
                Dashboard
              </Link>
              <Link href="/settings" className="btn-secondary btn-sm">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="border-b border-void-gray bg-void-dark">
        <div className="section-container py-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'highlight', 'allow', 'defer', 'reduce', 'block'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={filter === f ? 'filter-pill-active' : 'filter-pill'}
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
          <div className="empty-state">
            <div className="spinner mx-auto mb-4"></div>
            <p className="empty-state-title">Loading signals...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📡</div>
            <p className="empty-state-title">No items found</p>
            <p className="empty-state-description mb-4">Add some feeds to start filtering the noise.</p>
            <Link href="/dashboard" className="btn-outline-cyan">
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

// Decision styling with full Tailwind classes (no dynamic interpolation)
const decisionStyles = {
  HIGHLIGHT: {
    card: 'border-neon-green/30 hover:border-neon-green',
    badge: 'badge-highlight',
  },
  ALLOW: {
    card: 'border-neon-cyan/30 hover:border-neon-cyan',
    badge: 'badge-allow',
  },
  DEFER: {
    card: 'border-neon-purple/30 hover:border-neon-purple',
    badge: 'badge-defer',
  },
  REDUCE: {
    card: 'border-orange-500/30 hover:border-orange-500',
    badge: 'badge-reduce',
  },
  BLOCK: {
    card: 'border-neon-pink/30 hover:border-neon-pink',
    badge: 'badge-block',
  },
} as const

function ItemCard({ item, onFeedback }: { item: FeedItem; onFeedback: (feedback: 'NOISE' | 'SIGNAL') => void }) {
  const [expanded, setExpanded] = useState(false)

  const decision = (item.decision || 'ALLOW') as keyof typeof decisionStyles
  const styles = decisionStyles[decision] || decisionStyles.ALLOW

  const signalPercentage = ((item.signalScore || 0) * 100).toFixed(0)
  const noisePercentage = ((item.noiseScore || 0) * 100).toFixed(0)

  return (
    <div className={`border bg-void-dark p-6 transition-colors ${styles.card}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={styles.badge}>
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
        <div className="w-32">
          <div className="text-xs font-mono text-gray-500 mb-1">Signal {signalPercentage}%</div>
          <div className="score-bar mb-2">
            <div className="score-bar-signal" style={{ width: `${signalPercentage}%` }} />
          </div>
          <div className="text-xs font-mono text-gray-500 mb-1">Noise {noisePercentage}%</div>
          <div className="score-bar">
            <div className="score-bar-noise" style={{ width: `${noisePercentage}%` }} />
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
        <button onClick={() => setExpanded(!expanded)} className="btn-ghost btn-sm">
          {expanded ? 'Show Less' : 'Show More'}
        </button>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => onFeedback('SIGNAL')}
            className={item.userFeedback === 'SIGNAL' ? 'badge-green' : 'btn-ghost btn-sm hover:text-neon-green'}
          >
            Signal
          </button>
          <button
            onClick={() => onFeedback('NOISE')}
            className={item.userFeedback === 'NOISE' ? 'badge-pink' : 'btn-ghost btn-sm hover:text-neon-pink'}
          >
            Noise
          </button>
        </div>
      </div>
    </div>
  )
}
