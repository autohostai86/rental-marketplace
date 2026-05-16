import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const category = searchParams.get('category')
  const duration = searchParams.get('duration_unit')
  const q        = searchParams.get('q')
  const minPrice = searchParams.get('min_price')
  const maxPrice = searchParams.get('max_price')
  const ownerId  = searchParams.get('owner_id')

  let query = supabase
    .from('items')
    .select('*, owner:profiles(id, full_name, avatar_url, avg_rating, locality)')
    .in('status', ['available', 'rented_out'])
    .order('created_at', { ascending: false })
    .limit(40)

  if (category)  query = query.eq('category', category)
  if (ownerId)   query = query.eq('owner_id', ownerId)
  if (q)         query = query.ilike('title', `%${q}%`)

  if (duration === 'daily')   query = query.not('price_daily',   'is', null)
  if (duration === 'weekly')  query = query.not('price_weekly',  'is', null)
  if (duration === 'monthly') query = query.not('price_monthly', 'is', null)

  if (minPrice) {
    query = query.or(
      `price_daily.gte.${minPrice},price_weekly.gte.${minPrice},price_monthly.gte.${minPrice}`
    )
  }
  if (maxPrice) {
    query = query.or(
      `price_daily.lte.${maxPrice},price_weekly.lte.${maxPrice},price_monthly.lte.${maxPrice}`
    )
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ items: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    title, description, category, condition, images,
    inventory, price_daily, price_weekly, price_monthly,
    locality, address_hint,
  } = body

  if (!title || !category || !images?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!price_daily && !price_weekly && !price_monthly) {
    return NextResponse.json({ error: 'At least one price is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('items')
    .insert({
      owner_id: user.id,
      title, description, category, condition,
      images, inventory: inventory ?? 1,
      price_daily:   price_daily   || null,
      price_weekly:  price_weekly  || null,
      price_monthly: price_monthly || null,
      locality: locality ?? 'Diamond District',
      address_hint,
      status: 'available',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data }, { status: 201 })
}
