from flask import Blueprint, request, jsonify
from ..services.gemini_service import analyze_job_with_ai, analyze_interview_answer_with_ai, gemini_status

analyze_bp = Blueprint('analyze', __name__, url_prefix='/api')

@analyze_bp.route('/gemini-status', methods=['GET'])
def status():
    return jsonify(gemini_status())

@analyze_bp.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    job_description = data.get('job_description', '')
    rule_score = data.get('rule_score', 50)
    resume_text = data.get('resume_text', '')

    if not job_description or len(job_description) < 50:
        return jsonify({'error': 'Job description too short'}), 400

    ai_result = analyze_job_with_ai(job_description, rule_score, resume_text)

    return jsonify({
        'summary': ai_result.get('summary'),
        'top_signals': ai_result.get('top_signals', []),
        'action': ai_result.get('action'),
        'candidate_fit': ai_result.get('candidate_fit'),
    })

@analyze_bp.route('/interview-analyze', methods=['POST'])
def analyze_interview():
    data = request.get_json()
    question = data.get('question', '')
    answer = data.get('answer', '')
    mode = data.get('mode', 'mixed')
    resume_context = data.get('resume_context', '')
    local_score = data.get('local_score', {})

    if not answer or len(answer.split()) < 5:
        return jsonify({'error': 'Answer too short'}), 400

    ai_result = analyze_interview_answer_with_ai(
        question=question,
        answer=answer,
        mode=mode,
        resume_context=resume_context,
        local_score=local_score,
    )

    return jsonify(ai_result)
