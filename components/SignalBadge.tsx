import { Signal } from "@/lib/types";

interface Props {
  signal: Signal;
}

export default function SignalBadge({ signal }: Props) {
  const isPos = signal.type === "positive";
  const isNeg = signal.type === "negative";

  return (
    <div
      className={`group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all cursor-default select-none
        ${
          isPos
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20"
            : isNeg
            ? "bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20"
            : "bg-slate-700/50 border-slate-600/50 text-slate-300"
        }`}
    >
      {/* Icon */}
      <span className={`text-xs font-bold ${isPos ? "text-emerald-400" : "text-red-400"}`}>
        {isPos ? "✓" : isNeg ? "✗" : "•"}
      </span>

      <span>{signal.label}</span>

      {/* Impact pill */}
      <span
        className={`ml-1 text-xs font-bold px-1.5 py-0.5 rounded-md ${
          isPos
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-red-500/20 text-red-400"
        }`}
      >
        {signal.impact}
      </span>

      {/* Tooltip on hover */}
      {signal.description && (
        <div className="absolute bottom-full left-0 mb-2 w-72 p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 leading-relaxed opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 shadow-2xl">
          {signal.description}
          <div className="absolute top-full left-5 w-2.5 h-2.5 bg-slate-800 border-r border-b border-slate-700 transform rotate-45 -mt-1.5" />
        </div>
      )}
    </div>
  );
}
