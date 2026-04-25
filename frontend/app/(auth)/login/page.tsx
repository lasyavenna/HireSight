'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/')
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', display: 'block',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text)',
    fontFamily: 'var(--font)',
    fontSize: '13px',
    padding: '11px 14px',
    marginBottom: '10px',
    outline: 'none',
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border2)',
        borderRadius: '16px',
        padding: '36px',
        width: '100%', maxWidth: '380px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: '22px', color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: '6px',
          }}>
            HireSight<span style={{ color: 'var(--amber)' }}>.</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text3)' }}>Welcome back</div>
        </div>

        <input
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle as any}
          onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ ...inputStyle as any, marginBottom: '16px' }}
          onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />

        {error && (
          <div style={{ fontSize: '12px', color: 'var(--red)', marginBottom: '12px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          style={{
            width: '100%', background: 'var(--amber)', color: '#1a0e00',
            border: 'none', borderRadius: '8px', padding: '12px',
            fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-display)',
            cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
            opacity: loading || !email || !password ? 0.5 : 1,
            marginBottom: '16px',
          }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text3)' }}>
          No account?{' '}
          <Link href="/signup" style={{ color: 'var(--amber)', textDecoration: 'none', fontWeight: 600 }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}