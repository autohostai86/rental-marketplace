'use client'

import Logo from '@/components/Logo'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

interface TopNavProps {
  unreadCount?: number
}

export default function TopNav({ unreadCount = 0 }: TopNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isBrowse = pathname === '/browse'
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/browse?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link href="/" className="shrink-0">
          <Logo className="h-8 w-auto" />
        </Link>

        {isBrowse && (
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items…"
              className="w-full text-sm rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
            />
          </form>
        )}

        {!isBrowse && <div className="flex-1" />}

        <Link href="/notifications" className="relative p-1">
          <BellIcon className="w-6 h-6 stroke-black" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  )
}
