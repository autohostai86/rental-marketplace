'use client'

import { useState } from 'react'

export default function RequestForm() {
  const [value, setValue] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setState('loading')
    await fetch('/api/item-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_name: value }),
    })
    setState('done')
  }

  if (state === 'done') return (
    <p className="text-sm text-green-500 mt-6">Thanks! We&apos;ll look out for it.</p>
  )

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2 max-w-sm mx-auto">
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="What are you looking for?"
        className="input flex-1 text-sm"
      />
      <button
        type="submit"
        disabled={state === 'loading'}
        className="btn-primary px-4 rounded-full text-sm shrink-0"
      >
        {state === 'loading' ? '…' : 'Submit'}
      </button>
    </form>
  )
}
