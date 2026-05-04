import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FOOD4ALL — Waste Less, Save More',
  description: 'Davao City\'s marketplace for discounted bulk processed foods. Buy and sell near-expiry packaged goods at unbeatable prices. Pick-up only.',
  generator: 'v0.app',
  keywords: ['food', 'bulk food', 'Davao City', 'discounted food', 'marketplace', 'hotdogs', 'frozen food'],
  authors: [{ name: 'FOOD4ALL' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#38a8e8',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased h-[100dvh] sm:h-auto sm:min-h-screen overflow-hidden sm:overflow-auto">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
