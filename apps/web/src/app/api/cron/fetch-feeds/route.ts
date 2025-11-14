/**
 * Cron endpoint for automatic feed fetching
 * POST /api/cron/fetch-feeds
 *
 * Protected by CRON_SECRET environment variable
 * Triggered by external cron service every 15 minutes
 */

import { NextResponse } from 'next/server'
import { fetchDueFeeds } from '@/lib/cron/feed-fetcher'

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all due feeds
    const summary = await fetchDueFeeds()

    console.log('[Cron] Feed fetch completed:', {
      totalFeeds: summary.totalFeeds,
      fetchedFeeds: summary.fetchedFeeds,
      totalNewItems: summary.totalNewItems,
      errors: summary.errors,
    })

    return NextResponse.json({
      success: true,
      summary,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Feed fetch error:', error)
    return NextResponse.json(
      {
        error: 'Feed fetch failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Allow GET for testing/health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'feed-fetcher',
    info: 'POST with Authorization: Bearer <CRON_SECRET> to trigger',
  })
}
