import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { item_name } = await request.json()
  if (!item_name?.trim()) {
    return NextResponse.json({ error: 'Item name is required' }, { status: 400 })
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from('item_requests')
    .insert({ item_name: item_name.trim() })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
