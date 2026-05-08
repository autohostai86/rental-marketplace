import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const itemId = formData.get('itemId') as string | null

  if (!file || !itemId) {
    return NextResponse.json({ error: 'Missing file or itemId' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const path = `${user.id}/${itemId}/${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error } = await supabase.storage
    .from('item-images')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('item-images')
    .getPublicUrl(path)

  return NextResponse.json({ publicUrl })
}
