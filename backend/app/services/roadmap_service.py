import os
import json
import concurrent.futures

try:
    import google.generativeai as genai
except ImportError:
    genai = None

try:
    from ddgs import DDGS
    _search_available = True
except ImportError:
    try:
        from duckduckgo_search import DDGS
        _search_available = True
    except ImportError:
        _search_available = False

MODEL_NAME = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
_model = None


def _get_model():
    global _model
    if _model is None and genai and os.getenv('GEMINI_API_KEY'):
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        _model = genai.GenerativeModel(MODEL_NAME)
    return _model


def _search(query: str, max_results: int = 6) -> list:
    if not _search_available:
        return []
    try:
        with DDGS() as ddgs:
            return list(ddgs.text(query, max_results=max_results))
    except Exception:
        return []


def _gather_web_context(company: str, role: str) -> str:
    queries = [
        f'{company} {role} interview experience site:reddit.com',
        f'{company} {role} glassdoor blind interview process rounds timeline',
        f'{company} {role} job requirements skills qualifications',
        f'{company} {role} how to get hired preparation tips',
    ]
    labels = [
        'REDDIT — CANDIDATE EXPERIENCES',
        'GLASSDOOR / BLIND — INTERVIEW PROCESS',
        'JOB REQUIREMENTS & SKILLS',
        'PREPARATION & HIRING TIPS',
    ]

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        all_results = list(pool.map(lambda q: _search(q, 6), queries))

    sections = []
    for label, hits in zip(labels, all_results):
        snippets = []
        for h in hits:
            title = (h.get('title') or '').strip()
            body = (h.get('body') or '').strip()
            url = h.get('href', '')
            if body:
                snippets.append(f'  [{title}]\n  Source: {url}\n  {body[:500]}')
        if snippets:
            sections.append(f'--- {label} ---\n' + '\n\n'.join(snippets))

    return '\n\n'.join(sections) if sections else 'No live search results available.'


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith('```'):
        text = text.split('\n', 1)[1].rsplit('```', 1)[0].strip()
    return json.loads(text)


def generate_roadmap(company: str, role: str, resume_text: str = '') -> dict:
    model = _get_model()
    if not model:
        return _fallback_roadmap(company, role)

    web_context = _gather_web_context(company, role)
    resume_section = (
        f'\nCandidate resume (use this to personalize the skill gap analysis):\n{resume_text[:2000]}'
        if resume_text else ''
    )

    prompt = f"""You are a career intelligence engine building a personalized roadmap for:
- Company: {company}
- Role: {role}

Below are REAL, LIVE search results pulled right now from Reddit, Glassdoor, Blind, and job postings.
Use these as your primary source. Every claim you make must come from or be consistent with the search results.
Do NOT produce generic advice. Reference what the search results actually say — specific rounds, specific questions, specific skills mentioned in real job postings, real timelines.

=== LIVE SEARCH RESULTS ===
{web_context}
=== END SEARCH RESULTS ==={resume_section}

Now produce a roadmap grounded in these results. Rules:
- If the results mention specific interview rounds (e.g. "2 coding rounds + 1 system design"), use that.
- If the results mention specific tools/languages in job postings, use those exact tools.
- If Reddit/Blind candidates say something specific about difficulty or surprises, quote or paraphrase it.
- If you genuinely found nothing specific for a field, say so honestly instead of inventing generic advice.

Return ONLY raw JSON (no markdown, no backticks):
{{
  "overview": "2-3 sentences that reference specific things found in the search results about landing {role} at {company}. Start with what the community actually says.",
  "hiring_process": "Describe {company}'s actual hiring process for {role} based on the search results: OA format, number of rounds, what each covers, typical timeline.",
  "required_skills": {{
    "technical": ["Exact skill or technology mentioned in {company}'s job postings or community reports"],
    "tools_and_platforms": ["Real tools/platforms from the search results for this specific company and role"],
    "soft_skills": ["Soft skill specifically called out for {company}'s culture based on results"]
  }},
  "timeline": [
    {{
      "phase": "Phase name",
      "weeks": "Weeks 1–3",
      "goal": "Goal tied specifically to what {company} tests for based on search results",
      "tasks": [
        "Specific task referencing {company}'s actual stack or interview format from results",
        "Second specific task",
        "Third specific task"
      ],
      "milestone": "Concrete, measurable deliverable"
    }}
  ],
  "projects_to_build": [
    {{
      "name": "Project name",
      "why": "Why this mirrors {company}'s actual product/tech based on what you found in results",
      "skills": ["skill1", "skill2"]
    }}
  ],
  "application_tips": [
    "Tip grounded in what Reddit/Glassdoor said about {company}'s application process",
    "Second tip from search results",
    "Third tip from search results"
  ],
  "community_insights": "2-3 sentences summarizing what real candidates said on Reddit or Blind about {company}'s {role} process. Include specific recurring themes, warnings, or surprises from the results.",
  "resources": [
    "Specific resource relevant to what {company} tests for, based on search results",
    "Second resource"
  ]
}}

Timeline: exactly 4 phases, weeks 1–12, exactly 3 tasks each."""

    try:
        response = model.generate_content(prompt)
        result = _parse_json(response.text)
        _validate(result)
        return result
    except Exception:
        try:
            response = model.generate_content(prompt + '\n\nIMPORTANT: Return raw JSON only. No backticks. No markdown.')
            result = _parse_json(response.text)
            _validate(result)
            return result
        except Exception:
            return _fallback_roadmap(company, role)


