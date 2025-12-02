/**
 * Item feedback API
 * POST /api/items/:id/feedback - Mark item as noise/signal
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/get-user'
import { processItemFeedback } from '@/lib/adaptive-learning'

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
    const userId = await getAuthenticatedUser()
    const body = await request.json()
    const data = feedbackSchema.parse(body)

    const item = await prisma.feedItem.update({
      where: {
        id: params.id,
        userId,
      },
      data: {
        userFeedback: data.feedback,
      },
    })

    // Process feedback for adaptive learning (async, don't wait)
    processItemFeedback(userId, params.id, data.feedback).catch(err => {
      console.error('Error processing feedback for learning:', err)
    })

    return NextResponse.json({ item })
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

    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}
