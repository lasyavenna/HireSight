import { NextRequest, NextResponse } from "next/server";
import { runRuleBasedAnalysis, generateRuleBasedSummary, analyzeSkillMatch } from "@/lib/analyzer";
import { AnalyzeRequest, AnalysisResult, SkillMatch } from "@/lib/types";

// ─── Optional LLM enhancement via OpenAI ─────────────────────────────────────
async function callOpenAI(
  jobDescription: string,
  ruleResult: Pick<AnalysisResult, "realHireProbability" | "signals">,
  resumeText?: string
): Promise<{ summary: string; adjustedScore?: number; skillMatch?: SkillMatch }> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const signalSummary = ruleResult.signals
    .map((s) => `- ${s.label} (${s.impact}): ${s.description}`)
    .join("\n");

  const resumeSection = resumeText
    ? `\nCANDIDATE RESUME (truncated to 2000 chars):\n${resumeText.slice(0, 2000)}\n`
    : "";

  const skillMatchInstructions = resumeText
    ? `
Since a resume was provided, also evaluate the candidate's fit:
3. A fit score (0–100) for how well the candidate matches this role
4. Up to 5 specific matching skills or experiences from the resume
5. Up to 3 important gaps or missing requirements
6. A one-sentence verdict on the candidate's suitability
7. A boolean for whether you recommend applying based on fit alone

Include a "skillMatch" key in your JSON:
{
  "summary": "...",
  "adjustedScore": <number 0-100>,
  "skillMatch": {
    "fitScore": <number 0-100>,
    "matchingSkills": ["...", "..."],
    "missingSkills": ["...", "..."],
    "verdict": "...",
    "worthApplying": <true|false>
  }
}`
    : `
Respond ONLY with valid JSON:
{"summary": "...", "adjustedScore": <number 0-100>}`;

  const prompt = `You are an expert career coach and HR analyst specializing in detecting "ghost jobs" — postings that companies publish with no real intent to fill.

A rule-based engine scored this posting at ${ruleResult.realHireProbability}/100 real-hire probability using these signals:
${signalSummary}
${resumeSection}
Now read the raw posting and provide:
1. A 2–3 sentence plain-English summary explaining your ghost-job assessment
2. An adjusted real-hire probability score (0–100) that you believe is more accurate
${skillMatchInstructions}

JOB POSTING (truncated to 3000 chars):
${jobDescription.slice(0, 3000)}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: resumeText ? 600 : 350,
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("Empty LLM response");
  return JSON.parse(content);
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json();

    if (!body.jobDescription || body.jobDescription.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a job description (at least a few sentences)." },
        { status: 400 }
      );
    }

    // Resume text is extracted client-side; we just use it directly here
    const resumeText = body.resumeText?.trim() || undefined;

    // Step 1: rule-based analysis (always runs)
    const ruleResult = runRuleBasedAnalysis(body);

    let summary: string;
    let finalScore = ruleResult.realHireProbability;
    let analysisMode: "rule-based" | "ai-enhanced" = "rule-based";
    let skillMatch: SkillMatch | undefined;

    // Step 2: optionally upgrade with LLM
    if (process.env.OPENAI_API_KEY) {
      try {
        const llm = await callOpenAI(body.jobDescription, ruleResult, resumeText);
        summary = llm.summary;
        if (llm.adjustedScore !== undefined) {
          finalScore = Math.round(ruleResult.realHireProbability * 0.55 + llm.adjustedScore * 0.45);
        }
        if (llm.skillMatch) {
          skillMatch = llm.skillMatch;
        } else if (resumeText) {
          // LLM didn't return skillMatch — fall back to rule-based
          skillMatch = analyzeSkillMatch(body.jobDescription, resumeText);
        }
        analysisMode = "ai-enhanced";
      } catch (err) {
        console.error("LLM call failed — falling back to rule-based:", err);
        summary = generateRuleBasedSummary(ruleResult);
        if (resumeText) {
          skillMatch = analyzeSkillMatch(body.jobDescription, resumeText);
        }
      }
    } else {
      summary = generateRuleBasedSummary(ruleResult);
      if (resumeText) {
        skillMatch = analyzeSkillMatch(body.jobDescription, resumeText);
      }
    }

    const result: AnalysisResult = {
      ...ruleResult,
      realHireProbability: Math.min(100, Math.max(0, finalScore)),
      ghostRisk: Math.min(100, Math.max(0, 100 - finalScore)),
      summary,
      analysisMode,
      ...(skillMatch ? { skillMatch } : {}),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
