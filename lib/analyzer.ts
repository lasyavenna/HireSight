import {
  Signal, AnalysisResult, AnalyzeRequest, Recommendation,
  TimelineEvent, OutcomeBreakdown, ROIScore, ActionPlan,
} from "./types";

// ─── Individual signal detectors ─────────────────────────────────────────────

function detectSalary(text: string): Signal {
  const hasSalary =
    /\$[\d,]+|\d+k\s*[-–]\s*\$?\d+k|\bsalary\b.*\d|\bcompensation\b.*\d|\bpay range\b|\$\d/i.test(
      text
    );
  return hasSalary
    ? {
        label: "Salary Range Provided",
        impact: "+15",
        type: "positive",
        description: "Transparent compensation is a strong signal of genuine hiring intent.",
      }
    : {
        label: "No Salary Listed",
        impact: "-10",
        type: "negative",
        description:
          "Omitting salary is common in exploratory or ghost postings where budget isn't approved.",
      };
}

function detectResponsibilities(text: string): Signal {
  const bullets = (text.match(/[•\-\*]\s+\w/g) || []).length;
  const numbered = (text.match(/^\d+\.\s+\w/gm) || []).length;
  const total = bullets + numbered;

  if (total >= 6)
    return {
      label: "Detailed Responsibilities",
      impact: "+12",
      type: "positive",
      description: `${total} specific bullet points suggest a well-scoped, active role.`,
    };
  if (total >= 3)
    return {
      label: "Some Responsibilities Listed",
      impact: "+5",
      type: "positive",
      description: "Has structure but could be more specific.",
    };
  return {
    label: "Vague Responsibilities",
    impact: "-10",
    type: "negative",
    description:
      "Lacks specific role definition — may be pipeline building or a copied template.",
  };
}

function detectBuzzwords(text: string): Signal | null {
  const buzzwords = [
    "rockstar", "ninja", "wizard", "guru", "passionate",
    "synergy", "leverage", "dynamic team", "fast-paced environment",
    "best of breed", "thought leader", "disruptive", "hustle",
    "wear many hats", "self-starter",
  ];
  const found = buzzwords.filter((w) => text.toLowerCase().includes(w));

  if (found.length >= 3)
    return {
      label: "Buzzword Overload",
      impact: "-10",
      type: "negative",
      description: `Found ${found.length} vague buzzwords (${found
        .slice(0, 2)
        .join(", ")}…) — hallmark of a recycled template.`,
    };
  if (found.length === 0)
    return {
      label: "Clear, Specific Language",
      impact: "+8",
      type: "positive",
      description: "Avoids clichés — reads as a genuine, role-specific posting.",
    };
  return null;
}

function detectUnrealisticRequirements(text: string): Signal | null {
  // Check if a young technology is paired with too many required years
  const youngTechs: { name: string; released: number }[] = [
    { name: "react",       released: 2013 },
    { name: "kubernetes",  released: 2014 },
    { name: "docker",      released: 2013 },
    { name: "terraform",   released: 2014 },
    { name: "graphql",     released: 2015 },
    { name: "typescript",  released: 2012 },
    { name: "flutter",     released: 2017 },
    { name: "next.js",     released: 2016 },
    { name: "svelte",      released: 2016 },
    { name: "rust",        released: 2015 },
  ];

  const currentYear = new Date().getFullYear();

  for (const tech of youngTechs) {
    const maxPossible = currentYear - tech.released;
    const re = new RegExp(
      `(\\d+)\\+?\\s*years?\\s*(of\\s+)?experience\\s*(with|in|using)?\\s*${tech.name}` +
        `|${tech.name}\\s*(experience)?[:\\s]*(\\d+)\\+?\\s*years?`,
      "i"
    );
    const match = text.match(re);
    if (match) {
      const years = parseInt(match[1] || match[5]);
      if (years > maxPossible + 1) {
        return {
          label: "Unrealistic Experience Requirements",
          impact: "-15",
          type: "negative",
          description: `Asks for ${years}+ years of ${tech.name} experience, but it's only ~${maxPossible} years old.`,
        };
      }
    }
  }

  // Blanket check: inflated bar (15+ years anything) is a filter-by-default tactic
  if (/1[5-9]\+?\s*years?|2\d\+?\s*years?/i.test(text)) {
    return {
      label: "Inflated Experience Bar",
      impact: "-8",
      type: "negative",
      description:
        "Extremely high experience demands often indicate the role isn't actively filling.",
    };
  }
  return null;
}

