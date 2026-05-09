import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BORRO — Rent from your neighbours',
  description: 'Hyperlocal peer-to-peer rentals in Diamond District, Bangalore.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-white text-black">{children}</body>
    </html>
  )
}
