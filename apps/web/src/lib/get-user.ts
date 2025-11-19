/**
 * Server-side helper to get authenticated user
 */

import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function getAuthenticatedUser(): Promise<string> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  return session.user.id
}

export async function getOptionalUser(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id || null
}
