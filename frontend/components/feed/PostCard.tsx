'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Post } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

interface Props { post: Post }

const catBadgeStyle: Record<string, { background: string; color: string }> = {
  OA:        { background: 'var(--purple-dim)', color: 'var(--purple)' },
  interview: { background: 'var(--teal-dim)',   color: 'var(--teal)'   },
  ghost:     { background: 'var(--red-dim)',     color: 'var(--red)'    },
  recruiter: { background: 'var(--amber-dim)',   color: 'var(--amber)'  },
  advice:    { background: 'var(--green-dim)',   color: 'var(--green)'  },
}

const signalDotColor: Record<string, string> = {
  ghost: 'var(--red)',
  recruiter: 'var(--amber)',
  OA: 'var(--purple)',
  interview: 'var(--teal)',
  advice: 'var(--green)',
}

const signalText: Record<string, string> = {
  OA: 'Assessment signal',
  ghost: 'Ghost risk flagged',
  interview: 'Interview report',
  recruiter: 'Recruiter intel',
  advice: 'Community advice',
}

function avatarColor(str: string) {
  const colors = ['#7c3aed','#0891b2','#059669','#d97706','#dc2626','#db2777']
  let sum = 0
  for (const c of str) sum += c.charCodeAt(0)
  return colors[sum % colors.length]
}

export default function PostCard({ post }: Props) {
  const [votes, setVotes] = useState(post.vote_count ?? 0)
  const [voted, setVoted] = useState(false)

  const handleVote = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (voted) { setVotes(v => v - 1); setVoted(false) }
    else { setVotes(v => v + 1); setVoted(true) }
  }

  const authorLabel = post.is_anonymous
    ? 'anon'
    : post.profiles?.username ?? 'unknown'

  const badgeStyle = catBadgeStyle[post.post_type] ?? catBadgeStyle.advice
  const dotColor = signalDotColor[post.post_type] ?? 'var(--text3)'
  const sigText = signalText[post.post_type] ?? 'Signal'

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '16px 18px',
      marginBottom: '12px',
      cursor: 'pointer',
      transition: 'border-color 0.15s',
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        {/* Avatar */}
        <div style={{
          width: '28px', height: '28px',
          borderRadius: '50%',
          background: avatarColor(authorLabel),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 700, color: '#fff',
          flexShrink: 0,
        }}>
          {authorLabel.slice(0, 2).toUpperCase()}
        </div>

        {/* Meta */}
        <div style={{
          fontSize: '12px',
          color: 'var(--text3)',
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          flexWrap: 'wrap',
          flex: 1,
        }}>
          {post.companies?.name && (
            <span style={{
              fontSize: '12px', fontWeight: 600,
              padding: '2px 8px', borderRadius: '5px',
              background: 'var(--bg3)', color: 'var(--text)',
              border: '1px solid var(--border2)',
            }}>{post.companies.name}</span>
          )}

          <span style={{
            fontSize: '10px', fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            padding: '2px 7px', borderRadius: '4px',
            textTransform: 'uppercase', letterSpacing: '0.5px',
            background: badgeStyle.background,
            color: badgeStyle.color,
          }}>{post.post_type}</span>

          {post.role_title && <span>{post.role_title}</span>}
          <span style={{ color: 'var(--text3)' }}>
            · {post.is_anonymous ? 'anonymous' : `u/${post.profiles?.username}`}
            · {formatDistanceToNow(new Date(post.created_at.endsWith('Z') ? post.created_at : post.created_at + 'Z'))} ago
          </span>
        </div>
      </div>

      {/* Content */}
      <Link href={`/post/${post.id}`} style={{ textDecoration: 'none' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '15px', fontWeight: 600,
          color: 'var(--text)', marginBottom: '7px', lineHeight: 1.4,
        }}>
          {post.role_title
            ? `${post.companies?.name ?? ''} ${post.role_title} — ${post.content.slice(0, 60)}${post.content.length > 60 ? '...' : ''}`
            : post.content.slice(0, 80)}
        </div>
        <div style={{
          fontSize: '13px', color: 'var(--text2)',
          lineHeight: 1.6, marginBottom: '12px',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {post.content}
        </div>
      </Link>

      {/* Stats row (difficulty, response) */}
      {(post.difficulty || post.got_response !== null || post.response_time_days) && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {post.difficulty && (
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
              Difficulty: {post.difficulty}/5
            </span>
          )}
          {post.got_response !== null && (
            <span style={{
              fontSize: '11px', fontFamily: 'var(--font-mono)',
              color: post.got_response ? 'var(--green)' : 'var(--red)',
            }}>
              {post.got_response ? '✓ Got response' : '✗ No response'}
            </span>
          )}
          {post.response_time_days && (
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
              {post.response_time_days}d to respond
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={handleVote}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '12px', fontWeight: 600,
            padding: '5px 10px', borderRadius: '6px',
            border: `1px solid ${voted ? 'var(--amber)' : 'var(--border)'}`,
            background: voted ? 'var(--amber-dim)' : 'none',
            color: voted ? 'var(--amber)' : 'var(--text2)',
            cursor: 'pointer', transition: 'all 0.12s',
            fontFamily: 'var(--font-mono)',
          }}
        >
          ▲ {votes}
        </button>

        <Link href={`/post/${post.id}`} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          fontSize: '12px', fontWeight: 500,
          color: 'var(--text3)', textDecoration: 'none',
          transition: 'color 0.12s',
        }}>
          💬 {post.comment_count ?? 0} comments
        </Link>

        <span style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '11px', color: 'var(--text3)',
          fontFamily: 'var(--font-mono)',
        }}>
          <span style={{
            width: '6px', height: '6px',
            borderRadius: '50%',
            background: dotColor,
          }} />
          {sigText}
        </span>
      </div>
    </div>
  )
}