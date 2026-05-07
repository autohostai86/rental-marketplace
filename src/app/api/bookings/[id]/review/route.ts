import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rating, comment } = await request.json()
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .or(`borrower_id.eq.${user.id},lender_id.eq.${user.id}`)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.status !== 'completed') return NextResponse.json({ error: 'Can only review completed bookings' }, { status: 400 })

  const isBorrower = user.id === booking.borrower_id
  const revieweeId = isBorrower ? booking.lender_id : booking.borrower_id

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      booking_id:  bookingId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      item_id:     isBorrower ? booking.item_id : null,
      role:        isBorrower ? 'borrower' : 'lender',
      rating,
      comment: comment ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already reviewed' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify reviewee
  await supabase.from('notifications').insert({
    user_id:    revieweeId,
    type:       'review_received',
    title:      'You received a review',
    body:       `Someone left you a ${rating}-star review`,
    booking_id: bookingId,
  })

  return NextResponse.json({ review: data }, { status: 201 })
}
