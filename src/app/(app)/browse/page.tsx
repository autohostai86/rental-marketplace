import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPrice, formatDurationUnit } from '@/lib/formatters'
import { getLowestPrice } from '@/lib/pricing'
import type { Item } from '@/types'
import { CATEGORIES } from '@/types'

interface SearchParams {
  q?: string
  category?: string
  duration_unit?: string
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('items')
    .select('*, owner:profiles(id, full_name, avg_rating)')
    .in('status', ['available', 'rented_out'])
    .order('created_at', { ascending: false })
    .limit(40)

  if (sp.q)             query = query.ilike('title', `%${sp.q}%`)
  if (sp.category)      query = query.eq('category', sp.category)
  if (sp.duration_unit === 'daily')   query = query.not('price_daily',   'is', null)
  if (sp.duration_unit === 'weekly')  query = query.not('price_weekly',  'is', null)
  if (sp.duration_unit === 'monthly') query = query.not('price_monthly', 'is', null)

  const { data: items } = await query

  return (
    <div className="px-4 py-4">
      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <Pill label="All" href="/browse" active={!sp.category} />
        {CATEGORIES.map((cat) => (
          <Pill
            key={cat}
            label={cat}
            href={`/browse?category=${encodeURIComponent(cat)}${sp.q ? `&q=${sp.q}` : ''}`}
            active={sp.category === cat}
          />
        ))}
      </div>

      {/* Duration filter */}
      <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { label: 'Any',     value: '' },
          { label: 'Daily',   value: 'daily'   },
          { label: 'Weekly',  value: 'weekly'  },
          { label: 'Monthly', value: 'monthly' },
        ].map(({ label, value }) => {
          const active = (sp.duration_unit ?? '') === value
          const params = new URLSearchParams()
          if (sp.q) params.set('q', sp.q)
          if (sp.category) params.set('category', sp.category)
          if (value) params.set('duration_unit', value)
          return (
            <Link
              key={value}
              href={`/browse?${params.toString()}`}
              className={`shrink-0 px-3 py-1 text-xs rounded-full border transition-colors ${
                active
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* Results */}
      <div className="mt-4">
        {!items?.length ? (
          <p className="text-center text-gray-300 py-16 text-sm">No items found</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item as Item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Pill({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
        active
          ? 'bg-black text-white border-black'
          : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'
      }`}
    >
      {label}
    </Link>
  )
}

function ItemCard({ item }: { item: Item }) {
  const lowest = getLowestPrice(item)
  const isRentedOut = item.status === 'rented_out'

  return (
    <Link href={`/items/${item.id}`} className="block bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-300 transition-colors group">
      <div className="relative aspect-square bg-gray-50">
        {item.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200 text-3xl">📦</div>
        )}
        {isRentedOut && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-wide uppercase">Rented Out</span>
          </div>
        )}
        <span className="absolute top-2 left-2 bg-white text-gray-600 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-gray-100">
          {item.category}
        </span>
      </div>
      <div className="p-2.5">
        <p className="text-sm font-medium text-black truncate">{item.title}</p>
        {lowest != null && (
          <p className="text-xs mt-0.5">
            {lowest.price === 0
              ? <span className="text-green-600 font-medium">Free</span>
              : <span className="text-gray-500">from {formatPrice(lowest.price)}<span className="text-gray-400">{formatDurationUnit(lowest.unit)}</span></span>
            }
          </p>
        )}
        {item.avg_rating != null && (
          <p className="text-xs text-gray-400 mt-0.5">★ {item.avg_rating.toFixed(1)}</p>
        )}
      </div>
    </Link>
  )
}
