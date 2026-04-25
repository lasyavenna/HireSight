export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  role: 'job_seeker' | 'recruiter' | 'professional'
  karma: number
  created_at: string
}

export interface Company {
  id: string
  name: string
  industry: string | null
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  company_id: string | null
  role_title: string | null
  post_type: 'OA' | 'interview' | 'recruiter' | 'ghost' | 'advice'
  content: string
  difficulty: 1 | 2 | 3 | 4 | 5 | null
  response_time_days: number | null
  got_response: boolean | null
  is_anonymous: boolean
  created_at: string
  // joined fields
  profiles?: Profile
  companies?: Company
  vote_count?: number
  comment_count?: number
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Vote {
  id: string
  post_id: string
  user_id: string
  vote_type: 1 | -1
  created_at: string
}

export interface Resume {
  id: string
  user_id: string
  raw_text: string | null
  skills: string[] | null
  experience_level: 'student' | 'junior' | 'mid' | 'senior' | null
  created_at: string
}

export interface GhostAnalysis {
  id: string
  user_id: string | null
  job_title: string | null
  company_name: string | null
  job_description: string
  score: number
  ghost_risk_pct: number
  recommendation: 'Apply' | 'Network First' | 'Low Priority' | 'Skip'
  signals_detected: {
    positive: { label: string; impact: number }[]
    negative: { label: string; impact: number }[]
  } | null
  ai_summary: string | null
  created_at: string
}