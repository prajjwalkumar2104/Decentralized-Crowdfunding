"""
explainer.py — Explainable AI (XAI) Signal Generation

Translates raw campaign features into interpretable, human-readable explanations.
These signals highlight why a campaign received a particular risk score,
assisting contributors in making informed decisions without acting as an accusation.
"""

from typing import List
from app.schemas import CampaignRiskRequest


def generate_explanation_signals(data: CampaignRiskRequest, risk_score: int) -> List[str]:
    """
    Evaluates measurable features and derives human-friendly explanations.
    """
    signals = []

    # 1. Capital concentration
    if data.top_contributor_share >= 0.70:
        pct = round(data.top_contributor_share * 100)
        signals.append(f"High fund concentration: A single donor supplied {pct}% of total raised capital.")
    elif data.top_contributor_share >= 0.50:
        pct = round(data.top_contributor_share * 100)
        signals.append(f"Moderate fund concentration: Top contributor accounts for {pct}% of funds.")

    # 2. Wallet diversity / Repeat contributions
    if data.contributor_count >= 10:
        unique_ratio = data.unique_contributor_count / max(1, data.contributor_count)
        if unique_ratio < 0.60:
            signals.append(
                f"Low donor diversity: Only {data.unique_contributor_count} unique wallets "
                f"across {data.contributor_count} total contributions."
            )

    # 3. Identical / Uniform donation patterns (Wash contribution signal)
    if data.contributor_count >= 15 and data.contribution_std_eth < 0.005:
        signals.append(
            "Uniform contributions: High frequency of identical donation amounts with near-zero variation."
        )

    # 4. Milestone Governance & Delivery
    if data.funding_progress >= 0.70:
        if data.milestone_count > 0 and data.milestone_completion_ratio == 0:
            signals.append("Milestone stall: Over 70% funded with zero completed milestones.")

        if data.milestone_vote_participation < 0.10:
            signals.append("Low governance participation: Less than 10% of investor voting weight has participated in milestone reviews.")

    # 5. Cancellation
    if data.is_cancelled == 1:
        signals.append("Campaign cancellation: The creator has marked this campaign as cancelled.")

    # 6. Serial Creator History
    if data.creator_campaign_count >= 5:
        signals.append(f"High creator frequency: Creator has initiated {data.creator_campaign_count} campaigns.")

    # 7. Deadline Pressure vs Progress
    if data.days_until_deadline <= 0 and data.funding_progress < 1.0:
        signals.append("Campaign deadline expired without achieving funding target.")

    # Fallback explanation if no explicit anomaly triggered but score is low/normal
    if not signals:
        if risk_score < 35:
            signals.append("Standard campaign activity: Metrics follow typical distributed crowdfunding patterns.")
        else:
            signals.append("Multivariate anomaly: Interaction between campaign velocity and voting patterns flagged by ML model.")

    return signals
