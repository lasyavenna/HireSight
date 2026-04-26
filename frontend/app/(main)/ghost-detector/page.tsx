'use client'
import { useState } from 'react'
import { analyzeJobPosting, AnalysisResult } from '@/lib/analyzer'
import ResumePdfUploader from '@/components/resume/ResumePdfUploader'

const recStyle: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  'Apply':         { color: 'var(--green)',  bg: 'var(--green-dim)',  border: 'rgba(34,197,94,0.3)',  icon: '↑' },
  'Network First': { color: 'var(--amber)',  bg: 'var(--amber-dim)',  border: 'rgba(245,158,11,0.3)', icon: '~' },
  'Low Priority':  { color: 'var(--coral)',  bg: 'var(--coral-dim)',  border: 'rgba(251,146,60,0.3)', icon: '↓' },
  'Skip':          { color: 'var(--red)',    bg: 'var(--red-dim)',    border: 'rgba(244,63,94,0.3)',  icon: '✕' },
}

const EXAMPLE = `Software Engineer — Full Stack
Acme Corp · San Francisco, CA (Hybrid)

We're looking for a full-stack engineer to join our growth team of 8 engineers, reporting to the VP of Engineering.

Responsibilities:
- Build and maintain customer-facing features in React and Node.js
- Design REST APIs and GraphQL endpoints
- Collaborate with product and design on new features

Requirements:
- 3+ years with React and TypeScript
- Experience with Node.js, PostgreSQL, Redis
- Familiarity with AWS (EC2, S3, RDS)

Compensation: $140,000 – $175,000 base + equity
Benefits: Health, dental, vision, 401k match, unlimited PTO
Interview process: recruiter screen → technical screen → take-home → final loop (3 rounds)`

