'use client'
import { useState } from 'react'
import { analyzeJobPosting, AnalysisResult } from '@/lib/analyzer'

interface ResumeMatch {
  match_score: number
  match_label: string
  match_summary: string
  strengths: string[]
  gaps: string[]
  keywords_found: string[]
  keywords_missing: string[]
  action_items: string[]
}

const matchColors: Record<string, { color: string; bg: string }> = {
  'Excellent Match': { color: 'var(--green)',  bg: 'var(--green-dim)'  },
  'Strong Match':    { color: 'var(--teal)',   bg: 'var(--teal-dim)'   },
  'Moderate Match':  { color: 'var(--amber)',  bg: 'var(--amber-dim)'  },
  'Weak Match':      { color: 'var(--red)',    bg: 'var(--red-dim)'    },
}

const recStyle: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  'Apply':         { color: 'var(--green)',  bg: 'var(--green-dim)',  border: 'rgba(34,197,94,0.3)',  icon: '↑' },
  'Network First': { color: 'var(--amber)',  bg: 'var(--amber-dim)',  border: 'rgba(245,158,11,0.3)', icon: '~' },
  'Low Priority':  { color: 'var(--coral)',  bg: 'var(--coral-dim)',  border: 'rgba(251,146,60,0.3)', icon: '↓' },
  'Skip':          { color: 'var(--red)',    bg: 'var(--red-dim)',    border: 'rgba(244,63,94,0.3)',  icon: '✕' },
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
  resize: 'none',
  lineHeight: 1.65,
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '10px', fontWeight: 500,
  color: 'var(--text3)',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: '8px',
  display: 'block',
}

