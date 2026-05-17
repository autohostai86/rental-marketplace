'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice, formatDurationUnit, formatRelativeTime } from '@/lib/formatters'
import { calculateEndDatetime, calculateTotalPrice, getAvailableUnits, getPriceForUnit } from '@/lib/pricing'
import type { Item, Review, DurationUnit } from '@/types'
import { DURATION_UNITS } from '@/types'

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [item, setItem] = useState<Item | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)

  // Booking state
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('daily')
  const [durationCount, setDurationCount] = useState(1)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 16)
  })
  const [note, setNote] = useState('')
  const [booking, setBooking] = useState(false)
  const [booked, setBooked] = useState(false)
  const [bookError, setBookError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/items/${id}`)
      .then((r) => r.json())
      .then(({ item, reviews }) => {
        setItem(item)
        setReviews(reviews ?? [])
        const units = item ? getAvailableUnits(item) : []
        if (units.length > 0 && !units.includes(durationUnit)) setDurationUnit(units[0])
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleBook() {
    setBooking(true)
    setBookError(null)
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: id,
        duration_unit: durationUnit,
        duration_count: durationCount,
        start_datetime: new Date(startDate).toISOString(),
        borrower_note: note || undefined,
      }),
    })
    const data = await res.json()
    setBooking(false)
    if (!res.ok) { setBookError(data.error); return }
    setBooked(true)
    setTimeout(() => router.push(`/bookings/${data.booking.id}`), 1200)
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!item) return <p className="text-center py-16 text-gray-400">Item not found</p>

  const owner      = item.owner as { full_name?: string; avatar_url?: string; avg_rating?: number } | undefined
  const units      = getAvailableUnits(item)
  const price      = getPriceForUnit(item, durationUnit)
  const total      = price != null ? calculateTotalPrice(price, durationCount) : 0
  const end        = price != null ? calculateEndDatetime(new Date(startDate), durationUnit, durationCount) : null
  const isRentedOut = item.status === 'rented_out'

  return (
    <div className="pb-32">
      {/* Image gallery */}
      <div className="relative bg-gray-100" style={{ aspectRatio: '4/3' }}>
        {item.images[imgIdx] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.images[imgIdx]} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl text-gray-200">📦</div>
        )}
        {item.images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {item.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
        {isRentedOut && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            Rented Out
          </div>
        )}
        <button onClick={() => router.back()} className="absolute top-3 right-3 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center text-sm">
          ←
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Title + category */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold text-gray-900">{item.title}</h1>
            <span className="shrink-0 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{item.category}</span>
          </div>
          {item.address_hint && (
            <p className="text-sm text-gray-500 mt-1">📍 {item.address_hint}</p>
          )}
          {item.avg_rating != null && (
            <p className="text-sm text-gray-500 mt-1">★ {item.avg_rating.toFixed(1)} · {item.total_reviews} reviews</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Qty available: {item.inventory} · Condition: {item.condition.replace('_', ' ')}
          </p>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
        )}

        {/* Pricing table */}
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pricing</p>
          <div className="space-y-1">
            {DURATION_UNITS.map(({ value, label, shortLabel }) => {
              const p = getPriceForUnit(item, value)
              if (p == null) return null
              return (
                <div key={value} className="flex justify-between text-sm">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-semibold text-gray-900">
                    {p === 0
                      ? <span className="text-green-600">Free</span>
                      : <>{formatPrice(p)}<span className="text-gray-400 font-normal">{shortLabel}</span></>
                    }
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Owner */}
        <div className="flex items-center gap-3 py-2 border-t border-gray-100">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
            {owner?.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{owner?.full_name ?? 'Owner'}</p>
            {owner?.avg_rating != null && (
              <p className="text-xs text-gray-400">★ {owner.avg_rating.toFixed(1)}</p>
            )}
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Reviews</p>
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-800">
                      {(r.reviewer as { full_name?: string })?.full_name ?? 'User'}
                    </p>
                    <span className="text-xs text-gray-400">{formatRelativeTime(r.created_at)}</span>
                  </div>
                  <p className="text-xs text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
                  {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed booking panel */}
      {!isRentedOut && (
        <div className="fixed bottom-16 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 space-y-3">
          {!booked ? (
            <>
              <div className="flex gap-2 overflow-x-auto">
                {units.map((u) => (
                  <button
                    key={u}
                    onClick={() => setDurationUnit(u)}
                    className={`shrink-0 px-3 py-1 text-xs rounded-full border transition-colors ${
                      durationUnit === u ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input text-xs flex-1"
                />
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => setDurationCount((c) => Math.max(1, c - 1))} className="px-2 py-1 text-gray-500 hover:bg-gray-50">−</button>
                  <span className="px-3 text-sm font-medium">{durationCount}</span>
                  <button onClick={() => setDurationCount((c) => c + 1)} className="px-2 py-1 text-gray-500 hover:bg-gray-50">+</button>
                </div>
              </div>
              {price != null && end && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {price === 0
                      ? `${durationCount} × Free`
                      : `${durationCount} × ${formatPrice(price)}${formatDurationUnit(durationUnit)}`
                    }
                  </span>
                  <span className="font-bold text-gray-900">
                    {price === 0 ? <span className="text-green-600">Free</span> : formatPrice(total)}
                  </span>
                </div>
              )}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Message to owner (optional)"
                rows={1}
                className="input w-full text-xs resize-none"
              />
              {bookError && <p className="text-xs text-red-500">{bookError}</p>}
              <button
                onClick={handleBook}
                disabled={booking || price == null}
                className="btn-primary w-full"
              >
                {booking ? 'Booking…' : price === 0 ? 'Request to borrow (Free)' : `Book for ${formatPrice(total)}`}
              </button>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-green-600 font-semibold">Booking request sent!</p>
              <p className="text-xs text-gray-400 mt-1">Redirecting…</p>
            </div>
          )}
        </div>
      )}

      {isRentedOut && (
        <div className="fixed bottom-16 inset-x-0 bg-white border-t border-gray-200 px-4 py-4">
          <p className="text-center text-gray-500 font-medium">Currently rented out — check back later</p>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
}
