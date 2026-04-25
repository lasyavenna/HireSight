// Shared scoring logic (mirrors frontend/lib/analyzer.ts)
function analyzeJob(text) {
  let score = 50
  const signals = []

  if (/\$[\d,]+|\d+k\s*[-–]\s*\d+k/i.test(text)) { score += 15; signals.push({ label: 'Salary listed', positive: true }) }
  else { score -= 10; signals.push({ label: 'No salary', positive: false }) }

  if (/interview process|hiring process|phone screen/i.test(text)) { score += 12; signals.push({ label: 'Interview process outlined', positive: true }) }
  if (/react|python|typescript|kubernetes/i.test(text)) { score += 10; signals.push({ label: 'Specific tech stack', positive: true }) }
  if (text.length < 300) { score -= 18; signals.push({ label: 'Very sparse', positive: false }) }
  if (/synergy|rockstar|ninja|guru/i.test(text)) { score -= 10; signals.push({ label: 'Buzzwords detected', positive: false }) }

  score = Math.max(0, Math.min(100, score))
  let recommendation = score >= 70 ? 'Apply' : score >= 50 ? 'Network First' : score >= 35 ? 'Low Priority' : 'Skip'
  let ghostRisk = 100 - score

  return { score, ghostRisk, recommendation, signals }
}