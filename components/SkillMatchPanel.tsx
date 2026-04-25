"use client";

import { SkillMatch } from "@/lib/types";

interface Props {
  skillMatch: SkillMatch;
}

function FitArc({ score }: { score: number }) {
  const radius = 44;
  const circumference = Math.PI * radius; // half-circle arc length
  const progress = (score / 100) * circumference;
  const color =
    score >= 75 ? "#34d399" : score >= 50 ? "#f59e0b" : score >= 25 ? "#f97316" : "#f87171";

  return (
    <svg width="120" height="68" viewBox="0 0 120 68" fill="none">
      {/* Track */}
      <path
        d="M 12 62 A 44 44 0 0 1 108 62"
        stroke="#1e293b"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      {/* Progress */}
      <path
        d="M 12 62 A 44 44 0 0 1 108 62"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${progress} ${circumference}`}
        fill="none"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x="60" y="56" textAnchor="middle" fill={color} fontSize="20" fontWeight="900">
        {score}
      </text>
    </svg>
  );
}

export default function SkillMatchPanel({ skillMatch }: Props) {
  const { fitScore, matchingSkills, missingSkills, verdict, worthApplying } = skillMatch;

  const worthColor = worthApplying
    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
    : "text-red-400 bg-red-500/10 border-red-500/25";

  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">🎯</span>
        <h3 className="text-white font-bold">Resume Fit Analysis</h3>
        <span className="ml-auto text-xs text-slate-500 font-medium">Is this role right for you?</span>
      </div>

      {/* Score + verdict row */}
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <FitArc score={fitScore} />
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold -mt-1">Fit Score</p>
        </div>

        <div className="flex-1 space-y-3">
          <p className="text-slate-200 text-sm leading-relaxed">{verdict}</p>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold ${worthColor}`}>
            <span>{worthApplying ? "✓" : "✗"}</span>
            {worthApplying ? "Worth applying based on your skills" : "Skill gap may hurt your chances"}
          </div>
        </div>
      </div>

      {/* Skills grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {matchingSkills.length > 0 && (
          <div>
            <p className="text-xs text-emerald-500 font-semibold uppercase tracking-wider mb-2">
              ✓ Matching Skills ({matchingSkills.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {matchingSkills.map((skill, i) => (
                <span
                  key={i}
                  className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs px-2.5 py-1 rounded-full font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {missingSkills.length > 0 && (
          <div>
            <p className="text-xs text-red-500 font-semibold uppercase tracking-wider mb-2">
              ✗ Gaps / Missing ({missingSkills.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((skill, i) => (
                <span
                  key={i}
                  className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-2.5 py-1 rounded-full font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
