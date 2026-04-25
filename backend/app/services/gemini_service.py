import os
import google.generativeai as genai

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

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
        response = model.generate_content(prompt)
        import json
        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith('```'):
            text = text.split('\n', 1)[1].rsplit('```', 1)[0].strip()
        return json.loads(text)
    except Exception as e:
        return {
            "summary": "AI analysis unavailable at this time.",
            "top_signals": [],
            "action": "Review the rule-based signals above."
        }