import type { Metadata } from 'next'
import { Space_Mono, Inter } from 'next/font/google'
import './globals.css'

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'snub.io - ignore the noise, on purpose',
  description: 'Intentional signal filtering and focus amplification. Treat attention as the scarce resource it is.',
  keywords: ['focus', 'attention', 'productivity', 'signal', 'noise filtering'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${spaceMono.variable} ${inter.variable}`}>
      <body className="bg-void-black text-gray-100 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
