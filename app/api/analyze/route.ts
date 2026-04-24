import { NextRequest, NextResponse } from "next/server";
import { runRuleBasedAnalysis, generateRuleBasedSummary } from "@/lib/analyzer";
import { AnalyzeRequest, AnalysisResult } from "@/lib/types";

// ─── Optional LLM enhancement via OpenAI ─────────────────────────────────────
async function callOpenAI(
  jobDescription: string,
  ruleResult: Pick<AnalysisResult, "realHireProbability" | "signals">
): Promise<{ summary: string; adjustedScore?: number }> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const signalSummary = ruleResult.signals
    .map((s) => `- ${s.label} (${s.impact}): ${s.description}`)
    .join("\n");

  const prompt = `You are an expert career coach and HR analyst specializing in detecting "ghost jobs" — postings that companies publish with no real intent to fill (e.g., for optics, passive pipeline, or budget approval cycles).

A rule-based engine already scored this job posting at ${ruleResult.realHireProbability}/100 real-hire probability using these signals:
${signalSummary}

Now read the raw posting and provide:
1. A 2–3 sentence plain-English summary explaining your ghost-job assessment
2. An adjusted real-hire probability score (0–100) that you believe is more accurate

JOB POSTING (truncated to 3000 chars):
${jobDescription.slice(0, 3000)}

Respond ONLY with valid JSON in this shape:
{"summary": "...", "adjustedScore": <number 0-100>}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 350,
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

    // Step 1: rule-based analysis (always runs)
    const ruleResult = runRuleBasedAnalysis(body);

    let summary: string;
    let finalScore = ruleResult.realHireProbability;
    let analysisMode: "rule-based" | "ai-enhanced" = "rule-based";

    // Step 2: optionally upgrade with LLM
    if (process.env.OPENAI_API_KEY) {
      try {
        const llm = await callOpenAI(body.jobDescription, ruleResult);
        summary = llm.summary;
        if (llm.adjustedScore !== undefined) {
          // Weighted blend: rule-based has high fidelity on specifics, LLM on nuance
          finalScore = Math.round(ruleResult.realHireProbability * 0.55 + llm.adjustedScore * 0.45);
        }
        analysisMode = "ai-enhanced";
      } catch (err) {
        console.error("LLM call failed — falling back to rule-based summary:", err);
        summary = generateRuleBasedSummary(ruleResult);
      }
    } else {
      summary = generateRuleBasedSummary(ruleResult);
    }

    const result: AnalysisResult = {
      ...ruleResult,
      realHireProbability: Math.min(100, Math.max(0, finalScore)),
      ghostRisk: Math.min(100, Math.max(0, 100 - finalScore)),
      summary,
      analysisMode,
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
