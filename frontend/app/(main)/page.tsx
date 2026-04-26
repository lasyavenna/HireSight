'use client'
import { useState } from 'react'

interface InterviewStage {
  stage: string
  description: string
  duration: string
}

interface RoleInsights {
  summary: string
  key_skills: string[]
  day_to_day: string
  team_context: string
}

interface TechnicalQuestion {
  type: string
  question: string
  difficulty: string
}

interface InterviewInsights {
  interview_process: InterviewStage[]
  role_insights: RoleInsights
  technical_questions: TechnicalQuestion[]
  tips: string[]
}

const typeColors: Record<string, { color: string; bg: string; border: string }> = {
  'OA':            { color: 'var(--purple)', bg: 'var(--purple-dim)', border: 'rgba(167,139,250,0.3)' },
  'System Design': { color: 'var(--teal)',   bg: 'var(--teal-dim)',   border: 'rgba(20,184,166,0.3)'  },
  'Behavioral':    { color: 'var(--green)',  bg: 'var(--green-dim)',  border: 'rgba(34,197,94,0.3)'   },
  'Technical':     { color: 'var(--amber)',  bg: 'var(--amber-dim)',  border: 'rgba(245,158,11,0.3)'  },
}

const diffColors: Record<string, string> = {
  Easy:   'var(--green)',
  Medium: 'var(--amber)',
  Hard:   'var(--red)',
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  color: 'var(--text)',
  fontFamily: 'var(--font)',
  fontSize: '14px',
  padding: '13px 16px',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  fontWeight: 500,
  color: 'var(--text3)',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: '8px',
  display: 'block',
}

export default function InterviewPrepPage() {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<InterviewInsights | null>(null)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const canSubmit = company.trim() && role.trim() && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    setInsights(null)
    setSearched(true)

    try {
      const res = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: company.trim(), role: role.trim() }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setInsights(data)
    } catch {
      setError('Failed to fetch insights. Is the backend running?')
    }
    setLoading(false)
  }

  const questionsByType = insights?.technical_questions.reduce<Record<string, TechnicalQuestion[]>>(
    (acc, q) => { (acc[q.type] ??= []).push(q); return acc },
    {}
  )

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '20px', padding: '5px 14px',
          fontSize: '11px', fontFamily: 'var(--font-mono)',
          color: 'var(--amber)', letterSpacing: '0.5px',
          marginBottom: '16px',
        }}>
          ✦ AI-POWERED INTERVIEW INTELLIGENCE
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '32px',
          fontWeight: 800, color: 'var(--text)',
          letterSpacing: '-0.8px', marginBottom: '10px',
        }}>
          Know exactly what&apos;s coming.
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6 }}>
          Enter a company and role — get the full interview process, role insights, and practice questions.
        </p>
      </div>

      {/* Input card */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '28px', marginBottom: '24px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Company</label>
            <input
              type="text"
              placeholder="e.g. Google, Meta, Stripe"
              value={company}
              onChange={e => setCompany(e.target.value)}
              style={fieldStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div>
            <label style={labelStyle}>Job Role</label>
            <input
              type="text"
              placeholder="e.g. Software Engineer, PM, Data Scientist"
              value={role}
              onChange={e => setRole(e.target.value)}
              style={fieldStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%',
            background: canSubmit ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--bg3)',
            color: canSubmit ? '#1a0e00' : 'var(--text3)',
            border: 'none', borderRadius: '10px', padding: '14px',
            fontSize: '15px', fontWeight: 700,
            fontFamily: 'var(--font-display)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {loading ? (
            <>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1a0e00', animation: 'pulse 1s infinite' }} />
              Researching…
            </>
          ) : '✦ Get Interview Insights'}
        </button>
      </div>

      {error && (
        <div style={{
          background: 'var(--red-dim)', border: '1px solid rgba(244,63,94,0.3)',
          borderRadius: '10px', padding: '14px 18px',
          color: 'var(--red)', fontSize: '13px', marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[180, 160, 220].map((h, i) => (
            <div key={i} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: '14px', height: `${h}px`,
              opacity: 0.6, animation: 'pulse 1.5s infinite',
            }} />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && insights && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Interview Process */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--teal)',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--teal)' }} />
              Interview Process — {insights.interview_process.length} Stages
            </div>

            {insights.interview_process.map((stage, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', paddingBottom: i < insights.interview_process.length - 1 ? '18px' : '0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'var(--bg3)', border: '2px solid var(--teal)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--teal)', fontWeight: 600,
                  }}>
                    {i + 1}
                  </div>
                  {i < insights.interview_process.length - 1 && (
                    <div style={{ width: '1px', flex: 1, background: 'var(--border)', marginTop: '4px', minHeight: '20px' }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                      {stage.stage}
                    </span>
                    {stage.duration && (
                      <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: '4px' }}>
                        {stage.duration}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text2)', margin: 0, lineHeight: 1.6 }}>
                    {stage.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Role Insights */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--amber)',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '18px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--amber)' }} />
              Role Insights
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.7, marginBottom: '20px' }}>
              {insights.role_insights.summary}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {[
                { label: 'Day-to-Day', val: insights.role_insights.day_to_day },
                { label: 'Team Context', val: insights.role_insights.team_context },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    {label}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{val}</p>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                Key Skills
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {insights.role_insights.key_skills.map((skill, i) => (
                  <span key={i} style={{
                    fontSize: '12px', fontFamily: 'var(--font-mono)',
                    background: 'var(--bg3)', color: 'var(--text2)',
                    padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)',
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Technical Questions */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--purple)',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--purple)' }} />
              Practice Questions — {insights.technical_questions.length} Total
            </div>

            {questionsByType && Object.entries(questionsByType).map(([type, questions]) => {
              const colors = typeColors[type] ?? typeColors['Technical']
              return (
                <div key={type} style={{ marginBottom: '20px' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '4px 10px', borderRadius: '6px',
                    background: colors.bg, border: `1px solid ${colors.border}`,
                    color: colors.color, fontSize: '11px',
                    fontFamily: 'var(--font-mono)', fontWeight: 500,
                    marginBottom: '12px',
                  }}>
                    {type}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {questions.map((q, i) => (
                      <div key={i} style={{
                        background: 'var(--bg3)', borderRadius: '10px', padding: '14px 16px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
                      }}>
                        <span style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6, flex: 1 }}>
                          {q.question}
                        </span>
                        <span style={{
                          fontSize: '10px', fontFamily: 'var(--font-mono)', flexShrink: 0, marginTop: '2px',
                          color: diffColors[q.difficulty] ?? 'var(--text3)',
                        }}>
                          {q.difficulty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Insider Tips */}
          {insights.tips.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(20,184,166,0.08))',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '14px', padding: '22px',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--amber)',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--amber)', animation: 'pulse 2s infinite' }} />
                Insider Tips for {company}
              </div>
              {insights.tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingBottom: i < insights.tips.length - 1 ? '10px' : '0' }}>
                  <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontSize: '11px', flexShrink: 0, marginTop: '2px' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p style={{ fontSize: '13px', color: 'var(--text2)', margin: 0, lineHeight: 1.6 }}>{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !searched && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>✦</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--text2)', marginBottom: '6px' }}>
            We&apos;ve all been there.
          </div>
          <div style={{ fontSize: '13px' }}>Enter a company + role above to get started.</div>
        </div>
      )}
    </div>
  )
}
