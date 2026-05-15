'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatPrice, formatDatetime, formatRelativeTime } from '@/lib/formatters'
import type { Booking } from '@/types'
import CountdownTimer from '@/components/CountdownTimer'

export default function LendPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bookings?role=lender')
      .then((r) => r.json())
      .then(({ bookings }) => {
        setBookings(bookings ?? [])
        setLoading(false)
      })
  }, [])

  const pending  = bookings.filter((b) => b.status === 'pending')
  const active   = bookings.filter((b) => ['accepted', 'active'].includes(b.status))
  const history  = bookings.filter((b) => ['completed', 'rejected', 'cancelled'].includes(b.status))

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-black mb-6">Lend Dashboard</h1>

      <Section title="Pending Requests" count={pending.length} badge="bg-gray-100 text-gray-800">
        {pending.length === 0
          ? <Empty text="No pending requests" />
          : pending.map((b) => <BookingRequestCard key={b.id} booking={b} />)
        }
      </Section>

      <Section title="Active Rentals" count={active.length} badge="bg-black text-white">
        {active.length === 0
          ? <Empty text="No active rentals" />
          : active.map((b) => <ActiveBookingCard key={b.id} booking={b} />)
        }
      </Section>

      <Section title="History" count={history.length} badge="bg-gray-100 text-gray-400">
        {history.length === 0
          ? <Empty text="No past bookings" />
          : history.map((b) => <HistoryCard key={b.id} booking={b} />)
        }
      </Section>
    </div>
  )
}

function Section({ title, count, badge, children }: { title: string; count: number; badge: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{count}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function BookingRequestCard({ booking }: { booking: Booking }) {
  const item = booking.item as { title: string; images: string[] } | undefined
  return (
    <Link href={`/lend/${booking.id}`} className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-black transition-colors">
      <div className="flex items-start gap-3">
        {item?.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-black truncate">{item?.title}</p>
          <p className="text-sm font-semibold text-black mt-1">{formatPrice(booking.total_price)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{booking.duration_count} {booking.duration_unit} · from {formatDatetime(booking.start_datetime)}</p>
        </div>
        <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-full shrink-0">Review →</span>
      </div>
    </Link>
  )
}

function ActiveBookingCard({ booking }: { booking: Booking }) {
  const item = booking.item as { title: string; images: string[] } | undefined
  return (
    <Link href={`/lend/${booking.id}`} className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-black transition-colors">
      <div className="flex items-center gap-3">
        {item?.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-black truncate">{item?.title}</p>
          {booking.payment_confirmed
            ? <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs text-gray-400">Due back</p>
                <CountdownTimer endDatetime={booking.end_datetime} />
              </div>
            : <p className="text-xs text-gray-400 mt-0.5">Due back {formatDatetime(booking.end_datetime)}</p>
          }
          {!booking.payment_confirmed && <p className="text-xs text-red-400 mt-0.5">Payment not confirmed</p>}
        </div>
        <span className="text-xs font-medium bg-black text-white px-2 py-1 rounded-full shrink-0">Active</span>
      </div>
    </Link>
  )
}

function HistoryCard({ booking }: { booking: Booking }) {
  const item = booking.item as { title: string } | undefined
  const statusColor: Record<string, string> = {
    completed: 'text-gray-400',
    rejected:  'text-red-400',
    cancelled: 'text-red-400',
  }
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700 truncate">{item?.title}</p>
        <p className="text-xs text-gray-300 mt-0.5">{formatRelativeTime(booking.created_at)}</p>
      </div>
      <span className={`text-xs font-medium capitalize ${statusColor[booking.status] ?? 'text-gray-400'}`}>
        {booking.status}
      </span>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-gray-300 py-4 text-center">{text}</p>
}
