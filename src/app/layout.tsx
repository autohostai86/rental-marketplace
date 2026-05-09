import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BORRO — Rent from your neighbours',
  description: 'Hyperlocal peer-to-peer rentals in Diamond District, Bangalore.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full bg-white text-black">{children}</body>
    </html>
  )
}
