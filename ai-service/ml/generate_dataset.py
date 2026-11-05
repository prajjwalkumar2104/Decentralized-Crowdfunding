"""
generate_dataset.py — Synthetic Dataset Generator

CONCEPT: What is a dataset?
────────────────────────────
A dataset is a structured collection of examples that a machine-learning model
learns from. Think of it like a spreadsheet:
  - Each ROW is one example (one campaign, in our case)
  - Each COLUMN is one feature (a measurable property of that campaign)
  - One special column is the LABEL (the answer we want the model to predict)

CONCEPT: What is synthetic data?
─────────────────────────────────
Synthetic data is data we generate using code, with controlled statistical
properties, rather than collecting real historical data.

WHY we use synthetic data here:
  1. No real labeled fraud dataset exists for Ethereum crowdfunding
  2. It lets us build and test the complete ML pipeline immediately
  3. We can control the distribution (how many suspicious vs. normal examples)

IMPORTANT LIMITATION (must appear in your report):
  A model trained on synthetic labels learns the SYNTHETIC LABELING RULES,
  not real-world fraud behavior. All evaluation metrics in this prototype
  reflect performance on the synthetic rules, not on real campaigns.

LABELING PHILOSOPHY:
  Suspicious campaigns are NOT identified by any single feature.
  Instead, we use combinations of features, because:
    - A campaign CAN legitimately have high funding progress
    - A campaign CAN legitimately have one large contributor
    - A campaign CAN legitimately have low milestone completion early on
  Fraud-like behavior appears when MULTIPLE unusual signals co-occur.

Run this script with:
    python ml/generate_dataset.py
"""

import sys
import os
import numpy as np
import pandas as pd

# ─── Reproducibility ──────────────────────────────────────────────────────────
# A random seed makes the random number generator produce the same sequence
# every time. Without this, you would get a different dataset each run,
# making it impossible to reproduce your experiments.
RANDOM_SEED = 42
rng = np.random.default_rng(RANDOM_SEED)


# ─── Dataset Size ─────────────────────────────────────────────────────────────
N_SAMPLES = 1200          # Total number of campaigns to generate
SUSPICIOUS_RATIO = 0.30   # 30% suspicious, 70% normal
# Note: Real fraud datasets are heavily imbalanced (fraud is rare).
# 30% is higher than reality, but gives the model enough suspicious examples
# to learn from during prototyping.

N_SUSPICIOUS = int(N_SAMPLES * SUSPICIOUS_RATIO)   # 360
N_NORMAL     = N_SAMPLES - N_SUSPICIOUS             # 840


