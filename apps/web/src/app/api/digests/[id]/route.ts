/**
 * Individual digest API
 * GET /api/digests/:id - Get digest with items
 */

import { NextResponse } from 'next/server'
import { getDigestWithItems, markDigestAsViewed } from '@/lib/digest/generator'

const DEMO_USER_ID = 'demo-user'

/**
 * GET /api/digests/:id - Get digest with full item details
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const digest = await getDigestWithItems(params.id)

    if (!digest || digest.userId !== DEMO_USER_ID) {
      return NextResponse.json(
        { error: 'Digest not found' },
        { status: 404 }
      )
    }

    // Mark as viewed
    if (!digest.viewedAt) {
      await markDigestAsViewed(params.id)
    }

    return NextResponse.json({ digest })
  } catch (error) {
    console.error('Error fetching digest:', error)
    return NextResponse.json(
      { error: 'Failed to fetch digest' },
      { status: 500 }
    )
  }
}
