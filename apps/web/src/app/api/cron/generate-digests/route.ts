/**
 * Cron endpoint for generating digests
 * POST /api/cron/generate-digests
 *
 * Protected by CRON_SECRET
 * Triggered hourly to generate appropriate digests
 */

import { NextResponse } from 'next/server'
import { generateDigestsForAllUsers } from '@/lib/digest/generator'

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

    const now = new Date()
    const hour = now.getHours()

    const results: any = {}

    // Generate hourly digests every hour
    const hourlyResult = await generateDigestsForAllUsers('HOURLY')
    results.hourly = hourlyResult

    // Generate daily digests at 8 AM
    if (hour === 8) {
      const dailyResult = await generateDigestsForAllUsers('DAILY')
      results.daily = dailyResult
    }

    // Generate weekly digests on Monday at 8 AM
    if (now.getDay() === 1 && hour === 8) {
      const weeklyResult = await generateDigestsForAllUsers('WEEKLY')
      results.weekly = weeklyResult
    }

    console.log('[Cron] Digest generation completed:', results)

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Digest generation error:', error)
    return NextResponse.json(
      {
        error: 'Digest generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'digest-generator',
    info: 'POST with Authorization: Bearer <CRON_SECRET> to trigger',
  })
}
