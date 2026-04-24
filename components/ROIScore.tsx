"use client";

import { ROIScore as ROI } from "@/lib/types";

const CONFIG: Record<ROI["roiRating"], {
  color: string; bg: string; border: string; barColor: string;
}> = {
  "High":      { color: "text-emerald-400", bg: "bg-emerald-500/8",  border: "border-emerald-500/25", barColor: "bg-emerald-500" },
  "Medium":    { color: "text-amber-400",   bg: "bg-amber-500/8",    border: "border-amber-500/25",   barColor: "bg-amber-500"   },
  "Low":       { color: "text-orange-400",  bg: "bg-orange-500/8",   border: "border-orange-500/25",  barColor: "bg-orange-500"  },
  "Very Low":  { color: "text-red-400",     bg: "bg-red-500/8",      border: "border-red-500/25",     barColor: "bg-red-500"     },
};

interface MetricProps {
  icon: string;
  label: string;
  value: string;
}

function Metric({ icon, label, value }: MetricProps) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-3.5 text-center">
      <div className="text-xl mb-1.5">{icon}</div>
      <div className="text-white font-bold text-sm leading-tight">{value}</div>
      <div className="text-slate-500 text-xs mt-1">{label}</div>
    </div>
  );
}

export default function ROIScore({ roi }: { roi: ROI }) {
  const c = CONFIG[roi.roiRating];

  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl p-6`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">💸</span>
        <h3 className="text-white font-bold">Applicant ROI Score</h3>
        <span
          className={`ml-auto text-xs font-black px-3 py-1 rounded-full border ${c.color} ${c.bg} ${c.border} tracking-widest`}
        >
          {roi.roiRating.toUpperCase()}
        </span>
      </div>

      {/* The emotional verdict — this is the money line */}
      <blockquote className="text-slate-100 text-base leading-relaxed italic border-l-[3px] border-violet-500/60 pl-4 mb-6">
        &ldquo;{roi.verdict}&rdquo;
      </blockquote>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Metric icon="⏱"  label="Time to Apply"     value={roi.timeToApply} />
        <Metric icon="📬" label="Hear Back In"       value={roi.timeToHearBack} />
        <Metric icon="📩" label="Response Chance"    value={`${roi.responseChance}%`} />
        <Metric icon="🎯" label="Interview Chance"   value={`${roi.interviewChance}%`} />
      </div>

      {/* Visual response probability bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Response probability</span>
          <span className={c.color}>{roi.responseChance}%</span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full ${c.barColor} transition-all duration-1000`}
            style={{ width: `${roi.responseChance}%` }}
          />
        </div>
      </div>
    </div>
  );
}
