/**
 * Item feedback API
 * POST /api/items/:id/feedback - Mark item as noise/signal
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

const DEMO_USER_ID = 'demo-user'

const feedbackSchema = z.object({
  feedback: z.enum(['NOISE', 'SIGNAL']),
})

/**
 * POST /api/items/:id/feedback - Provide user feedback on an item
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = feedbackSchema.parse(body)

    const item = await prisma.feedItem.update({
      where: {
        id: params.id,
        userId: DEMO_USER_ID,
      },
      data: {
        userFeedback: data.feedback,
      },
    })

    // TODO: Use feedback to train adaptive filters

    return NextResponse.json({ item })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}
