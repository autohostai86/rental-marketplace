import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, formatDurationUnit } from '@/lib/formatters'
import { getLowestPrice } from '@/lib/pricing'
import type { Item } from '@/types'
import { CATEGORIES } from '@/types'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: items } = await supabase
    .from('items')
    .select('*, owner:profiles(id, full_name)')
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(12)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-indigo-600 font-bold text-lg">RentLocal</span>
          <div className="flex gap-2">
            <Link href="/browse" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">Browse</Link>
            <Link href="/login" className="btn-primary text-sm py-1.5 px-4">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-indigo-600 text-white px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Rent anything from your neighbours</h1>
        <p className="mt-3 text-indigo-200 max-w-sm mx-auto">
          Hyperlocal rentals in Diamond District, Bangalore. Drills, toys, gadgets and more — by the hour, day, or week.
        </p>
        <Link href="/browse" className="mt-6 inline-block bg-white text-indigo-700 font-semibold px-6 py-3 rounded-full hover:bg-indigo-50 transition-colors">
          Browse Items
        </Link>
      </section>

      {/* Categories */}
      <section className="max-w-4xl mx-auto px-4 pt-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Categories</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/browse?category=${encodeURIComponent(cat)}`}
              className="shrink-0 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-full hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Recent listings */}
      <section className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Available now</h2>
          <Link href="/browse" className="text-sm text-indigo-600 hover:underline">See all →</Link>
        </div>

        {!items?.length ? (
          <p className="text-center text-gray-400 py-12 text-sm">No listings yet — be the first!</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item) => {
              const lowest = getLowestPrice(item as Item)
              return (
                <Link key={item.id} href={`/items/${item.id}`} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100">
                    {item.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">📦</div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    {lowest && (
                      <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                        from {formatPrice(lowest.price)}
                        <span className="text-gray-400 font-normal">{formatDurationUnit(lowest.unit)}</span>
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-indigo-50 border-t border-indigo-100 px-4 py-12 text-center mt-4">
        <h2 className="text-xl font-bold text-gray-900">Have something to lend?</h2>
        <p className="text-sm text-gray-500 mt-2">List your idle items and earn money from your community</p>
        <Link href="/login" className="mt-5 inline-block btn-primary px-8">
          Start lending
        </Link>
      </section>
    </div>
  )
}
