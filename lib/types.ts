export interface Signal {
  label: string;
  impact: string;
  description: string;
  type: "positive" | "negative" | "neutral";
}

export type Recommendation = "Apply" | "Network First" | "Low Priority" | "Skip";

// ─── New feature types ────────────────────────────────────────────────────────

export interface TimelineEvent {
  week: string;
  event: string;
  probability: number; // 0–100
  status: "active" | "warning" | "danger";
}

export interface OutcomeBreakdown {
  filled: number;   // % chance role is actively filled
  ghost: number;    // % chance it's a pipeline/ghost role
  reposted: number; // % chance it gets reposted
}

export type ROIRating = "High" | "Medium" | "Low" | "Very Low";

export interface ROIScore {
  timeToApply: string;
  timeToHearBack: string;
  responseChance: number;  // 0–100
  interviewChance: number; // 0–100
  roiRating: ROIRating;
  verdict: string; // The emotional one-liner
}

export interface ActionPlan {
  primary: string;
  actions: string[];
}

// ─── Skill match ──────────────────────────────────────────────────────────────

export interface SkillMatch {
  fitScore: number;           // 0–100
  matchingSkills: string[];
  missingSkills: string[];
  verdict: string;            // one-sentence summary
  worthApplying: boolean;
}

// ─── Core result ──────────────────────────────────────────────────────────────

export interface AnalysisResult {
  realHireProbability: number;
  ghostRisk: number;
  confidence: number;
  signals: Signal[];
  summary: string;
  recommendation: Recommendation;
  analysisMode: "rule-based" | "ai-enhanced";
  // Future-prediction features
  timeline: TimelineEvent[];
  outcomeBreakdown: OutcomeBreakdown;
  roiScore: ROIScore;
  actionPlan: ActionPlan;
  // Optional resume fit
  skillMatch?: SkillMatch;
}

export interface AnalyzeRequest {
  jobDescription: string;
  companyName?: string;
  jobUrl?: string;
  resumeText?: string;
}
