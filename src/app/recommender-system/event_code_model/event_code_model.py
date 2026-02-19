import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
import joblib
from pathlib import Path

# Resolve paths relative to this file
BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "MPDS_Protocol_01_to10.csv"
MODEL_PATH = BASE_DIR / "event_code_model.pkl"

df_train = pd.read_csv(CSV_PATH)
model = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 2))),
    ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
])
model.fit(df_train['Descriptor'], df_train['Determinant Code'])

joblib.dump(model, MODEL_PATH)
print(f"Model saved successfully as {MODEL_PATH}")