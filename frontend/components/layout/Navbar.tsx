'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const tabs = [
    { label: 'Community', href: '/' },
    { label: 'Analyze a Job', href: '/ghost-detector' },
    { label: 'Live Interview', href: '/live-interview' },
    { label: 'Ghost Exposé', href: '/ghost-expose' },
  ]

  return (
    <nav style={{
      background: 'var(--bg2)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      height: '56px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link href="/" style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: '20px',
        color: 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginRight: '32px',
        textDecoration: 'none',
        letterSpacing: '-0.5px',
        flexShrink: 0,
      }}>
        HireSight<span style={{ color: 'var(--amber)' }}>.</span>
        <span style={{
          fontSize: '9px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 500,
          background: 'var(--amber-dim)',
          color: 'var(--amber)',
          padding: '2px 6px',
          borderRadius: '4px',
          border: '1px solid rgba(245,158,11,0.25)',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>Beta</span>
      </Link>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', flex: 1, overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                fontFamily: 'var(--font)',
                fontSize: '13px',
                fontWeight: 500,
                padding: '6px 16px',
                borderRadius: '8px',
                background: isActive ? 'var(--amber-dim)' : 'none',
                color: isActive ? 'var(--amber)' : 'var(--text2)',
                textDecoration: 'none',
                transition: 'all 0.15s',
                letterSpacing: '0.1px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
        {user ? (
          <>
            <span style={{ fontSize: '13px', color: 'var(--text2)' }}>
              {user.email?.split('@')[0]}
            </span>
            <button
              onClick={handleSignOut}
              style={{
                fontFamily: 'var(--font)',
                fontSize: '13px',
                fontWeight: 500,
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border2)',
                background: 'none',
                color: 'var(--text2)',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={{
              fontFamily: 'var(--font)',
              fontSize: '13px',
              fontWeight: 500,
              padding: '7px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border2)',
              background: 'none',
              color: 'var(--text2)',
              textDecoration: 'none',
            }}>
              Sign In
            </Link>
            <Link href="/signup" style={{
              fontFamily: 'var(--font)',
              fontSize: '13px',
              fontWeight: 600,
              padding: '7px 16px',
              borderRadius: '8px',
              background: 'var(--amber)',
              color: '#1a0e00',
              textDecoration: 'none',
            }}>
              Post Experience
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
