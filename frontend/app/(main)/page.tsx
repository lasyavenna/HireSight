import Link from 'next/link'
import { ArrowRight, FileText, LogIn, Mic2, SearchCheck, ShieldCheck, Users, MapPin } from 'lucide-react'

export default function HomePage() {
  const demoSteps = [
    {
      icon: LogIn,
      title: '1. Create an applicant account',
      body: 'Sign up once so the resume and interview context can follow the candidate across the demo.',
      href: '/signup',
      cta: 'Start with sign up',
    },
    {
      icon: FileText,
      title: '2. Upload a PDF resume',
      body: 'HireSight extracts readable resume text, saves it for the user, and uses it in job and interview analysis.',
      href: '/ghost-detector',
      cta: 'Upload and analyze',
    },
    {
      icon: SearchCheck,
      title: '3. Score a job posting',
      body: 'Paste a posting to show the rule engine, Gemini summary, ghost-job risk, and personalized candidate fit.',
      href: '/ghost-detector',
      cta: 'Analyze a job',
    },
    {
      icon: Mic2,
      title: '4. Practice the interview',
      body: 'Run the live coach to demonstrate resume-aware questions, speech notes, and AI feedback.',
      href: '/live-interview',
      cta: 'Open coach',
    },
    {
      icon: MapPin,
      title: '5. Build a career roadmap',
      body: 'Enter a target company and role. HireSight searches Reddit, LinkedIn, and Glassdoor to generate a personalized 12-week plan.',
      href: '/roadmap',
      cta: 'Get my roadmap',
    },
  ]

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '32px 20px 56px' }}>
      <section className="demo-hero">
        <div style={{
          border: '1px solid var(--border)',
          background: 'var(--bg2)',
          borderRadius: '14px',
          padding: '32px',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--amber)',
            background: 'var(--amber-dim)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: '8px',
            padding: '5px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            marginBottom: '18px',
          }}>
            <ShieldCheck size={14} />
            Judge demo path
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(34px, 5vw, 58px)',
            lineHeight: 1,
            fontWeight: 900,
            marginBottom: '16px',
            color: 'var(--text)',
          }}>
            HireSight turns job chaos into applicant intelligence.
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '15px', lineHeight: 1.8, maxWidth: '720px', marginBottom: '24px' }}>
            Present the product as one candidate journey: create an account, upload a resume PDF, evaluate whether a job is worth applying to, then practice an interview with that resume context.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--amber)',
              color: '#0d1e2a',
              textDecoration: 'none',
              borderRadius: '9px',
              padding: '11px 16px',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '14px',
            }}>
              Run the demo <ArrowRight size={16} />
            </Link>
            <Link href="/ghost-detector" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid var(--border2)',
              color: 'var(--text2)',
              textDecoration: 'none',
              borderRadius: '9px',
              padding: '11px 16px',
              fontWeight: 700,
              fontSize: '14px',
            }}>
              Skip to analyzer
            </Link>
          </div>
        </div>

      </section>

      <section className="demo-steps">
        {demoSteps.map(step => {
          const Icon = step.icon
          return (
            <Link key={step.title} href={step.href} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '230px',
              border: '1px solid var(--border)',
              background: 'var(--bg2)',
              borderRadius: '12px',
              padding: '18px',
              color: 'inherit',
              textDecoration: 'none',
            }}>
              <Icon size={22} color="var(--amber)" />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
                {step.title}
              </div>
              <p style={{ color: 'var(--text2)', fontSize: '12px', lineHeight: 1.7, flex: 1 }}>{step.body}</p>
              <span style={{ color: 'var(--amber)', fontSize: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {step.cta} <ArrowRight size={14} />
              </span>
            </Link>
          )
        })}
      </section>

      <section className="demo-support">
        <div style={{ border: '1px solid var(--border)', background: 'var(--bg2)', borderRadius: '12px', padding: '20px' }}>
          <Users size={20} color="var(--teal)" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '12px 0 8px' }}>Community feed</h2>
          <p style={{ color: 'var(--text2)', fontSize: '13px', lineHeight: 1.7, marginBottom: '14px' }}>
            Applicants share company-specific signal — interview experiences, offer timelines, red flags — so future candidates know what they're actually walking into.
          </p>
          <Link href="/community" style={{ color: 'var(--teal)', fontSize: '13px', fontWeight: 800, textDecoration: 'none' }}>Open community feed</Link>
        </div>
      </section>
    </div>
  )
}
