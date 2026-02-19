import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, Model
from sentence_transformers import SentenceTransformer
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path

# Resolve paths relative to this file
BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "emergency_data_nlp.csv"
SCALER_PATH = BASE_DIR / "data_scaler.pkl"

df = pd.read_csv(CSV_PATH)

# 1. NLP Embedding
nlp_model = SentenceTransformer('all-MiniLM-L6-v2')
# Combine all text fields into one context string
text_columns = ['incident_type', 'details', 'hazards', 'people']
df['text_input'] = df[text_columns].fillna('').agg(' '.join, axis=1)
text_embeddings = nlp_model.encode(df['text_input'].values)

# 2. Numeric Features 
scaler = StandardScaler()
numeric_features = scaler.fit_transform(df[['urgency', 'hour', 'is_weekend']])
joblib.dump(scaler, SCALER_PATH)

y = df[['police', 'ambulance', 'bomba']].values

# 3. Model Architecture
# Text branch
text_in = layers.Input(shape=(384,), name="NLP_Input")
t = layers.Dense(128, activation='relu')(text_in)

# Numeric branch (Shape is now 3)
num_in = layers.Input(shape=(3,), name="Numeric_Input")
n = layers.Dense(64, activation='relu')(num_in)

# Merge
merged = layers.concatenate([t, n])
output = layers.Dense(3, activation='relu')(merged)

model = Model(inputs=[text_in, num_in], outputs=output)
model.compile(optimizer='adam', loss='mse')

model.fit([text_embeddings, numeric_features], y, epochs=30, batch_size=32)
model.save(BASE_DIR / "emergency_nlp_model.keras")