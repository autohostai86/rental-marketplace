import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateEndDatetime, calculateTotalPrice, getPriceForUnit } from '@/lib/pricing'
import type { DurationUnit } from '@/types'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role') // 'borrower' | 'lender'

  const field = role === 'lender' ? 'lender_id' : 'borrower_id'
  const { data, error } = await supabase
    .from('bookings')
    .select('*, item:items(id, title, images, category), borrower:profiles!bookings_borrower_id_fkey(id, full_name, avatar_url), lender:profiles!bookings_lender_id_fkey(id, full_name, avatar_url, upi_id)')
    .eq(field, user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bookings: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { item_id, duration_unit, duration_count, start_datetime, borrower_note } = body

  if (!item_id || !duration_unit || !duration_count || !start_datetime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Fetch item to validate and get price
  const { data: item, error: itemErr } = await supabase
    .from('items')
    .select('*, owner:profiles(id)')
    .eq('id', item_id)
    .single()

  if (itemErr || !item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  if (item.status === 'rented_out') return NextResponse.json({ error: 'Item is currently rented out' }, { status: 409 })
  if (item.status !== 'available') return NextResponse.json({ error: 'Item is not available' }, { status: 409 })
  if (item.owner_id === user.id) return NextResponse.json({ error: 'Cannot book your own item' }, { status: 400 })
  if (item.inventory < 1) return NextResponse.json({ error: 'Item is out of stock' }, { status: 409 })

  const pricePerUnit = getPriceForUnit(item, duration_unit as DurationUnit)
  if (pricePerUnit == null) return NextResponse.json({ error: `Item does not support ${duration_unit} pricing` }, { status: 400 })

  const start = new Date(start_datetime)
  const end   = calculateEndDatetime(start, duration_unit as DurationUnit, duration_count)
  const total = calculateTotalPrice(pricePerUnit, duration_count)

  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .insert({
      item_id,
      borrower_id:    user.id,
      lender_id:      item.owner_id,
      duration_unit,
      duration_count,
      start_datetime: start.toISOString(),
      end_datetime:   end.toISOString(),
      price_per_unit: pricePerUnit,
      total_price:    total,
      borrower_note:  borrower_note ?? null,
      status:         'pending',
    })
    .select()
    .single()

  if (bookingErr) return NextResponse.json({ error: bookingErr.message }, { status: 500 })

  // Create notifications for both parties
  await supabase.from('notifications').insert([
    {
      user_id:    item.owner_id,
      type:       'booking_request',
      title:      'New booking request',
      body:       `Someone wants to rent "${item.title}"`,
      booking_id: booking.id,
      item_id:    item.id,
    },
  ])

  return NextResponse.json({ booking }, { status: 201 })
}
