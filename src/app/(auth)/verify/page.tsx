'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function VerifyPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  useEffect(() => {
    const stored = sessionStorage.getItem('otp_email')
    if (!stored) { router.replace('/login'); return }
    setEmail(stored)
    inputRefs.current[0]?.focus()
  }, [router])

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 7) inputRefs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    e.preventDefault()
    const next = [...otp]
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setOtp(next)
    const focusIndex = Math.min(pasted.length, 7)
    inputRefs.current[focusIndex]?.focus()
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const token = otp.join('')
    if (token.length < 6) return
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error) {
      setLoading(false)
      setError(error.message)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      return
    }

    if (data.session?.user) {
      await supabase.from('profiles').upsert({
        id: data.session.user.id,
        phone: data.session.user.email ?? '',
      }, { onConflict: 'id' })
      sessionStorage.removeItem('otp_email')
    }

    router.replace('/browse')
  }

  const isFilled = otp.every(d => d !== '')

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <img src="/logo.svg" alt="Borro" className="h-10 w-auto mx-auto" />
          <p className="mt-2 text-sm text-gray-400">Enter the 8-digit code we sent to</p>
          <p className="mt-1 text-sm font-medium text-black">{email}</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-11 h-14 text-center text-xl font-bold border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
              />
            ))}
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !isFilled}
            className="btn-primary w-full rounded-full"
          >
            {loading ? 'Verifying…' : 'Verify Code'}
          </button>
        </form>

        <button
          onClick={() => router.replace('/login')}
          className="mt-8 block w-full text-center text-xs text-gray-400 hover:text-black transition-colors underline underline-offset-2"
        >
          Use a different email
        </button>
      </div>
    </div>
  )
}
