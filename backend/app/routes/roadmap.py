from flask import Blueprint, request, jsonify
from ..services.roadmap_service import generate_roadmap

roadmap_bp = Blueprint('roadmap', __name__, url_prefix='/api')

@roadmap_bp.route('/roadmap', methods=['POST'])
def roadmap():
    data = request.get_json()
    company = (data.get('company') or '').strip()
    role = (data.get('role') or '').strip()
    resume_text = (data.get('resume_text') or '').strip()

    if not company or not role:
        return jsonify({'error': 'company and role are required'}), 400
    if len(company) > 200 or len(role) > 200:
        return jsonify({'error': 'Input too long'}), 400

    result = generate_roadmap(company, role, resume_text)
    return jsonify(result)
