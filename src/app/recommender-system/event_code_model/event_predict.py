import numpy as np
import joblib
import pandas as pd
from pathlib import Path

# Resolve paths relative to this file
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "event_code_model.pkl"
TEST_INPUTS_PATH = BASE_DIR / "test_inputs.csv"

loaded_model = joblib.load(MODEL_PATH)

df_test = pd.read_csv(TEST_INPUTS_PATH)

df_test['Predicted_Code'] = loaded_model.predict(df_test['Incident_Description'])

print(df_test[['Incident_Description', 'Predicted_Code']])
df_test.to_csv(BASE_DIR / "results.csv", index=False)