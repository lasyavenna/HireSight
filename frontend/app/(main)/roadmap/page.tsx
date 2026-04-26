'use client'
import { useState } from 'react'
import {
  Target, Briefcase, Clock, Code2, Wrench, Users, Lightbulb,
  ChevronRight, CheckCircle2, Circle, Star, MessageSquare, BookOpen,
  Loader2, Search, MapPin, ArrowRight,
} from 'lucide-react'

interface Skill { label: string; color: string; bg: string }
interface TimelinePhase {
  phase: string
  weeks: string
  goal: string
  tasks: string[]
  milestone: string
}
interface Project {
  name: string
  why: string
  skills: string[]
}
interface RoadmapData {
  overview: string
  hiring_process: string
  required_skills: {
    technical: string[]
    tools_and_platforms: string[]
    soft_skills: string[]
  }
  timeline: TimelinePhase[]
  projects_to_build: Project[]
  application_tips: string[]
  community_insights: string
  resources: string[]
}

const PHASE_COLORS = [
  { border: 'var(--amber)', dot: 'var(--amber)', bg: 'var(--amber-dim)', label: 'var(--amber)' },
  { border: 'var(--teal)', dot: 'var(--teal)', bg: 'var(--teal-dim)', label: 'var(--teal)' },
  { border: 'var(--purple)', dot: 'var(--purple)', bg: 'var(--purple-dim)', label: 'var(--purple)' },
  { border: 'var(--green)', dot: 'var(--green)', bg: 'var(--green-dim)', label: 'var(--green)' },
]

const LOADING_STEPS = [
  { label: 'Searching Reddit & Blind for community insights…', icon: MessageSquare },
  { label: 'Analyzing LinkedIn job postings for this role…', icon: Search },
  { label: 'Pulling Glassdoor interview data…', icon: Briefcase },
  { label: 'Synthesizing 12-week roadmap…', icon: MapPin },
]

function SkillChip({ label, color, bg }: Skill) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '12px',
      fontFamily: 'var(--font-mono)',
      fontWeight: 500,
      color,
      background: bg,
      border: `1px solid ${color}30`,
    }}>
      {label}
    </span>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '14px',
        fontFamily: 'var(--font-display)',
        fontSize: '15px',
        fontWeight: 800,
        color: 'var(--text)',
        letterSpacing: '-0.2px',
      }}>
        <Icon size={16} color="var(--amber)" />
        {title}
      </div>
      {children}
    </div>
  )
}

