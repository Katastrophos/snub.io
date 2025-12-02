/**
 * Filters API
 * GET  /api/filters - List user's filter configs
 * POST /api/filters - Create new filter
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/get-user'

const createFilterSchema = z.object({
  filterType: z.enum(['keyword', 'engagement_bait']),
  name: z.string().min(1).max(100),
  config: z.object({
    noiseKeywords: z.array(z.string()).optional(),
    signalKeywords: z.array(z.string()).optional(),
  }).optional().default({}),
  enabled: z.boolean().optional().default(true),
  priority: z.number().min(0).max(100).optional().default(50),
})

/**
 * GET /api/filters - List all filters for user
 */
export async function GET() {
  try {
    const userId = await getAuthenticatedUser()

    const filters = await prisma.filterConfig.findMany({
      where: { userId },
      orderBy: { priority: 'desc' },
    })

    return NextResponse.json({ filters })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching filters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filters' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/filters - Create new filter
 */
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUser()
    const body = await request.json()
    const data = createFilterSchema.parse(body)

    const filter = await prisma.filterConfig.create({
      data: {
        userId,
        filterType: data.filterType,
        name: data.name,
        config: data.config,
        enabled: data.enabled,
        priority: data.priority,
      },
    })

    return NextResponse.json({ filter }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating filter:', error)
    return NextResponse.json(
      { error: 'Failed to create filter' },
      { status: 500 }
    )
  }
}
