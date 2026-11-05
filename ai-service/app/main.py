"""
main.py — FastAPI Application Entrypoint

Serves:
  - GET  /health          → Health check & model status
  - POST /api/risk-score  → Machine learning fraud-risk inference & explanation
  - GET  /docs            → Interactive Swagger UI documentation
"""

import os
import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.schemas import HealthResponse, CampaignRiskRequest, CampaignRiskResponse
from app.predictor import predictor

# ─── Logging Setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ─── FastAPI App Instance ─────────────────────────────────────────────────────
app = FastAPI(
    title="RadiantFund AI — Fraud Risk Service",
    description=(
        "Estimates fraud risk for RadiantFund crowdfunding campaigns using "
        "a machine-learning model. Returns a risk score (0–100), a risk "
        "category (LOW / MEDIUM / HIGH), and human-readable explanation signals.\n\n"
        "**Important**: This service provides risk estimates only. "
        "A high score does not prove fraud. A low score does not guarantee legitimacy."
    ),
    version="1.0.0",
    redoc_url=None,
)

# ─── CORS Configuration ───────────────────────────────────────────────────────
raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

logger.info("CORS configured — allowed origins: %s", allowed_origins)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Returns the operational status of the AI service and whether the ML model is loaded.",
    tags=["Monitoring"],
)
async def health_check() -> HealthResponse:
    """Returns service status and model availability."""
    return HealthResponse(
        status="ok" if predictor.is_loaded else "degraded",
        model_loaded=predictor.is_loaded,
        version=predictor.version,
    )


@app.post(
    "/api/risk-score",
    response_model=CampaignRiskResponse,
    summary="Evaluate Campaign Risk",
    description="Computes fraud-risk assessment and explanations for a crowdfunding campaign.",
    tags=["Risk Scoring"],
)
async def calculate_risk_score(request: CampaignRiskRequest) -> CampaignRiskResponse:
    """
    POST /api/risk-score

    Validates incoming campaign metrics, passes them to the Random Forest model,
    and returns a structured 0–100 risk score, category, and explanation list.
    """
    if not predictor.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Machine learning model is currently unavailable. Please ensure model.joblib exists.",
        )

    try:
        assessment = predictor.predict_risk(request)
        return assessment
    except Exception as e:
        logger.error("Inference failure for campaign %s: %s", request.campaign_id, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing risk assessment.",
        )


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")
