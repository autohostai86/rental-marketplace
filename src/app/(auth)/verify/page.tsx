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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-6">📧</div>
        <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="mt-3 text-sm text-gray-500">
          We sent a login link to
        </p>
        <p className="mt-1 font-medium text-gray-800">{email}</p>
        <p className="mt-4 text-sm text-gray-500">
          Click the link in the email to log in. You can close this page.
        </p>

        <button
          onClick={() => router.replace('/login')}
          className="mt-8 text-sm text-indigo-600 hover:underline"
        >
          Use a different email
        </button>
      </div>
    </div>
  )
}