def generate_normal_campaigns(n: int) -> dict:
    """
    Generate feature values that represent typical, non-suspicious campaigns.

    Each feature is drawn from a statistical distribution that approximates
    what we expect to see in legitimate crowdfunding campaigns.

    Parameters
    ----------
    n : int
        Number of normal campaign examples to generate.

    Returns
    -------
    dict
        Dictionary of feature arrays, each of length n.
    """
    return {
        # ── Feature 1: funding_progress ───────────────────────────────────────
        # How much of the target has been raised (amountCollected / target).
        # Normal: Spread across a wide range; most campaigns are somewhere
        # between 10% and 110% of their goal.
        # Values > 1.0 are possible (overfunded campaigns).
        "funding_progress": rng.uniform(0.05, 1.20, n).round(4),

        # ── Feature 2: contributor_count ──────────────────────────────────────
        # Total number of donation transactions received.
        # Normal campaigns receive a moderate number of contributions.
        "contributor_count": rng.integers(2, 120, n),

        # ── Feature 3: unique_contributor_count ───────────────────────────────
        # Number of DISTINCT wallet addresses that contributed.
        # For normal campaigns, most contributions come from unique wallets.
        # This is computed after, as a fraction of contributor_count.
        "unique_contributor_count": None,  # filled below

        # ── Feature 4: avg_contribution_eth ───────────────────────────────────
        # Mean donation size in ETH.
        # Normal: Contributions vary widely; mean is usually moderate.
        "avg_contribution_eth": rng.exponential(scale=0.15, size=n).round(4),

        # ── Feature 5: contribution_std_eth ───────────────────────────────────
        # Standard deviation of contribution amounts.
        # What is standard deviation? It measures how SPREAD OUT the values are.
        # Example: [0.1, 0.1, 0.1] → std = 0.0 (all identical, very suspicious)
        #          [0.05, 0.1, 0.5, 2.0] → std = 0.8 (healthy variation)
        # Normal campaigns have healthy variation in donation amounts.
        "contribution_std_eth": rng.exponential(scale=0.12, size=n).round(4),

        # ── Feature 6: top_contributor_share ──────────────────────────────────
        # What fraction of total funds came from the single largest donor?
        # Normal: Usually below 0.5 (no one wallet dominates).
        "top_contributor_share": rng.beta(a=2, b=5, size=n).round(4),

        # ── Feature 7: milestone_count ────────────────────────────────────────
        # Number of milestones defined for this campaign.
        # Normal: Most campaigns have 2–5 milestones.
        "milestone_count": rng.integers(1, 6, n),

        # ── Feature 8: milestone_completion_ratio ─────────────────────────────
        # Completed milestones / total milestones.
        # Normal: Varies depending on campaign age; often low for newer campaigns.
        "milestone_completion_ratio": rng.uniform(0.0, 1.0, n).round(4),

        # ── Feature 9: milestone_vote_participation ────────────────────────────
        # max(milestone.voteWeight) / amountCollected
        # This measures how engaged investors are in governance voting.
        # Normal: Moderate participation, not all investors vote on every milestone.
        "milestone_vote_participation": rng.beta(a=3, b=4, size=n).round(4),

        # ── Feature 10: is_cancelled ──────────────────────────────────────────
        # 1 if campaign was cancelled, 0 otherwise.
        # Normal: Most campaigns are not cancelled (5% cancellation rate assumed).
        "is_cancelled": rng.choice([0, 1], size=n, p=[0.95, 0.05]),

        # ── Feature 11: days_until_deadline ───────────────────────────────────
        # How many days remain before the campaign deadline.
        # Normal: Ranges from newly created (60 days) to nearly expired (0 days).
        "days_until_deadline": rng.uniform(0.5, 60.0, n).round(2),

        # ── Feature 12: creator_campaign_count ────────────────────────────────
        # How many total campaigns this wallet address has created.
        # Normal: Most creators have 1–3 campaigns.
        "creator_campaign_count": rng.integers(1, 4, n),
    }


