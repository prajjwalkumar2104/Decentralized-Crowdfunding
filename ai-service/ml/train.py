"""
train.py — Machine-Learning Training Pipeline

This script:
1. Loads the synthetic dataset (campaigns.csv).
2. Performs data validation and feature/label separation.
3. Splits data into stratified train and test sets (prevents data leakage).
4. Trains a Random Forest Classifier.
5. Evaluates model performance using Precision, Recall, F1, and Confusion Matrix.
6. Saves the trained model artifact and metadata (feature names, version) to models/model.joblib.

Run with:
    python ml/train.py
"""

import os
import sys
import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
)

RANDOM_SEED = 42
MODEL_VERSION = "1.0.0"

FEATURE_COLUMNS = [
    "funding_progress",
    "contributor_count",
    "unique_contributor_count",
    "avg_contribution_eth",
    "contribution_std_eth",
    "top_contributor_share",
    "milestone_count",
    "milestone_completion_ratio",
    "milestone_vote_participation",
    "is_cancelled",
    "days_until_deadline",
    "creator_campaign_count",
]

TARGET_COLUMN = "is_suspicious"


def load_and_validate_data(dataset_path: str) -> pd.DataFrame:
    """Loads CSV and verifies integrity."""
    if not os.path.exists(dataset_path):
        print(f"[FAIL] Dataset not found at: {dataset_path}")
        print("Please run 'python ml/generate_dataset.py' first.")
        sys.exit(1)

    df = pd.read_csv(dataset_path)
    print(f"[OK] Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")

    # Verify features and target existence
    for col in FEATURE_COLUMNS + [TARGET_COLUMN]:
        if col not in df.columns:
            print(f"[FAIL] Missing required column: {col}")
            sys.exit(1)

    # Check for missing values
    if df[FEATURE_COLUMNS + [TARGET_COLUMN]].isnull().any().any():
        print("[FAIL] Missing values detected in training columns.")
        sys.exit(1)

    return df


def train():
    print("=" * 60)
    print("  RADIANTFUND AI — MODEL TRAINING PIPELINE")
    print("=" * 60)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(base_dir, "..", "datasets", "campaigns.csv")
    models_dir = os.path.join(base_dir, "..", "models")
    os.makedirs(models_dir, exist_ok=True)
    model_output_path = os.path.join(models_dir, "model.joblib")

    # 1. Load data
    df = load_and_validate_data(dataset_path)

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    # 2. Train/Test Split (Stratified to maintain class ratios in both splits)
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=RANDOM_SEED,
        stratify=y,
    )
    print(f"\n[OK] Split data: {len(X_train)} training samples, {len(X_test)} testing samples")

    # 3. Model Training
    # We use a balanced Random Forest with 100 trees and moderate max_depth to prevent overfitting
    print("\nTraining Random Forest Classifier...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=RANDOM_SEED,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)
    print("[OK] Training complete.")

    # 4. Evaluation on Unseen Test Data
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    cm = confusion_matrix(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_proba)

    print("\n" + "-" * 60)
    print("  MODEL EVALUATION (On Unseen Test Set)")
    print("-" * 60)
    print(f"Precision: {prec:.4f}  (Of all campaigns flagged as suspicious, {prec*100:.1f}% were truly suspicious)")
    print(f"Recall:    {rec:.4f}  (Of all truly suspicious campaigns, {rec*100:.1f}% were detected)")
    print(f"F1-Score:  {f1:.4f}  (Harmonic balance between precision and recall)")
    print(f"ROC-AUC:   {roc_auc:.4f}  (Discrimination ability across all thresholds)")

    print("\nConfusion Matrix:")
    print("               Predicted Normal  Predicted Suspicious")
    print(f"Actual Normal      {cm[0][0]:>10}            {cm[0][1]:>10}")
    print(f"Actual Suspicious  {cm[1][0]:>10}            {cm[1][1]:>10}")

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Normal", "Suspicious"]))

    # 5. Feature Importances
    importances = pd.Series(model.feature_importances_, index=FEATURE_COLUMNS).sort_values(ascending=False)
    print("\nTop 5 Most Informative Features:")
    for feat, imp in importances.head(5).items():
        print(f"  - {feat:<30} {imp*100:.2f}%")

    # 6. Save Model Bundle (Model + Metadata)
    artifact = {
        "model": model,
        "feature_columns": FEATURE_COLUMNS,
        "version": MODEL_VERSION,
        "metrics": {
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1),
            "roc_auc": float(roc_auc),
        },
    }

    joblib.dump(artifact, model_output_path)
    print(f"\n[OK] Model successfully saved to: {os.path.abspath(model_output_path)}")
    print(f"Model file size: {os.path.getsize(model_output_path) / 1024:.1f} KB")
    print("=" * 60)


if __name__ == "__main__":
    train()
