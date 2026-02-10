import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, Model
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib

df = pd.read_csv("src/app/recommender-system/emergency_data.csv")
wide_df = pd.get_dummies(df[['emergency_type', 'location_cat']])

scaler = StandardScaler()
deep_num = scaler.fit_transform(df[['severity_score', 'pop_density', 'hour', 'is_weekend']])
joblib.dump(scaler, "src/app/recommender-system/data_scaler.pkl")
y = df[['police', 'ambulance', 'bomba']].values

X_wide_train, X_wide_test, X_deep_train, X_deep_test, y_train, y_test = train_test_split(
    wide_df.values, deep_num, y, test_size=0.2, random_state=42
)

# model
wide_input = layers.Input(shape=(X_wide_train.shape[1],), name="Wide_Input")

deep_input = layers.Input(shape=(X_deep_train.shape[1],), name="Deep_Input")
d = layers.Dense(64, activation='relu')(deep_input)
d = layers.Dense(32, activation='relu')(d)

merged = layers.concatenate([wide_input, d])

# 3 outputs
output = layers.Dense(3, activation='relu', name="Resource_Predictions")(merged)

model = Model(inputs=[wide_input, deep_input], outputs=output)
model.compile(optimizer='adam', loss='mse', metrics=['mae'])

# train
print("Training model...")
model.fit(
    [X_wide_train, X_deep_train], y_train, 
    epochs=50, batch_size=32, validation_split=0.1, verbose=0
)

# Evaluation
loss, mae = model.evaluate([X_wide_test, X_deep_test], y_test)
print(f"\nEvaluation Results -> Mean Absolute Error: {mae:.2f} units")

model.save("src/app/recommender-system/emergency_recommender_model.keras")