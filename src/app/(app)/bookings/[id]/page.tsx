'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice, formatDatetime, maskPhone } from '@/lib/formatters'
import type { Booking } from '@/types'
import CountdownTimer from '@/components/CountdownTimer'

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/bookings/${id}`)
      .then((r) => r.json())
      .then(({ booking, hasReviewed }) => {
        setBooking(booking)
        setHasReviewed(hasReviewed)
        setLoading(false)
      })
  }, [id])

  async function handleCancel() {
    setCancelLoading(true)
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    setCancelLoading(false)
    router.push('/bookings')
  }

  async function submitReview() {
    setReviewLoading(true)
    await fetch(`/api/bookings/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment }),
    })
    setReviewLoading(false)
    setReviewDone(true)
    setHasReviewed(true)
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!booking) return <p className="text-center py-16 text-gray-400">Booking not found</p>

  const item   = booking.item   as { title?: string; images?: string[]; address_hint?: string } | undefined
  const lender = booking.lender as { full_name?: string; phone?: string; upi_id?: string } | undefined
  const isAcceptedOrBeyond = ['accepted', 'active', 'completed'].includes(booking.status)

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <button onClick={() => router.back()} className="text-sm text-indigo-600">← Back</button>
      <h1 className="text-xl font-bold text-gray-900">Rental Detail</h1>

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
            {booking.duration_count} {booking.duration_unit}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDatetime(booking.start_datetime)} → {formatDatetime(booking.end_datetime)}
          </p>
          {item?.address_hint && (
            <p className="text-xs text-gray-500 mt-1">📍 {item.address_hint}</p>
          )}
        </div>
      </div>

      {/* Status */}
      <StatusBadge status={booking.status} />

      {/* Countdown timer — active rentals only */}
      {booking.status === 'active' && (
        <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">Time remaining</p>
          <CountdownTimer endDatetime={booking.end_datetime} />
        </div>
      )}

      {/* Lender contact — only after acceptance */}
      {isAcceptedOrBeyond && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Owner</p>
          <p className="font-medium text-gray-900">{lender?.full_name ?? 'Unknown'}</p>
          {lender?.phone && (
            <p className="text-sm text-gray-600 mt-0.5">📱 {maskPhone(lender.phone)}</p>
          )}
        </div>
      )}

      {/* Payment instructions */}
      {booking.status === 'accepted' && !booking.payment_confirmed && lender?.upi_id && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-indigo-800">Please make payment</p>
          <p className="text-sm text-indigo-700 mt-1">
            Transfer <strong>{formatPrice(booking.total_price)}</strong> to:
          </p>
          <p className="text-base font-bold text-indigo-900 mt-1 tracking-wide">{lender.upi_id}</p>
          <p className="text-xs text-indigo-500 mt-2">Once the owner confirms receipt, your rental will go active.</p>
        </div>
      )}

      {booking.payment_confirmed && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-sm text-green-700 font-medium">✓ Payment confirmed by owner</p>
        </div>
      )}

      {/* Lender note */}
      {booking.lender_note && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-400 font-medium mb-1">Owner note</p>
          <p className="text-sm text-gray-700 italic">"{booking.lender_note}"</p>
        </div>
      )}

      {/* Cancel */}
      {booking.status === 'pending' && (
        <button
          onClick={handleCancel}
          disabled={cancelLoading}
          className="w-full py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
        >
          {cancelLoading ? 'Cancelling…' : 'Cancel Request'}
        </button>
      )}

      {/* Review */}
      {booking.status === 'completed' && !hasReviewed && !reviewDone && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="font-medium text-gray-900 mb-3">Leave a Review</p>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                className={`text-2xl transition-transform hover:scale-110 ${s <= rating ? 'opacity-100' : 'opacity-30'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience…"
            rows={3}
            className="input w-full resize-none text-sm mb-3"
          />
          <button
            onClick={submitReview}
            disabled={reviewLoading || rating === 0}
            className="btn-primary w-full"
          >
            {reviewLoading ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      )}

      {(hasReviewed || reviewDone) && booking.status === 'completed' && (
        <p className="text-center text-sm text-gray-400">✓ Review submitted</p>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:   { label: 'Awaiting confirmation', cls: 'bg-amber-100 text-amber-700'  },
    accepted:  { label: 'Accepted',              cls: 'bg-blue-100 text-blue-700'    },
    active:    { label: 'Active',                cls: 'bg-green-100 text-green-700'  },
    completed: { label: 'Completed',             cls: 'bg-gray-100 text-gray-600'    },
    rejected:  { label: 'Rejected',              cls: 'bg-red-100 text-red-600'      },
    cancelled: { label: 'Cancelled',             cls: 'bg-red-100 text-red-600'      },
  }
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  )
}

function Spinner() {
  return <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
}
