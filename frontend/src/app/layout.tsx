import type { Metadata } from 'next'
import '@superdoc-dev/react/style.css'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Drafter - Production-Grade AI Document Platform',
  description: 'Lossless DOCX editing and intelligent real-time document drafting',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
