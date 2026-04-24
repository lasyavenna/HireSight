// Ghost Job rule-based analyzer — ported from lib/analyzer.ts
// Runs entirely in the browser with no server required.

function detectSalary(text) {
  const has = /\$[\d,]+|\d+k\s*[-–]\s*\$?\d+k|\bsalary\b.*\d|\bcompensation\b.*\d|\bpay range\b|\$\d/i.test(text);
  return has
    ? { label: "Salary Range Provided", impact: "+15", type: "positive", description: "Transparent compensation is a strong signal of genuine hiring intent." }
    : { label: "No Salary Listed", impact: "-10", type: "negative", description: "Omitting salary is common in exploratory or ghost postings where budget isn't approved." };
}

function detectResponsibilities(text) {
  const bullets = (text.match(/[•\-\*]\s+\w/g) || []).length;
  const numbered = (text.match(/^\d+\.\s+\w/gm) || []).length;
  const total = bullets + numbered;
  if (total >= 6) return { label: "Detailed Responsibilities", impact: "+12", type: "positive", description: `${total} specific bullet points suggest a well-scoped, active role.` };
  if (total >= 3) return { label: "Some Responsibilities Listed", impact: "+5", type: "positive", description: "Has structure but could be more specific." };
  return { label: "Vague Responsibilities", impact: "-10", type: "negative", description: "Lacks specific role definition — may be pipeline building or a copied template." };
}

function detectBuzzwords(text) {
  const buzzwords = ["rockstar","ninja","wizard","guru","passionate","synergy","leverage","dynamic team","fast-paced environment","best of breed","thought leader","disruptive","hustle","wear many hats","self-starter"];
  const found = buzzwords.filter(w => text.toLowerCase().includes(w));
  if (found.length >= 3) return { label: "Buzzword Overload", impact: "-10", type: "negative", description: `Found ${found.length} vague buzzwords (${found.slice(0,2).join(", ")}…) — hallmark of a recycled template.` };
  if (found.length === 0) return { label: "Clear, Specific Language", impact: "+8", type: "positive", description: "Avoids clichés — reads as a genuine, role-specific posting." };
  return null;
}

function detectUnrealisticRequirements(text) {
  const youngTechs = [
    { name: "react", released: 2013 }, { name: "kubernetes", released: 2014 },
    { name: "docker", released: 2013 }, { name: "terraform", released: 2014 },
    { name: "graphql", released: 2015 }, { name: "typescript", released: 2012 },
    { name: "flutter", released: 2017 }, { name: "next.js", released: 2016 },
    { name: "svelte", released: 2016 }, { name: "rust", released: 2015 },
  ];
  const currentYear = new Date().getFullYear();
  for (const tech of youngTechs) {
    const maxPossible = currentYear - tech.released;
    const re = new RegExp(`(\\d+)\\+?\\s*years?\\s*(of\\s+)?experience\\s*(with|in|using)?\\s*${tech.name}|${tech.name}\\s*(experience)?[:\\s]*(\\d+)\\+?\\s*years?`, "i");
    const match = text.match(re);
    if (match) {
      const years = parseInt(match[1] || match[5]);
      if (years > maxPossible + 1) return { label: "Unrealistic Experience Requirements", impact: "-15", type: "negative", description: `Asks for ${years}+ years of ${tech.name} experience, but it's only ~${maxPossible} years old.` };
    }
  }
  if (/1[5-9]\+?\s*years?|2\d\+?\s*years?/i.test(text)) return { label: "Inflated Experience Bar", impact: "-8", type: "negative", description: "Extremely high experience demands often indicate the role isn't actively filling." };
  return null;
}

function detectUrgency(text) {
  const phrases = ["immediate","asap","as soon as possible","start immediately","urgent","right away"];
  if (phrases.some(p => text.toLowerCase().includes(p))) return { label: "Urgency Signals Present", impact: "+10", type: "positive", description: "Time-sensitive language strongly suggests an active, genuine opening." };
  return null;
}

