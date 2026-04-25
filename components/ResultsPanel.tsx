"use client";

import { AnalysisResult, Recommendation } from "@/lib/types";
import ScoreGauge from "./ScoreGauge";
import SignalBadge from "./SignalBadge";
import TimelinePanel from "./TimelinePanel";
import ROIScore from "./ROIScore";
import SkillMatchPanel from "./SkillMatchPanel";

interface Props {
  result: AnalysisResult;
  companyName?: string;
  onReset: () => void;
}

const REC_CONFIG: Record<
  Recommendation,
  { color: string; bg: string; border: string; icon: string; tagline: string }
> = {
  Apply: {
    color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25",
    icon: "🚀", tagline: "Strong signals of a genuine, active opening. Worth your time.",
  },
  "Network First": {
    color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/25",
    icon: "🤝", tagline: "Mixed signals. Reach out to someone at the company before applying.",
  },
  "Low Priority": {
    color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/25",
    icon: "⚠️", tagline: "Several red flags. Apply only if it's a dream company.",
  },
  Skip: {
    color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/25",
    icon: "🚫", tagline: "High ghost job probability. Your energy is better spent elsewhere.",
  },
};

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function ResultsPanel({ result, companyName, onReset }: Props) {
  const rec = REC_CONFIG[result.recommendation];
  const positiveSignals = result.signals.filter((s) => s.type === "positive");
  const negativeSignals = result.signals.filter((s) => s.type === "negative");

  const ghostColor = result.ghostRisk >= 70 ? "text-red-400" : result.ghostRisk >= 45 ? "text-amber-400" : "text-emerald-400";
  const ghostBar   = result.ghostRisk >= 70 ? "bg-red-500"   : result.ghostRisk >= 45 ? "bg-amber-500"   : "bg-emerald-500";

  return (
    <div className="space-y-5 animate-slide-up">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Analysis Complete</h2>
          {companyName && <p className="text-slate-400 text-sm mt-0.5">{companyName}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
            result.analysisMode === "ai-enhanced"
              ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
              : "bg-slate-700/60 border-slate-600/50 text-slate-400"
          }`}>
            {result.analysisMode === "ai-enhanced" ? "✨ AI Enhanced" : "⚡ Rule-Based"}
          </span>
          <button
            onClick={onReset}
            className="text-slate-400 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-700/60"
          >
            ← New
          </button>
        </div>
      </div>

      {/* ── Scores ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gauge */}
        <div className="md:col-span-1 bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 flex items-center justify-center">
          <ScoreGauge score={result.realHireProbability} label="Posting Legitimacy" />
        </div>

        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          {/* Ghost risk */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Ghost Risk</p>
            <p className={`text-4xl font-black ${ghostColor}`}>{result.ghostRisk}%</p>
            <MiniBar value={result.ghostRisk} color={ghostBar} />
          </div>

          {/* Confidence */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Confidence</p>
            <p className="text-4xl font-black text-violet-400">{result.confidence}%</p>
            <MiniBar value={result.confidence} color="bg-violet-500" />
          </div>

          {/* Recommendation */}
          <div className={`col-span-2 ${rec.bg} border ${rec.border} rounded-2xl p-5 flex items-center gap-4`}>
            <span className="text-4xl">{rec.icon}</span>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Recommendation</p>
              <p className={`text-2xl font-black ${rec.color}`}>{result.recommendation}</p>
              <p className="text-slate-400 text-sm mt-0.5">{rec.tagline}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Resume Fit (only shown when resume was uploaded) ──── */}
      {result.skillMatch && <SkillMatchPanel skillMatch={result.skillMatch} />}

      {/* ── ROI Score — the emotional punch ──────────────────── */}
      <ROIScore roi={result.roiScore} />

      {/* ── Timeline ─────────────────────────────────────────── */}
      <TimelinePanel events={result.timeline} />

      {/* ── What To Do Instead ───────────────────────────────── */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🎯</span>
          <h3 className="text-white font-bold">What To Do Instead</h3>
        </div>
        <p className="text-slate-200 font-medium mb-4">{result.actionPlan.primary}</p>
        <ul className="space-y-2.5">
          {result.actionPlan.actions.map((action, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
              <span className="text-violet-500 mt-0.5 flex-shrink-0">→</span>
              {action}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Summary ──────────────────────────────────────────── */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Analysis Summary</p>
        <p className="text-slate-200 leading-relaxed">{result.summary}</p>
      </div>

      {/* ── Signals ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
          Detected Signals ({result.signals.length})
        </p>

        {positiveSignals.length > 0 && (
          <div>
            <p className="text-xs text-emerald-600 font-medium mb-2">
              ✓ Positive Indicators ({positiveSignals.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {positiveSignals.map((s, i) => <SignalBadge key={i} signal={s} />)}
            </div>
          </div>
        )}

        {negativeSignals.length > 0 && (
          <div>
            <p className="text-xs text-red-600 font-medium mb-2">
              ✗ Red Flags ({negativeSignals.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {negativeSignals.map((s, i) => <SignalBadge key={i} signal={s} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
