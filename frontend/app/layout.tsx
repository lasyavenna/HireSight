import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HireSight — Applicant Intelligence',
  description: 'Resume-aware job analysis and interview coaching for applicants',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
