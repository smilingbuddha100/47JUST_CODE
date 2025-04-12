import pandas as pd
from math import sqrt
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib
import os

# Load dataset
csv_path = "data/commute_data_6000.csv"  # Ensure it's the Bengaluru-specific dataset
df = pd.read_csv(csv_path)

# Features & Target
X = df[["distance_km", "traffic_multiplier", "peak_hour", "mode_encoded"]]
y = df["eta_minutes"]

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
rmse = sqrt(mean_squared_error(y_test, y_pred))
within_5_min = sum(abs(y_test - y_pred) <= 5) / len(y_test) * 100

# Print metrics
print(f"✅ Model trained successfully!")
print(f"MAE: {mae:.2f}")
print(f"RMSE: {rmse:.2f}")
print(f"Accuracy (±5 min): {within_5_min:.2f}%")

# Save model
model_dir = "models"
if not os.path.exists(model_dir):
    os.makedirs(model_dir)

joblib.dump(model, os.path.join(model_dir, "rf_model_bengaluru.pkl"))
print("✅ Model saved at models/rf_model_bengaluru.pkl")
import joblib

# Save model after training
joblib.dump(model, 'model.pkl')
print("✅ Model saved as model.pkl")