def _validate(data: dict):
    for key in ['overview', 'hiring_process', 'required_skills', 'timeline', 'projects_to_build']:
        if key not in data:
            raise ValueError(f'Missing key: {key}')


def _fallback_roadmap(company: str, role: str) -> dict:
    return {
        'overview': f'Live search results for {role} at {company} could not be loaded. The roadmap below is based on general industry knowledge — restart the backend and try again for company-specific data.',
        'hiring_process': 'Typical tech hiring: resume screen → online assessment (OA) → 1-2 phone screens → virtual onsite (3-5 rounds). Timeline is usually 4-8 weeks.',
        'required_skills': {
            'technical': ['Data Structures & Algorithms', 'System Design', 'Python or Java', 'SQL'],
            'tools_and_platforms': ['Git', 'Linux', 'Cloud basics (AWS/GCP/Azure)'],
            'soft_skills': ['Clear communication', 'Structured problem-solving', 'Intellectual curiosity'],
        },
        'timeline': [
            {
                'phase': 'Foundation', 'weeks': 'Weeks 1–3',
                'goal': 'Close gaps in core CS fundamentals',
                'tasks': ['Solve 50 LeetCode mediums in your target language', 'Read Designing Data-Intensive Applications ch. 1-5', f'Research {company}\'s engineering blog and tech stack'],
                'milestone': 'Consistently solving LeetCode mediums in under 25 min',
            },
            {
                'phase': 'Build', 'weeks': 'Weeks 4–7',
                'goal': 'Create portfolio projects that match the domain',
                'tasks': [f'Build a project using {company}\'s core technology', 'Deploy it with a clean README and demo', 'Contribute one PR to a related open-source project'],
                'milestone': 'Two deployed, documented projects on GitHub',
            },
            {
                'phase': 'Network', 'weeks': 'Weeks 8–10',
                'goal': 'Build internal visibility and find a referral',
                'tasks': [f'Connect with 10 {company} employees on LinkedIn', 'Request one informational interview', 'Attend a company-hosted virtual event or meetup'],
                'milestone': 'Secured a referral or informational interview',
            },
            {
                'phase': 'Apply & Interview', 'weeks': 'Weeks 11–12',
                'goal': 'Submit application and ace the loop',
                'tasks': ['Submit application through referral if secured', 'Complete 3 mock interviews with peer feedback', 'Prepare 5 STAR behavioral stories'],
                'milestone': 'Completed full interview loop',
            },
        ],
        'projects_to_build': [
            {'name': f'Full-stack app in {company}\'s domain', 'why': 'Demonstrates product thinking and relevant technical skills', 'skills': ['API design', 'Database modeling', 'Frontend']},
        ],
        'application_tips': [
            'Get a referral — it dramatically increases your resume screen pass rate',
            'Tailor resume bullets to match exact language in the job description',
            'Apply early — many companies review on a rolling basis',
        ],
        'community_insights': 'Search results were unavailable. Generally: referrals are the highest-leverage action, and interviewers focus on problem-solving approach over perfect solutions.',
        'resources': [
            'Neetcode.io — structured LeetCode curriculum by pattern',
            'System Design Primer (GitHub) — free, comprehensive resource',
        ],
    }
