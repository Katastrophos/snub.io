/**
 * Digests API
 * GET /api/digests - List user's digests
 * POST /api/digests - Manually generate a digest
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { generateDigest } from '@/lib/digest/generator'
import { getAuthenticatedUser } from '@/lib/get-user'

/**
 * GET /api/digests - List all digests for user
 */
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUser()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const where: any = {
      userId,
    }

    if (type) {
      where.type = type.toUpperCase()
    }

    const digests = await prisma.digest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ digests })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching digests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch digests' },
      { status: 500 }
    )
  }
}

const createDigestSchema = z.object({
  type: z.enum(['HOURLY', 'DAILY', 'WEEKLY']),
  signalThreshold: z.number().min(0).max(1).optional(),
  minItems: z.number().min(1).optional(),
  maxItems: z.number().min(1).max(100).optional(),
})

/**
 * POST /api/digests - Manually generate a digest
 */
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUser()
    const body = await request.json()
    const data = createDigestSchema.parse(body)

    const digest = await generateDigest({
      type: data.type,
      userId,
      signalThreshold: data.signalThreshold,
      minItems: data.minItems,
      maxItems: data.maxItems,
    })

    if (!digest) {
      return NextResponse.json(
        { error: 'Not enough high-signal items to generate digest' },
        { status: 400 }
      )
    }

    return NextResponse.json({ digest }, { status: 201 })
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

    console.error('Error creating digest:', error)
    return NextResponse.json(
      { error: 'Failed to create digest' },
      { status: 500 }
    )
  }
}
