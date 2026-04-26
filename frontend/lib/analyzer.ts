// Rule-based scoring engine — runs client-side for instant results
// AI-enhanced mode calls Flask backend

const SKILL_KEYWORDS = [
  'react', 'typescript', 'javascript', 'python', 'node', 'nodejs', 'sql', 'postgresql',
  'postgres', 'redis', 'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'graphql', 'rest',
  'api', 'flask', 'django', 'fastapi', 'next', 'nextjs', 'tailwind', 'css', 'html',
  'machine learning', 'ml', 'ai', 'llm', 'data science', 'analytics', 'tableau', 'spark',
  'java', 'go', 'golang', 'rust', 'c++', 'swift', 'kotlin', 'ruby', 'rails', 'php',
  'mongodb', 'dynamodb', 'firebase', 'supabase', 'git', 'ci/cd', 'agile', 'scrum',
  'product management', 'figma', 'ux', 'ui', 'leadership', 'communication', 'linux',
  'terraform', 'ansible', 'kafka', 'elasticsearch', 'nginx', 'pandas', 'numpy', 'pytorch',
  'tensorflow', 'openai', 'langchain', 'microservices', 'serverless', 'websocket',
]

function parseRequiredYears(jobDescription: string): number | null {
  const match = jobDescription.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i)
  return match ? parseInt(match[1]) : null
}

function inferResumeYears(resumeText: string): number | null {
  const yearMatches = resumeText.match(/20(1[5-9]|2[0-4])/g)
  if (!yearMatches || yearMatches.length < 2) return null
  const years = yearMatches.map(Number).sort()
  return new Date().getFullYear() - years[0]
}

function inferLevel(text: string): 'student' | 'junior' | 'mid' | 'senior' {
  const t = text.toLowerCase()
  if (/\b(intern|student|coursework|university|college|bootcamp)\b/.test(t)) return 'student'
  if (/\b(senior|staff|principal|lead|architect|director|vp|head of)\b/.test(t)) return 'senior'
  if (/\b(3\+|4\+|5\+|6\+|7\+|8\+|9\+|10\+)\s*years?\b/.test(t)) return 'senior'
  if (/\b(mid.level|mid level|2\+|3\+)\s*years?\b/.test(t)) return 'mid'
  return 'junior'
}

export function computeCandidateFit(resumeText: string, jobDescription: string): string {
  const resumeLower = resumeText.toLowerCase()
  const jobLower = jobDescription.toLowerCase()

  const matched = SKILL_KEYWORDS.filter(k => resumeLower.includes(k) && jobLower.includes(k))
  const jobOnly = SKILL_KEYWORDS.filter(k => !resumeLower.includes(k) && jobLower.includes(k))
  const resumeOnly = SKILL_KEYWORDS.filter(k => resumeLower.includes(k) && !jobLower.includes(k))

  const totalJobSkills = matched.length + jobOnly.length
  const fitPct = totalJobSkills > 0 ? Math.round((matched.length / totalJobSkills) * 100) : 0

  const requiredYears = parseRequiredYears(jobDescription)
  const resumeYears = inferResumeYears(resumeText)
  const resumeLevel = inferLevel(resumeText)
  const jobLevel = inferLevel(jobDescription)

  const lines: string[] = []

  // Overall fit
  if (totalJobSkills === 0) {
    lines.push('No recognizable technical skills found in this posting — fit is hard to assess automatically. Review the requirements manually.')
  } else if (fitPct >= 70) {
    lines.push(`Strong skill match: your resume covers ${matched.length} of ${totalJobSkills} detected required skills (${fitPct}% overlap).`)
  } else if (fitPct >= 40) {
    lines.push(`Partial skill match: your resume covers ${matched.length} of ${totalJobSkills} detected required skills (${fitPct}% overlap). Targetable with some prep.`)
  } else {
    lines.push(`Low skill overlap: your resume matches ${matched.length} of ${totalJobSkills} detected required skills (${fitPct}%). This role may require significant upskilling.`)
  }

  // Matched skills
  if (matched.length > 0) {
    lines.push(`Skills you already have: ${matched.slice(0, 8).map(s => s.toUpperCase()).join(', ')}.`)
  }

  // Gaps
  if (jobOnly.length > 0) {
    lines.push(`Skills to address before applying: ${jobOnly.slice(0, 5).map(s => s.toUpperCase()).join(', ')}.`)
  }

  // Transferable extras
  if (resumeOnly.length > 0) {
    lines.push(`You also bring ${resumeOnly.slice(0, 4).map(s => s.toUpperCase()).join(', ')} — not required, but potentially differentiating.`)
  }

  // Experience level check
  if (requiredYears !== null && resumeYears !== null) {
    if (resumeYears >= requiredYears) {
      lines.push(`Experience level looks like a match: role asks for ${requiredYears}+ years and your resume suggests ~${resumeYears} years.`)
    } else {
      lines.push(`Potential experience gap: role asks for ${requiredYears}+ years, your resume suggests ~${resumeYears} years. Consider highlighting impact over tenure.`)
    }
  } else if (resumeLevel !== jobLevel) {
    const levelMap = { student: 'entry-level', junior: 'junior', mid: 'mid-level', senior: 'senior' }
    lines.push(`Seniority signal: your resume reads as ${levelMap[resumeLevel]} while this role appears to target ${levelMap[jobLevel]} candidates.`)
  }

  return lines.join(' ')
}

