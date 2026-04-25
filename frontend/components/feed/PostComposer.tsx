'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PostComposer() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('text')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('Please sign in to post'); setLoading(false); return }

    const { error } = await supabase.from('posts').insert({
      author_id: user.id,
      title,
      body,
      post_type: type,
      community_id: null, // TODO: add community selector
    })
    if (!error) { setTitle(''); setBody('') }
    setLoading(false)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
      <div className="flex gap-2 mb-3">
        {['text', 'experience', 'question'].map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${type === t ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <input
        placeholder="Post title..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-violet-500"
      />
      <textarea
        placeholder="Share your experience, ask a question, or drop a link..."
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={3}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-violet-500 resize-none"
      />
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading || !title.trim()}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  )
}