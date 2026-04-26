from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app, origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
    ])

    from .routes.analyze import analyze_bp
    from .routes.health import health_bp
    from .routes.roadmap import roadmap_bp
    app.register_blueprint(analyze_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(roadmap_bp)

    return app
