// Rule-based scoring engine — runs client-side for instant results
// AI-enhanced mode calls Flask backend

export interface AnalysisResult {
  score: number
  ghost_risk_pct: number
  confidence_pct: number
  recommendation: 'Apply' | 'Network First' | 'Low Priority' | 'Skip'
  positive_signals: SignalResult[]
  negative_signals: SignalResult[]
  ai_summary?: string
}

export interface SignalResult {
  label: string
  impact: number
  detected: boolean
}

export function analyzeJobPosting(description: string): AnalysisResult {
  const text = description.toLowerCase()
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