'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Post, Comment } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

const catBadgeStyle: Record<string, { background: string; color: string }> = {
  OA:        { background: 'var(--purple-dim)', color: 'var(--purple)' },
  interview: { background: 'var(--teal-dim)',   color: 'var(--teal)'   },
  ghost:     { background: 'var(--red-dim)',     color: 'var(--red)'    },
  recruiter: { background: 'var(--amber-dim)',   color: 'var(--amber)'  },
  advice:    { background: 'var(--green-dim)',   color: 'var(--green)'  },
}

function avatarColor(str: string) {
  const colors = ['#7c3aed','#0891b2','#059669','#d97706','#dc2626','#db2777']
  let sum = 0
  for (const c of str) sum += c.charCodeAt(0)
  return colors[sum % colors.length]
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [voted, setVoted] = useState(false)
  const [votes, setVotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPost()
    fetchComments()

    // Realtime subscription for new comments
    const channel = supabase
      .channel(`post-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${id}`,
      }, (payload) => {
        fetchComments()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  async function fetchPost() {
    const { data } = await supabase
      .from('posts')
      .select(`*, profiles(username, avatar_url, role), companies(name, industry), votes(vote_type)`)
      .eq('id', id)
      .single()

    if (data) {
      const voteCount = (data.votes || []).reduce((acc: number, v: any) => acc + v.vote_type, 0)
      setPost({ ...data, vote_count: voteCount })
      setVotes(voteCount)
    }
    setLoading(false)
  }

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select(`*, profiles(username, avatar_url, role)`)
      .eq('post_id', id)
      .order('created_at', { ascending: true })

    setComments(data || [])
  }

  async function handleVote() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    if (voted) {
      await supabase.from('votes').delete().eq('post_id', id).eq('user_id', user.id)
      setVotes(v => v - 1)
      setVoted(false)
    } else {
      await supabase.from('votes').upsert({ post_id: id, user_id: user.id, vote_type: 1 })
      setVotes(v => v + 1)
      setVoted(true)
    }
  }

  async function handleComment() {
    if (!newComment.trim()) return
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); setSubmitting(false); return }

    await supabase.from('comments').insert({
      post_id: id,
      user_id: user.id,
      content: newComment.trim(),
    })

    setNewComment('')
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 20px', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text3)' }}>
          Loading post…
        </span>
      </div>
    )
  }

  if (!post) {
    return (
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 20px', textAlign: 'center' }}>
        <div style={{ color: 'var(--text2)', marginBottom: '12px' }}>Post not found</div>
        <Link href="/" style={{ color: 'var(--amber)', fontSize: '13px' }}>← Back to feed</Link>
      </div>
    )
  }

  const badge = catBadgeStyle[post.post_type] ?? catBadgeStyle.advice
  const authorLabel = post.is_anonymous ? 'anonymous' : `u/${post.profiles?.username}`

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 20px' }}>

      {/* Back */}
      <Link href="/" style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        fontSize: '13px', color: 'var(--text3)', textDecoration: 'none',
        marginBottom: '16px', transition: 'color 0.12s',
      }}>
        ← Back to feed
      </Link>

      {/* Post card */}
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: avatarColor(authorLabel),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {authorLabel.slice(0, 2).toUpperCase()}
          </div>

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
            background: badge.background, color: badge.color,
          }}>{post.post_type}</span>

          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
            {authorLabel} · {formatDistanceToNow(new Date(post.created_at))} ago
          </span>
        </div>

        {/* Role title */}
        {post.role_title && (
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px', fontWeight: 700,
            color: 'var(--text)', marginBottom: '12px',
            lineHeight: 1.3,
          }}>
            {post.role_title}
          </div>
        )}

        {/* Content */}
        <p style={{
          fontSize: '14px', color: 'var(--text2)',
          lineHeight: 1.75, marginBottom: '18px',
          whiteSpace: 'pre-wrap',
        }}>
          {post.content}
        </p>

        {/* Stats chips */}
        {(post.difficulty || post.got_response !== null || post.response_time_days) && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
            {post.difficulty && (
              <span style={{
                fontSize: '11px', fontFamily: 'var(--font-mono)',
                padding: '3px 10px', borderRadius: '5px',
                background: 'var(--bg3)', color: 'var(--text2)',
                border: '1px solid var(--border)',
              }}>Difficulty {post.difficulty}/5</span>
            )}
            {post.got_response !== null && (
              <span style={{
                fontSize: '11px', fontFamily: 'var(--font-mono)',
                padding: '3px 10px', borderRadius: '5px',
                background: post.got_response ? 'var(--green-dim)' : 'var(--red-dim)',
                color: post.got_response ? 'var(--green)' : 'var(--red)',
                border: `1px solid ${post.got_response ? 'rgba(34,197,94,0.2)' : 'rgba(244,63,94,0.2)'}`,
              }}>
                {post.got_response ? '✓ Got response' : '✗ No response'}
              </span>
            )}
            {post.response_time_days && (
              <span style={{
                fontSize: '11px', fontFamily: 'var(--font-mono)',
                padding: '3px 10px', borderRadius: '5px',
                background: 'var(--bg3)', color: 'var(--text2)',
                border: '1px solid var(--border)',
              }}>{post.response_time_days}d response time</span>
            )}
          </div>
        )}

        {/* Vote row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleVote}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', fontWeight: 600,
              padding: '6px 14px', borderRadius: '8px',
              border: `1px solid ${voted ? 'var(--amber)' : 'var(--border)'}`,
              background: voted ? 'var(--amber-dim)' : 'none',
              color: voted ? 'var(--amber)' : 'var(--text2)',
              cursor: 'pointer', transition: 'all 0.12s',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ▲ {votes} {votes === 1 ? 'upvote' : 'upvotes'}
          </button>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
            💬 {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      </div>

      {/* Comments section */}
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '20px',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px', fontWeight: 500,
          color: 'var(--text3)',
          textTransform: 'uppercase', letterSpacing: '1px',
          marginBottom: '16px',
        }}>
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </div>

        {/* Comment input */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()}
            placeholder="Share your experience or ask a question…"
            style={{
              flex: 1,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text)',
              fontFamily: 'var(--font)', fontSize: '13px',
              padding: '10px 14px', outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
          <button
            onClick={handleComment}
            disabled={submitting || !newComment.trim()}
            style={{
              background: 'var(--amber)', color: '#1a0e00',
              border: 'none', borderRadius: '8px',
              padding: '10px 18px', fontWeight: 700,
              cursor: 'pointer', fontSize: '13px',
              fontFamily: 'var(--font-display)',
              opacity: submitting || !newComment.trim() ? 0.5 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>

        {/* Comments list */}
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '24px 0', fontSize: '13px' }}>
            No comments yet — be the first to reply
          </div>
        ) : (
          comments.map((comment, i) => (
            <div key={comment.id} style={{
              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
              padding: '14px 0',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: '6px',
              }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: avatarColor(comment.profiles?.username ?? 'anon'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {(comment.profiles?.username ?? 'AN').slice(0, 2).toUpperCase()}
                </div>
                <Link
                  href={`/profile/${comment.user_id}`}
                  style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}
                >
                  {comment.profiles?.username ?? 'anonymous'}
                </Link>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                  {formatDistanceToNow(new Date(comment.created_at))} ago
                </span>
              </div>
              <p style={{
                fontSize: '13px', color: 'var(--text2)',
                lineHeight: 1.65, paddingLeft: '32px',
                whiteSpace: 'pre-wrap',
              }}>
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}