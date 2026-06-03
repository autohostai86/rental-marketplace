import Logo from '@/components/Logo'
import RequestForm from '@/components/RequestForm'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, formatDurationUnit } from '@/lib/formatters'
import { getLowestPrice } from '@/lib/pricing'
import type { Item } from '@/types'
import { CATEGORIES } from '@/types'

function ItemCard({ item }: { item: Item }) {
  const lowest = getLowestPrice(item)
  return (
    <Link
      href={`/items/${item.id}`}
      className="w-40 shrink-0 bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-300 transition-colors group"
    >
      <div className="aspect-square bg-gray-50">
        {item.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.images[0]} alt={item.title} className="w-full h-full object-contain group-hover:opacity-90 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">📦</div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-black truncate">{item.title}</p>
        {lowest != null && (
          <p className="text-xs mt-0.5">
            {lowest.price === 0
              ? <span className="text-green-600 font-medium">Free</span>
              : <span className="text-gray-500">from {formatPrice(lowest.price)}<span className="text-gray-400">{formatDurationUnit(lowest.unit)}</span></span>
            }
          </p>
        )}
      </div>
    </Link>
  )
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from('items')
    .select('*, owner:profiles(id, full_name)')
    .eq('status', 'available')
    .order('category')
    .order('created_at', { ascending: false })
    .limit(100)

  const items = (raw ?? []) as Item[]
  const byCategory = CATEGORIES.reduce<Record<string, Item[]>>((acc, cat) => {
    const catItems = items.filter(i => i.category === cat).slice(0, 6)
    if (catItems.length > 0) acc[cat] = catItems
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo className="h-8 w-auto" />
          <div className="flex gap-2 items-center">
            <Link href="/browse" className="text-sm text-gray-500 hover:text-black px-3 py-1.5 transition-colors">Browse</Link>
            <Link href="/login" className="btn-primary text-sm py-1.5 px-4 rounded-full">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-black text-white px-4 py-20 text-center">
        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4">Diamond District, Bangalore</p>
        <h1 className="text-4xl font-black tracking-tight leading-tight">Rent anything.<br/>From neighbours<br/>IN 20 MINUTES</h1>
        <p className="mt-4 text-gray-400 max-w-xs mx-auto text-sm">
          Drills, toys, gadgets and more — by the hour, day, or week.
        </p>
        <Link href="/browse" className="mt-8 inline-block bg-white text-black font-semibold px-8 py-3 rounded-full text-sm hover:bg-gray-100 transition-colors">
          Browse Items
        </Link>
      </section>

      {/* Categories */}
      <section className="max-w-4xl mx-auto px-4 pt-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Categories</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/browse?category=${encodeURIComponent(cat)}`}
              className="shrink-0 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-full hover:border-black hover:text-black transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Listings by category */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        {Object.keys(byCategory).length === 0 ? (
          <p className="text-center text-gray-300 py-16 text-sm">No listings yet — be the first!</p>
        ) : (
          Object.entries(byCategory).map(([category, catItems]) => (
            <div key={category} className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-black">{category}</p>
                <Link
                  href={`/browse?category=${encodeURIComponent(category)}`}
                  className="text-xs text-gray-400 hover:text-black transition-colors"
                >
                  See all →
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
                {catItems.map(item => <ItemCard key={item.id} item={item} />)}
              </div>
            </div>
          ))
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 px-4 py-16 text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">For owners</p>
        <h2 className="text-2xl font-black text-black tracking-tight">Have something to lend?</h2>
        <p className="text-sm text-gray-400 mt-2">Earn from idle items in your home</p>
        <Link href="/login" className="mt-6 inline-block btn-primary px-8 rounded-full">
          Start lending
        </Link>
        <p className="text-base font-semibold text-gray-500 mt-10">Unable to find what you are looking for?</p>
        <RequestForm />
      </section>
    </div>
  )
}
