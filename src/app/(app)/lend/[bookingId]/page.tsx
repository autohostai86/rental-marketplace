'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice, formatDatetime, maskPhone } from '@/lib/formatters'
import type { Booking } from '@/types'

export default function LendBookingDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params)
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then(({ booking }) => { setBooking(booking); setLoading(false) })
  }, [bookingId])

  async function takeAction(status: string) {
    setActionLoading(true)
    setError(null)
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, lender_note: note || undefined }),
    })
    const data = await res.json()
    setActionLoading(false)
    if (!res.ok) { setError(data.error); return }
    setBooking(data.booking)
    if (status === 'accepted' || status === 'rejected') router.push('/lend')
  }

  async function confirmPayment() {
    setActionLoading(true)
    await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_confirmed: true }),
    })
    setBooking((b) => b ? { ...b, payment_confirmed: true } : b)
    setActionLoading(false)
  }

  async function markCompleted() {
    await takeAction('completed')
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!booking) return <p className="text-center py-16 text-gray-400">Booking not found</p>

  const borrower = booking.borrower as { full_name?: string; phone?: string; avatar_url?: string } | undefined
  const item     = booking.item     as { title?: string; images?: string[] } | undefined
  const isAccepted = ['accepted', 'active'].includes(booking.status)

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <button onClick={() => router.back()} className="text-sm text-indigo-600">← Back</button>

      <h1 className="text-xl font-bold text-gray-900">Booking Request</h1>

      {/* Item */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3">
        {item?.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.images[0]} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0" />
        )}
        <div>
          <p className="font-medium text-gray-900">{item?.title}</p>
          <p className="text-sm text-indigo-600 font-semibold mt-1">{formatPrice(booking.total_price)}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {booking.duration_count} {booking.duration_unit} · from {formatDatetime(booking.start_datetime)}
          </p>
        </div>
      </div>

      {/* Borrower */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Renter</p>
        <p className="font-medium text-gray-900">{borrower?.full_name ?? 'Unknown'}</p>
        {isAccepted && borrower?.phone && (
          <p className="text-sm text-gray-600 mt-0.5">📱 {maskPhone(borrower.phone)}</p>
        )}
        {booking.borrower_note && (
          <p className="text-sm text-gray-500 mt-2 bg-gray-50 rounded-lg p-2 italic">
            "{booking.borrower_note}"
          </p>
        )}
      </div>

      {/* Status */}
      <StatusBadge status={booking.status} />

      {/* Payment confirmation */}
      {isAccepted && !booking.payment_confirmed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800 font-medium">Awaiting payment</p>
          <p className="text-xs text-amber-600 mt-1">
            Ask the renter to transfer {formatPrice(booking.total_price)} to your UPI
          </p>
          <button
            onClick={confirmPayment}
            disabled={actionLoading}
            className="mt-3 text-sm font-medium text-white bg-amber-500 px-4 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50"
          >
            Mark Payment Received
          </button>
        </div>
      )}

      {booking.payment_confirmed && isAccepted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-sm text-green-700 font-medium">✓ Payment received</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Actions */}
      {booking.status === 'pending' && (
        <div className="space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional) — shown to renter"
            rows={2}
            className="input w-full resize-none text-sm"
          />
          <div className="flex gap-3">
            <button
              onClick={() => takeAction('rejected')}
              disabled={actionLoading}
              className="flex-1 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={() => takeAction('accepted')}
              disabled={actionLoading}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              Accept
            </button>
          </div>
        </div>
      )}

      {isAccepted && (
        <button
          onClick={markCompleted}
          disabled={actionLoading}
          className="w-full py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          Mark as Returned / Completed
        </button>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:   { label: 'Pending Review',  cls: 'bg-amber-100 text-amber-700'  },
    accepted:  { label: 'Accepted',        cls: 'bg-blue-100 text-blue-700'    },
    active:    { label: 'Active',          cls: 'bg-green-100 text-green-700'  },
    completed: { label: 'Completed',       cls: 'bg-gray-100 text-gray-600'    },
    rejected:  { label: 'Rejected',        cls: 'bg-red-100 text-red-600'      },
    cancelled: { label: 'Cancelled',       cls: 'bg-red-100 text-red-600'      },
  }
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  )
}

function Spinner() {
  return <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
}
