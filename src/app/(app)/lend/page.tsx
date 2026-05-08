import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPrice, formatDatetime, formatRelativeTime } from '@/lib/formatters'
import type { Booking } from '@/types'

export default async function LendPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, item:items(id, title, images), borrower:profiles(id, full_name, avatar_url)')
    .eq('lender_id', user.id)
    .order('created_at', { ascending: false })

  const pending   = bookings?.filter((b) => b.status === 'pending')   ?? []
  const active    = bookings?.filter((b) => ['accepted','active'].includes(b.status)) ?? []
  const history   = bookings?.filter((b) => ['completed','rejected','cancelled'].includes(b.status)) ?? []

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Lend Dashboard</h1>

      <Section title="Pending Requests" count={pending.length} badge="bg-amber-100 text-amber-700">
        {pending.length === 0
          ? <Empty text="No pending requests" />
          : pending.map((b) => <BookingRequestCard key={b.id} booking={b as Booking} />)
        }
      </Section>

      <Section title="Active Rentals" count={active.length} badge="bg-green-100 text-green-700">
        {active.length === 0
          ? <Empty text="No active rentals" />
          : active.map((b) => <ActiveBookingCard key={b.id} booking={b as Booking} />)
        }
      </Section>

      <Section title="History" count={history.length} badge="bg-gray-100 text-gray-500">
        {history.length === 0
          ? <Empty text="No past bookings" />
          : history.map((b) => <HistoryCard key={b.id} booking={b as Booking} />)
        }
      </Section>
    </div>
  )
}

function Section({ title, count, badge, children }: { title: string; count: number; badge: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{count}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function BookingRequestCard({ booking }: { booking: Booking }) {
  const item = booking.item as { title: string; images: string[] } | undefined

  return (
    <Link href={`/lend/${booking.id}`} className="block bg-white border border-amber-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        {item?.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{item?.title}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {(booking.borrower as { full_name?: string })?.full_name ?? 'Someone'} wants to rent
          </p>
          <p className="text-sm font-semibold text-indigo-600 mt-1">
            {formatPrice(booking.total_price)} · {booking.duration_count} {booking.duration_unit}
          </p>
          <p className="text-xs text-gray-400 mt-1">From {formatDatetime(booking.start_datetime)}</p>
        </div>
        <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full shrink-0">
          Review
        </span>
      </div>
    </Link>
  )
}

function ActiveBookingCard({ booking }: { booking: Booking }) {
  const item = booking.item as { title: string; images: string[] } | undefined

  return (
    <Link href={`/lend/${booking.id}`} className="block bg-white border border-green-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        {item?.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{item?.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">Due back {formatDatetime(booking.end_datetime)}</p>
          {!booking.payment_confirmed && (
            <p className="text-xs text-red-500 mt-0.5">Payment not confirmed</p>
          )}
        </div>
        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full shrink-0">
          Active
        </span>
      </div>
    </Link>
  )
}

function HistoryCard({ booking }: { booking: Booking }) {
  const item = booking.item as { title: string } | undefined
  const statusColor: Record<string, string> = {
    completed: 'text-gray-500',
    rejected:  'text-red-400',
    cancelled: 'text-red-400',
  }
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700 truncate">{item?.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(booking.created_at)}</p>
      </div>
      <span className={`text-xs font-medium capitalize ${statusColor[booking.status] ?? 'text-gray-400'}`}>
        {booking.status}
      </span>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 py-4 text-center">{text}</p>
}