export default function GhostDetectorPage() {
  const [jobUrl, setJobUrl] = useState('')
  const [input, setInput] = useState('')
  const [company, setCompany] = useState('')
  const [resume, setResume] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0

  const handleAnalyze = async () => {
    if (!input.trim()) return
    setAiLoading(true)
    setAnalyzed(true)
    const r = analyzeJobPosting(input)
    setResult(r)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description: input,
          rule_score: r.score,
          resume_text: resume,
          company_name: company,
          job_url: jobUrl,
        }),
      })
      const data = await res.json()
      setResult(prev => prev ? { ...prev, ai_summary: data.summary, candidate_fit: data.candidate_fit } : prev)
    } catch (e) {
      console.error(e)
    }
    setAiLoading(false)
  }

  const rec = result ? recStyle[result.recommendation] : null

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px', fontWeight: 500,
    color: 'var(--text3)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', display: 'block',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    color: 'var(--text)',
    fontFamily: 'var(--font)',
    fontSize: '13px',
    padding: '12px 16px',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '26px',
          fontWeight: 800, color: 'var(--text)',
          letterSpacing: '-0.5px', marginBottom: '6px',
        }}>Analyze a Job Posting</h1>
        <p style={{ fontSize: '13px', color: 'var(--text3)' }}>
          Paste any job description to get an instant ghost-job risk score
        </p>
      </div>

      {/* Form card */}
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '20px',
      }}>

        {/* Job URL */}
        <div style={{ marginBottom: '20px' }}>
          <div style={labelStyle}>
            <span>Job URL <span style={{ color: 'var(--text3)', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>— optional</span></span>
          </div>
          <input
            type="text"
            placeholder="https://linkedin.com/jobs/view/..."
            value={jobUrl}
            onChange={e => setJobUrl(e.target.value)}
            style={fieldStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Job Description */}
        <div style={{ marginBottom: '20px' }}>
          <div style={labelStyle}>
            <span>
              Job Description{' '}
              <span style={{ color: 'var(--red)', fontSize: '13px', fontFamily: 'var(--font)' }}>*</span>
            </span>
            <button
              onClick={() => setInput(EXAMPLE)}
              style={{
                fontSize: '11px', color: 'var(--amber)',
                background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'var(--font)',
                fontWeight: 600, textTransform: 'none', letterSpacing: 0,
              }}
            >Try an example →</button>
          </div>
          <div style={{ position: 'relative' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={'Paste the full job description here...\n\nThe more detail you provide, the more accurate the analysis.'}
              rows={9}
              style={{ ...fieldStyle, resize: 'none', lineHeight: 1.65, paddingBottom: '30px' }}
              onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            <span style={{
              position: 'absolute', bottom: '10px', right: '14px',
              fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--font-mono)',
              pointerEvents: 'none',
            }}>{wordCount} words</span>
          </div>
        </div>

        {/* Company Name */}
        <div style={{ marginBottom: '20px' }}>
          <div style={labelStyle}>
            <span>Company Name <span style={{ color: 'var(--text3)', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>— optional</span></span>
          </div>
          <input
            type="text"
            placeholder="e.g. Acme Corp"
            value={company}
            onChange={e => setCompany(e.target.value)}
            style={fieldStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Resume */}
        <div style={{ marginBottom: '26px' }}>
          <div style={labelStyle}>
            <span>
              Resume PDF{' '}
              <span style={{ color: 'var(--text3)', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>
                — optional · unlocks candidate fit and interview personalization
              </span>
            </span>
          </div>

          <ResumePdfUploader
            resumeText={resume}
            onResumeParsed={parsed => setResume(parsed.text)}
            onClear={() => setResume('')}
          />
        </div>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={!input.trim() || aiLoading}
          style={{
            width: '100%',
            background: input.trim() && !aiLoading
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : 'var(--bg3)',
            color: input.trim() && !aiLoading ? '#1a0e00' : 'var(--text3)',
            border: 'none', borderRadius: '10px',
            padding: '15px',
            fontSize: '15px', fontWeight: 700,
            fontFamily: 'var(--font-display)',
            cursor: input.trim() && !aiLoading ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px',
            letterSpacing: '0.2px',
          }}
        >
          {aiLoading ? (
            <>
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: '#1a0e00', animation: 'pulse 1s infinite',
              }} />
              Analyzing…
            </>
          ) : (
            '✦ Analyze Job Posting'
          )}
        </button>
      </div>

      {/* Results */}
      {analyzed && result && rec && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Score card */}
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: '14px', padding: '24px',
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '18px',
            }}>Analysis Results</div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: '56px',
                  fontWeight: 900, color: 'var(--text)', lineHeight: 1,
                }}>{result.score}</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: '4px', letterSpacing: '1px' }}>
                  LEGITIMACY SCORE
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: 800, color: 'var(--red)', lineHeight: 1 }}>
                  {result.ghost_risk_pct}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: '4px', letterSpacing: '1px' }}>
                  GHOST RISK
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: 800, color: 'var(--text2)', lineHeight: 1 }}>
                  {result.confidence_pct}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: '4px', letterSpacing: '1px' }}>
                  CONFIDENCE
                </div>
              </div>
            </div>

            <div style={{ height: '6px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden', marginBottom: '18px' }}>
              <div style={{
                width: `${result.score}%`, height: '100%',
                background: 'linear-gradient(90deg, var(--red), var(--amber), var(--green))',
                borderRadius: '3px', transition: 'width 0.8s ease',
              }} />
            </div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '8px',
              border: `1px solid ${rec.border}`,
              background: rec.bg, color: rec.color,
              fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700,
            }}>
              {rec.icon} {result.recommendation}
            </div>
          </div>

          {/* Signals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { title: '↑ Positive Signals', color: 'var(--green)', signals: result.positive_signals, positive: true },
              { title: '↓ Red Flags', color: 'var(--red)', signals: result.negative_signals, positive: false },
            ].map(col => (
              <div key={col.title} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '16px',
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px', color: col.color,
                  textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px',
                }}>{col.title}</div>
                {col.signals.length === 0
                  ? <div style={{ fontSize: '12px', color: 'var(--text3)' }}>None detected</div>
                  : col.signals.map(s => (
                    <div key={s.label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '7px 0', borderBottom: '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{s.label}</span>
                      <span style={{ fontSize: '11px', color: col.color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {col.positive ? `+${s.impact}` : s.impact}
                      </span>
                    </div>
                  ))
                }
              </div>
            ))}
          </div>

          {/* AI Summary */}
          {result.ai_summary && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(20,184,166,0.08))',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '12px', padding: '20px',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--amber)',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--amber)', animation: 'pulse 2s infinite' }} />
                AI Analysis
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7 }}>{result.ai_summary}</p>
            </div>
          )}

          {result.candidate_fit && (
            <div style={{
              background: 'rgba(34,197,94,0.07)',
              border: '1px solid rgba(34,197,94,0.22)',
              borderRadius: '12px', padding: '20px',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--green)',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px',
              }}>
                Resume Match
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7 }}>{result.candidate_fit}</p>
            </div>
          )}

          {aiLoading && !result.ai_summary && (
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '16px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--amber)', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Running AI analysis…</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
