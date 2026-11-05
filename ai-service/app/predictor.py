"""
predictor.py — Model Loading & Inference Engine

Loads the saved model artifact from disk once at startup, caches it in memory,
validates feature column order, and executes predictions.
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, Tuple
import joblib
import pandas as pd

from app.schemas import CampaignRiskRequest, CampaignRiskResponse
from app.explainer import generate_explanation_signals

logger = logging.getLogger(__name__)

class ModelPredictor:
    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.getenv("MODEL_PATH", os.path.join(base_dir, "..", "models", "model.joblib"))
        
        self.model_path = os.path.abspath(model_path)
        self.model = None
        self.feature_columns = []
        self.version = "unknown"
        self._load_model()

    def _load_model(self):
        """Loads model bundle from disk."""
        if not os.path.exists(self.model_path):
            logger.warning("Model file not found at %s. Predictor will be uninitialized.", self.model_path)
            return

        try:
            artifact = joblib.load(self.model_path)
            self.model = artifact["model"]
            self.feature_columns = artifact["feature_columns"]
            self.version = artifact.get("version", "1.0.0")
            logger.info("Successfully loaded model artifact (version %s) from %s", self.version, self.model_path)
        except Exception as e:
            logger.error("Failed to load model from %s: %s", self.model_path, e, exc_info=True)

    @property
    def is_loaded(self) -> bool:
        return self.model is not None

    def predict_risk(self, request: CampaignRiskRequest) -> CampaignRiskResponse:
        """
        Executes prediction on a validated campaign request.
        """
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded. Train the model or check MODEL_PATH.")

        # Convert request to pandas DataFrame in the exact feature column order expected by the model
        data_dict = request.model_dump()
        input_df = pd.DataFrame([{col: data_dict[col] for col in self.feature_columns}])

        # Predict probability of the suspicious class (class 1)
        proba = float(self.model.predict_proba(input_df)[0][1])
        
        # Scale to 0-100 risk score
        risk_score = int(round(proba * 100))

        # Categorize
        if risk_score >= 70:
            category = "HIGH"
        elif risk_score >= 35:
            category = "MEDIUM"
        else:
            category = "LOW"

        # Generate human-readable explanation signals
        signals = generate_explanation_signals(request, risk_score)

        return CampaignRiskResponse(
            campaign_id=request.campaign_id,
            risk_score=risk_score,
            risk_category=category,
            probability=round(proba, 4),
            signals=signals,
            model_version=self.version,
            analyzed_at=datetime.now(timezone.utc).isoformat(),
        )

# Global singleton predictor instance
predictor = ModelPredictor()
