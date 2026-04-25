from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:3000"])

    from .routes.analyze import analyze_bp
    from .routes.health import health_bp
    app.register_blueprint(analyze_bp)
    app.register_blueprint(health_bp)

    return app