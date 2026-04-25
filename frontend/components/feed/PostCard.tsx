'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowUp, ArrowDown, MessageSquare, Share2 } from 'lucide-react'
import { Post } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

interface Props { post: Post }

const postTypeBadge: Record<string, string> = {
  OA: 'bg-blue-900 text-blue-300',
  interview: 'bg-green-900 text-green-300',
  recruiter: 'bg-yellow-900 text-yellow-300',
  ghost: 'bg-red-900 text-red-300',
  advice: 'bg-zinc-800 text-zinc-400',
}

const difficultyLabel = ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard']

export default function PostCard({ post }: Props) {
  const [votes, setVotes] = useState(post.vote_count ?? 0)
  const [voted, setVoted] = useState<1 | -1 | 0>(0)

  const handleVote = (dir: 1 | -1) => {
    if (voted === dir) { setVotes(v => v - dir); setVoted(0) }
    else { setVotes(v => v + dir - voted); setVoted(dir) }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex gap-3">

        {/* Vote column */}
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <button
            onClick={() => handleVote(1)}
            className={`p-1 rounded transition-colors ${voted === 1 ? 'text-violet-400' : 'text-zinc-500 hover:text-violet-400'}`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-zinc-300">{votes}</span>
          <button
            onClick={() => handleVote(-1)}
            className={`p-1 rounded transition-colors ${voted === -1 ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'}`}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-500 mb-1">
            {post.companies?.name && (
              <span className="text-violet-400 font-medium">{post.companies.name}</span>
            )}
            {post.companies?.name && <span>•</span>}
            <span>{post.is_anonymous ? 'anonymous' : `u/${post.profiles?.username}`}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>

            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${postTypeBadge[post.post_type]}`}>
              {post.post_type}
            </span>

            {post.difficulty && (
              <span className="text-zinc-500">
                {difficultyLabel[post.difficulty]} ({post.difficulty}/5)
              </span>
            )}

            {post.got_response !== null && (
              <span className={post.got_response ? 'text-green-400' : 'text-red-400'}>
                {post.got_response ? '✓ Got response' : '✗ No response'}
              </span>
            )}

            {post.response_time_days !== null && post.got_response && (
              <span className="text-zinc-500">{post.response_time_days}d to respond</span>
            )}
          </div>

          {/* Role title */}
          {post.role_title && (
            <p className="text-sm font-semibold text-zinc-200 mb-1">{post.role_title}</p>
          )}

          {/* Content */}
          <Link href={`/post/${post.id}`}>
            <p className="text-sm text-zinc-300 line-clamp-3 hover:text-white transition-colors cursor-pointer mb-2">
              {post.content}
            </p>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {post.comment_count ?? 0} comments
            </Link>
            <button className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}