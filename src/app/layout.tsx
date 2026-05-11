import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Quikly — Get help today',
  description: 'On-demand local jobs. Flat-rate quotes. Paid when done.',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Quikly' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f0f0f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0f0f0f] text-white antialiased overscroll-none">
        {children}
      </body>
    </html>
  )
}