function detectTeamStructure(text) {
  const patterns = [/team of \d+/i, /reporting (to|directly to)/i, /you'?ll (work|collaborate) with/i, /your (manager|team|squad|direct reports)/i, /\d+ (direct|indirect) reports/i];
  if (patterns.some(p => p.test(text))) return { label: "Team Structure Described", impact: "+10", type: "positive", description: "Naming actual team context signals a real, org-approved role." };
  return null;
}

function detectInterviewProcess(text) {
  const patterns = [/interview process/i, /hiring process/i, /\d+ (round|stage|interview)/i, /take.?home (assignment|project|test)/i, /technical (screen|interview|assessment)/i, /onsite (interview|round)/i];
  if (patterns.some(p => p.test(text))) return { label: "Interview Process Outlined", impact: "+12", type: "positive", description: "Describing hiring steps is a strong indicator of genuine, near-term intent." };
  return null;
}

function detectBenefits(text) {
  const keywords = ["401k","401(k)","health insurance","dental","vision","pto","paid time off","vacation days","equity","stock options","parental leave","flexible hours","remote"];
  const found = keywords.filter(k => text.toLowerCase().includes(k));
  if (found.length >= 3) return { label: "Benefits Package Detailed", impact: "+8", type: "positive", description: `Lists ${found.length} real benefits — reflects an active, funded hire.` };
  if (found.length >= 1) return { label: "Some Benefits Mentioned", impact: "+4", type: "positive", description: "At least partial benefits listed." };
  return null;
}

function detectTechStack(text) {
  const techs = ["typescript","javascript","python","go","rust","java","kotlin","swift","react","vue","angular","svelte","next.js","nuxt","node.js","express","fastapi","django","spring","aws","gcp","azure","cloudflare","postgres","postgresql","mysql","mongodb","redis","elasticsearch","docker","kubernetes","terraform","ci/cd","github actions","kafka","rabbitmq","graphql","rest api"];
  const found = techs.filter(t => text.toLowerCase().includes(t));
  if (found.length >= 4) return { label: "Specific Tech Stack Named", impact: "+10", type: "positive", description: `Names ${found.length} real technologies — clearly written for an actual role.` };
  if (found.length >= 2) return { label: "Some Technical Requirements", impact: "+5", type: "positive", description: `Mentions ${found.length} specific technologies.` };
  return null;
}

function detectDescriptionLength(text) {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 50) return { label: "Unusually Short Posting", impact: "-18", type: "negative", description: `Only ~${wordCount} words. Real postings average 400–800 words.` };
  if (wordCount < 150) return { label: "Sparse Description", impact: "-10", type: "negative", description: `~${wordCount} words is below typical for an actively-filled role.` };
  if (wordCount > 600) return { label: "Thorough Job Description", impact: "+6", type: "positive", description: `~${wordCount} words shows real investment in finding the right hire.` };
  return null;
}

function detectBoilerplate(text) {
  const phrases = ["equal opportunity employer","we are an equal","must be eligible to work","background check may be required","drug-free workplace"];
  const found = phrases.filter(p => text.toLowerCase().includes(p));
  if (found.length >= 3 && text.length < 1500) return { label: "High Boilerplate Ratio", impact: "-5", type: "negative", description: "Legal disclaimers dominate the posting vs actual role content." };
  return null;
}

function detectVagueTitle(text) {
  const vague = ["various roles","multiple positions","talent pool","future opportunities","general application"];
  if (vague.some(t => text.toLowerCase().includes(t))) return { label: "Non-Specific Role Title", impact: "-12", type: "negative", description: "Generic titles often indicate pipeline building, not active hiring." };
  return null;
}

function generateSummary(result) {
  const pos = result.signals.filter(s => s.type === "positive").map(s => s.label.toLowerCase());
  const neg = result.signals.filter(s => s.type === "negative").map(s => s.label.toLowerCase());
  const p = result.realHireProbability;
  if (p >= 72) return `Strong hiring signals: ${pos.slice(0,2).join(" and ")} suggest a well-defined role with genuine intent.${neg.length ? ` Minor concern: ${neg[0]}.` : " No major red flags."}`;
  if (p >= 52) return `Mixed signals. While ${pos[0] || "some aspects"} look legitimate, ${neg[0] || "other details"} raise questions. Network in before committing heavy effort.`;
  if (p >= 35) return `Several ghost-job indicators: ${neg.slice(0,2).join(" and ")} are notable concerns. Apply only if this is a top-priority company.`;
  return `High ghost job probability. ${neg.slice(0,3).join(", ")} collectively suggest this is not an active hire.`;
}

function runAnalysis(jobDescription) {
  const text = jobDescription || "";
  const signals = [];
  let score = 50;

  const checks = [
    detectSalary(text), detectResponsibilities(text), detectBuzzwords(text),
    detectUnrealisticRequirements(text), detectUrgency(text), detectTeamStructure(text),
    detectInterviewProcess(text), detectBenefits(text), detectTechStack(text),
    detectDescriptionLength(text), detectBoilerplate(text), detectVagueTitle(text),
  ];

  for (const signal of checks) {
    if (signal) { signals.push(signal); score += parseInt(signal.impact, 10); }
  }

  const realHireProbability = Math.min(100, Math.max(0, Math.round(score)));
  const ghostRisk = 100 - realHireProbability;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const confidence = Math.min(95, Math.max(30, Math.round(40 + (Math.min(wordCount, 500) / 500) * 35 + signals.length * 1.5)));

  let recommendation;
  if (realHireProbability >= 72) recommendation = "Apply";
  else if (realHireProbability >= 52) recommendation = "Network First";
  else if (realHireProbability >= 35) recommendation = "Low Priority";
  else recommendation = "Skip";

  const summary = generateSummary({ realHireProbability, signals });

  return { realHireProbability, ghostRisk, confidence, signals, recommendation, summary };
}
