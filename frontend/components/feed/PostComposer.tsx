'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const postTypes = ['OA', 'interview', 'recruiter', 'ghost', 'advice']

interface Props {
  onPost?: () => void
}

export default function PostComposer({ onPost }: Props) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [type, setType] = useState('interview')
  const [difficulty, setDifficulty] = useState<number | null>(null)
  const [gotResponse, setGotResponse] = useState<boolean | null>(null)
  const [isAnon, setIsAnon] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('Please sign in to post'); setLoading(false); return }

    // Get or create company
    let company_id = null
    if (company.trim()) {
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .ilike('name', company.trim())
        .single()

      if (existing) {
        company_id = existing.id
      } else {
        const { data: newCo } = await supabase
          .from('companies')
          .insert({ name: company.trim() })
          .select('id')
          .single()
        company_id = newCo?.id
      }
    }

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      content,
      post_type: type,
      company_id,
      role_title: role || null,
      difficulty,
      got_response: gotResponse,
      is_anonymous: isAnon,
    })

    if (!error) {
      setContent(''); setCompany(''); setRole('')
      setDifficulty(null); setGotResponse(null)
      setOpen(false)
      onPost?.()
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <div
        onClick={() => setOpen(true)}
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
          cursor: 'text',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'var(--bg3)', flexShrink: 0,
        }} />
        <span style={{ color: 'var(--text3)', fontSize: '13px' }}>
          Share an experience, OA, interview, or offer…
        </span>
        <button style={{
          marginLeft: 'auto',
          background: 'var(--amber)',
          color: '#1a0e00',
          border: 'none',
          borderRadius: '8px',
          padding: '6px 14px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'var(--font)',
          whiteSpace: 'nowrap',
        }}>Post Experience</button>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border2)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px',
    }}>
      {/* Type selector */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {postTypes.map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            style={{
              fontSize: '11px', fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              padding: '4px 10px', borderRadius: '6px',
              border: 'none', cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              background: type === t ? 'var(--amber-dim)' : 'var(--bg3)',
              color: type === t ? 'var(--amber)' : 'var(--text3)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Company + Role */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <input
          placeholder="Company name"
          value={company}
          onChange={e => setCompany(e.target.value)}
          style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: '8px', color: 'var(--text)',
            fontFamily: 'var(--font)', fontSize: '13px',
            padding: '10px 12px',
          }}
        />
        <input
          placeholder="Role title (e.g. SWE L4)"
          value={role}
          onChange={e => setRole(e.target.value)}
          style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: '8px', color: 'var(--text)',
            fontFamily: 'var(--font)', fontSize: '13px',
            padding: '10px 12px',
          }}
        />
      </div>

      {/* Content */}
      <textarea
        placeholder="Share what happened — be specific. Others will use this to make better decisions."
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={4}
        style={{
          width: '100%',
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: '8px', color: 'var(--text)',
          fontFamily: 'var(--font)', fontSize: '13px',
          padding: '12px', resize: 'none',
          marginBottom: '12px', lineHeight: 1.6,
        }}
      />

      {/* Optional fields */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
        {type === 'OA' || type === 'interview' ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Difficulty:</span>
            {[1,2,3,4,5].map(d => (
              <button key={d} onClick={() => setDifficulty(d === difficulty ? null : d)} style={{
                width: '24px', height: '24px', borderRadius: '4px',
                border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                background: difficulty === d ? 'var(--amber-dim)' : 'var(--bg3)',
                color: difficulty === d ? 'var(--amber)' : 'var(--text3)',
              }}>{d}</button>
            ))}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Response:</span>
          {[true, false].map(v => (
            <button key={String(v)} onClick={() => setGotResponse(gotResponse === v ? null : v)} style={{
              padding: '3px 10px', borderRadius: '4px',
              border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
              background: gotResponse === v ? (v ? 'var(--green-dim)' : 'var(--red-dim)') : 'var(--bg3)',
              color: gotResponse === v ? (v ? 'var(--green)' : 'var(--red)') : 'var(--text3)',
              fontFamily: 'var(--font)',
            }}>{v ? 'Got response' : 'No response'}</button>
          ))}
        </div>

        <button onClick={() => setIsAnon(!isAnon)} style={{
          padding: '3px 10px', borderRadius: '4px',
          border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
          background: isAnon ? 'var(--bg3)' : 'var(--amber-dim)',
          color: isAnon ? 'var(--text3)' : 'var(--amber)',
          fontFamily: 'var(--font)',
        }}>{isAnon ? 'Anonymous' : 'Showing username'}</button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={() => setOpen(false)} style={{
          padding: '8px 16px', borderRadius: '8px',
          border: '1px solid var(--border)', background: 'none',
          color: 'var(--text2)', cursor: 'pointer', fontSize: '13px',
          fontFamily: 'var(--font)',
        }}>Cancel</button>
        <button onClick={handleSubmit} disabled={loading || !content.trim()} style={{
          padding: '8px 20px', borderRadius: '8px',
          border: 'none', background: 'var(--amber)',
          color: '#1a0e00', cursor: 'pointer', fontSize: '13px',
          fontWeight: 700, fontFamily: 'var(--font-display)',
          opacity: loading || !content.trim() ? 0.5 : 1,
        }}>{loading ? 'Posting…' : 'Post Experience'}</button>
      </div>
    </div>
  )
}