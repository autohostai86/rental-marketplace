import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RentLocal — Hyperlocal Rentals',
  description: 'Rent anything from your neighbours in Diamond District, Bangalore.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