function detectUrgency(text: string): Signal | null {
  const phrases = [
    "immediate", "asap", "as soon as possible",
    "start immediately", "urgent", "right away",
  ];
  if (phrases.some((p) => text.toLowerCase().includes(p)))
    return {
      label: "Urgency Signals Present",
      impact: "+10",
      type: "positive",
      description: "Time-sensitive language strongly suggests an active, genuine opening.",
    };
  return null;
}

function detectTeamStructure(text: string): Signal | null {
  const patterns = [
    /team of \d+/i,
    /reporting (to|directly to)/i,
    /you'?ll (work|collaborate) with/i,
    /your (manager|team|squad|direct reports)/i,
    /\d+ (direct|indirect) reports/i,
  ];
  if (patterns.some((p) => p.test(text)))
    return {
      label: "Team Structure Described",
      impact: "+10",
      type: "positive",
      description: "Naming actual team context signals a real, org-approved role.",
    };
  return null;
}

function detectInterviewProcess(text: string): Signal | null {
  const patterns = [
    /interview process/i,
    /hiring process/i,
    /\d+ (round|stage|interview)/i,
    /take.?home (assignment|project|test)/i,
    /technical (screen|interview|assessment)/i,
    /onsite (interview|round)/i,
  ];
  if (patterns.some((p) => p.test(text)))
    return {
      label: "Interview Process Outlined",
      impact: "+12",
      type: "positive",
      description:
        "Describing hiring steps is a strong indicator of genuine, near-term intent.",
    };
  return null;
}

function detectBenefits(text: string): Signal | null {
  const keywords = [
    "401k", "401(k)", "health insurance", "dental", "vision",
    "pto", "paid time off", "vacation days", "equity", "stock options",
    "parental leave", "flexible hours", "remote",
  ];
  const found = keywords.filter((k) => text.toLowerCase().includes(k));

  if (found.length >= 3)
    return {
      label: "Benefits Package Detailed",
      impact: "+8",
      type: "positive",
      description: `Lists ${found.length} real benefits — reflects an active, funded hire.`,
    };
  if (found.length >= 1)
    return {
      label: "Some Benefits Mentioned",
      impact: "+4",
      type: "positive",
      description: "At least partial benefits listed.",
    };
  return null;
}

function detectTechStack(text: string): Signal | null {
  const techs = [
    "typescript", "javascript", "python", "go", "rust", "java", "kotlin", "swift",
    "react", "vue", "angular", "svelte", "next.js", "nuxt",
    "node.js", "express", "fastapi", "django", "spring",
    "aws", "gcp", "azure", "cloudflare",
    "postgres", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "docker", "kubernetes", "terraform", "ci/cd", "github actions",
    "kafka", "rabbitmq", "graphql", "rest api",
  ];
  const found = techs.filter((t) => text.toLowerCase().includes(t));

  if (found.length >= 4)
    return {
      label: "Specific Tech Stack Named",
      impact: "+10",
      type: "positive",
      description: `Names ${found.length} real technologies — clearly written for an actual role.`,
    };
  if (found.length >= 2)
    return {
      label: "Some Technical Requirements",
      impact: "+5",
      type: "positive",
      description: `Mentions ${found.length} specific technologies.`,
    };
  return null;
}

function detectDescriptionLength(text: string): Signal | null {
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (wordCount < 50)
    return {
      label: "Unusually Short Posting",
      impact: "-18",
      type: "negative",
      description: `Only ~${wordCount} words. Real postings average 400–800 words.`,
    };
  if (wordCount < 150)
    return {
      label: "Sparse Description",
      impact: "-10",
      type: "negative",
      description: `~${wordCount} words is below typical for an actively-filled role.`,
    };
  if (wordCount > 600)
    return {
      label: "Thorough Job Description",
      impact: "+6",
      type: "positive",
      description: `~${wordCount} words shows real investment in finding the right hire.`,
    };
  return null;
}

