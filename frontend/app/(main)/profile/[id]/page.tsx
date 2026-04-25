import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import PostCard from '@/components/feed/PostCard'
import { Post, Profile } from '@/lib/types'

async function getProfile(id: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

async function getUserPosts(id: string): Promise<Post[]> {
  const { data } = await supabase
    .from('posts')
    .select(`*, profiles(username, avatar_url, role), companies(name, industry), votes(vote_type)`)
    .eq('user_id', id)
    .eq('is_anonymous', false)
    .order('created_at', { ascending: false })
    .limit(20)

  return (data || []).map((post: any) => ({
    ...post,
    vote_count: (post.votes || []).reduce((acc: number, v: any) => acc + v.vote_type, 0),
    comment_count: post.comment_count ?? 0,
  }))
}

const roleColors: Record<string, { bg: string; color: string }> = {
  recruiter:    { bg: 'var(--amber-dim)',  color: 'var(--amber)'  },
  professional: { bg: 'var(--teal-dim)',   color: 'var(--teal)'   },
  job_seeker:   { bg: 'var(--purple-dim)', color: 'var(--purple)' },
}

function avatarColor(str: string) {
  const colors = ['#7c3aed','#0891b2','#059669','#d97706','#dc2626','#db2777']
  let sum = 0
  for (const c of str) sum += c.charCodeAt(0)
  return colors[sum % colors.length]
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getProfile(id)
  if (!profile) notFound()

  const posts = await getUserPosts(id)
  const badge = roleColors[profile.role] ?? roleColors.job_seeker
  const initials = (profile.display_name ?? profile.username).slice(0, 2).toUpperCase()

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 20px' }}>

      {/* Profile header */}
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '24px',
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start',
      }}>
        {/* Avatar */}
        <div style={{
          width: '72px', height: '72px',
          borderRadius: '50%',
          background: avatarColor(profile.username),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', fontWeight: 800, color: '#fff',
          flexShrink: 0,
          fontFamily: 'var(--font-display)',
        }}>
          {initials}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px', fontWeight: 800,
              color: 'var(--text)', letterSpacing: '-0.5px',
            }}>
              {profile.display_name ?? profile.username}
            </h1>
            <span style={{
              fontSize: '11px', fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              padding: '3px 10px', borderRadius: '5px',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              background: badge.bg, color: badge.color,
            }}>
              {profile.role.replace('_', ' ')}
            </span>
          </div>

          <div style={{
            fontSize: '13px', color: 'var(--text3)',
            fontFamily: 'var(--font-mono)',
            marginBottom: '10px',
          }}>
            u/{profile.username}
          </div>

          {profile.bio && (
            <p style={{
              fontSize: '13px', color: 'var(--text2)',
              lineHeight: 1.6, marginBottom: '14px',
              maxWidth: '520px',
            }}>
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'Karma', val: profile.karma.toLocaleString(), color: 'var(--amber)' },
              { label: 'Posts', val: String(posts.length), color: 'var(--text)' },
              { label: 'Member since', val: new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), color: 'var(--text)' },
            ].map(s => (
              <div key={s.label}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '16px', fontWeight: 700,
                  color: s.color,
                }}>{s.val}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '1px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Posts section */}
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px', fontWeight: 500,
          color: 'var(--text3)',
          textTransform: 'uppercase', letterSpacing: '1px',
          marginBottom: '14px',
        }}>
          Public Posts ({posts.length})
        </div>

        {posts.length === 0 ? (
          <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: 'var(--text3)',
          }}>
            <div style={{ fontSize: '15px', marginBottom: '6px' }}>No public posts yet</div>
            <div style={{ fontSize: '12px' }}>Posts made anonymously won't appear here</div>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  )
}