import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface BulkItem {
  title: string
  description?: string
  category: string
  condition: string
  inventory: number
  address_hint?: string
  price_daily?: number | null
  price_weekly?: number | null
  price_monthly?: number | null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { items }: { items: BulkItem[] } = await request.json()
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'No items provided' }, { status: 400 })
  }

  const results = await Promise.all(
    items.map(async (item) => {
      const { data, error } = await supabase
        .from('items')
        .insert({
          owner_id:      user.id,
          title:         item.title,
          description:   item.description || null,
          category:      item.category,
          condition:     item.condition,
          images:        [],
          inventory:     item.inventory ?? 1,
          price_daily:   item.price_daily   || null,
          price_weekly:  item.price_weekly  || null,
          price_monthly: item.price_monthly || null,
          locality:      'Diamond District',
          address_hint:  item.address_hint  || null,
          status:        'available',
        })
        .select('id, title')
        .single()

      return error
        ? { title: item.title, ok: false, error: error.message }
        : { title: data.title, ok: true, id: data.id }
    })
  )

  return NextResponse.json({ results }, { status: 201 })
}
