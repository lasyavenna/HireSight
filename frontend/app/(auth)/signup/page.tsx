'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, username })
    }
    router.push('/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-center text-white">Create account</h1>
        <p className="text-zinc-500 text-sm text-center mb-6">Join CareerIntel</p>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm mb-3 focus:outline-none focus:border-violet-500 text-white" />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm mb-3 focus:outline-none focus:border-violet-500 text-white" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm mb-4 focus:outline-none focus:border-violet-500 text-white" />
        {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}
        <button onClick={handleSignup} disabled={loading || !email || !password || !username}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
        <p className="text-center text-sm text-zinc-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
