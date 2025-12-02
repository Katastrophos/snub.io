/**
 * Individual feed API
 * PATCH  /api/feeds/:id - Update feed
 * DELETE /api/feeds/:id - Delete feed
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/get-user'

const updateFeedSchema = z.object({
  enabled: z.boolean().optional(),
  fetchInterval: z.number().min(5).max(1440).optional(),
})

/**
 * PATCH /api/feeds/:id - Update feed settings
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthenticatedUser()
    const body = await request.json()
    const data = updateFeedSchema.parse(body)

    const feed = await prisma.feed.update({
      where: {
        id: params.id,
        userId,
      },
      data,
    })

    return NextResponse.json({ feed })
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

    console.error('Error updating feed:', error)
    return NextResponse.json(
      { error: 'Failed to update feed' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/feeds/:id - Delete feed
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthenticatedUser()

    await prisma.feed.delete({
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
    console.error('Error deleting feed:', error)
    return NextResponse.json(
      { error: 'Failed to delete feed' },
      { status: 500 }
    )
  }
}
