'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function VerifyPage() {
  const [otp, setOtp] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const stored = sessionStorage.getItem('otp_phone')
    if (!stored) { router.replace('/login'); return }
    setPhone(stored)
  }, [router])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Upsert profile row
      await supabase.from('profiles').upsert({
        id:    data.user.id,
        phone: data.user.phone ?? phone,
      }, { onConflict: 'id' })

      sessionStorage.removeItem('otp_phone')
      router.replace('/browse')
    }
  }

  async function handleResend() {
    const supabase = createClient()
    await supabase.auth.signInWithOtp({ phone })
    setError(null)
    setOtp('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Enter OTP</h1>
          <p className="mt-2 text-sm text-gray-500">
            We sent a 6-digit code to{' '}
            <span className="font-medium text-gray-800">{phone}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="• • • • • •"
            className="block w-full text-center text-2xl tracking-widest rounded-lg border border-gray-300 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Verifying…' : 'Verify & Continue'}
          </button>
        </form>

        <button
          onClick={handleResend}
          className="mt-4 w-full text-center text-sm text-indigo-600 hover:underline"
        >
          Resend OTP
        </button>

        <button
          onClick={() => router.replace('/login')}
          className="mt-2 w-full text-center text-sm text-gray-400 hover:underline"
        >
          Change phone number
        </button>
      </div>
    </div>
  )
}
