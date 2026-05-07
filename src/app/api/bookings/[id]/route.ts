import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { BookingStatus } from '@/types'

const VALID_TRANSITIONS: Record<string, BookingStatus[]> = {
  pending:   ['accepted', 'rejected', 'cancelled'],
  accepted:  ['active', 'completed', 'cancelled'],
  active:    ['completed'],
  completed: [],
  rejected:  [],
  cancelled: [],
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('bookings')
    .select('*, item:items(id, title, images, category, address_hint), borrower:profiles!bookings_borrower_id_fkey(id, full_name, avatar_url, phone), lender:profiles!bookings_lender_id_fkey(id, full_name, avatar_url, phone, upi_id)')
    .eq('id', id)
    .or(`borrower_id.eq.${user.id},lender_id.eq.${user.id}`)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only expose phone after booking is accepted
  const isAcceptedOrBeyond = ['accepted', 'active', 'completed'].includes(data.status)
  if (!isAcceptedOrBeyond) {
    if (data.borrower) (data.borrower as Record<string, unknown>).phone = null
    if (data.lender)   (data.lender   as Record<string, unknown>).phone = null
  }

  // Check if current user has already reviewed
  const { data: myReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', id)
    .eq('reviewer_id', user.id)
    .maybeSingle()

  return NextResponse.json({ booking: data, hasReviewed: !!myReview })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { status: newStatus, lender_note, payment_confirmed } = body

  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .or(`borrower_id.eq.${user.id},lender_id.eq.${user.id}`)
    .single()

  if (fetchErr || !booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (newStatus) {
    const allowed = VALID_TRANSITIONS[booking.status] ?? []
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from ${booking.status} to ${newStatus}` },
        { status: 400 }
      )
    }

    // Only lender can accept/reject; only borrower can cancel a pending booking
    if (['accepted', 'rejected'].includes(newStatus) && user.id !== booking.lender_id) {
      return NextResponse.json({ error: 'Only the lender can accept or reject' }, { status: 403 })
    }
    if (newStatus === 'cancelled' && booking.status === 'pending' && user.id !== booking.borrower_id) {
      return NextResponse.json({ error: 'Only the borrower can cancel a pending request' }, { status: 403 })
    }
  }

  const update: Record<string, unknown> = {}
  if (newStatus)           update.status = newStatus
  if (lender_note != null) update.lender_note = lender_note
  if (payment_confirmed != null && user.id === booking.lender_id) {
    update.payment_confirmed = payment_confirmed
  }

  const { data: updated, error: updateErr } = await supabase
    .from('bookings')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Fire notifications based on new status
  const notifMap: Record<string, { userId: string; type: string; title: string; body: string }> = {
    accepted:  { userId: booking.borrower_id, type: 'booking_accepted',  title: 'Booking accepted!',  body: 'Your rental request has been accepted. Please make payment.' },
    rejected:  { userId: booking.borrower_id, type: 'booking_rejected',  title: 'Booking rejected',   body: lender_note ?? 'Your rental request was rejected.' },
    cancelled: { userId: booking.lender_id,   type: 'booking_cancelled', title: 'Booking cancelled',  body: 'A renter cancelled their booking request.' },
    completed: { userId: booking.borrower_id, type: 'rental_completed',  title: 'Rental completed',   body: 'Please leave a review for your experience.' },
  }

  if (newStatus && notifMap[newStatus]) {
    const n = notifMap[newStatus]
    await supabase.from('notifications').insert({
      user_id:    n.userId,
      type:       n.type,
      title:      n.title,
      body:       n.body,
      booking_id: id,
    })
  }

  return NextResponse.json({ booking: updated })
}
