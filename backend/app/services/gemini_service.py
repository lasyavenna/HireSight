import os
import json

try:
    import google.generativeai as genai
except ImportError:
    genai = None

model = None
MODEL_NAME = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
if genai and os.getenv('GEMINI_API_KEY'):
    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
    model = genai.GenerativeModel(MODEL_NAME)

def gemini_status() -> dict:
    if not genai:
        return {
            "configured": False,
            "reason": "google-generativeai is not installed in the backend Python environment.",
        }
    if not os.getenv('GEMINI_API_KEY'):
        return {
            "configured": False,
            "reason": "GEMINI_API_KEY is missing from backend/.env or the backend process environment.",
        }
    if not model:
        return {
            "configured": False,
            "reason": "Gemini model was not initialized.",
        }
    return {
        "configured": True,
        "reason": "",
        "model": MODEL_NAME,
    }

def _parse_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith('```'):
        text = text.split('\n', 1)[1].rsplit('```', 1)[0].strip()
    return json.loads(text)

def analyze_job_with_ai(job_description: str, rule_score: int, resume_text: str = "") -> dict:
    prompt = f"""You are an expert at detecting ghost jobs — roles companies post with no real intent to hire.

Analyze this job posting and provide:
1. A 2-3 sentence plain-English summary of whether this looks like a real job
2. The top 2 specific red flags (or green flags if it looks real)
3. One concrete action the applicant should take
4. If resume context is provided, a 1-2 sentence candidate-fit note that references specific overlap or gaps

Rule-based score: {rule_score}/100 (higher = more legitimate)

Job Posting:
{job_description[:3000]}

Resume Context:
{resume_text[:2200] if resume_text else "No resume provided."}

Respond in this exact JSON format:
{{
  "summary": "...",
  "top_signals": ["...", "..."],
  "action": "...",
  "candidate_fit": "..."
}}"""

    try:
        if not model:
            raise RuntimeError("Gemini is not configured")
        response = model.generate_content(prompt)
        return _parse_json_response(response.text)
    except Exception as e:
        candidate_fit = ""
        if resume_text:
            candidate_fit = "Resume context was received, but AI fit analysis is unavailable right now. Compare the resume keywords against the role requirements before applying."
        return {
            "summary": "AI analysis unavailable at this time.",
            "top_signals": [],
            "action": "Review the rule-based signals above.",
            "candidate_fit": candidate_fit,
        }

def analyze_interview_answer_with_ai(
    question: str,
    answer: str,
    mode: str,
    resume_context: str,
    local_score: dict,
) -> dict:
    prompt = f"""You are HireSight's live interview coach. Give specific, useful feedback on a candidate's practice interview answer.

Do not be generic. Refer to exact details from the answer. If the answer lacks specifics, say what exact detail is missing.
Score strictly but fairly for a real internship/new-grad software interview.

Interview mode: {mode}
Question:
{question[:800]}

Candidate answer:
{answer[:3500]}

Resume context, if available:
{resume_context[:1600] if resume_context else "No resume context available."}

Local rubric estimate:
{json.dumps(local_score)}

Evaluate:
- Clarity: organized, direct, not rambling, answers the question
- Depth: concrete story, candidate ownership, technical/behavioral substance, tradeoffs where relevant
- Impact: measurable result, learning, user/team/business outcome, validation

Return ONLY valid JSON in this exact shape:
{{
  "clarity": 0,
  "depth": 0,
  "impact": 0,
  "feedback": "3-5 sentences with direct, detailed coaching.",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"],
  "better_answer": "A stronger 4-6 sentence sample answer using only facts the candidate provided. Do not invent companies, numbers, or projects.",
  "follow_up_question": "One realistic interviewer follow-up question."
}}"""

    try:
        if not model:
            raise RuntimeError("Gemini is not configured")
        response = model.generate_content(prompt)
        result = _parse_json_response(response.text)
        return {
            "clarity": int(result.get("clarity", local_score.get("clarity", 50))),
            "depth": int(result.get("depth", local_score.get("depth", 50))),
            "impact": int(result.get("impact", local_score.get("impact", 50))),
            "feedback": result.get("feedback", "Add a concrete example, explain your action, and connect it to a result."),
            "strengths": result.get("strengths", [])[:3],
            "improvements": result.get("improvements", [])[:3],
            "better_answer": result.get("better_answer", ""),
            "follow_up_question": result.get("follow_up_question", ""),
            "source": "gemini",
            "status_reason": "",
        }
    except Exception as e:
        status = gemini_status()
        return {
            "clarity": local_score.get("clarity", 50),
            "depth": local_score.get("depth", 50),
            "impact": local_score.get("impact", 50),
            "feedback": f"Gemini analysis is unavailable right now ({status['reason'] or 'request failed'}), so HireSight used the local scoring rubric instead.",
            "strengths": local_score.get("strengths", []),
            "improvements": local_score.get("improvements", []),
            "better_answer": "",
            "follow_up_question": "",
            "source": "local",
            "status_reason": status["reason"] or "Gemini request failed.",
        }
