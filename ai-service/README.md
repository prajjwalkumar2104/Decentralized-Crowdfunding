# RadiantFund AI — Fraud Risk Detection Service

A Python-based machine-learning service that estimates fraud risk for
RadiantFund crowdfunding campaigns. Built with **FastAPI** and **scikit-learn**.

> **Important disclaimer**: This service estimates risk patterns. It does **not**
> declare a campaign fraudulent. A high score does not prove fraud. A low score
> does not guarantee legitimacy.

---

## Quick Start (Local Development)

```bash
# 1. Navigate into this folder
cd ai-service

# 2. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # macOS / Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Generate the synthetic training dataset
python ml/generate_dataset.py

# 5. Train the model
python ml/train.py

# 6. Start the API server
uvicorn app.main:app --reload --port 8000

# 7. Open interactive docs
# Visit: http://localhost:8000/docs
```

---

## Project Structure

```
ai-service/
├── app/
│   ├── main.py        — FastAPI entrypoint, routes, CORS config
│   ├── schemas.py     — Pydantic request/response models
│   ├── predictor.py   — Loads model, runs risk prediction
│   └── explainer.py   — Generates human-readable risk signals
│
├── ml/
│   ├── generate_dataset.py  — Creates synthetic training data
│   ├── train.py             — Trains and saves the Random Forest model
│   └── evaluate.py          — Evaluates model, prints metrics
│
├── datasets/
│   └── campaigns.csv        — Generated (excluded from git)
│
├── models/
│   └── model.joblib         — Saved model (excluded from git)
│
├── tests/
│   ├── test_api.py          — API endpoint tests
│   └── test_features.py     — Feature calculation tests
│
├── requirements.txt
└── README.md
```

---

## API Endpoints

### `GET /health`
Returns service status and whether the ML model is loaded.

```json
{
  "status": "ok",
  "model_loaded": true,
  "version": "1.0.0"
}
```

### `POST /api/risk-score`
Accepts campaign feature data and returns a risk assessment.

**Request body:**
```json
{
  "campaign_id": "5",
  "funding_progress": 0.85,
  "contributor_count": 12,
  "unique_contributor_count": 10,
  "avg_contribution_eth": 0.15,
  "contribution_std_eth": 0.08,
  "top_contributor_share": 0.72,
  "milestone_count": 3,
  "milestone_completion_ratio": 0.33,
  "milestone_vote_participation": 0.45,
  "is_cancelled": 0,
  "days_until_deadline": 14.5,
  "creator_campaign_count": 1
}
```

**Response:**
```json
{
  "campaign_id": "5",
  "risk_score": 72,
  "risk_category": "HIGH",
  "signals": [
    "High concentration of funds from a single contributor (72% from one wallet)",
    "Funding progressed rapidly relative to campaign age"
  ],
  "model_version": "1.0.0",
  "analyzed_at": "2026-11-05T12:00:00Z",
  "disclaimer": "This automated assessment identifies risk patterns. It does not establish fraud or guarantee that a campaign is legitimate."
}
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ALLOWED_ORIGINS` | `*` | Comma-separated list of allowed CORS origins |
| `MODEL_PATH` | `models/model.joblib` | Path to the saved model file |

For local development, no `.env` file is needed.
For production, create `.env` with:
```
ALLOWED_ORIGINS=https://your-app.vercel.app
MODEL_PATH=models/model.joblib
```

---

## Running Tests

```bash
# Activate virtual environment first
venv\Scripts\activate

# Run all tests
pytest tests/ -v

# Run with coverage report
pytest tests/ -v --tb=short
```

---

## Technology Stack

| Component | Technology | Version |
|---|---|---|
| API Framework | FastAPI | 0.115.5 |
| Server | Uvicorn | 0.32.1 |
| Validation | Pydantic | 2.10.1 |
| ML Model | scikit-learn Random Forest | 1.5.2 |
| Data Processing | Pandas + NumPy | 2.2.3 / 2.1.3 |
| Model Persistence | Joblib | 1.4.2 |
| Testing | Pytest + httpx | 8.3.3 / 0.28.0 |

---

## Limitations

1. **Synthetic training data**: The model is trained on artificially generated data, not real fraud cases. It learns the synthetic labeling rules, not verified fraud behavior.
2. **Missing features**: `new_wallet_ratio` and `contributions_last_hour` require a blockchain indexer (The Graph / Alchemy) which is out of scope for this prototype.
3. **No real-world validation**: Without a labeled real-world fraud dataset, we cannot report validated precision/recall on live campaigns.
4. **Risk ≠ fraud**: A high score identifies suspicious patterns. It does not prove fraud.