export default function RoadmapPage() {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [showResume, setShowResume] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [data, setData] = useState<RoadmapData | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!company.trim() || !role.trim()) return
    setLoading(true)
    setData(null)
    setError('')
    setLoadingStep(0)

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev))
    }, 2000)

    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: company.trim(), role: role.trim(), resume_text: resumeText }),
      })
      clearInterval(stepInterval)
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Something went wrong')
        return
      }
      const json = await res.json()
      setData(json)
    } catch {
      setError('Could not reach the backend. Make sure the Flask server is running.')
    } finally {
      clearInterval(stepInterval)
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 20px 64px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--teal)',
          background: 'var(--teal-dim)',
          border: '1px solid rgba(58,176,200,0.25)',
          borderRadius: '8px',
          padding: '5px 10px',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}>
          <Target size={13} />
          Career Roadmap
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4vw, 46px)',
          fontWeight: 900,
          lineHeight: 1.05,
          color: 'var(--text)',
          marginBottom: '10px',
          letterSpacing: '-1px',
        }}>
          What do you need to land<br />
          <span style={{ color: 'var(--amber)' }}>this specific job?</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: 1.8, maxWidth: '600px' }}>
          Enter a company and role. We search Reddit, LinkedIn, Glassdoor, and real candidate experiences
          to build you a personalized 12-week roadmap.
        </p>
      </div>

      {/* Input card */}
      <div style={{
        border: '1px solid var(--border2)',
        background: 'var(--bg2)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
              Company
            </label>
            <input
              value={company}
              onChange={e => setCompany(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. Google, Stripe, Palantir"
              style={{
                width: '100%',
                background: 'var(--bg3)',
                border: '1px solid var(--border2)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: 'var(--text)',
                fontSize: '14px',
                fontFamily: 'var(--font)',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
              Role
            </label>
            <input
              value={role}
              onChange={e => setRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. Software Engineer Intern, PM, Data Scientist"
              style={{
                width: '100%',
                background: 'var(--bg3)',
                border: '1px solid var(--border2)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: 'var(--text)',
                fontSize: '14px',
                fontFamily: 'var(--font)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <button
          onClick={() => setShowResume(v => !v)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text3)',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '0 0 12px',
            fontFamily: 'var(--font)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ChevronRight size={14} style={{ transform: showResume ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
          {showResume ? 'Hide' : 'Add resume context for personalized gap analysis (optional)'}
        </button>

        {showResume && (
          <textarea
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
            placeholder="Paste your resume text here…"
            rows={5}
            style={{
              width: '100%',
              background: 'var(--bg3)',
              border: '1px solid var(--border2)',
              borderRadius: '10px',
              padding: '12px 14px',
              color: 'var(--text)',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              resize: 'vertical',
              marginBottom: '14px',
            }}
          />
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !company.trim() || !role.trim()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: company.trim() && role.trim() ? 'var(--amber)' : 'var(--bg4)',
            color: company.trim() && role.trim() ? '#0d1e2a' : 'var(--text3)',
            border: 'none',
            borderRadius: '10px',
            padding: '11px 20px',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '14px',
            cursor: company.trim() && role.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Target size={15} />}
          {loading ? 'Building roadmap…' : 'Build my roadmap'}
          {!loading && <ArrowRight size={15} />}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          border: '1px solid var(--border)',
          background: 'var(--bg2)',
          borderRadius: '14px',
          padding: '28px 24px',
          marginBottom: '28px',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            fontWeight: 800,
            color: 'var(--text)',
            marginBottom: '20px',
          }}>
            Researching {role} at {company}…
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {LOADING_STEPS.map((step, i) => {
              const Icon = step.icon
              const done = i < loadingStep
              const active = i === loadingStep
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: i > loadingStep ? 0.35 : 1, transition: 'opacity 0.4s' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: done ? 'var(--green-dim)' : active ? 'var(--amber-dim)' : 'var(--bg3)',
                    border: `1px solid ${done ? 'var(--green)' : active ? 'var(--amber)' : 'var(--border)'}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {done
                      ? <CheckCircle2 size={15} color="var(--green)" />
                      : active
                        ? <Loader2 size={15} color="var(--amber)" style={{ animation: 'spin 1s linear infinite' }} />
                        : <Icon size={15} color="var(--text3)" />
                    }
                  </div>
                  <span style={{ fontSize: '13px', color: done ? 'var(--green)' : active ? 'var(--text)' : 'var(--text3)' }}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          border: '1px solid rgba(224,96,112,0.3)',
          background: 'var(--red-dim)',
          borderRadius: '10px',
          padding: '14px 16px',
          color: 'var(--red)',
          fontSize: '13px',
          marginBottom: '24px',
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <div>
          {/* Target header */}
          <div style={{
            border: '1px solid var(--amber)30',
            background: 'var(--amber-dim)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--amber)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Target</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 900, color: 'var(--text)' }}>
                {role} <span style={{ color: 'var(--text3)', fontWeight: 500, fontSize: '16px' }}>at</span> {company}
              </div>
            </div>
            <div style={{ flexShrink: 0, padding: '10px 16px', borderRadius: '10px', background: 'var(--bg3)', border: '1px solid var(--border2)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--amber)' }}>12</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>week plan</div>
            </div>
          </div>

          {/* Overview + Hiring Process */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '28px' }}>
            <div style={{ border: '1px solid var(--border)', background: 'var(--bg2)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={12} /> Overview
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.8 }}>{data.overview}</p>
            </div>
            <div style={{ border: '1px solid var(--border)', background: 'var(--bg2)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={12} /> Hiring Process
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.8 }}>{data.hiring_process}</p>
            </div>
          </div>

          {/* Skills */}
          <Section title="Required Skills" icon={Code2}>
            <div style={{ border: '1px solid var(--border)', background: 'var(--bg2)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Technical', items: data.required_skills.technical, color: 'var(--amber)', bg: 'var(--amber-dim)' },
                { label: 'Tools & Platforms', items: data.required_skills.tools_and_platforms, color: 'var(--teal)', bg: 'var(--teal-dim)' },
                { label: 'Soft Skills', items: data.required_skills.soft_skills, color: 'var(--purple)', bg: 'var(--purple-dim)' },
              ].map(group => (
                <div key={group.label}>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                    {group.label}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {group.items.map(item => (
                      <SkillChip key={item} label={item} color={group.color} bg={group.bg} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Timeline */}
          <Section title="12-Week Roadmap" icon={Clock}>
            <div style={{ position: 'relative' }}>
              {/* Vertical line */}
              <div style={{
                position: 'absolute',
                left: '19px',
                top: '24px',
                bottom: '24px',
                width: '2px',
                background: 'linear-gradient(to bottom, var(--amber), var(--teal), var(--purple), var(--green))',
                opacity: 0.3,
                borderRadius: '2px',
              }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.timeline.map((phase, i) => {
                  const colors = PHASE_COLORS[i % PHASE_COLORS.length]
                  return (
                    <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      {/* Dot */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: colors.bg,
                        border: `2px solid ${colors.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 1,
                      }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '14px', color: colors.label }}>
                          {i + 1}
                        </span>
                      </div>

                      {/* Content */}
                      <div style={{
                        flex: 1,
                        border: `1px solid ${colors.border}22`,
                        background: 'var(--bg2)',
                        borderRadius: '12px',
                        padding: '16px 18px',
                        borderLeft: `3px solid ${colors.border}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
                          <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '2px' }}>
                              {phase.phase}
                            </div>
                            <div style={{ fontSize: '12px', color: colors.label, fontFamily: 'var(--font-mono)' }}>{phase.weeks}</div>
                          </div>
                          <div style={{
                            flexShrink: 0,
                            fontSize: '11px',
                            color: colors.label,
                            background: colors.bg,
                            border: `1px solid ${colors.border}30`,
                            borderRadius: '6px',
                            padding: '3px 9px',
                            fontFamily: 'var(--font-mono)',
                            whiteSpace: 'nowrap',
                          }}>
                            Phase {i + 1}/4
                          </div>
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '12px' }}>{phase.goal}</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                          {phase.tasks.map((task, ti) => (
                            <div key={ti} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                              <Circle size={12} color={colors.dot} style={{ flexShrink: 0, marginTop: '3px' }} />
                              <span style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6 }}>{task}</span>
                            </div>
                          ))}
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          background: colors.bg,
                          borderRadius: '8px',
                          border: `1px solid ${colors.border}25`,
                        }}>
                          <CheckCircle2 size={13} color={colors.label} style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '11px', color: colors.label, fontFamily: 'var(--font-mono)' }}>
                            Milestone: {phase.milestone}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Section>

          {/* Projects */}
          <Section title="Portfolio Projects to Build" icon={Code2}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {data.projects_to_build.map((proj, i) => (
                <div key={i} style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg2)',
                  borderRadius: '12px',
                  padding: '16px',
                  borderTop: '3px solid var(--teal)',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                    {proj.name}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '10px' }}>{proj.why}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {proj.skills.map(s => (
                      <SkillChip key={s} label={s} color="var(--teal)" bg="var(--teal-dim)" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Application Tips + Community in 2 col */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '28px' }}>
            <div style={{ border: '1px solid var(--border)', background: 'var(--bg2)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star size={12} color="var(--coral)" /> Application Strategy
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.application_tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'var(--coral-dim)',
                      border: '1px solid var(--coral)30',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--coral)',
                      fontWeight: 700,
                    }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.7 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: '1px solid var(--border)', background: 'var(--bg2)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={12} color="var(--purple)" /> Community Insights
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.8, marginBottom: '14px' }}>{data.community_insights}</p>

              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={12} color="var(--green)" /> Resources
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {data.resources.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <ArrowRight size={12} color="var(--green)" style={{ flexShrink: 0, marginTop: '4px' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reset */}
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button
              onClick={() => { setData(null); setCompany(''); setRole(''); setResumeText('') }}
              style={{
                background: 'none',
                border: '1px solid var(--border2)',
                borderRadius: '8px',
                padding: '8px 18px',
                color: 'var(--text3)',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
              }}
            >
              Search another role
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: var(--text3); }
        input:focus, textarea:focus { border-color: var(--amber) !important; }
        @media (max-width: 680px) {
          .roadmap-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
