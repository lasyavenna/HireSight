import os
import json

try:
    import google.generativeai as genai
except ImportError:
    genai = None

MODEL_NAME = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
_model = None

def _get_model():
    global _model
    if _model is None and genai and os.getenv('GEMINI_API_KEY'):
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        _model = genai.GenerativeModel(MODEL_NAME)
    return _model

def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith('```'):
        text = text.split('\n', 1)[1].rsplit('```', 1)[0].strip()
    return json.loads(text)

def generate_roadmap(company: str, role: str, resume_text: str = '') -> dict:
    model = _get_model()
    if not model:
        return _fallback_roadmap(company, role)

    resume_section = f"\nCandidate resume context:\n{resume_text[:2000]}" if resume_text else ""

    prompt = f"""You are a career intelligence engine with deep knowledge of hiring at top tech companies, sourced from LinkedIn job postings, Reddit threads (r/cscareerquestions, r/jobs, company-specific subreddits), Glassdoor reviews, and real candidate experiences.

A candidate wants to land the following role:
- Company: {company}
- Role: {role}{resume_section}

Research and synthesize everything you know about:
1. What skills are truly required for this exact role at this company (not generic — be specific to how {company} hires for {role})
2. What the hiring process actually looks like (OA, interviews, rounds, timelines)
3. What projects and experience make candidates stand out
4. What the community (Reddit/Discord/Blind) says about this company's interview process
5. A realistic step-by-step 12-week roadmap someone could follow to get ready

Return ONLY valid JSON in this exact shape — no markdown, no extra text:
{{
  "overview": "2-3 sentence honest assessment of what it takes to get {role} at {company}. Be specific to this company's culture and bar.",
  "hiring_process": "2-3 sentences describing the actual interview process: OA, phone screens, rounds, timeline from app to offer.",
  "required_skills": {{
    "technical": ["list of specific technical skills — be precise, e.g. 'Python (pandas, asyncio)' not just 'Python'"],
    "tools_and_platforms": ["specific tools, frameworks, cloud platforms used at this company"],
    "soft_skills": ["2-3 genuinely important soft skills for this company culture, not generic buzzwords"]
  }},
  "timeline": [
    {{
      "phase": "Phase name (e.g. 'Foundation')",
      "weeks": "e.g. 'Weeks 1–3'",
      "goal": "One sentence on what to accomplish this phase",
      "tasks": ["specific actionable task", "specific actionable task", "specific actionable task"],
      "milestone": "Concrete deliverable that proves this phase is done"
    }}
  ],
  "projects_to_build": [
    {{
      "name": "Project name",
      "why": "Why this specific project signals fit for {role} at {company}",
      "skills": ["skill1", "skill2"]
    }}
  ],
  "application_tips": [
    "Specific tip about how {company} recruits or screens for {role}",
    "Another specific tip about the referral/networking strategy for this company",
    "A third tip about what to highlight in resume/cover letter for this company"
  ],
  "community_insights": "2-3 sentences summarizing what candidates on Reddit, Blind, or Discord say about {company}'s {role} hiring — include specific recurring themes or surprises.",
  "resources": [
    "Specific resource name + why it's relevant to this company/role",
    "Another resource"
  ]
}}

The timeline array must have exactly 4 phases covering weeks 1-12. Each phase must have exactly 3 tasks. Be specific to {company} and {role}, not generic career advice."""

    try:
        response = model.generate_content(prompt)
        result = _parse_json(response.text)
        _validate_roadmap(result)
        return result
    except Exception:
        try:
            # Retry with explicit instruction to avoid markdown
            response = model.generate_content(prompt + "\n\nIMPORTANT: Return raw JSON only. No backticks. No markdown.")
            result = _parse_json(response.text)
            _validate_roadmap(result)
            return result
        except Exception as e:
            return _fallback_roadmap(company, role)


def _validate_roadmap(data: dict):
    required = ['overview', 'hiring_process', 'required_skills', 'timeline', 'projects_to_build', 'application_tips']
    for key in required:
        if key not in data:
            raise ValueError(f"Missing key: {key}")


def _fallback_roadmap(company: str, role: str) -> dict:
    return {
        "overview": f"Analysis for {role} at {company} is temporarily unavailable. The general path involves building a strong technical portfolio, networking with employees, and preparing for system design and coding interviews.",
        "hiring_process": "Typical tech hiring involves an initial resume screen, an online assessment (OA), 1-2 phone interviews, and a final onsite or virtual loop with 3-5 rounds.",
        "required_skills": {
            "technical": ["Data Structures & Algorithms", "System Design", "Python or Java", "SQL"],
            "tools_and_platforms": ["Git", "Linux", "Cloud basics (AWS/GCP/Azure)"],
            "soft_skills": ["Clear communication", "Structured problem-solving", "Intellectual curiosity"]
        },
        "timeline": [
            {
                "phase": "Foundation",
                "weeks": "Weeks 1–3",
                "goal": "Close skill gaps in core CS fundamentals",
                "tasks": ["Complete 50 LeetCode medium problems in target language", "Review system design fundamentals (Designing Data-Intensive Applications)", "Research the company's tech stack and recent engineering blog posts"],
                "milestone": "Can solve medium LeetCode problems in under 30 minutes"
            },
            {
                "phase": "Build",
                "weeks": "Weeks 4–7",
                "goal": "Create portfolio projects that match the company's domain",
                "tasks": ["Build a project using the company's core technology", "Write a technical blog post about what you built", "Contribute to a related open-source project"],
                "milestone": "Two deployed projects visible on GitHub with good READMEs"
            },
            {
                "phase": "Network",
                "weeks": "Weeks 8–10",
                "goal": "Build internal visibility and find a referral",
                "tasks": ["Connect with 10 employees at the company on LinkedIn", "Attend a virtual event or meetup hosted by the company", "Reach out to one engineer for a 15-minute coffee chat"],
                "milestone": "Secured an internal referral or informational interview"
            },
            {
                "phase": "Apply & Interview",
                "weeks": "Weeks 11–12",
                "goal": "Submit application and ace the interview loop",
                "tasks": ["Submit application with referral if secured", "Practice 3 mock interviews with peers", "Prepare STAR stories for 5 behavioral scenarios"],
                "milestone": "Completed full interview loop"
            }
        ],
        "projects_to_build": [
            {
                "name": "Full-stack web app in target company's domain",
                "why": "Demonstrates product thinking and relevant technical skills",
                "skills": ["API design", "Database modeling", "Frontend"]
            }
        ],
        "application_tips": [
            "Get a referral — it dramatically increases resume screen pass rates at most tech companies",
            "Tailor your resume bullets to match the exact language in the job description",
            "Apply as early as possible after a role posts — many companies review on a rolling basis"
        ],
        "community_insights": "Community discussions consistently emphasize that referrals are the single highest-leverage action for getting through the resume screen. Interview difficulty varies by team but typically focuses on problem-solving approach over perfect solutions.",
        "resources": [
            "Neetcode.io — structured LeetCode curriculum organized by pattern",
            "System Design Primer (GitHub) — comprehensive free system design resource"
        ]
    }
