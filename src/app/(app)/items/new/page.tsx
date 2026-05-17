'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, ITEM_CONDITIONS } from '@/types'

interface PricingState {
  daily:   { enabled: boolean; price: string }
  weekly:  { enabled: boolean; price: string }
  monthly: { enabled: boolean; price: string }
}

export default function NewItemPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [condition, setCondition] = useState<string>(ITEM_CONDITIONS[0].value)
  const [inventory, setInventory] = useState('1')
  const [addressHint, setAddressHint] = useState('')

  // Step 2
  const [isFree, setIsFree] = useState(false)
  const [pricing, setPricing] = useState<PricingState>({
    daily:   { enabled: true,  price: '' },
    weekly:  { enabled: false, price: '' },
    monthly: { enabled: false, price: '' },
  })

  // Step 3
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const itemId = useState(() => crypto.randomUUID())[0]

  async function uploadImage(file: File) {
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('itemId', itemId)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok || !data.publicUrl) {
        setError(data.error ?? 'Upload failed')
        return
      }
      setImages((prev) => [...prev, data.publicUrl])
    } catch (e) {
      setError('Upload failed: ' + String(e))
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    setError(null)
    if (images.length === 0) { setError('Please upload at least one image'); return }
    const hasPricing = isFree || Object.values(pricing).some(
      (p) => p.enabled && p.price !== '' && !isNaN(parseFloat(p.price))
    )
    if (!hasPricing) { setError('Please set at least one price'); return }

    setLoading(true)
    const body = {
      title, description, category, condition,
      inventory: parseInt(inventory) || 1,
      address_hint: addressHint,
      images,
      price_daily:   isFree ? 0 : (pricing.daily.enabled   && pricing.daily.price   !== '' ? parseFloat(pricing.daily.price)   : null),
      price_weekly:  isFree ? null : (pricing.weekly.enabled  && pricing.weekly.price  !== '' ? parseFloat(pricing.weekly.price)  : null),
      price_monthly: isFree ? null : (pricing.monthly.enabled && pricing.monthly.price !== '' ? parseFloat(pricing.monthly.price) : null),
    }

    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error); return }
    router.push('/profile')
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">List an Item</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`flex-1 h-0.5 w-8 ${step > s ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <span className="ml-2 text-sm text-gray-500">
          {step === 1 ? 'Details' : step === 2 ? 'Pricing' : 'Photos'}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="space-y-4">
          <Field label="Title *">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bosch Drill Machine"
              className="input"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe your item…"
              className="input resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category *">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Condition *">
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className="input">
                {ITEM_CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Quantity available *">
            <input
              type="number"
              min={1}
              value={inventory}
              onChange={(e) => setInventory(e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Location hint">
            <input
              value={addressHint}
              onChange={(e) => setAddressHint(e.target.value)}
              placeholder="e.g. Near INOX, Diamond District"
              className="input"
            />
          </Field>

          <button
            onClick={() => { if (!title.trim()) { setError('Title is required'); return } setError(null); setStep(2) }}
            className="btn-primary w-full"
          >
            Next: Pricing
          </button>
        </div>
      )}

      {/* Step 2: Pricing */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Select the durations you want to offer and set prices in ₹</p>

          {/* Free option */}
          <button
            type="button"
            onClick={() => setIsFree(!isFree)}
            className={`flex items-center justify-between w-full p-3 rounded-lg border transition-colors ${
              isFree ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-700'
            }`}
          >
            <span className="text-sm font-medium">Free</span>
            <span className={`text-xs ${isFree ? 'text-gray-300' : 'text-gray-400'}`}>
              {isFree ? 'No charge to borrow' : 'Lend at no cost'}
            </span>
          </button>

          {!isFree && (Object.entries(pricing) as [keyof PricingState, PricingState[keyof PricingState]][]).map(([unit, val]) => (
            <div key={unit} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                id={`chk-${unit}`}
                checked={val.enabled}
                onChange={(e) => setPricing((p) => ({ ...p, [unit]: { ...p[unit], enabled: e.target.checked } }))}
                className="w-4 h-4 text-indigo-600"
              />
              <label htmlFor={`chk-${unit}`} className="text-sm font-medium text-gray-700 w-16 capitalize">
                {unit}
              </label>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  min={0}
                  value={val.price}
                  disabled={!val.enabled}
                  onChange={(e) => setPricing((p) => ({ ...p, [unit]: { ...p[unit], price: e.target.value } }))}
                  placeholder="0"
                  className="input pl-7 disabled:bg-gray-50 disabled:text-gray-300"
                />
              </div>
            </div>
          ))}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
            <button onClick={() => { setError(null); setStep(3) }} className="btn-primary flex-1">Next: Photos</button>
          </div>
        </div>
      )}

      {/* Step 3: Images */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Add 1–5 photos of your item</p>

          <div className="grid grid-cols-3 gap-2">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
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
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors">
                <span className="text-2xl text-gray-300">{uploading ? '…' : '+'}</span>
                <span className="text-xs text-gray-400 mt-1">Add photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f) }}
                />
              </label>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
            <button
              onClick={handleSubmit}
              disabled={loading || uploading}
              className="btn-primary flex-1"
            >
              {loading ? 'Publishing…' : 'Publish Listing'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
