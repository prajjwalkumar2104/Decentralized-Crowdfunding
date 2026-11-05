"""
test_features.py — Feature Engineering & Signal Generation Unit Tests
"""

import pytest
from app.schemas import CampaignRiskRequest
from app.explainer import generate_explanation_signals


def test_explainer_high_concentration():
    req = CampaignRiskRequest(
        funding_progress=0.8,
        contributor_count=10,
        unique_contributor_count=10,
        avg_contribution_eth=0.1,
        contribution_std_eth=0.05,
        top_contributor_share=0.85,  # 85% from one donor
        milestone_count=2,
        milestone_completion_ratio=0.5,
        milestone_vote_participation=0.5,
        is_cancelled=0,
        days_until_deadline=10.0,
        creator_campaign_count=1,
    )
    signals = generate_explanation_signals(req, risk_score=80)
    assert any("High fund concentration" in s for s in signals)


def test_explainer_zero_milestones():
    req = CampaignRiskRequest(
        funding_progress=0.2,
        contributor_count=5,
        unique_contributor_count=5,
        avg_contribution_eth=0.05,
        contribution_std_eth=0.01,
        top_contributor_share=0.2,
        milestone_count=0,
        milestone_completion_ratio=0.0,
        milestone_vote_participation=0.0,
        is_cancelled=0,
        days_until_deadline=30.0,
        creator_campaign_count=1,
    )
    # Should not raise division by zero or errors
    signals = generate_explanation_signals(req, risk_score=20)
    assert len(signals) > 0


def test_explainer_cancelled_campaign():
    req = CampaignRiskRequest(
        funding_progress=0.5,
        contributor_count=5,
        unique_contributor_count=5,
        avg_contribution_eth=0.1,
        contribution_std_eth=0.02,
        top_contributor_share=0.2,
        milestone_count=2,
        milestone_completion_ratio=0.0,
        milestone_vote_participation=0.2,
        is_cancelled=1,  # Cancelled
        days_until_deadline=15.0,
        creator_campaign_count=1,
    )
    signals = generate_explanation_signals(req, risk_score=50)
    assert any("Campaign cancellation" in s for s in signals)
