'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('job_seeker')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) return
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: username.trim(), role },
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Manually upsert profile so we don't depend solely on the DB trigger
    const userId = data.user?.id
    if (userId) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        username: username.trim(),
      }, { onConflict: 'id' })
      if (profileError) console.error('Profile upsert error on signup:', profileError)
    }

    if (data.session) {
      router.push('/')
    } else {
      alert('Check your email to confirm your account, then sign in.')
      router.push('/login')
    }

    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
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

  const roles = [
    { key: 'job_seeker',   label: 'Job Seeker'  },
    { key: 'recruiter',    label: 'Recruiter'    },
    { key: 'professional', label: 'Industry Pro' },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border2)',
        borderRadius: '16px', padding: '36px',
        width: '100%', maxWidth: '400px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: '22px', color: 'var(--text)',
            letterSpacing: '-0.5px', marginBottom: '6px',
          }}>
            HireSight<span style={{ color: 'var(--amber)' }}>.</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text3)' }}>Create your account</div>
        </div>

        {[
          { label: 'Username', type: 'text', val: username, set: (v: string) => setUsername(v.toLowerCase().replace(/\s/g, '')), placeholder: 'e.g. techrecruiter42' },
          { label: 'Email', type: 'email', val: email, set: setEmail, placeholder: 'you@example.com' },
          { label: 'Password', type: 'password', val: password, set: setPassword, placeholder: 'Min 6 characters' },
        ].map(f => (
          <div key={f.label}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px',
              color: 'var(--text3)', textTransform: 'uppercase',
              letterSpacing: '1px', marginBottom: '6px',
            }}>{f.label}</div>
            <input
              type={f.type}
              placeholder={f.placeholder}
              value={f.val}
              onChange={e => f.set(e.target.value)}
              style={f.label === 'Password' ? { ...inputStyle, marginBottom: '16px' } : inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        ))}

        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '10px',
          color: 'var(--text3)', textTransform: 'uppercase',
          letterSpacing: '1px', marginBottom: '8px',
        }}>I am a</div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {roles.map(r => (
            <button key={r.key} onClick={() => setRole(r.key)} style={{
              flex: 1, padding: '9px 4px', borderRadius: '8px',
              border: `1px solid ${role === r.key ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
              background: role === r.key ? 'var(--amber-dim)' : 'var(--bg3)',
              color: role === r.key ? 'var(--amber)' : 'var(--text3)',
              fontSize: '11px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font)',
            }}>{r.label}</button>
          ))}
        </div>

        {error && (
          <div style={{
            fontSize: '12px', color: 'var(--red)',
            background: 'var(--red-dim)',
            border: '1px solid rgba(244,63,94,0.2)',
            borderRadius: '8px', padding: '10px 14px',
            marginBottom: '14px', textAlign: 'center',
          }}>{error}</div>
        )}

        <button
          onClick={handleSignup}
          disabled={loading || !email || !password || !username}
          style={{
            width: '100%', background: 'var(--amber)', color: '#1a0e00',
            border: 'none', borderRadius: '8px', padding: '13px',
            fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-display)',
            cursor: loading || !email || !password || !username ? 'not-allowed' : 'pointer',
            opacity: loading || !email || !password || !username ? 0.5 : 1,
            marginBottom: '16px',
          }}
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text3)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--amber)', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}