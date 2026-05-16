'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    sessionStorage.setItem('otp_email', email)
    router.push('/verify')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <img src="/logo.svg" alt="Borro" className="h-10 w-auto mx-auto" />
          <p className="mt-2 text-sm text-gray-400">Enter your email to get started</p>
        </div>

        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input w-full"
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email}
            className="btn-primary w-full rounded-full"
          >
            {loading ? 'Sending…' : 'Continue with Email'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-300">
          We'll send an 8-digit code to your inbox
        </p>
      </div>
    </div>
  )
}