export default function ResumePage() {
  const [resume, setResume] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [ghostResult, setGhostResult] = useState<AnalysisResult | null>(null)
  const [resumeMatch, setResumeMatch] = useState<ResumeMatch | null>(null)
  const [analyzed, setAnalyzed] = useState(false)

  const canSubmit = resume.trim().length >= 100 && !aiLoading

  const handleAnalyze = async () => {
    if (!canSubmit) return

    setAiLoading(true)
    setAnalyzed(true)
    setGhostResult(null)
    setResumeMatch(null)

    const hasJob = jobDescription.trim().length > 50

    if (hasJob) {
      const ghostR = analyzeJobPosting(jobDescription)
      setGhostResult(ghostR)

      // Run AI ghost analysis and resume match in parallel
      const [ghostRes, matchRes] = await Promise.allSettled([
        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_description: jobDescription, rule_score: ghostR.score }),
        }).then(r => r.json()),
        fetch('/api/resume-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume: resume.trim(), job_description: jobDescription.trim() }),
        }).then(r => r.json()),
      ])

      if (ghostRes.status === 'fulfilled') {
        setGhostResult(prev => prev ? { ...prev, ai_summary: ghostRes.value.summary } : prev)
      }
      if (matchRes.status === 'fulfilled' && matchRes.value.resume_match) {
        setResumeMatch(matchRes.value.resume_match)
      }
    }

    setAiLoading(false)
  }

  const rec = ghostResult ? recStyle[ghostResult.recommendation] : null
  const mc = resumeMatch ? (matchColors[resumeMatch.match_label] ?? matchColors['Moderate Match']) : null

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '36px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '28px',
          fontWeight: 800, color: 'var(--text)',
          letterSpacing: '-0.5px', marginBottom: '6px',
        }}>Resume & Job Analysis</h1>
        <p style={{ fontSize: '13px', color: 'var(--text3)' }}>
          Paste your resume and a job description — get a ghost expose score and resume match analysis.
        </p>
      </div>

      {/* Form */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', marginBottom: '20px' }}>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>
            Your Resume <span style={{ color: 'var(--red)', fontFamily: 'var(--font)', textTransform: 'none', letterSpacing: 0 }}>*</span>
          </label>
          <textarea
            value={resume}
            onChange={e => setResume(e.target.value)}
            placeholder="Paste your full resume text here..."
            rows={8}
            style={fieldStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
          {resume.trim().length > 0 && resume.trim().length < 100 && (
            <div style={{ fontSize: '11px', color: 'var(--coral)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
              Add more text ({100 - resume.trim().length} chars needed)
            </div>
          )}
        </div>

        <div style={{ marginBottom: '26px' }}>
          <label style={labelStyle}>
            Job Description{' '}
            <span style={{ color: 'var(--text3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              — optional · unlocks ghost expose + match scoring
            </span>
          </label>
          <textarea
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            rows={6}
            style={fieldStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!canSubmit}
          style={{
            width: '100%',
            background: canSubmit ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--bg3)',
            color: canSubmit ? '#1a0e00' : 'var(--text3)',
            border: 'none', borderRadius: '10px', padding: '15px',
            fontSize: '15px', fontWeight: 700,
            fontFamily: 'var(--font-display)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {aiLoading ? (
            <>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1a0e00', animation: 'pulse 1s infinite' }} />
              Analyzing…
            </>
          ) : '✦ Analyze Resume & Job'}
        </button>
      </div>

      {/* Results */}
      {analyzed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Loading state */}
          {aiLoading && !ghostResult && !resumeMatch && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--amber)', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Running analysis…</span>
            </div>
          )}

          {/* Ghost Expose */}
          {ghostResult && rec && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--red)',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '18px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--red)' }} />
                Ghost Exposé
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>
                    {ghostResult.score}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: '4px', letterSpacing: '1px' }}>
                    LEGITIMACY SCORE
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, color: 'var(--red)', lineHeight: 1 }}>
                    {ghostResult.ghost_risk_pct}%
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: '4px', letterSpacing: '1px' }}>
                    GHOST RISK
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, color: 'var(--text2)', lineHeight: 1 }}>
                    {ghostResult.confidence_pct}%
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: '4px', letterSpacing: '1px' }}>
                    CONFIDENCE
                  </div>
                </div>
              </div>

              <div style={{ height: '6px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ width: `${ghostResult.score}%`, height: '100%', background: 'linear-gradient(90deg, var(--red), var(--amber), var(--green))', borderRadius: '3px', transition: 'width 0.8s ease' }} />
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${rec.border}`, background: rec.bg, color: rec.color, fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>
                {rec.icon} {ghostResult.recommendation}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { title: '↑ Positive Signals', color: 'var(--green)', signals: ghostResult.positive_signals, positive: true },
                  { title: '↓ Red Flags', color: 'var(--red)', signals: ghostResult.negative_signals, positive: false },
                ].map(col => (
                  <div key={col.title} style={{ background: 'var(--bg3)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: col.color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                      {col.title}
                    </div>
                    {col.signals.length === 0
                      ? <div style={{ fontSize: '12px', color: 'var(--text3)' }}>None detected</div>
                      : col.signals.map(s => (
                        <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
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

              {ghostResult.ai_summary && (
                <div style={{ marginTop: '14px', background: 'linear-gradient(135deg, rgba(244,63,94,0.08), rgba(245,158,11,0.08))', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--amber)', animation: 'pulse 2s infinite' }} />
                    AI Ghost Analysis
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>{ghostResult.ai_summary}</p>
                </div>
              )}
            </div>
          )}

          {/* Job Analysis / Resume Match */}
          {resumeMatch && mc && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--teal)',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '18px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--teal)' }} />
                Job Analysis
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '18px' }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>
                    {resumeMatch.match_score}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: '4px', letterSpacing: '1px' }}>
                    MATCH SCORE
                  </div>
                </div>
                <div style={{ flex: 1, paddingTop: '6px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 12px', borderRadius: '8px', background: mc.bg, color: mc.color, fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
                    {resumeMatch.match_label}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
                    {resumeMatch.match_summary}
                  </p>
                </div>
              </div>

              <div style={{ height: '6px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden', marginBottom: '18px' }}>
                <div style={{ width: `${resumeMatch.match_score}%`, height: '100%', background: 'linear-gradient(90deg, var(--red), var(--amber), var(--green))', borderRadius: '3px', transition: 'width 0.8s ease' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'var(--bg3)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                    ↑ Your Strengths
                  </div>
                  {resumeMatch.strengths.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', padding: '5px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--green)', fontSize: '12px', flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{s}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'var(--bg3)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                    ↓ Gaps to Address
                  </div>
                  {resumeMatch.gaps.length === 0
                    ? <div style={{ fontSize: '12px', color: 'var(--text3)' }}>No significant gaps</div>
                    : resumeMatch.gaps.map((g, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', padding: '5px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--red)', fontSize: '12px', flexShrink: 0 }}>✕</span>
                        <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{g}</span>
                      </div>
                    ))
                  }
                </div>
              </div>

              {(resumeMatch.keywords_found.length > 0 || resumeMatch.keywords_missing.length > 0) && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                    Keywords
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {resumeMatch.keywords_found.map((k, i) => (
                      <span key={i} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: '4px', background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        ✓ {k}
                      </span>
                    ))}
                    {resumeMatch.keywords_missing.map((k, i) => (
                      <span key={i} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: '4px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(244,63,94,0.2)' }}>
                        ✕ {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {resumeMatch.action_items.length > 0 && (
                <div style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.08), rgba(167,139,250,0.08))', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--teal)', animation: 'pulse 2s infinite' }} />
                    Action Items
                  </div>
                  {resumeMatch.action_items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '6px 0' }}>
                      <span style={{ color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontSize: '11px', flexShrink: 0, marginTop: '2px' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p style={{ fontSize: '13px', color: 'var(--text2)', margin: 0, lineHeight: 1.6 }}>{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No job description provided */}
          {!aiLoading && analyzed && !jobDescription.trim() && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '4px' }}>Resume saved.</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                Add a job description above and re-analyze to get Ghost Exposé + Job Analysis.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
