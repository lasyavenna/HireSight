from flask import Blueprint, request, jsonify
from ..services.gemini_service import analyze_job_with_ai, get_interview_insights, analyze_resume_match

analyze_bp = Blueprint('analyze', __name__, url_prefix='/api')

@analyze_bp.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    job_description = data.get('job_description', '')
    rule_score = data.get('rule_score', 50)

    if not job_description or len(job_description) < 50:
        return jsonify({'error': 'Job description too short'}), 400

    ai_result = analyze_job_with_ai(job_description, rule_score)

    return jsonify({
        'summary': ai_result.get('summary'),
        'top_signals': ai_result.get('top_signals', []),
        'action': ai_result.get('action'),
    })


@analyze_bp.route('/interview-prep', methods=['POST'])
def interview_prep():
    data = request.get_json()
    company = (data.get('company') or '').strip()
    role = (data.get('role') or '').strip()

    if not company or not role:
        return jsonify({'error': 'Company and role are required'}), 400

    return jsonify(get_interview_insights(company, role))


@analyze_bp.route('/resume-analyze', methods=['POST'])
def resume_analyze():
    data = request.get_json()
    resume = (data.get('resume') or '').strip()
    job_description = (data.get('job_description') or '').strip()

    if not resume or len(resume) < 100:
        return jsonify({'error': 'Resume text is required (min 100 characters)'}), 400

    result = {}
    if job_description:
        result['resume_match'] = analyze_resume_match(resume, job_description)

    return jsonify(result)