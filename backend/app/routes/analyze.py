from flask import Blueprint, request, jsonify
from ..services.gemini_service import analyze_job_with_ai

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