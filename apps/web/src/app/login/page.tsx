'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push(callbackUrl)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-void-black flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-4xl font-mono font-bold text-neon-cyan glow-text">
            snub.io
          </Link>
          <p className="mt-2 text-sm text-neon-pink font-mono">ignore the noise, on purpose</p>
        </div>

        <div className="border border-neon-cyan bg-void-dark p-8">
          <h2 className="text-2xl font-mono text-neon-cyan mb-6">Login</h2>

          {error && (
            <div className="mb-4 p-3 bg-neon-pink/20 border border-neon-pink text-neon-pink text-sm font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-void-black border border-gray-600 text-gray-100 font-mono focus:border-neon-cyan focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-void-black border border-gray-600 text-gray-100 font-mono focus:border-neon-cyan focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-neon-cyan text-void-black font-mono uppercase tracking-wider hover:bg-neon-cyan/80 transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 font-mono">
            Don't have an account?{' '}
            <Link href="/register" className="text-neon-purple hover:text-neon-purple/80">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
