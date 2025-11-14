/**
 * Individual feed API
 * PATCH  /api/feeds/:id - Update feed
 * DELETE /api/feeds/:id - Delete feed
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

const updateFeedSchema = z.object({
  enabled: z.boolean().optional(),
  fetchInterval: z.number().min(5).max(1440).optional(),
})

const DEMO_USER_ID = 'demo-user'

/**
 * PATCH /api/feeds/:id - Update feed settings
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateFeedSchema.parse(body)

    const feed = await prisma.feed.update({
      where: {
        id: params.id,
        userId: DEMO_USER_ID,
      },
      data,
    })

    return NextResponse.json({ feed })
  } catch (error) {
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
    await prisma.feed.delete({
      where: {
        id: params.id,
        userId: DEMO_USER_ID,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting feed:', error)
    return NextResponse.json(
      { error: 'Failed to delete feed' },
      { status: 500 }
    )
  }
}