function detectBoilerplate(text: string): Signal | null {
  const phrases = [
    "equal opportunity employer",
    "we are an equal",
    "must be eligible to work",
    "background check may be required",
    "drug-free workplace",
  ];
  const found = phrases.filter((p) => text.toLowerCase().includes(p));
  // High boilerplate-to-content ratio is a red flag
  if (found.length >= 3 && text.length < 1500)
    return {
      label: "High Boilerplate Ratio",
      impact: "-5",
      type: "negative",
      description: "Legal disclaimers dominate the posting vs actual role content.",
    };
  return null;
}

function detectVagueTitle(text: string): Signal | null {
  const vague = [
    "various roles", "multiple positions", "talent pool",
    "future opportunities", "general application",
  ];
  if (vague.some((t) => text.toLowerCase().includes(t)))
    return {
      label: "Non-Specific Role Title",
      impact: "-12",
      type: "negative",
      description: "Generic titles often indicate pipeline building, not active hiring.",
    };
  return null;
}

// ─── Future prediction helpers ───────────────────────────────────────────────

export function computeTimeline(score: number, hasUrgency: boolean): TimelineEvent[] {
  if (score >= 72) {
    return [
      { week: "Week 1", event: "High applicant inflow, active screening begins", probability: 88, status: "active" },
      { week: "Week 2", event: "Interviews scheduled, shortlist forming", probability: 78, status: "active" },
      { week: "Week 3", event: "Final rounds + reference checks", probability: 68, status: "active" },
      { week: "Week 4+", event: hasUrgency ? "Offer extended — role fills" : "Offer stage, minor extension possible", probability: 62, status: "active" },
    ];
  }
  if (score >= 52) {
    return [
      { week: "Week 1", event: "Moderate inflow, slow initial screening", probability: 72, status: "active" },
      { week: "Week 2", event: "Internal candidates reviewed first", probability: 52, status: "warning" },
      { week: "Week 3", event: "External hiring deprioritized", probability: 38, status: "warning" },
      { week: "Week 4+", event: "Process stalls or quietly reposted", probability: 28, status: "danger" },
    ];
  }
  if (score >= 35) {
    return [
      { week: "Week 1", event: "Posted — minimal active sourcing detected", probability: 45, status: "warning" },
      { week: "Week 2", event: "Referred / internal candidate prioritized", probability: 32, status: "danger" },
      { week: "Week 3", event: "External pipeline effectively paused", probability: 18, status: "danger" },
      { week: "Week 4+", event: "Role goes inactive or reposted unchanged", probability: 12, status: "danger" },
    ];
  }
  return [
    { week: "Week 1", event: "Posting live — no real hiring process started", probability: 22, status: "warning" },
    { week: "Week 2", event: "No recruiter activity (ghost pattern)", probability: 12, status: "danger" },
    { week: "Week 3", event: "Role effectively abandoned internally", probability: 8, status: "danger" },
    { week: "Week 4+", event: "Silently removed or reposted next quarter", probability: 6, status: "danger" },
  ];
}

export function computeOutcomeBreakdown(score: number): OutcomeBreakdown {
  let filled: number, ghost: number, reposted: number;

  if (score >= 72) {
    filled   = Math.round(55 + (score - 72) * 0.45);
    ghost    = Math.round(28 - (score - 72) * 0.25);
    reposted = Math.max(5, 100 - filled - ghost);
  } else if (score >= 52) {
    filled   = Math.round(35 + (score - 52) * 1.0);
    ghost    = Math.round(43 - (score - 52) * 0.55);
    reposted = Math.max(5, 100 - filled - ghost);
  } else if (score >= 35) {
    filled   = Math.round(18 + (score - 35) * 1.0);
    ghost    = Math.round(57 - (score - 35) * 0.8);
    reposted = Math.max(5, 100 - filled - ghost);
  } else {
    filled   = Math.round(5 + score * 0.3);
    ghost    = Math.round(68 - score * 0.1);
    reposted = Math.max(5, 100 - filled - ghost);
  }

  // Clamp and normalise to exactly 100
  filled   = Math.min(90, Math.max(5, filled));
  ghost    = Math.min(90, Math.max(5, ghost));
  reposted = Math.min(40, Math.max(5, 100 - filled - ghost));
  const total = filled + ghost + reposted;
  return {
    filled:   Math.round((filled   / total) * 100),
    ghost:    Math.round((ghost    / total) * 100),
    reposted: Math.round((reposted / total) * 100),
  };
}

