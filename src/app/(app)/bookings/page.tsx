import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPrice, formatDatetime, formatRelativeTime } from '@/lib/formatters'
import type { Booking } from '@/types'

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, item:items(id, title, images, category)')
    .eq('borrower_id', user.id)
    .order('created_at', { ascending: false })

  const active   = bookings?.filter((b) => ['pending','accepted','active'].includes(b.status)) ?? []
  const history  = bookings?.filter((b) => ['completed','rejected','cancelled'].includes(b.status)) ?? []

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">My Rentals</h1>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Upcoming</h2>
        {active.length === 0
          ? <p className="text-sm text-gray-400 text-center py-8">No active bookings</p>
          : <div className="space-y-3">{active.map((b) => <BookingCard key={b.id} booking={b as Booking} />)}</div>
        }
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3">History</h2>
        {history.length === 0
          ? <p className="text-sm text-gray-400 text-center py-8">No past rentals</p>
          : <div className="space-y-3">{history.map((b) => <BookingCard key={b.id} booking={b as Booking} />)}</div>
        }
      </section>
    </div>
  )
}

function BookingCard({ booking }: { booking: Booking }) {
  const item   = booking.item   as { id: string; title: string; images: string[] } | undefined
  const statusMap: Record<string, { label: string; cls: string }> = {
    pending:   { label: 'Awaiting confirmation', cls: 'text-amber-600'  },
    accepted:  { label: 'Accepted — make payment', cls: 'text-blue-600' },
    active:    { label: 'Active rental',           cls: 'text-green-600' },
    completed: { label: 'Completed',               cls: 'text-gray-400'  },
    rejected:  { label: 'Rejected',                cls: 'text-red-500'   },
    cancelled: { label: 'Cancelled',               cls: 'text-red-500'   },
  }
  const s = statusMap[booking.status]

  return (
    <Link href={`/bookings/${booking.id}`} className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        {item?.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{item?.title}</p>
          <p className={`text-xs font-medium mt-0.5 ${s?.cls}`}>{s?.label}</p>
          <p className="text-sm text-indigo-600 font-semibold mt-1">{formatPrice(booking.total_price)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDatetime(booking.start_datetime)}</p>
        </div>
        <p className="text-xs text-gray-300 shrink-0">{formatRelativeTime(booking.created_at)}</p>
      </div>

      {booking.status === 'accepted' && !booking.payment_confirmed && (
        <div className="mt-3 p-2.5 bg-amber-50 rounded-lg">
          <p className="text-xs text-amber-700 font-medium">
            Please complete payment of {formatPrice(booking.total_price)}
          </p>
        </div>
      )}
    </Link>
  )
}
