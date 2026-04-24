"use client";

import { useState } from "react";

// Example job description to demo the app quickly
const EXAMPLE_JD = `We're looking for a Senior Software Engineer to join our growing backend team of 8 engineers reporting to the VP of Engineering.

Responsibilities:
• Design and maintain high-throughput APIs serving 50M+ requests/day
• Lead architecture discussions and mentor 2 junior engineers
• Collaborate cross-functionally with Product and Data teams
• Drive adoption of TypeScript across our Node.js services
• On-call rotation (1 week per month)

Requirements:
• 4+ years of experience with Node.js / TypeScript
• Strong grasp of PostgreSQL, Redis, and distributed systems
• Experience with AWS (ECS, RDS, SQS)
• Comfortable with Docker and CI/CD pipelines

Interview Process: 30-min recruiter screen → technical phone screen → take-home project (3 hrs) → onsite loop (4 rounds)

Compensation: $160,000–$190,000 base + equity + benefits
Benefits: Full health/dental/vision, 401(k) match, unlimited PTO, remote-friendly

Start: ASAP — we have a headcount approved and a team waiting.`;

interface Props {
  onAnalyze: (jobDescription: string, companyName: string) => void;
  isLoading: boolean;
}

export default function AnalyzeForm({ onAnalyze, isLoading }: Props) {
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobUrl, setJobUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = jobUrl
      ? `Job URL: ${jobUrl}\n\n${jobDescription}`
      : jobDescription;
    onAnalyze(text.trim(), companyName.trim());
  };

  const loadExample = () => {
    setJobDescription(EXAMPLE_JD);
    setCompanyName("Acme Corp");
    setJobUrl("");
  };

  const isReady = jobDescription.trim().length > 10;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* URL field (optional) */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Job URL <span className="text-slate-600 normal-case font-normal">— optional</span>
        </label>
        <input
          type="url"
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
          placeholder="https://linkedin.com/jobs/view/…"
          className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/40 transition-all text-sm"
        />
      </div>

      {/* Description textarea */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Job Description <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={loadExample}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            Try an example →
          </button>
        </div>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder={
            "Paste the full job description here…\n\nThe more detail you provide, the more accurate the analysis."
          }
          required
          rows={9}
          className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/40 transition-all resize-none text-sm leading-relaxed"
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-slate-600">
            {jobDescription.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
      </div>

      {/* Company name */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Company Name <span className="text-slate-600 normal-case font-normal">— optional</span>
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. Acme Corp"
          className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/40 transition-all text-sm"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !isReady}
        className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 hover:scale-[1.015] active:scale-[0.985] text-base"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing…
          </span>
        ) : (
          "🔍 Analyze Job Posting"
        )}
      </button>

      <p className="text-center text-xs text-slate-600">
        Analysis is instant · No account required · Data never stored
      </p>
    </form>
  );
}
