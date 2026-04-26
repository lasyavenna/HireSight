'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PostCard from '@/components/feed/PostCard'
import PostComposer from '@/components/feed/PostComposer'
import LeftSidebar from '@/components/layout/LeftSidebar'
import RightSidebar from '@/components/layout/RightSidebar'
import { Post } from '@/lib/types'

const sortOptions = ['Hot', 'New', 'Top']

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('New')
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [sort])

  async function fetchPosts() {
    setLoading(true)
    setFetchError('')

    const { data, error } = await supabase
      .from('posts')
      .select(`*, profiles(username, avatar_url, role), companies(name, industry)`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      // Fallback: fetch posts without joins so we at least show something
      const { data: plain, error: plainError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (plainError) {
        setFetchError('Could not load posts. Check your Supabase connection.')
      } else if (plain) {
        setPosts(plain.map(p => ({ ...p, vote_count: 0, comment_count: 0 })))
      }
    } else if (data) {
      setPosts(data.map(post => ({ ...post, vote_count: 0, comment_count: post.comment_count ?? 0 })))
    }

    setLoading(false)
  }

  const filteredPosts = (() => {
    let result = filter === 'all' ? posts : posts.filter(p => p.post_type === filter)
    if (sort === 'Top') result = [...result].sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
    else if (sort === 'Hot') result = [...result].sort((a, b) => {
      const age = (d: string) => (Date.now() - new Date(d).getTime()) / 3600000
      const score = (p: Post) => (p.vote_count ?? 0) / Math.pow(age(p.created_at) + 2, 1.5)
      return score(b) - score(a)
    })
    return result
  })()

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '220px 1fr 280px',
      gap: '20px',
      padding: '24px 20px',
    }}>
      <LeftSidebar activeFilter={filter} onFilter={setFilter} />

      <main>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
            Applicant Intelligence Feed
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {sortOptions.map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                style={{
                  fontSize: '12px', fontWeight: 500,
                  padding: '5px 12px', borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: sort === s ? 'var(--bg3)' : 'none',
                  color: sort === s ? 'var(--text)' : 'var(--text2)',
                  cursor: 'pointer', transition: 'all 0.12s',
                  fontFamily: 'var(--font)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <PostComposer onPost={fetchPosts} />

        {fetchError && (
          <div style={{ border: '1px solid rgba(224,96,112,0.3)', background: 'var(--red-dim)', borderRadius: '10px', padding: '12px 16px', color: 'var(--red)', fontSize: '13px', marginBottom: '16px' }}>
            {fetchError}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '48px 0', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            Loading feed...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '48px 0' }}>
            <div style={{ fontSize: '16px', marginBottom: '6px' }}>No posts yet</div>
            <div style={{ fontSize: '13px' }}>Be the first to share your experience</div>
          </div>
        ) : (
          filteredPosts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </main>

      <RightSidebar />
    </div>
  )
}
