"""
schemas.py — Request & Response Data Models (Pydantic)

Pydantic validates types, ranges, and required fields before any prediction code executes.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Shape of the response from GET /health"""
    status: str
    model_loaded: bool
    version: str


class CampaignRiskRequest(BaseModel):
    """
    Input payload for POST /api/risk-score.
    All features extracted from smart contract & campaign state.
    """
    campaign_id: Optional[str] = Field(
        default=None,
        description="Optional campaign identifier or on-chain ID for tracing",
        examples=["0"]
    )
    funding_progress: float = Field(
        ...,
        ge=0.0,
        description="Ratio of funds collected divided by target goal (e.g., 0.85 = 85%)",
        examples=[0.85]
    )
    contributor_count: int = Field(
        ...,
        ge=0,
        description="Total number of contributions recorded",
        examples=[15]
    )
    unique_contributor_count: int = Field(
        ...,
        ge=0,
        description="Number of distinct donor wallet addresses",
        examples=[12]
    )
    avg_contribution_eth: float = Field(
        ...,
        ge=0.0,
        description="Average contribution amount in ETH",
        examples=[0.12]
    )
    contribution_std_eth: float = Field(
        ...,
        ge=0.0,
        description="Standard deviation of donation amounts in ETH",
        examples=[0.05]
    )
    top_contributor_share: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Proportion of total funds provided by the single largest contributor",
        examples=[0.25]
    )
    milestone_count: int = Field(
        ...,
        ge=0,
        description="Total number of defined milestones for this campaign",
        examples=[3]
    )
    milestone_completion_ratio: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Proportion of milestones approved & released (released / total)",
        examples=[0.33]
    )
    milestone_vote_participation: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Highest voting weight on milestones divided by total funds collected",
        examples=[0.55]
    )
    is_cancelled: int = Field(
        ...,
        ge=0,
        le=1,
        description="1 if campaign was cancelled by owner, 0 otherwise",
        examples=[0]
    )
    days_until_deadline: float = Field(
        ...,
        description="Days remaining until deadline (can be negative if ended)",
        examples=[14.5]
    )
    creator_campaign_count: int = Field(
        ...,
        ge=1,
        description="Total number of campaigns initiated by this creator wallet",
        examples=[1]
    )


class CampaignRiskResponse(BaseModel):
    """
    Output payload for POST /api/risk-score.
    Provides risk score, categorized level, human-readable reasons, and disclaimer.
    """
    campaign_id: Optional[str] = None
    risk_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Calculated fraud risk score ranging from 0 (very low) to 100 (high risk)"
    )
    risk_category: str = Field(
        ...,
        description="Human-friendly risk category: LOW, MEDIUM, or HIGH"
    )
    probability: float = Field(
        ...,
        description="Raw predicted probability of the suspicious class from the ML model"
    )
    signals: List[str] = Field(
        default_factory=list,
        description="Specific anomaly and risk signals identified from campaign data"
    )
    model_version: str = Field(
        ...,
        description="Version string of the active machine-learning model artifact"
    )
    analyzed_at: str = Field(
        ...,
        description="ISO 8601 UTC timestamp of when this assessment was performed"
    )
    disclaimer: str = Field(
        default=(
            "This automated assessment estimates risk patterns based on on-chain features. "
            "It does not constitute a fraud verdict or guarantee campaign legitimacy."
        ),
        description="Mandatory advisory disclaimer"
    )
