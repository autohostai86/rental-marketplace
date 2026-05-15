'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatPrice, formatDurationUnit } from '@/lib/formatters'
import { getLowestPrice } from '@/lib/pricing'
import type { Profile, Item } from '@/types'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [upiId, setUpiId] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p) {
        setProfile(p as Profile)
        setFullName(p.full_name ?? '')
        setBio(p.bio ?? '')
        setUpiId(p.upi_id ?? '')
      }

      const { data: myItems } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', user.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })

      setItems((myItems ?? []) as Item[])
      setLoading(false)
    })
  }, [router])

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({
      full_name: fullName,
      bio,
      upi_id: upiId || null,
    }).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        <button onClick={signOut} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
          Sign out
        </button>
      </div>

      {/* Avatar + phone */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
          {fullName?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{fullName || 'Your Name'}</p>
          <p className="text-sm text-gray-400">{profile?.phone}</p>
          {profile?.avg_rating != null && (
            <p className="text-xs text-gray-400">★ {profile.avg_rating.toFixed(1)} · {profile.total_reviews} reviews</p>
          )}
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Edit Profile</p>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input w-full"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            className="input w-full resize-none"
            placeholder="Tell renters a bit about yourself"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">UPI ID (for receiving payments)</label>
          <input
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className="input w-full"
            placeholder="yourname@upi"
          />
        </div>

        <button
          onClick={saveProfile}
          disabled={saving}
          className={`btn-primary w-full ${saved ? 'bg-green-600 hover:bg-green-600' : ''}`}
        >
          {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* My listings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">My Listings ({items.length})</p>
          <div className="flex gap-3">
            <Link href="/items/bulk" className="text-sm text-gray-400 hover:text-black font-medium transition-colors">Bulk upload</Link>
            <Link href="/items/new" className="text-sm text-indigo-600 font-medium">+ Add item</Link>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No listings yet</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const lowest = getLowestPrice(item)
              return (
                <Link key={item.id} href={`/items/${item.id}/edit`}
                  className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 hover:shadow-sm transition-shadow">
                  {item.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    {lowest && (
                      <p className="text-xs text-indigo-600 mt-0.5">
                        from {formatPrice(lowest.price)}{formatDurationUnit(lowest.unit)}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.inventory}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                    item.status === 'available'  ? 'bg-green-100 text-green-700'  :
                    item.status === 'rented_out' ? 'bg-red-100 text-red-600'     :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {item.status === 'rented_out' ? 'Rented' : item.status}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
}
