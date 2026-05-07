import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId, fileName, contentType } = await request.json()
  if (!itemId || !fileName || !contentType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const ext = fileName.split('.').pop()
  const path = `${user.id}/${itemId}/${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from('item-images')
    .createSignedUploadUrl(path)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const publicUrl = supabase.storage.from('item-images').getPublicUrl(path).data.publicUrl

  return NextResponse.json({ signedUrl: data.signedUrl, path, publicUrl })
}
