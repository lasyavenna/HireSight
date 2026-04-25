'use client'

interface Props {
  activeFilter: string
  onFilter: (cat: string) => void
}

const categories = [
  { key: 'all', label: 'All Posts', color: '#8b90a8' },
  { key: 'OA', label: 'Online Assessments', color: 'var(--purple)' },
  { key: 'interview', label: 'Interviews', color: 'var(--teal)' },
  { key: 'ghost', label: 'Ghost Jobs', color: 'var(--red)' },
  { key: 'recruiter', label: 'Recruiter Intel', color: 'var(--amber)' },
  { key: 'advice', label: 'Advice', color: 'var(--green)' },
]

const trendingCompanies = [
  { name: 'Google', count: 142 },
  { name: 'Meta', count: 98 },
  { name: 'Stripe', count: 73 },
  { name: 'Airbnb', count: 61 },
  { name: 'OpenAI', count: 55 },
  { name: 'Databricks', count: 41 },
]

export default function LeftSidebar({ activeFilter, onFilter }: Props) {
  return (
    <aside style={{ position: 'sticky', top: '76px', alignSelf: 'start' }}>
      {/* Categories */}
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
          marginBottom: '12px',
        }}>Categories</div>

        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onFilter(cat.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '7px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: activeFilter === cat.key ? 'var(--amber)' : 'var(--text2)',
              background: activeFilter === cat.key ? 'var(--amber-dim)' : 'none',
              fontSize: '13px',
              fontWeight: 500,
              border: 'none',
              width: '100%',
              textAlign: 'left',
              marginBottom: '2px',
              transition: 'all 0.12s',
              fontFamily: 'var(--font)',
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: cat.color,
              flexShrink: 0,
            }} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Trending Companies */}
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
          marginBottom: '12px',
        }}>Trending Companies</div>

        {trendingCompanies.map((c, i) => (
          <div key={c.name} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 0',
            borderBottom: i < trendingCompanies.length - 1 ? '1px solid var(--border)' : 'none',
            cursor: 'pointer',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{c.name}</span>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text3)',
              background: 'var(--bg3)',
              padding: '2px 7px',
              borderRadius: '4px',
            }}>{c.count}</span>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
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
          marginBottom: '12px',
        }}>Quick Stats</div>

        {[
          { label: 'Posts today', val: '247', color: 'var(--text)' },
          { label: 'Ghost jobs flagged', val: '89', color: 'var(--red)' },
          { label: 'Avg response time', val: '3.2 wks', color: 'var(--amber)' },
        ].map((s) => (
          <div key={s.label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '7px 0',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{s.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500, color: s.color }}>{s.val}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}