'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PostCard from '@/components/feed/PostCard'
import PostComposer from '@/components/feed/PostComposer'
import LeftSidebar from '@/components/layout/LeftSidebar'
import RightSidebar from '@/components/layout/RightSidebar'
import { Post } from '@/lib/types'

const sortOptions = ['Hot', 'New', 'Top']
type PostRow = Post & {
  votes?: { vote_type: number }[]
  comment_count?: number
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('Hot')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .select(`*, profiles(username, avatar_url, role), companies(name, industry), votes(vote_type)`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      const mapped = (data as PostRow[]).map((post) => ({
        ...post,
        vote_count: (post.votes || []).reduce((acc, vote) => acc + vote.vote_type, 0),
        comment_count: post.comment_count ?? 0,
      }))
      setPosts(mapped)
    }
    setLoading(false)
  }

  const filteredPosts = filter === 'all'
    ? posts
    : posts.filter(p => p.post_type === filter)

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
