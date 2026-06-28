from flask import Flask
from flask_cors import CORS

from routes.upload import upload_bp
from routes.clean import clean_bp
from routes.model import train_bp
from routes.persis import persis_bp

app = Flask(__name__)
CORS(app)

# Registrar Blueprints
app.register_blueprint(upload_bp)
app.register_blueprint(clean_bp)
app.register_blueprint(train_bp)
app.register_blueprint(persis_bp)

@app.route("/")
def home():
    return {
        "ok": True,
        "mensaje": "Backend funcionando"
    }

if __name__ == "__main__":
    app.run(debug=True)