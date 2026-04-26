'use client'

import { ChangeEvent, useRef, useState } from 'react'
import { FileText, Upload, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type ParsedResume = {
  text: string
  word_count: number
  skills: string[]
  experience_level: 'student' | 'junior' | 'mid' | 'senior'
  file_name: string
}

type Props = {
  resumeText: string
  onResumeParsed: (resume: ParsedResume) => void
  onClear: () => void
}

export default function ResumePdfUploader({ resumeText, onResumeParsed, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [fileName, setFileName] = useState('')

  async function saveResume(parsed: ParsedResume) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setStatus('Resume parsed. Sign in to save it for interview coaching.')
      return
    }

    // Ensure a profiles row exists to satisfy the FK on resumes.user_id
    const fallbackUsername = user.email?.split('@')[0] ?? 'user'
    const { error: profileError } = await supabase.from('profiles').upsert(
      { id: user.id, username: fallbackUsername },
      { onConflict: 'id' }
    )
    if (profileError) console.error('Profile upsert error:', profileError)

    const { data: existing } = await supabase
      .from('resumes')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    let error
    if (existing) {
      ;({ error } = await supabase
        .from('resumes')
        .update({ raw_text: parsed.text, skills: parsed.skills, experience_level: parsed.experience_level })
        .eq('user_id', user.id))
    } else {
      ;({ error } = await supabase
        .from('resumes')
        .insert({ user_id: user.id, raw_text: parsed.text, skills: parsed.skills, experience_level: parsed.experience_level }))
    }

    if (error) {
      console.error('Supabase resume save error:', error)
      setStatus(`Resume parsed, but could not save: ${error.message}`)
    } else {
      setStatus('Resume parsed and saved for this account.')
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setStatus('')
    setFileName(file.name)

    const formData = new FormData()
    formData.append('resume', file)

    try {
      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) {
        setStatus(data.error || 'Could not parse this resume PDF.')
        return
      }

      onResumeParsed(data)
      await saveResume(data)
    } catch {
      setStatus('Resume upload failed. Try again before the demo.')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {resumeText ? (
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: '10px',
          background: 'rgba(34,197,94,0.06)',
          padding: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <FileText size={18} color="var(--green)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: '13px' }}>
                {fileName || 'Resume PDF loaded'}
              </div>
              <div style={{ color: 'var(--text3)', fontSize: '11px' }}>
                {resumeText.split(/\s+/).filter(Boolean).length} readable words extracted
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFileName('')
                setStatus('')
                onClear()
              }}
              aria-label="Clear resume"
              style={{
                width: '30px',
                height: '30px',
                display: 'grid',
                placeItems: 'center',
                border: '1px solid var(--border)',
                background: 'var(--bg2)',
                color: 'var(--text3)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '12px', lineHeight: 1.6, maxHeight: '92px', overflow: 'auto' }}>
            {resumeText.slice(0, 700)}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          style={{
            width: '100%',
            border: '1px dashed var(--border2)',
            borderRadius: '10px',
            padding: '24px',
            textAlign: 'center',
            cursor: loading ? 'wait' : 'pointer',
            background: 'rgba(255,255,255,0.02)',
            color: 'var(--text2)',
            fontFamily: 'var(--font)',
          }}
        >
          <Upload size={20} color="var(--amber)" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text2)', marginBottom: '3px' }}>
            {loading ? 'Reading resume PDF...' : 'Upload resume PDF'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
            Text-based PDFs up to 5 MB. Parsed text is sent to the API for personalized analysis.
          </div>
        </button>
      )}

      {status && (
        <div style={{ marginTop: '8px', color: status.includes('failed') || status.includes('Could not') || status.includes('did not') ? 'var(--red)' : 'var(--green)', fontSize: '12px' }}>
          {status}
        </div>
      )}
    </div>
  )
}
