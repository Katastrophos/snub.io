/**
 * Extension sync API
 * GET /api/extension/sync - Get filters for extension (requires token)
 * POST /api/extension/sync - Generate extension token (requires auth)
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/get-user'
import crypto from 'crypto'

/**
 * GET /api/extension/sync - Get filters for extension
 * Requires X-Extension-Token header
 */
export async function GET(request: Request) {
  try {
    const token = request.headers.get('X-Extension-Token')

    if (!token) {
      return NextResponse.json(
        { error: 'Extension token required' },
        { status: 401 }
      )
    }

    // Find user by extension token (stored in preferences)
    const users = await prisma.user.findMany({
      where: {
        preferences: {
          path: ['extensionToken'],
          equals: token,
        },
      },
    })

    // SQLite doesn't support JSON path queries well, so try alternative approach
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        preferences: true,
      },
    })

    const user = allUsers.find((u: { id: string; preferences: unknown }) => {
      const prefs = u.preferences as Record<string, unknown> | null
      return prefs?.extensionToken === token
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid extension token' },
        { status: 401 }
      )
    }

    // Get user's filters
    const filters = await prisma.filterConfig.findMany({
      where: {
        userId: user.id,
        enabled: true,
      },
      orderBy: {
        priority: 'desc',
      },
      select: {
        id: true,
        filterType: true,
        name: true,
        config: true,
        enabled: true,
        priority: true,
      },
    })

    return NextResponse.json({
      filters,
      userId: user.id,
      syncedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error syncing extension:', error)
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/extension/sync - Generate new extension token
 * Requires authentication
 */
export async function POST() {
  try {
    const userId = await getAuthenticatedUser()

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')

    // Get current preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    })

    // Update user preferences with new token
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...(user?.preferences as object || {}),
          extensionToken: token,
          extensionTokenCreatedAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      token,
      message: 'Extension token generated. Add this to your extension settings.',
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error generating extension token:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}
