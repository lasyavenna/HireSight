import os
import json
import google.generativeai as genai

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith('```'):
        text = text.split('\n', 1)[1].rsplit('```', 1)[0].strip()
    return json.loads(text)


def _generate(prompt: str) -> str:
    return model.generate_content(prompt).text


def get_interview_insights(company: str, role: str) -> dict:
    prompt = f"""You are an expert tech recruiter and career coach with deep knowledge of hiring at top companies.

Provide comprehensive interview prep insights for:
Company: {company}
Role: {role}

Return valid JSON only, no markdown or code fences:
{{
  "interview_process": [
    {{"stage": "Recruiter Screen", "description": "...", "duration": "30 min"}},
    {{"stage": "Online Assessment", "description": "...", "duration": "90 min"}},
    {{"stage": "Technical Interview", "description": "...", "duration": "45 min"}},
    {{"stage": "System Design", "description": "...", "duration": "45 min"}},
    {{"stage": "Behavioral / Final Loop", "description": "...", "duration": "3 hours"}}
  ],
  "role_insights": {{
    "summary": "2-3 sentence overview of what this role actually involves",
    "key_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
    "day_to_day": "What a typical day looks like",
    "team_context": "Team size, structure, and where this role fits"
  }},
  "technical_questions": [
    {{"type": "OA", "question": "...", "difficulty": "Medium"}},
    {{"type": "OA", "question": "...", "difficulty": "Hard"}},
    {{"type": "System Design", "question": "...", "difficulty": "Hard"}},
    {{"type": "System Design", "question": "...", "difficulty": "Hard"}},
    {{"type": "Behavioral", "question": "...", "difficulty": "Easy"}},
    {{"type": "Behavioral", "question": "...", "difficulty": "Medium"}},
    {{"type": "Technical", "question": "...", "difficulty": "Medium"}},
    {{"type": "Technical", "question": "...", "difficulty": "Hard"}}
  ],
  "tips": ["Tip specific to {company} culture/process", "Tip 2", "Tip 3"]
}}"""

    try:
        return _parse_json(_generate(prompt))
    except Exception as e:
        print(f"[interview_insights] error: {e}")
        return {
            "interview_process": [],
            "role_insights": {"summary": "Unable to fetch insights.", "key_skills": [], "day_to_day": "", "team_context": ""},
            "technical_questions": [],
            "tips": []
        }


def analyze_resume_match(resume: str, job_description: str) -> dict:
    prompt = f"""You are a senior technical recruiter and career advisor. Analyze this resume against the job description.

Resume:
{resume[:2500]}

Job Description:
{job_description[:2500]}

Return valid JSON only, no markdown or code fences:
{{
  "match_score": 72,
  "match_label": "Strong Match",
  "match_summary": "2-3 sentence analysis of how well this candidate fits",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2"],
  "keywords_found": ["keyword1", "keyword2", "keyword3"],
  "keywords_missing": ["keyword1", "keyword2"],
  "action_items": ["Specific action 1", "Specific action 2", "Specific action 3"]
}}

match_label must be one of: "Excellent Match", "Strong Match", "Moderate Match", "Weak Match"
match_score must be 0-100."""

    try:
        return _parse_json(_generate(prompt))
    except Exception as e:
        print(f"[resume_match] error: {e}")
        return {
            "match_score": 0,
            "match_label": "Analysis unavailable",
            "match_summary": "Resume analysis unavailable at this time.",
            "strengths": [], "gaps": [],
            "keywords_found": [], "keywords_missing": [],
            "action_items": []
        }


def analyze_job_with_ai(job_description: str, rule_score: int) -> dict:
    prompt = f"""You are an expert at detecting ghost jobs — roles companies post with no real intent to hire.

Analyze this job posting and provide:
1. A 2-3 sentence plain-English summary of whether this looks like a real job
2. The top 2 specific red flags (or green flags if it looks real)
3. One concrete action the applicant should take

Rule-based score: {rule_score}/100 (higher = more legitimate)

Job Posting:
{job_description[:3000]}

Respond in this exact JSON format:
{{
  "summary": "...",
  "top_signals": ["...", "..."],
  "action": "..."
}}"""

    try:
        return _parse_json(_generate(prompt))
    except Exception as e:
        print(f"[analyze_job] error: {e}")
        return {
            "summary": "AI analysis unavailable at this time.",
            "top_signals": [],
            "action": "Review the rule-based signals above."
        }
