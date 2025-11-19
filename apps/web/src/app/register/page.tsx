'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Auto-login after registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Registration successful but login failed. Please login manually.')
        router.push('/login')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
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
          <h2 className="text-2xl font-mono text-neon-cyan mb-6">Create Account</h2>

          {error && (
            <div className="mb-4 p-3 bg-neon-pink/20 border border-neon-pink text-neon-pink text-sm font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">
                Name (Optional)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-void-black border border-gray-600 text-gray-100 font-mono focus:border-neon-cyan focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-void-black border border-gray-600 text-gray-100 font-mono focus:border-neon-cyan focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">
                Password (min 8 characters)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-void-black border border-gray-600 text-gray-100 font-mono focus:border-neon-cyan focus:outline-none"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-neon-green text-void-black font-mono uppercase tracking-wider hover:bg-neon-green/80 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 font-mono">
            Already have an account?{' '}
            <Link href="/login" className="text-neon-purple hover:text-neon-purple/80">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
