"use client";

import { TimelineEvent } from "@/lib/types";

const STYLE: Record<TimelineEvent["status"], {
  dot: string; label: string; badge: string; connector: string;
}> = {
  active:  {
    dot:       "bg-emerald-500 border-emerald-400 shadow-emerald-500/50",
    label:     "text-emerald-400",
    badge:     "bg-emerald-500/10 border-emerald-500/25 text-emerald-300",
    connector: "bg-emerald-500/30",
  },
  warning: {
    dot:       "bg-amber-500 border-amber-400 shadow-amber-500/50",
    label:     "text-amber-400",
    badge:     "bg-amber-500/10 border-amber-500/25 text-amber-300",
    connector: "bg-amber-500/30",
  },
  danger:  {
    dot:       "bg-red-500 border-red-400 shadow-red-500/50",
    label:     "text-red-400",
    badge:     "bg-red-500/10 border-red-500/25 text-red-300",
    connector: "bg-red-500/30",
  },
};

export default function TimelinePanel({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <h3 className="text-white font-bold">Predicted Hiring Timeline</h3>
        </div>
        <span className="text-xs text-slate-500 italic hidden sm:block">
          Modeled from posting signals
        </span>
      </div>

      {/* ── Desktop: horizontal stepper ── */}
      <div className="hidden md:block relative">
        {/* Base connector line */}
        <div className="absolute top-[13px] left-[12.5%] right-[12.5%] h-px bg-slate-700/50" />

        <div className="grid grid-cols-4 gap-4">
          {events.map((e, i) => {
            const s = STYLE[e.status];
            return (
              <div key={i} className="flex flex-col items-center gap-2.5 text-center">
                {/* Dot */}
                <div
                  className={`relative z-10 w-7 h-7 rounded-full border-2 ${s.dot} shadow-lg flex items-center justify-center`}
                >
                  <span className="text-white text-xs font-black">{i + 1}</span>
                </div>

                {/* Week */}
                <p className={`text-xs font-bold uppercase tracking-widest ${s.label}`}>
                  {e.week}
                </p>

                {/* Event text */}
                <p className="text-slate-400 text-xs leading-relaxed min-h-[3rem]">{e.event}</p>

                {/* Probability badge */}
                <span className={`text-xs border px-2.5 py-0.5 rounded-full font-semibold ${s.badge}`}>
                  {e.probability}% likely
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mobile: vertical list ── */}
      <div className="flex flex-col gap-0 md:hidden">
        {events.map((e, i) => {
          const s = STYLE[e.status];
          return (
            <div key={i} className="flex gap-4">
              {/* Left: dot + connector */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full border-2 ${s.dot} shadow-md flex items-center justify-center flex-shrink-0`}
                >
                  <span className="text-white text-xs font-black">{i + 1}</span>
                </div>
                {i < events.length - 1 && (
                  <div className={`w-px flex-1 my-1 min-h-[28px] ${s.connector}`} />
                )}
              </div>

              {/* Right: content */}
              <div className="pb-5">
                <p className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${s.label}`}>
                  {e.week}
                </p>
                <p className="text-slate-300 text-sm leading-snug mb-1.5">{e.event}</p>
                <span className={`text-xs border px-2 py-0.5 rounded-full font-semibold ${s.badge}`}>
                  {e.probability}% likely
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
