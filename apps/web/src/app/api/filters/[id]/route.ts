/**
 * Individual filter API
 * GET    /api/filters/:id - Get filter details
 * PATCH  /api/filters/:id - Update filter
 * DELETE /api/filters/:id - Delete filter
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/get-user'

const updateFilterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  config: z.object({
    noiseKeywords: z.array(z.string()).optional(),
    signalKeywords: z.array(z.string()).optional(),
  }).optional(),
  enabled: z.boolean().optional(),
  priority: z.number().min(0).max(100).optional(),
})

/**
 * GET /api/filters/:id - Get filter details
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthenticatedUser()

    const filter = await prisma.filterConfig.findUnique({
      where: {
        id: params.id,
        userId,
      },
    })

    if (!filter) {
      return NextResponse.json({ error: 'Filter not found' }, { status: 404 })
    }

    return NextResponse.json({ filter })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching filter:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filter' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/filters/:id - Update filter
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthenticatedUser()
    const body = await request.json()
    const data = updateFilterSchema.parse(body)

    // Build update data
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.enabled !== undefined) updateData.enabled = data.enabled
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.config !== undefined) {
      // Merge with existing config
      const existing = await prisma.filterConfig.findUnique({
        where: { id: params.id, userId },
      })
      if (existing) {
        updateData.config = {
          ...(existing.config as object),
          ...data.config,
        }
      }
    }

    const filter = await prisma.filterConfig.update({
      where: {
        id: params.id,
        userId,
      },
      data: updateData,
    })

    return NextResponse.json({ filter })
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
    console.error('Error updating filter:', error)
    return NextResponse.json(
      { error: 'Failed to update filter' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/filters/:id - Delete filter
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthenticatedUser()

    await prisma.filterConfig.delete({
      where: {
        id: params.id,
        userId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error deleting filter:', error)
    return NextResponse.json(
      { error: 'Failed to delete filter' },
      { status: 500 }
    )
  }
}