export interface AnalysisResult {
  score: number
  ghost_risk_pct: number
  confidence_pct: number
  recommendation: 'Apply' | 'Network First' | 'Low Priority' | 'Skip'
  positive_signals: SignalResult[]
  negative_signals: SignalResult[]
  ai_summary?: string
  candidate_fit?: string
}

export interface SignalResult {
  label: string
  impact: number
  detected: boolean
}

export function analyzeJobPosting(description: string): AnalysisResult {
  let score = 50 // baseline
  const positiveSignals: SignalResult[] = []
  const negativeSignals: SignalResult[] = []

  // --- POSITIVE SIGNALS ---
  const salaryPattern = /\$[\d,]+|\d+k\s*[-–]\s*\d+k|salary range|compensation range/i
  if (salaryPattern.test(description)) {
    score += 15
    positiveSignals.push({ label: 'Salary range provided', impact: 15, detected: true })
  }

  const responsibilitiesPattern = /you will|you'll|responsibilities include|your role|day.to.day/i
  if (responsibilitiesPattern.test(description) && description.length > 400) {
    score += 12
    positiveSignals.push({ label: 'Detailed responsibilities', impact: 12, detected: true })
  }

  const interviewPattern = /interview process|hiring process|next steps|phone screen|technical interview|take.home/i
  if (interviewPattern.test(description)) {
    score += 12
    positiveSignals.push({ label: 'Interview process outlined', impact: 12, detected: true })
  }

  const urgencyPattern = /\bimmediately\b|\basap\b|\burgent\b|\bstart date\b/i
  if (urgencyPattern.test(description)) {
    score += 10
    positiveSignals.push({ label: 'Urgency signals (ASAP/Immediate)', impact: 10, detected: true })
  }

  const teamPattern = /team of|you'll work with|reporting to|alongside|collaborate with/i
  if (teamPattern.test(description)) {
    score += 10
    positiveSignals.push({ label: 'Team structure described', impact: 10, detected: true })
  }

  const techPattern = /react|python|typescript|kubernetes|aws|gcp|azure|postgres|redis/i
  if (techPattern.test(description)) {
    score += 10
    positiveSignals.push({ label: 'Specific tech stack', impact: 10, detected: true })
  }

  const benefitsPattern = /health insurance|401k|pto|equity|stock options|dental|vision|parental leave/i
  if (benefitsPattern.test(description)) {
    const impact = description.match(/health|dental|vision|401|equity/gi)?.length ?? 1
    const pts = Math.min(8, 4 + impact)
    score += pts
    positiveSignals.push({ label: 'Benefits package detailed', impact: pts, detected: true })
  }

  // --- NEGATIVE SIGNALS ---
  const buzzwordPattern = /synergy|leverage|rockstar|ninja|guru|thought leader|fast.paced environment|wear many hats/i
  const buzzwordCount = (description.match(buzzwordPattern) || []).length
  if (buzzwordCount >= 3) {
    score -= 10
    negativeSignals.push({ label: 'Buzzword overload', impact: -10, detected: true })
  }

  if (!salaryPattern.test(description)) {
    score -= 10
    negativeSignals.push({ label: 'No salary listed', impact: -10, detected: true })
  }

  if (description.length < 300) {
    score -= 18
    negativeSignals.push({ label: 'Very sparse description', impact: -18, detected: true })
  } else if (description.length < 600) {
    score -= 10
    negativeSignals.push({ label: 'Short description', impact: -10, detected: true })
  }

  const vaguePattern = /various duties|other duties as assigned|fast.paced|dynamic environment/i
  if (vaguePattern.test(description)) {
    score -= 10
    negativeSignals.push({ label: 'Vague responsibilities', impact: -10, detected: true })
  }

  const unrealisticPattern = /10\+\s*years.*junior|entry level.*10 years|must know everything/i
  if (unrealisticPattern.test(description)) {
    score -= 12
    negativeSignals.push({ label: 'Unrealistic requirements', impact: -12, detected: true })
  }

  const vagueTitles = /specialist ii|associate iii|various positions|multiple openings/i
  if (vagueTitles.test(description)) {
    score -= 12
    negativeSignals.push({ label: 'Vague role title', impact: -12, detected: true })
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score))
  const ghost_risk_pct = Math.max(0, Math.min(100, 100 - score))
  const confidence_pct = Math.min(95, 60 + positiveSignals.length * 4 + negativeSignals.length * 3)

  let recommendation: AnalysisResult['recommendation']
  if (score >= 70) recommendation = 'Apply'
  else if (score >= 50) recommendation = 'Network First'
  else if (score >= 35) recommendation = 'Low Priority'
  else recommendation = 'Skip'

  return {
    score,
    ghost_risk_pct,
    confidence_pct,
    recommendation,
    positive_signals: positiveSignals,
    negative_signals: negativeSignals,
  }
}
