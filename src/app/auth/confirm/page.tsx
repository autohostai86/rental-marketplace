'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // The browser client automatically processes the token from the URL
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await supabase.from('profiles').upsert({
          id:    session.user.id,
          phone: session.user.email ?? '',
        }, { onConflict: 'id' })
        router.replace('/browse')
      } else {
        // Listen for the auth state change triggered by the magic link token
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (session?.user) {
              await supabase.from('profiles').upsert({
                id:    session.user.id,
                phone: session.user.email ?? '',
              }, { onConflict: 'id' })
              subscription.unsubscribe()
              router.replace('/browse')
            }
          }
        )
      }
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-sm text-gray-500">Logging you in…</p>
      </div>
    </div>
  )
}