def generate_suspicious_campaigns(n: int) -> dict:
    """
    Generate feature values that represent suspicious campaign patterns.

    IMPORTANT: Suspiciousness comes from COMBINATIONS of features, not any
    single feature alone. We use three different suspicious archetypes and
    mix them to create variety. Each archetype represents a different type
    of potential manipulation pattern.

    Archetype A — Wash contribution pattern:
      Many contributions but very low variation in amounts (suggesting automated
      or coordinated contributions from related wallets).

    Archetype B — Single-wallet concentration:
      One wallet provides a dominant share of funding, combined with rapid
      funding progress and many contributions from relatively few unique wallets.

    Archetype C — Milestone manipulation pattern:
      Campaign has poor milestone completion despite significant funding, and
      cancellation behavior is elevated.

    Parameters
    ----------
    n : int
        Number of suspicious campaign examples to generate.

    Returns
    -------
    dict
        Dictionary of feature arrays, each of length n.
    """
    # Assign each suspicious campaign randomly to one of three archetypes.
    n_a = n // 3
    n_b = n // 3
    n_c = n - n_a - n_b  # remainder goes to archetype C

    # ── Archetype A: Wash contribution pattern ────────────────────────────────
    a = {
        "funding_progress":           rng.uniform(0.4, 1.5, n_a).round(4),
        "contributor_count":          rng.integers(30, 200, n_a),   # many contributions
        "avg_contribution_eth":       rng.uniform(0.01, 0.05, n_a).round(4),
        "contribution_std_eth":       rng.uniform(0.001, 0.015, n_a).round(4),  # very LOW std → suspicious
        "top_contributor_share":      rng.beta(a=3, b=5, size=n_a).round(4),
        "milestone_count":            rng.integers(1, 4, n_a),
        "milestone_completion_ratio": rng.uniform(0.0, 0.3, n_a).round(4),
        "milestone_vote_participation": rng.uniform(0.0, 0.1, n_a).round(4),  # very LOW voting
        "is_cancelled":               rng.choice([0, 1], size=n_a, p=[0.85, 0.15]),
        "days_until_deadline":        rng.uniform(0.5, 30.0, n_a).round(2),
        "creator_campaign_count":     rng.integers(1, 3, n_a),
        # unique_contributor_count will be ~40–70% of contributor_count
        "_unique_ratio":              rng.uniform(0.40, 0.70, n_a),
    }

    # ── Archetype B: Single-wallet concentration ───────────────────────────────
    b = {
        "funding_progress":           rng.uniform(0.7, 2.0, n_b).round(4),  # rapid, high progress
        "contributor_count":          rng.integers(5, 40, n_b),
        "avg_contribution_eth":       rng.uniform(0.1, 1.0, n_b).round(4),
        "contribution_std_eth":       rng.exponential(scale=0.3, size=n_b).round(4),
        "top_contributor_share":      rng.uniform(0.65, 0.98, n_b).round(4),  # HIGH concentration
        "milestone_count":            rng.integers(2, 6, n_b),
        "milestone_completion_ratio": rng.uniform(0.0, 0.4, n_b).round(4),
        "milestone_vote_participation": rng.uniform(0.0, 0.2, n_b).round(4),
        "is_cancelled":               rng.choice([0, 1], size=n_b, p=[0.80, 0.20]),
        "days_until_deadline":        rng.uniform(0.5, 45.0, n_b).round(2),
        "creator_campaign_count":     rng.integers(1, 8, n_b),  # sometimes serial creators
        "_unique_ratio":              rng.uniform(0.30, 0.65, n_b),  # low unique ratio
    }

    # ── Archetype C: Milestone manipulation pattern ────────────────────────────
    c = {
        "funding_progress":           rng.uniform(0.3, 0.9, n_c).round(4),
        "contributor_count":          rng.integers(3, 50, n_c),
        "avg_contribution_eth":       rng.uniform(0.05, 0.3, n_c).round(4),
        "contribution_std_eth":       rng.exponential(scale=0.1, size=n_c).round(4),
        "top_contributor_share":      rng.uniform(0.3, 0.7, n_c).round(4),
        "milestone_count":            rng.integers(3, 7, n_c),
        "milestone_completion_ratio": rng.uniform(0.0, 0.1, n_c).round(4),  # very LOW completion
        "milestone_vote_participation": rng.uniform(0.0, 0.08, n_c).round(4),  # very LOW participation
        "is_cancelled":               rng.choice([0, 1], size=n_c, p=[0.65, 0.35]),  # HIGH cancellation
        "days_until_deadline":        rng.uniform(0.5, 50.0, n_c).round(2),
        "creator_campaign_count":     rng.integers(1, 10, n_c),
        "_unique_ratio":              rng.uniform(0.50, 0.85, n_c),
    }

    # Merge the three archetypes into one array for each feature
    def stack(key):
        return np.concatenate([a[key], b[key], c[key]])

    return {
        "funding_progress":             stack("funding_progress"),
        "contributor_count":            stack("contributor_count"),
        "_unique_ratio":                stack("_unique_ratio"),   # temporary — used below
        "avg_contribution_eth":         stack("avg_contribution_eth"),
        "contribution_std_eth":         stack("contribution_std_eth"),
        "top_contributor_share":        stack("top_contributor_share"),
        "milestone_count":              stack("milestone_count"),
        "milestone_completion_ratio":   stack("milestone_completion_ratio"),
        "milestone_vote_participation": stack("milestone_vote_participation"),
        "is_cancelled":                 stack("is_cancelled"),
        "days_until_deadline":          stack("days_until_deadline"),
        "creator_campaign_count":       stack("creator_campaign_count"),
    }


