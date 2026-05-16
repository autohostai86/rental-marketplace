'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, ITEM_CONDITIONS } from '@/types'
import type { Item } from '@/types'

interface PricingState {
  daily:   { enabled: boolean; price: string }
  weekly:  { enabled: boolean; price: string }
  monthly: { enabled: boolean; price: string }
}

export default function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [condition, setCondition] = useState<string>(ITEM_CONDITIONS[0].value)
  const [inventory, setInventory] = useState('1')
  const [addressHint, setAddressHint] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [pricing, setPricing] = useState<PricingState>({
    daily:   { enabled: true,  price: '' },
    weekly:  { enabled: false, price: '' },
    monthly: { enabled: false, price: '' },
  })

  useEffect(() => {
    fetch(`/api/items/${id}`)
      .then((r) => r.json())
      .then(({ item }: { item: Item }) => {
        if (!item) { router.replace('/profile'); return }
        setTitle(item.title)
        setDescription(item.description ?? '')
        setCategory(item.category)
        setCondition(item.condition)
        setInventory(String(item.inventory))
        setAddressHint(item.address_hint ?? '')
        setImages(item.images)
        setPricing({
          daily:   { enabled: item.price_daily   != null, price: String(item.price_daily   ?? '') },
          weekly:  { enabled: item.price_weekly  != null, price: String(item.price_weekly  ?? '') },
          monthly: { enabled: item.price_monthly != null, price: String(item.price_monthly ?? '') },
        })
        setLoading(false)
      })
  }, [id, router])

  async function uploadImage(file: File) {
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('itemId', id)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok || !data.publicUrl) { setError(data.error ?? 'Upload failed'); return }
      setImages((prev) => [...prev, data.publicUrl])
    } catch (e) {
      setError('Upload failed: ' + String(e))
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setError(null)
    if (!title.trim()) { setError('Title is required'); return }
    if (images.length === 0) { setError('At least one image is required'); return }
    const hasPricing = Object.values(pricing).some((p) => p.enabled && p.price)
    if (!hasPricing) { setError('At least one price is required'); return }

    setSaving(true)
    const res = await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, description, category, condition,
        inventory: parseInt(inventory) || 1,
        address_hint: addressHint,
        images,
        price_daily:   pricing.daily.enabled   && pricing.daily.price   ? parseFloat(pricing.daily.price)   : null,
        price_weekly:  pricing.weekly.enabled  && pricing.weekly.price  ? parseFloat(pricing.weekly.price)  : null,
        price_monthly: pricing.monthly.enabled && pricing.monthly.price ? parseFloat(pricing.monthly.price) : null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    router.push('/profile')
  }

  async function handleDelete() {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setDeleting(true)
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
    router.push('/profile')
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-black transition-colors">← Back</button>
        <h1 className="text-lg font-bold text-black">Edit Listing</h1>
        <button onClick={handleDelete} disabled={deleting} className="text-sm text-red-400 hover:text-red-600 transition-colors">
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">{error}</div>
      )}

      {/* Images */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Photos</label>
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors">
              <span className="text-2xl text-gray-300">{uploading ? '…' : '+'}</span>
              <span className="text-xs text-gray-300 mt-1">Add photo</span>
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f) }} />
            </label>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
        </Field>

        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input resize-none" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Condition">
            <select value={condition} onChange={(e) => setCondition(e.target.value)} className="input">
              {ITEM_CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Quantity available">
          <input type="number" min={1} value={inventory} onChange={(e) => setInventory(e.target.value)} className="input" />
        </Field>

        <Field label="Location hint">
          <input value={addressHint} onChange={(e) => setAddressHint(e.target.value)} placeholder="e.g. Near INOX, Diamond District" className="input" />
        </Field>
      </div>

      {/* Pricing */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pricing</label>
        <div className="space-y-2">
          {(Object.entries(pricing) as [keyof PricingState, PricingState[keyof PricingState]][]).map(([unit, val]) => (
            <div key={unit} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
              <input type="checkbox" id={`chk-${unit}`} checked={val.enabled}
                onChange={(e) => setPricing((p) => ({ ...p, [unit]: { ...p[unit], enabled: e.target.checked } }))}
                className="w-4 h-4" />
              <label htmlFor={`chk-${unit}`} className="text-sm font-medium text-gray-700 w-16 capitalize">{unit}</label>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input type="number" min={0} value={val.price} disabled={!val.enabled}
                  onChange={(e) => setPricing((p) => ({ ...p, [unit]: { ...p[unit], price: e.target.value } }))}
                  placeholder="0" className="input pl-7 disabled:bg-gray-50 disabled:text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  )
}
