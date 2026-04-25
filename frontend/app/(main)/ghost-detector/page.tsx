'use client'
import { useState } from 'react'
import { analyzeJobPosting, AnalysisResult } from '@/lib/analyzer'
import { CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react'

const recColors = {
  'Apply': 'text-green-400 bg-green-900/30 border-green-700',
  'Network First': 'text-yellow-400 bg-yellow-900/30 border-yellow-700',
  'Low Priority': 'text-orange-400 bg-orange-900/30 border-orange-700',
  'Skip': 'text-red-400 bg-red-900/30 border-red-700',
}

export default function GhostDetectorPage() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const analyze = () => {
    if (!input.trim()) return
    const r = analyzeJobPosting(input)
    setResult(r)
  }

  const analyzeWithAI = async () => {
    if (!input.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: input }),
      })
      const data = await res.json()
      setResult(prev => prev ? { ...prev, ai_summary: data.summary } : null)
    } catch (e) {
      console.error(e)
    }
    setAiLoading(false)
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Ghost Job Detector</h1>
        <p className="text-zinc-400 text-sm">Paste a job description to detect if it's a real opening or a ghost posting.</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[['47%', 'Average ghost rate'], ['3.2hrs', 'Avg time wasted'], ['12+', 'Signals checked']].map(([val, label]) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-violet-400">{val}</div>
            <div className="text-xs text-zinc-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={8}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-violet-500 mb-3"
        />
        <div className="flex gap-2">
          <button onClick={analyze} className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors">
            Analyze (Instant)
          </button>
          <button onClick={analyzeWithAI} disabled={aiLoading} className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors">
            {aiLoading ? 'Analyzing with AI...' : 'Analyze with AI'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Score + Recommendation */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-5xl font-black text-white">{result.score}</div>
                <div className="text-sm text-zinc-400">Legitimacy Score</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-400">{result.ghost_risk_pct}%</div>
                <div className="text-sm text-zinc-400">Ghost Risk</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-zinc-300">{result.confidence_pct}%</div>
                <div className="text-sm text-zinc-400">Confidence</div>
              </div>
            </div>

            {/* Score bar */}
            <div className="w-full bg-zinc-800 rounded-full h-3 mb-4">
              <div
                className="h-3 rounded-full transition-all duration-700 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ width: `${result.score}%` }}
              />
            </div>

            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold ${recColors[result.recommendation]}`}>
              {result.recommendation === 'Apply' && <TrendingUp className="w-4 h-4" />}
              {result.recommendation === 'Skip' && <XCircle className="w-4 h-4" />}
              {result.recommendation === 'Network First' && <AlertTriangle className="w-4 h-4" />}
              {result.recommendation}
            </div>
          </div>

          {/* Signals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Positive Signals
              </h3>
              <div className="space-y-2">
                {result.positive_signals.map(s => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-xs text-zinc-300">{s.label}</span>
                    <span className="text-xs text-green-400 font-medium">+{s.impact}</span>
                  </div>
                ))}
                {result.positive_signals.length === 0 && <p className="text-xs text-zinc-500">None detected</p>}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Red Flags
              </h3>
              <div className="space-y-2">
                {result.negative_signals.map(s => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-xs text-zinc-300">{s.label}</span>
                    <span className="text-xs text-red-400 font-medium">{s.impact}</span>
                  </div>
                ))}
                {result.negative_signals.length === 0 && <p className="text-xs text-zinc-500">None detected</p>}
              </div>
            </div>
          </div>

          {/* AI Summary */}
          {result.ai_summary && (
            <div className="bg-zinc-900 border border-violet-800/40 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-violet-400 mb-2">AI Analysis</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{result.ai_summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}