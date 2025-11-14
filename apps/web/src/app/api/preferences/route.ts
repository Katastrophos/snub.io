/**
 * User preferences API
 * GET /api/preferences - Get user preferences
 * PATCH /api/preferences - Update preferences
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getDefaultNotificationPrefs } from '@/lib/cron/feed-fetcher'

const DEMO_USER_ID = 'demo-user'

/**
 * GET /api/preferences - Get user preferences
 */
export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { id: DEMO_USER_ID },
      select: {
        preferences: true,
        notificationPrefs: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      preferences: user.preferences || {},
      notificationPrefs: user.notificationPrefs || getDefaultNotificationPrefs(),
    })
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

const updatePreferencesSchema = z.object({
  preferences: z.record(z.any()).optional(),
  notificationPrefs: z.object({
    autoFetch: z.boolean().optional(),
    digestFrequency: z.enum(['hourly', 'daily', 'weekly']).optional(),
    digestDelivery: z.enum(['web', 'email', 'both']).optional(),
    highSignalThreshold: z.number().min(0).max(1).optional(),
    digestMinItems: z.number().min(1).optional(),
    mutedFeeds: z.array(z.string()).optional(),
  }).optional(),
})

/**
 * PATCH /api/preferences - Update user preferences
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const data = updatePreferencesSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: DEMO_USER_ID },
      data: {
        preferences: data.preferences,
        notificationPrefs: data.notificationPrefs,
      },
      select: {
        preferences: true,
        notificationPrefs: true,
      },
    })

    return NextResponse.json({
      preferences: user.preferences,
      notificationPrefs: user.notificationPrefs,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
