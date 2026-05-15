'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, ITEM_CONDITIONS } from '@/types'

const VALID_CATEGORIES = CATEGORIES as readonly string[]
const VALID_CONDITIONS: string[] = ITEM_CONDITIONS.map(c => c.value)

const CSV_HEADERS = [
  'title', 'description', 'category', 'condition',
  'inventory', 'address_hint',
  'price_hourly', 'price_daily', 'price_weekly', 'price_monthly',
]

const TEMPLATE_ROW = [
  'Bosch Drill', 'Corded drill in good condition', 'Hardware Tools', 'good',
  '1', 'Near INOX',
  '', '150', '', '',
]

interface ParsedRow {
  title: string
  description: string
  category: string
  condition: string
  inventory: number
  address_hint: string
  price_hourly: number | null
  price_daily: number | null
  price_weekly: number | null
  price_monthly: number | null
  _errors: string[]
}

interface UploadResult {
  title: string
  ok: boolean
  error?: string
  id?: string
}

function parseCSV(text: string): string[][] {
  return text.trim().split('\n').map(line => {
    const cols: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQuotes = !inQuotes }
      else if (ch === ',' && !inQuotes) { cols.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    cols.push(cur.trim())
    return cols
  })
}

function validateRow(cols: string[], headers: string[]): ParsedRow {
  const get = (name: string) => cols[headers.indexOf(name)]?.trim() ?? ''
  const errors: string[] = []

  const title = get('title')
  const category = get('category')
  const condition = get('condition')
  const inventoryRaw = get('inventory')
  const inventory = parseInt(inventoryRaw) || 1

  const price_hourly  = parseFloat(get('price_hourly'))  || null
  const price_daily   = parseFloat(get('price_daily'))   || null
  const price_weekly  = parseFloat(get('price_weekly'))  || null
  const price_monthly = parseFloat(get('price_monthly')) || null

  if (!title) errors.push('Title required')
  if (!VALID_CATEGORIES.includes(category)) errors.push(`Invalid category: "${category}"`)
  if (!VALID_CONDITIONS.includes(condition)) errors.push(`Invalid condition: "${condition}"`)
  if (!price_hourly && !price_daily && !price_weekly && !price_monthly) errors.push('At least one price required')

  return {
    title, description: get('description'), category, condition,
    inventory, address_hint: get('address_hint'),
    price_hourly, price_daily, price_weekly, price_monthly,
    _errors: errors,
  }
}

function downloadTemplate() {
  const csv = [CSV_HEADERS.join(','), TEMPLATE_ROW.join(',')].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'borro_bulk_template.csv'
  a.click()
}

export default function BulkUploadPage() {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [results, setResults] = useState<UploadResult[]>([])
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFile(file: File) {
    setFileName(file.name)
    setResults([])
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length < 2) { setRows([]); return }
      const headers = parsed[0].map(h => h.toLowerCase().replace(/\s+/g, '_'))
      const dataRows = parsed.slice(1).filter(r => r.some(c => c))
      setRows(dataRows.map(r => validateRow(r, headers)))
    }
    reader.readAsText(file)
  }

  const validRows = rows.filter(r => r._errors.length === 0)
  const hasErrors = rows.some(r => r._errors.length > 0)

  async function handleUpload() {
    if (!validRows.length) return
    setLoading(true)
    const res = await fetch('/api/items/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: validRows }),
    })
    const data = await res.json()
    setLoading(false)
    setResults(data.results ?? [])
  }

  const successCount = results.filter(r => r.ok).length
  const failCount = results.filter(r => !r.ok).length

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-black transition-colors text-sm">← Back</button>
        <h1 className="text-xl font-bold text-gray-900">Bulk Upload Items</h1>
      </div>

      {/* Step 1: Download template */}
      <div className="border border-gray-200 rounded-xl p-5 mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-1">Step 1 — Download the template</p>
        <p className="text-xs text-gray-400 mb-3">Fill it in with your items, then upload below. Images can be added later.</p>
        <button onClick={downloadTemplate} className="btn-secondary text-sm px-4 py-2 rounded-lg">
          Download CSV Template
        </button>
        <div className="mt-3 text-xs text-gray-400 space-y-0.5">
          <p><span className="font-medium text-gray-600">Categories:</span> {CATEGORIES.join(', ')}</p>
          <p><span className="font-medium text-gray-600">Conditions:</span> new, like_new, good, fair</p>
        </div>
      </div>

      {/* Step 2: Upload */}
      <div className="border border-gray-200 rounded-xl p-5 mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-1">Step 2 — Upload your CSV</p>
        <div
          className="mt-2 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-black transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <p className="text-sm text-gray-400">{fileName || 'Click to choose a CSV file'}</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      </div>

      {/* Preview table */}
      {rows.length > 0 && results.length === 0 && (
        <div className="border border-gray-200 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">
              Preview — {rows.length} row{rows.length !== 1 ? 's' : ''} found
              {hasErrors && <span className="ml-2 text-red-500 font-normal">({rows.filter(r => r._errors.length).length} with errors — will be skipped)</span>}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 text-gray-500 font-medium pr-3">Title</th>
                  <th className="text-left pb-2 text-gray-500 font-medium pr-3">Category</th>
                  <th className="text-left pb-2 text-gray-500 font-medium pr-3">Condition</th>
                  <th className="text-left pb-2 text-gray-500 font-medium pr-3">Qty</th>
                  <th className="text-left pb-2 text-gray-500 font-medium pr-3">Daily ₹</th>
                  <th className="text-left pb-2 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-50 ${row._errors.length ? 'opacity-50' : ''}`}>
                    <td className="py-1.5 pr-3 font-medium text-gray-800">{row.title || '—'}</td>
                    <td className="py-1.5 pr-3 text-gray-500">{row.category || '—'}</td>
                    <td className="py-1.5 pr-3 text-gray-500">{row.condition || '—'}</td>
                    <td className="py-1.5 pr-3 text-gray-500">{row.inventory}</td>
                    <td className="py-1.5 pr-3 text-gray-500">{row.price_daily ?? '—'}</td>
                    <td className="py-1.5">
                      {row._errors.length
                        ? <span className="text-red-500">{row._errors[0]}</span>
                        : <span className="text-green-600">Ready</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {validRows.length > 0 && (
            <button
              onClick={handleUpload}
              disabled={loading}
              className="btn-primary w-full mt-4 rounded-lg"
            >
              {loading ? 'Uploading…' : `Upload ${validRows.length} item${validRows.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Done — <span className="text-green-600">{successCount} uploaded</span>
            {failCount > 0 && <span className="text-red-500 ml-2">{failCount} failed</span>}
          </p>
          <div className="space-y-1.5">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={r.ok ? 'text-green-500' : 'text-red-500'}>{r.ok ? '✓' : '✗'}</span>
                <span className="text-gray-700">{r.title}</span>
                {r.error && <span className="text-red-400">— {r.error}</span>}
              </div>
            ))}
          </div>
          {successCount > 0 && (
            <button onClick={() => router.push('/lend')} className="btn-primary w-full mt-4 rounded-lg text-sm">
              View your listings
            </button>
          )}
        </div>
      )}
    </div>
  )
}
