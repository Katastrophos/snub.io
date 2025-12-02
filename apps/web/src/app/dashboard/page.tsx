'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Feed {
  id: string
  url: string
  title?: string
  description?: string
  type: string
  fetchInterval: number
  lastFetchedAt?: string
  enabled: boolean
  createdAt: string
  _count: {
    items: number
  }
}

export default function DashboardPage() {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFeeds()
  }, [])

  async function loadFeeds() {
    setLoading(true)
    try {
      const response = await fetch('/api/feeds')
      const data = await response.json()
      setFeeds(data.feeds || [])
    } catch (error) {
      console.error('Error loading feeds:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addFeed(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setError('')

    try {
      const response = await fetch('/api/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newFeedUrl }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add feed')
      }

      setNewFeedUrl('')
      setShowAddForm(false)
      loadFeeds()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add feed')
    } finally {
      setAdding(false)
    }
  }

  async function deleteFeed(feedId: string) {
    if (!confirm('Are you sure you want to delete this feed?')) return

    try {
      await fetch(`/api/feeds/${feedId}`, {
        method: 'DELETE',
      })
      loadFeeds()
    } catch (error) {
      console.error('Error deleting feed:', error)
    }
  }

  async function toggleFeed(feedId: string, enabled: boolean) {
    try {
      await fetch(`/api/feeds/${feedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      loadFeeds()
    } catch (error) {
      console.error('Error toggling feed:', error)
    }
  }

  async function fetchFeed(feedId: string) {
    try {
      const response = await fetch(`/api/feeds/${feedId}/fetch`, {
        method: 'POST',
      })
      const data = await response.json()
      alert(`Fetched ${data.newItems} new items!`)
      loadFeeds()
    } catch (error) {
      console.error('Error fetching feed:', error)
      alert('Failed to fetch feed')
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
              <p className="text-sm text-gray-500 font-mono mt-1">Feed Management</p>
            </div>
            <div className="flex gap-3">
              <Link href="/digests" className="btn-outline-green btn-sm">
                Digests
              </Link>
              <Link href="/reader" className="btn-outline-cyan btn-sm">
                Reader
              </Link>
              <Link href="/settings" className="btn-secondary btn-sm">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="section-container py-8">
        {/* Add Feed Button */}
        <div className="mb-8">
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary btn-lg">
            {showAddForm ? 'Cancel' : '+ Add Feed'}
          </button>
        </div>

        {/* Add Feed Form */}
        {showAddForm && (
          <div className="card-cyan mb-8">
            <h2 className="section-title-cyan mb-4">Add New Feed</h2>
            <form onSubmit={addFeed} className="space-y-4">
              <div>
                <label className="label">Feed URL (RSS/Atom)</label>
                <input
                  type="url"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  placeholder="https://example.com/feed.xml"
                  className="input"
                  required
                  disabled={adding}
                />
              </div>

              {error && <div className="alert-error">{error}</div>}

              <button type="submit" disabled={adding} className="btn-success btn-lg">
                {adding ? 'Adding...' : 'Add Feed'}
              </button>
            </form>
          </div>
        )}

        {/* Feeds List */}
        {loading ? (
          <div className="empty-state">
            <div className="spinner mx-auto mb-4"></div>
            <p className="empty-state-title">Loading feeds...</p>
          </div>
        ) : feeds.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">📡</div>
            <p className="empty-state-title">No feeds yet</p>
            <p className="empty-state-description mb-4">Add your first feed to get started!</p>
            <div className="text-sm text-gray-600 font-mono mt-4">
              <p className="mb-2">Try popular feeds like:</p>
              <ul className="space-y-1 text-gray-500">
                <li>• https://hnrss.org/frontpage</li>
                <li>• https://www.reddit.com/r/programming/.rss</li>
                <li>• Your favorite blog's RSS feed</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {feeds.map((feed) => (
              <FeedCard
                key={feed.id}
                feed={feed}
                onToggle={(enabled) => toggleFeed(feed.id, enabled)}
                onDelete={() => deleteFeed(feed.id)}
                onFetch={() => fetchFeed(feed.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FeedCard({
  feed,
  onToggle,
  onDelete,
  onFetch,
}: {
  feed: Feed
  onToggle: (enabled: boolean) => void
  onDelete: () => void
  onFetch: () => void
}) {
  return (
    <div className={`card ${feed.enabled ? 'border-neon-cyan/30' : 'border-gray-700 opacity-60'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-gray-100">{feed.title || 'Untitled Feed'}</h3>
            {!feed.enabled && <span className="badge-gray">Disabled</span>}
          </div>

          <p className="text-sm text-gray-400 mb-2 break-all">{feed.url}</p>

          {feed.description && (
            <p className="text-sm text-gray-500 mt-2">{feed.description.substring(0, 150)}...</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm font-mono text-gray-500">
            <span className="badge-cyan">{feed._count.items} items</span>
            <span>Every {feed.fetchInterval}m</span>
            {feed.lastFetchedAt && (
              <span>Last: {new Date(feed.lastFetchedAt).toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button onClick={onFetch} disabled={!feed.enabled} className="btn-outline-green btn-sm">
            Fetch Now
          </button>
          <button onClick={() => onToggle(!feed.enabled)} className="btn-secondary btn-sm">
            {feed.enabled ? 'Disable' : 'Enable'}
          </button>
          <button onClick={onDelete} className="btn-danger btn-sm">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
