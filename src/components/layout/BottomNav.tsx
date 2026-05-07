'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/browse',    label: 'Browse',    icon: SearchIcon   },
  { href: '/items/new', label: 'List Item', icon: PlusIcon     },
  { href: '/lend',      label: 'Lend',      icon: TagIcon      },
  { href: '/bookings',  label: 'Bookings',  icon: CalendarIcon },
  { href: '/profile',   label: 'Profile',   icon: UserIcon     },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
      <div className="flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors ${
                active ? 'text-black font-semibold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon active={active} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'stroke-black' : 'stroke-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function PlusIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'stroke-black' : 'stroke-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function TagIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'stroke-black' : 'stroke-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  )
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'stroke-black' : 'stroke-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'stroke-black' : 'stroke-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}
