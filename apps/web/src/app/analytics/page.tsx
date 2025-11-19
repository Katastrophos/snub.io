'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Analytics {
  totalFeeds: number
  totalItems: number
  totalBlocked: number
  totalHighlighted: number
  avgSignalScore: number
  topSources: Array<{ source: string; count: number }>
  recentActivity: Array<{ date: string; items: number }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    try {
      const response = await fetch('/api/analytics')
      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <p className="font-mono text-gray-500 animate-pulse">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void-black">
      <header className="border-b border-void-gray">
        <div className="section-container py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-2xl font-mono font-bold text-neon-cyan hover:glow-text">
                snub.io
              </Link>
              <p className="text-sm text-gray-500 font-mono mt-1">Analytics & Insights</p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 border border-gray-600 text-gray-400 font-mono text-sm hover:border-gray-400 hover:text-gray-100 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="section-container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border border-neon-cyan bg-void-dark p-6">
            <div className="text-4xl font-mono font-bold text-neon-cyan mb-2">
              {analytics.totalFeeds}
            </div>
            <div className="text-sm text-gray-500 font-mono uppercase">Total Feeds</div>
          </div>

          <div className="border border-neon-green bg-void-dark p-6">
            <div className="text-4xl font-mono font-bold text-neon-green mb-2">
              {analytics.totalItems.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 font-mono uppercase">Items Processed</div>
          </div>

          <div className="border border-neon-purple bg-void-dark p-6">
            <div className="text-4xl font-mono font-bold text-neon-purple mb-2">
              {(analytics.avgSignalScore * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-500 font-mono uppercase">Avg Signal Score</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-void-gray bg-void-dark p-6">
            <h3 className="text-xl font-mono text-gray-100 mb-4">Filter Decisions</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-mono">
                <span className="text-neon-pink">Blocked:</span>
                <span className="text-gray-400">{analytics.totalBlocked}</span>
              </div>
              <div className="flex justify-between text-sm font-mono">
                <span className="text-neon-green">Highlighted:</span>
                <span className="text-gray-400">{analytics.totalHighlighted}</span>
              </div>
            </div>
          </div>

          <div className="border border-void-gray bg-void-dark p-6">
            <h3 className="text-xl font-mono text-gray-100 mb-4">Top Sources</h3>
            <div className="space-y-2">
              {analytics.topSources.map((source, i) => (
                <div key={i} className="flex justify-between text-sm font-mono">
                  <span className="text-gray-400">{source.source}</span>
                  <span className="text-neon-cyan">{source.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