def build_dataframe() -> pd.DataFrame:
    """
    Combine normal and suspicious campaign arrays into a single DataFrame,
    add the target label, shuffle rows, and add small realistic noise.

    Returns
    -------
    pd.DataFrame
        The complete dataset, ready for training.
    """
    # Generate both groups
    normal     = generate_normal_campaigns(N_NORMAL)
    suspicious = generate_suspicious_campaigns(N_SUSPICIOUS)

    # ── Compute unique_contributor_count ──────────────────────────────────────
    # For normal campaigns: 70–95% of contributions come from unique wallets
    normal_unique_ratio = rng.uniform(0.70, 0.95, N_NORMAL)
    normal["unique_contributor_count"] = np.maximum(
        1,
        (normal["contributor_count"] * normal_unique_ratio).astype(int)
    )

    # For suspicious campaigns: use the _unique_ratio we embedded in each archetype
    suspicious["unique_contributor_count"] = np.maximum(
        1,
        (suspicious["contributor_count"] * suspicious["_unique_ratio"]).astype(int)
    )
    # Remove the temporary helper column
    del suspicious["_unique_ratio"]
    del normal["unique_contributor_count"]  # will re-add from above array

    # ── Build DataFrames ──────────────────────────────────────────────────────
    FEATURE_COLS = [
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

    # Build normal dataframe
    df_normal = pd.DataFrame({
        "funding_progress":             normal["funding_progress"],
        "contributor_count":            normal["contributor_count"],
        "unique_contributor_count":     (normal["contributor_count"] * rng.uniform(0.70, 0.95, N_NORMAL)).astype(int).clip(1),
        "avg_contribution_eth":         normal["avg_contribution_eth"],
        "contribution_std_eth":         normal["contribution_std_eth"],
        "top_contributor_share":        normal["top_contributor_share"],
        "milestone_count":              normal["milestone_count"],
        "milestone_completion_ratio":   normal["milestone_completion_ratio"],
        "milestone_vote_participation": normal["milestone_vote_participation"],
        "is_cancelled":                 normal["is_cancelled"],
        "days_until_deadline":          normal["days_until_deadline"],
        "creator_campaign_count":       normal["creator_campaign_count"],
        "is_suspicious":                0,
    })

    df_suspicious = pd.DataFrame({
        "funding_progress":             suspicious["funding_progress"],
        "contributor_count":            suspicious["contributor_count"],
        "unique_contributor_count":     suspicious["unique_contributor_count"],
        "avg_contribution_eth":         suspicious["avg_contribution_eth"],
        "contribution_std_eth":         suspicious["contribution_std_eth"],
        "top_contributor_share":        suspicious["top_contributor_share"],
        "milestone_count":              suspicious["milestone_count"],
        "milestone_completion_ratio":   suspicious["milestone_completion_ratio"],
        "milestone_vote_participation": suspicious["milestone_vote_participation"],
        "is_cancelled":                 suspicious["is_cancelled"],
        "days_until_deadline":          suspicious["days_until_deadline"],
        "creator_campaign_count":       suspicious["creator_campaign_count"],
        "is_suspicious":                1,
    })

    # ── Combine and shuffle ───────────────────────────────────────────────────
    # We shuffle so that normal and suspicious rows are interleaved.
    # If we didn't shuffle, the first 840 rows would all be normal and the
    # last 360 would all be suspicious — the model might accidentally learn
    # row order instead of actual features.
    df = pd.concat([df_normal, df_suspicious], ignore_index=True)
    df = df.sample(frac=1, random_state=RANDOM_SEED).reset_index(drop=True)

    # ── Clip values to realistic ranges ───────────────────────────────────────
    df["funding_progress"]           = df["funding_progress"].clip(0.0, 3.0)
    df["top_contributor_share"]      = df["top_contributor_share"].clip(0.0, 1.0)
    df["milestone_completion_ratio"] = df["milestone_completion_ratio"].clip(0.0, 1.0)
    df["milestone_vote_participation"] = df["milestone_vote_participation"].clip(0.0, 1.0)
    df["avg_contribution_eth"]       = df["avg_contribution_eth"].clip(0.01, 50.0)
    df["contribution_std_eth"]       = df["contribution_std_eth"].clip(0.0, 50.0)
    df["days_until_deadline"]        = df["days_until_deadline"].clip(0.0, 365.0)
    df["contributor_count"]          = df["contributor_count"].clip(1, 10000)
    df["creator_campaign_count"]     = df["creator_campaign_count"].clip(1, 100)

    # Ensure unique count is never more than total count
    df["unique_contributor_count"] = df[["unique_contributor_count", "contributor_count"]].min(axis=1)
    df["unique_contributor_count"] = df["unique_contributor_count"].clip(1)

    return df


def validate_dataset(df: pd.DataFrame) -> None:
    """
    Run basic checks on the generated dataset and print a summary.
    This catches obvious problems before we try to train a model on bad data.
    """
    print("\n" + "=" * 60)
    print("  DATASET VALIDATION")
    print("=" * 60)

    # 1. Shape
    print(f"\n[OK] Shape: {df.shape[0]} rows x {df.shape[1]} columns")

    # 2. Columns
    expected_cols = [
        "funding_progress", "contributor_count", "unique_contributor_count",
        "avg_contribution_eth", "contribution_std_eth", "top_contributor_share",
        "milestone_count", "milestone_completion_ratio", "milestone_vote_participation",
        "is_cancelled", "days_until_deadline", "creator_campaign_count", "is_suspicious"
    ]
    missing = [c for c in expected_cols if c not in df.columns]
    if missing:
        print(f"[FAIL] Missing columns: {missing}")
        sys.exit(1)
    print(f"[OK] All {len(expected_cols)} expected columns present")

    # 3. Missing values
    null_counts = df.isnull().sum()
    if null_counts.any():
        print(f"[FAIL] Null values found:\n{null_counts[null_counts > 0]}")
        sys.exit(1)
    print("[OK] No null values")

    # 4. Label distribution
    label_counts = df["is_suspicious"].value_counts()
    print(f"\n[OK] Label distribution:")
    print(f"   Normal (0):     {label_counts.get(0, 0):>5} ({label_counts.get(0, 0)/len(df)*100:.1f}%)")
    print(f"   Suspicious (1): {label_counts.get(1, 0):>5} ({label_counts.get(1, 0)/len(df)*100:.1f}%)")

    # 5. Valid label values
    invalid_labels = df[~df["is_suspicious"].isin([0, 1])]
    if not invalid_labels.empty:
        print(f"[FAIL] Invalid label values found: {invalid_labels['is_suspicious'].unique()}")
        sys.exit(1)
    print("[OK] All label values are valid (0 or 1)")

    # 6. Value ranges
    print(f"\n[OK] Feature value ranges:")
    range_checks = {
        "funding_progress":           (0.0, 3.0),
        "top_contributor_share":      (0.0, 1.0),
        "milestone_completion_ratio": (0.0, 1.0),
        "milestone_vote_participation": (0.0, 1.0),
        "is_cancelled":               (0, 1),
        "contributor_count":          (1, 10000),
        "days_until_deadline":        (0.0, 365.0),
    }
    all_ok = True
    for col, (lo, hi) in range_checks.items():
        col_min = df[col].min()
        col_max = df[col].max()
        status = "[OK]" if col_min >= lo and col_max <= hi else "[FAIL]"
        if status == "[FAIL]":
            all_ok = False
        print(f"   {status} {col:<35} min={col_min:.3f}  max={col_max:.3f}")

    if not all_ok:
        sys.exit(1)

    # 7. Quick statistics
    print(f"\n[OK] Feature statistics (suspicious vs. normal):")
    compare_cols = [
        "funding_progress", "top_contributor_share",
        "contribution_std_eth", "milestone_completion_ratio",
    ]
    for col in compare_cols:
        normal_mean     = df[df["is_suspicious"] == 0][col].mean()
        suspicious_mean = df[df["is_suspicious"] == 1][col].mean()
        print(f"   {col:<35} normal={normal_mean:.3f}  suspicious={suspicious_mean:.3f}")

    print("\n" + "=" * 60)
    print("  VALIDATION PASSED [OK]")
    print("=" * 60 + "\n")


def main() -> None:
    print("Generating synthetic RadiantFund campaign dataset...")
    print(f"  Total samples:     {N_SAMPLES}")
    print(f"  Normal campaigns:  {N_NORMAL} ({100 - SUSPICIOUS_RATIO*100:.0f}%)")
    print(f"  Suspicious:        {N_SUSPICIOUS} ({SUSPICIOUS_RATIO*100:.0f}%)")
    print(f"  Random seed:       {RANDOM_SEED}")

    df = build_dataframe()
    validate_dataset(df)

    # ── Save to CSV ───────────────────────────────────────────────────────────
    # Resolve path relative to this script's location, not the working directory
    script_dir   = os.path.dirname(os.path.abspath(__file__))
    datasets_dir = os.path.join(script_dir, "..", "datasets")
    os.makedirs(datasets_dir, exist_ok=True)
    output_path  = os.path.join(datasets_dir, "campaigns.csv")

    df.to_csv(output_path, index=False)
    print(f"Dataset saved to: {os.path.abspath(output_path)}")
    print(f"File size: {os.path.getsize(output_path) / 1024:.1f} KB\n")

    # Print a small sample so you can visually inspect it
    print("First 5 rows:")
    print(df.head().to_string())
    print("\nColumn data types:")
    print(df.dtypes.to_string())


if __name__ == "__main__":
    main()