export function computeROIScore(
  score: number,
  hasUrgency: boolean,
  hasInterviewProcess: boolean
): ROIScore {
  let interviewChance: number, responseChance: number;
  let timeToHearBack: string;
  let roiRating: ROIScore["roiRating"];
  let verdict: string;

  if (score >= 72) {
    interviewChance = Math.min(55, Math.round(25 + (score - 72) * 0.55));
    responseChance  = Math.min(80, Math.round(50 + (score - 72) * 0.9));
    timeToHearBack  = hasUrgency ? "5–10 business days" : hasInterviewProcess ? "1–2 weeks" : "2–3 weeks";
    roiRating       = "High";
    verdict         = `Strong signal. You have a ~${interviewChance}% chance of landing an interview. A tailored application here is time well spent.`;
  } else if (score >= 52) {
    interviewChance = Math.round(12 + (score - 52) * 0.7);
    responseChance  = Math.round(22 + (score - 52) * 1.1);
    timeToHearBack  = "2–4 weeks, or no response";
    roiRating       = "Medium";
    verdict         = `~${interviewChance}% interview chance — decent but not strong. Cold-applying wastes time; warming a connection first could double your odds.`;
  } else if (score >= 35) {
    interviewChance = Math.round(4 + (score - 35) * 0.45);
    responseChance  = Math.round(9 + (score - 35) * 0.7);
    timeToHearBack  = "4–6 weeks, likely silence";
    roiRating       = "Low";
    verdict         = `You are likely to spend 2–3 hours applying with a ${interviewChance}% chance of any response. That's a poor trade for your time.`;
  } else {
    interviewChance = Math.max(1, Math.round(2 + score * 0.08));
    responseChance  = Math.max(2, Math.round(4 + score * 0.12));
    timeToHearBack  = "Never — likely a ghost posting";
    roiRating       = "Very Low";
    verdict         = `High ghost-job risk. There is less than a ${responseChance}% chance of any response. Your 2–3 hours of effort would return almost nothing here.`;
  }

  return {
    timeToApply:    "2–3 hours",
    timeToHearBack,
    responseChance:  Math.min(95, Math.max(2, responseChance)),
    interviewChance: Math.min(60, Math.max(1, interviewChance)),
    roiRating,
    verdict,
  };
}

