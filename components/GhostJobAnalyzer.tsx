"use client";

import { useState } from "react";
import { AnalysisResult } from "@/lib/types";
import AnalyzeForm from "./AnalyzeForm";
import ResultsPanel from "./ResultsPanel";
import LoadingState from "./LoadingState";

export default function GhostJobAnalyzer() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");

  const handleAnalyze = async (
    jobDescription: string,
    company: string,
    resumeText?: string
  ) => {
    setIsLoading(true);
    setError(null);
    setCompanyName(company);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          companyName: company,
          ...(resumeText ? { resumeText } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed — please try again.");
      }

      setResult(data as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCompanyName("");
  };

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-sm">
      {isLoading ? (
        <LoadingState />
      ) : result ? (
        <ResultsPanel result={result} companyName={companyName} onReset={handleReset} />
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Analyze a Job Posting</h2>
            <p className="text-slate-400 text-sm mt-1">
              Paste any job description to get an instant ghost-job risk score
            </p>
          </div>

          <AnalyzeForm onAnalyze={handleAnalyze} isLoading={isLoading} />

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
