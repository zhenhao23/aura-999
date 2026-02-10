from tensorflow.keras.models import load_model
import numpy as np
import joblib
loaded_model = load_model("src/app/recommender-system/emergency_recommender_model.keras")
scaler = joblib.load("src/app/recommender-system/data_scaler.pkl")

# Example: (Fire, Highway, Severity 5, High Density, Hour 14, Weekday)
sample_wide = np.array([[0, 0, 1, 0, 1, 0, 0]]) # One-hot: Fire + Highway
sample_deep = scaler.transform([[5, 9000, 14, 0]]) # Scaled numeric

prediction = loaded_model.predict([sample_wide, sample_deep])
print(f"Recommended Resources: Police: {round(prediction[0][0])}, Ambulance: {round(prediction[0][1])}, Bomba: {round(prediction[0][2])}")