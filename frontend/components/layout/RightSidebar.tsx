export default function RightSidebar() {
  return (
    <aside style={{ position: 'sticky', top: '76px', alignSelf: 'start' }}>
      {/* AI Digest */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(20,184,166,0.08))',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '14px',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          fontWeight: 500,
          color: 'var(--amber)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{
            width: '6px', height: '6px',
            borderRadius: '50%',
            background: 'var(--amber)',
            animation: 'pulse 2s infinite',
          }} />
          AI Digest — Google
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6, fontStyle: 'italic' }}>
          "Applicants report medium-hard OAs with heavy LC-style problems. Response times average 3–4 weeks. Recruiter communication is inconsistent but roles appear active. SWE-L4 highly competitive."
        </p>
      </div>

      {/* Hiring Signals */}
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '14px',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          fontWeight: 500,
          color: 'var(--text3)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '14px',
        }}>Google · SWE-L4 Signals</div>

        {[
          { label: 'Real-hire probability', val: '62%', color: 'var(--amber)' },
          { label: 'OA difficulty', val: 'Medium-Hard', color: 'var(--text)' },
          { label: 'Interview rounds', val: '5–6', color: 'var(--text)' },
          { label: 'Time to hear back', val: '3–4 weeks', color: 'var(--text)' },
          { label: 'Ghost job risk', val: 'Low', color: 'var(--green)' },
        ].map((s, i, arr) => (
          <div key={s.label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '7px 0',
            borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{s.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500, color: s.color }}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* Response Timeline */}
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '16px',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          fontWeight: 500,
          color: 'var(--text3)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '14px',
        }}>Response Timeline</div>

        {[
          { label: '1 week', pct: 18, color: 'var(--green)' },
          { label: '2–3 weeks', pct: 44, color: 'var(--amber)' },
          { label: '4+ weeks', pct: 31, color: 'var(--red)' },
          { label: 'No response', pct: 7, color: 'var(--text3)' },
        ].map((row) => (
          <div key={row.label} style={{ marginBottom: '10px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text3)',
              marginBottom: '4px',
            }}>
              <span>{row.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{row.pct}%</span>
            </div>
            <div style={{ height: '4px', background: 'var(--bg3)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${row.pct}%`, height: '100%', background: row.color, borderRadius: '2px' }} />
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}