'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Bell, User } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 bg-zinc-900 border-b border-zinc-800 px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-bold text-violet-400 text-lg">CareerIntel</Link>
        <div className="flex gap-1">
          <Link
            href="/"
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${pathname === '/' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Feed
          </Link>
          <Link
            href="/ghost-detector"
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${pathname === '/ghost-detector' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Ghost Detector
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            placeholder="Search posts..."
            className="bg-zinc-800 border border-zinc-700 rounded-full pl-9 pr-4 py-2 text-sm w-56 focus:outline-none focus:border-violet-500"
          />
        </div>
        <Link href="/login" className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4 py-1.5 rounded-full font-medium transition-colors">
          Sign In
        </Link>
      </div>
    </nav>
  )
}