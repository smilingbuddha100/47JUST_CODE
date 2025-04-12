import pandas as pd
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib

# Load dataset
df = pd.read_csv("data/commute_data_6000.csv")

# Features & target
X = df[["distance_km", "traffic_multiplier", "peak_hour", "mode_encoded", "day_of_week"]]
y = df["eta_minutes"]

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train XGBoost model
model = XGBRegressor(n_estimators=250, max_depth=8, learning_rate=0.1, random_state=42)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
import numpy as np

rmse = np.sqrt(mean_squared_error(y_test, y_pred))

within_5 = (abs(y_test - y_pred) <= 5).sum() / len(y_test) * 100

# Results
print(f"✅ Model trained successfully!")
print(f"MAE: {mae:.2f}")
print(f"RMSE: {rmse:.2f}")
print(f"Accuracy (±5 min): {within_5:.2f}%")

# Save model
joblib.dump(model, "model_xgb.pkl")
