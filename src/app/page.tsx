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
    .limit(8)

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <span style={{ fontFamily: 'var(--font-display)' }} className="text-black font-black text-xl tracking-tight">BORRO</span>
          <div className="flex gap-3 items-center">
            <Link href="/browse" className="text-sm text-gray-500 hover:text-black transition-colors">Browse</Link>
            <Link href="/login" className="btn-primary text-sm py-2 px-5 rounded-full">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 pt-16 pb-12">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Diamond District · Bangalore</span>
          <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-5xl sm:text-7xl font-black text-black leading-[0.95] tracking-tight mt-2">
            Borrow<br />
            <span className="italic font-normal">anything</span><br />
            nearby.
          </h1>
          <p className="text-gray-400 text-base mt-5 max-w-xs leading-relaxed">
            Rent drills, toys, gadgets & more from neighbours — by the hour, day or week.
          </p>
          <div className="flex gap-3 mt-6">
            <Link href="/login" className="btn-primary px-7 py-3 rounded-full text-sm">Start renting</Link>
            <Link href="/browse" className="btn-secondary px-7 py-3 rounded-full text-sm">Browse items</Link>
          </div>
        </div>

        {/* Marquee strip */}
        <div className="mt-12 overflow-hidden border-y border-gray-100 py-3">
          <div className="flex gap-8 animate-marquee whitespace-nowrap" style={{ animation: 'marquee 20s linear infinite' }}>
            {[...CATEGORIES, ...CATEGORIES].map((cat, i) => (
              <span key={i} className="text-xs font-medium text-gray-300 tracking-widest uppercase shrink-0">
                {cat} ·
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Categories grid */}
      <section className="max-w-5xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <span style={{ fontFamily: 'var(--font-display)' }} className="text-xs font-bold tracking-widest text-gray-400 uppercase">Categories</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/browse?category=${encodeURIComponent(cat)}`}
              className="shrink-0 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-full hover:bg-black hover:text-white hover:border-black transition-all duration-200"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Listings */}
      <section className="max-w-5xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-5">
          <span style={{ fontFamily: 'var(--font-display)' }} className="text-xs font-bold tracking-widest text-gray-400 uppercase">Available now</span>
          <Link href="/browse" className="text-xs text-gray-400 hover:text-black transition-colors">See all →</Link>
        </div>

        {!items?.length ? (
          <div className="border border-dashed border-gray-200 rounded-2xl py-20 text-center">
            <p className="text-gray-300 text-sm">No listings yet — be the first!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {items.map((item) => {
              const lowest = getLowestPrice(item as Item)
              return (
                <Link key={item.id} href={`/items/${item.id}`} className="group block card-hover">
                  <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2.5">
                    {item.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl text-gray-200">📦</div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-black truncate leading-tight">{item.title}</p>
                  {lowest && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatPrice(lowest.price)}<span className="text-gray-300">{formatDurationUnit(lowest.unit)}</span>
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-5 py-12 mt-4">
        <div className="border border-gray-100 rounded-2xl p-8">
          <span style={{ fontFamily: 'var(--font-display)' }} className="text-xs font-bold tracking-widest text-gray-400 uppercase">How it works</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-6">
            {[
              { num: '01', title: 'Browse & book', desc: 'Find what you need from neighbours nearby' },
              { num: '02', title: 'Pay & pickup', desc: 'Pay via UPI and pick up from the owner' },
              { num: '03', title: 'Return & review', desc: 'Return when done and leave a review' },
            ].map((s) => (
              <div key={s.num}>
                <span style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-black text-gray-100">{s.num}</span>
                <p className="text-sm font-semibold text-black mt-2">{s.title}</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-5 py-8 pb-20">
        <div className="bg-black rounded-2xl px-8 py-10 text-center">
          <span style={{ fontFamily: 'var(--font-display)' }} className="text-xs font-bold tracking-widest text-gray-500 uppercase">For owners</span>
          <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-black text-white mt-3 tracking-tight">
            Your stuff is<br />
            <span className="italic font-normal">earning nothing.</span>
          </h2>
          <p className="text-gray-400 text-sm mt-3">List your idle items and earn from your community</p>
          <Link href="/login" className="mt-6 inline-block bg-white text-black font-medium text-sm px-8 py-3 rounded-full hover:bg-gray-100 transition-colors">
            Start lending →
          </Link>
        </div>
      </section>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