export function computeActionPlan(recommendation: Recommendation): ActionPlan {
  const plans: Record<Recommendation, ActionPlan> = {
    Apply: {
      primary: "Strong signals. Apply with a tailored, high-effort application.",
      actions: [
        "Mirror the exact tech stack and keywords from the posting in your resume",
        "Write a cover letter referencing the specific team structure they described",
        "Apply within 48 hours — early applicants get 2× higher callback rates",
        "Connect with the hiring manager on LinkedIn after you submit",
      ],
    },
    "Network First": {
      primary: "Mixed signals. Don't apply cold — warm the connection first.",
      actions: [
        "Find 2–3 team members on LinkedIn and send a brief, specific note",
        "Ask for a 15-minute informational call before you submit your application",
        "Check if anyone in your network has a contact at this company",
        "Search for the same role title at companies posting in the last 7 days",
      ],
    },
    "Low Priority": {
      primary: "Skip this posting. Several red flags suggest it's not actively filling.",
      actions: [
        "Filter your job board to postings from the past 7–14 days only",
        "Set a job alert — if this role is real, a cleaner posting will appear soon",
        "Target the company directly via LinkedIn if you're set on them",
        "Redirect your 2–3 hours toward 2 higher-signal applications instead",
      ],
    },
    Skip: {
      primary: "Do not apply. High ghost-job probability — this role is likely inactive.",
      actions: [
        "Reach out to the company's talent team directly, bypassing this listing entirely",
        "Use LinkedIn to find people who work on the likely target team and message them",
        "Companies actively hiring usually post across multiple platforms — check for duplicates",
        "Networking has 10× the ROI of a cold application to a ghost posting",
      ],
    },
  };
  return plans[recommendation];
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function runRuleBasedAnalysis(
  input: AnalyzeRequest
): Omit<AnalysisResult, "summary" | "analysisMode"> {
  const text = input.jobDescription || "";
  const signals: Signal[] = [];
  let score = 50;

  const checks = [
    detectSalary(text),
    detectResponsibilities(text),
    detectBuzzwords(text),
    detectUnrealisticRequirements(text),
    detectUrgency(text),
    detectTeamStructure(text),
    detectInterviewProcess(text),
    detectBenefits(text),
    detectTechStack(text),
    detectDescriptionLength(text),
    detectBoilerplate(text),
    detectVagueTitle(text),
  ];

  for (const signal of checks) {
    if (signal) {
      signals.push(signal);
      score += parseInt(signal.impact, 10);
    }
  }

  const realHireProbability = Math.min(100, Math.max(0, Math.round(score)));
  const ghostRisk = 100 - realHireProbability;

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const confidence = Math.min(
    95,
    Math.max(30, Math.round(40 + (Math.min(wordCount, 500) / 500) * 35 + signals.length * 1.5))
  );

  let recommendation: Recommendation;
  if (realHireProbability >= 72) recommendation = "Apply";
  else if (realHireProbability >= 52) recommendation = "Network First";
  else if (realHireProbability >= 35) recommendation = "Low Priority";
  else recommendation = "Skip";

  // Check presence of specific signals for downstream computation
  const hasUrgency          = signals.some((s) => s.label === "Urgency Signals Present");
  const hasInterviewProcess = signals.some((s) => s.label === "Interview Process Outlined");

  const timeline        = computeTimeline(realHireProbability, hasUrgency);
  const outcomeBreakdown = computeOutcomeBreakdown(realHireProbability);
  const roiScore        = computeROIScore(realHireProbability, hasUrgency, hasInterviewProcess);
  const actionPlan      = computeActionPlan(recommendation);

  return {
    realHireProbability, ghostRisk, confidence, signals, recommendation,
    timeline, outcomeBreakdown, roiScore, actionPlan,
  };
}

// ─── Summary generator (fallback when no LLM key) ────────────────────────────

export function generateRuleBasedSummary(
  result: Pick<AnalysisResult, "realHireProbability" | "signals">
): string {
  const pos = result.signals.filter((s) => s.type === "positive").map((s) => s.label.toLowerCase());
  const neg = result.signals.filter((s) => s.type === "negative").map((s) => s.label.toLowerCase());
  const p = result.realHireProbability;

  if (p >= 72)
    return `This posting shows strong signals of active hiring. ${
      pos.slice(0, 2).join(" and ")
    } suggest a well-defined role with genuine budget and intent.${
      neg.length > 0
        ? ` Minor concern: ${neg[0]} — but it doesn't significantly undermine credibility.`
        : " No major red flags detected."
    } Definitely worth pursuing.`;

  if (p >= 52)
    return `Mixed signals on this posting. While ${
      pos[0] ?? "some aspects"
    } look legitimate, ${
      neg[0] ?? "other details"
    } raise questions. This could be a slow or underfunded hire, a long-standing open role, or soft pipeline building. Network into the company before committing heavy effort.`;

  if (p >= 35)
    return `Several ghost-job indicators detected. ${
      neg.slice(0, 2).join(" and ")
    } are notable concerns. The role may exist in principle but not be actively filling, or it could be posted for optics. Apply only if the company is a top target.`;

  return `High ghost job probability. ${
    neg.slice(0, 3).join(", ")
  } collectively suggest this is not an active hire. Companies post ghost jobs to build passive pipelines, gauge market rates, or satisfy investors. Save your energy for higher-signal opportunities.`;
}
