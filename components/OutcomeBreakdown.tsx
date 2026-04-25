"use client";

import { useEffect, useState } from "react";
import { OutcomeBreakdown as OB } from "@/lib/types";

interface Props {
  breakdown: OB;
}

const OUTCOMES = [
  {
    key: "filled"   as const,
    icon: "✅",
    label: "Role Actively Filled",
    bar:  "bg-emerald-500",
    text: "text-emerald-400",
    dot:  "bg-emerald-500",
  },
  {
    key: "ghost"    as const,
    icon: "👻",
    label: "Ghost / Pipeline Role",
    bar:  "bg-red-500",
    text: "text-red-400",
    dot:  "bg-red-500",
  },
  {
    key: "reposted" as const,
    icon: "🔄",
    label: "Gets Reposted Later",
    bar:  "bg-amber-500",
    text: "text-amber-400",
    dot:  "bg-amber-500",
  },
];

export default function OutcomeBreakdown({ breakdown }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lg">🔮</span>
        <h3 className="text-white font-bold">Predicted Outcome</h3>
        <span className="ml-auto text-xs text-slate-500 italic hidden sm:block">
          3-scenario probability model
        </span>
      </div>

      {/* Segmented bar */}
      <div className="flex w-full h-5 rounded-full overflow-hidden gap-0.5 mb-6">
        {OUTCOMES.map((o) => (
          <div
            key={o.key}
            className={`${o.bar} transition-all duration-1000 ease-out`}
            style={{ width: ready ? `${breakdown[o.key]}%` : "0%" }}
            title={`${o.label}: ${breakdown[o.key]}%`}
          />
        ))}
      </div>

      {/* Breakdown rows */}
      <div className="space-y-3">
        {OUTCOMES.map((o) => (
          <div key={o.key} className="flex items-center gap-3">
            {/* Colour dot */}
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${o.dot}`} />

            {/* Label */}
            <span className="text-slate-300 text-sm flex-1">
              {o.icon}&nbsp; {o.label}
            </span>

            {/* Percentage bar + number */}
            <div className="flex items-center gap-3 w-40">
              <div className="flex-1 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${o.bar} transition-all duration-1000`}
                  style={{ width: ready ? `${breakdown[o.key]}%` : "0%" }}
                />
              </div>
              <span className={`text-base font-black w-9 text-right ${o.text}`}>
                {breakdown[o.key]}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
