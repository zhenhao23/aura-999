import numpy as np
import joblib
from tensorflow.keras.models import load_model
from sentence_transformers import SentenceTransformer
from datetime import datetime
from pathlib import Path

# 1. Load the trained assets
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "emergency_nlp_model.keras"
SCALER_PATH = BASE_DIR / "data_scaler.pkl"
NLP_MODEL_PATH = "all-MiniLM-L6-v2"

model = load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
nlp_model = SentenceTransformer(NLP_MODEL_PATH)

def predict_resources(incident_report):
    """
    incident_report: Dictionary containing text from your input image
    """
    # --- Part A: Process NLP Text ---
    # Combine fields into a single string exactly like the training phase
    combined_text = (
        f"{incident_report['type']} {incident_report['details']} "
        f"{incident_report['hazards']} {incident_report['people']}"
    )
    text_embedding = nlp_model.encode([combined_text]) # Shape (1, 384)

    # --- Part B: Process Numeric Data ---
    # We need: [urgency, hour, is_weekend]
    now = datetime.now()
    hour = now.hour
    is_weekend = 1 if now.weekday() >= 5 else 0
    
    numeric_raw = np.array([[
        incident_report['urgency'], 
        hour, 
        is_weekend
    ]])
    numeric_scaled = scaler.transform(numeric_raw) # Shape (1, 3)

    # --- Part C: Generate Prediction ---
    prediction = model.predict([text_embedding, numeric_scaled])
    
    return {
        "Police": max(0, int(round(prediction[0][0]))),
        "Ambulance": max(0, int(round(prediction[0][1]))),
        "Bomba": max(0, int(round(prediction[0][2])))
    }

sample_input = {
    "urgency": 4,
    "type": "Fire",
    "details": "Apartment kitchen fire, smoke spreading to hallway",
    "hazards": "Thick black smoke, possible gas leak",
    "people": "2 elderly residents trapped"
}

result = predict_resources(sample_input)

print("\n--- Recommended Resource Allocation ---")
for resource, count in result.items():
    print(f"{resource}: {count} units")