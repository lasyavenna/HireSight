"use client";

import { useEffect, useState } from "react";

interface Props {
  score: number;
  label: string;
}

const RADIUS = 90;
const ARC_LENGTH = Math.PI * RADIUS; // ~282.74

function getColor(s: number) {
  if (s >= 70) return "#22c55e";  // green-500
  if (s >= 45) return "#f59e0b";  // amber-500
  return "#ef4444";               // red-500
}

function getGradient(s: number) {
  if (s >= 70) return "url(#gaugeGreen)";
  if (s >= 45) return "url(#gaugeAmber)";
  return "url(#gaugeRed)";
}

export default function ScoreGauge({ score, label }: Props) {
  const [animated, setAnimated] = useState(0);

  // Trigger fill animation after mount
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 120);
    return () => clearTimeout(t);
  }, [score]);

  const filled = (animated / 100) * ARC_LENGTH;
  const color = getColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 200 120" className="w-52 h-32" aria-label={`${score} out of 100`}>
        <defs>
          <linearGradient id="gaugeGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="gaugeAmber" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="gaugeRed" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <path
          d="M 10 110 A 90 90 0 0 1 190 110"
          fill="none"
          stroke="#1e293b"
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* Fill arc */}
        <path
          d="M 10 110 A 90 90 0 0 1 190 110"
          fill="none"
          stroke={getGradient(score)}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${ARC_LENGTH}`}
          filter="url(#glow)"
          style={{
            transition: "stroke-dasharray 1.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Score number */}
        <text
          x="100"
          y="96"
          textAnchor="middle"
          fill={color}
          fontSize="40"
          fontWeight="900"
          fontFamily="Inter, sans-serif"
        >
          {score}
        </text>

        {/* /100 label */}
        <text
          x="100"
          y="111"
          textAnchor="middle"
          fill="#475569"
          fontSize="11"
          fontFamily="Inter, sans-serif"
        >
          / 100
        </text>

        {/* Left label */}
        <text x="8" y="120" fill="#475569" fontSize="9" fontFamily="Inter, sans-serif">
          Ghost
        </text>
        {/* Right label */}
        <text x="170" y="120" fill="#475569" fontSize="9" fontFamily="Inter, sans-serif">
          Real
        </text>
      </svg>

      <p className="text-slate-400 text-sm font-medium tracking-wide">{label}</p>
    </div>
  );
}
