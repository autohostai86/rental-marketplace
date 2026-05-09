'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyPage() {
  const [email, setEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    const stored = sessionStorage.getItem('otp_email')
    if (!stored) { router.replace('/login'); return }
    setEmail(stored)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-black tracking-tighter text-black mb-8">BORRO</h1>
        <div className="text-4xl mb-6">✉️</div>
        <h2 className="text-lg font-bold text-black">Check your email</h2>
        <p className="mt-2 text-sm text-gray-400">
          We sent a login link to
        </p>
        <p className="mt-1 text-sm font-medium text-black">{email}</p>
        <p className="mt-4 text-sm text-gray-400">
          Click the link in the email to log in.
        </p>

        <button
          onClick={() => router.replace('/login')}
          className="mt-10 text-xs text-gray-400 hover:text-black transition-colors underline underline-offset-2"
        >
          Use a different email
        </button>
      </div>
    </div>
  )
}
