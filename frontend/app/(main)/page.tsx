import { supabase } from '@/lib/supabase'
import PostCard from '@/components/feed/PostCard'
import PostComposer from '@/components/feed/PostComposer'
import { Post } from '@/lib/types'

async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles(username, avatar_url, role),
      companies(name, industry),
      votes(vote_type)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) { console.error(error); return [] }

  return (data || []).map((post: any) => ({
    ...post,
    vote_count: (post.votes || []).reduce((acc: number, v: any) => acc + v.vote_type, 0),
    comment_count: post.comment_count ?? 0,
  }))
}

const postTypeFilters = ['All', 'OA', 'interview', 'recruiter', 'ghost', 'advice']

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; type?: string }>
}) {
  const params = await searchParams
  const filter = params.filter || 'new'
  const typeFilter = params.type || 'All'

  const posts = await getPosts()

  const filteredPosts = typeFilter === 'All'
    ? posts
    : posts.filter((p) => p.post_type === typeFilter)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Career Feed</h1>
          <p className="text-xs text-zinc-500">Real experiences from real applicants</p>
        </div>
        <div className="flex gap-2">
          {['new', 'top', 'hot'].map((f) => (
            <a
              key={f}
              href={`?filter=${f}&type=${typeFilter}`}
              className={`px-3 py-1 text-xs rounded capitalize transition-colors ${
                filter === f
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {f}
            </a>
          ))}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {postTypeFilters.map((t) => (
          <a
            key={t}
            href={`?filter=${filter}&type=${t}`}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              typeFilter === t
                ? 'bg-violet-600 border-violet-600 text-white'
                : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
            }`}
          >
            {t}
          </a>
        ))}
      </div>

      <PostComposer />

      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="text-center text-zinc-500 py-16">
            <p className="text-lg mb-1">No posts yet</p>
            <p className="text-sm">Be the first to share your experience</p>
          </div>
        ) : (
          filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  )
}