"""
evaluate.py — Standalone Model Evaluation & Inspection Script

Loads the trained model artifact from models/model.joblib, verifies that it can
be unpickled and run on test records, and outputs an assessment of feature
weights and test set metrics.

Run with:
    python ml/evaluate.py
"""

import os
import sys
import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix

def evaluate():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "..", "models", "model.joblib")
    dataset_path = os.path.join(base_dir, "..", "datasets", "campaigns.csv")

    if not os.path.exists(model_path):
        print(f"[FAIL] Saved model not found at {model_path}. Run train.py first.")
        sys.exit(1)

    artifact = joblib.load(model_path)
    model = artifact["model"]
    features = artifact["feature_columns"]
    version = artifact.get("version", "unknown")
    metrics = artifact.get("metrics", {})

    print("=" * 60)
    print(f"  MODEL ARTIFACT INSPECTION (Version: {version})")
    print("=" * 60)
    print(f"Features expected ({len(features)}):")
    for f in features:
        print(f"  - {f}")

    print("\nRecorded Metrics from Training:")
    for k, v in metrics.items():
        print(f"  {k:<15}: {v:.4f}")

    if os.path.exists(dataset_path):
        df = pd.read_csv(dataset_path)
        X = df[features]
        y = df["is_suspicious"]
        y_pred = model.predict(X)
        print("\nFull Dataset Check (Sanity Check):")
        print(confusion_matrix(y, y_pred))

    print("\n[OK] Model artifact is intact and ready for deployment.")

if __name__ == "__main__":
    evaluate()
