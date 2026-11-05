# RadiantFund AI — Major Project Report & Technical Specification

**Project Title**: RadiantFund AI: Explainable Machine Learning-Based Fraud-Risk Detection for Decentralized Crowdfunding  
**Author**: Information Technology Major Project  
**Tech Stack**: Next.js 16, Solidity 0.8.24, Wagmi, Viem, FastAPI, scikit-learn, Python 3.13  

---

## 1. Executive Summary & Abstract
Decentralized crowdfunding platforms offer trust-minimized, borderless fundraising by eliminating intermediaries through smart contracts. However, the pseudonymous nature of Ethereum and irreversible transaction finality expose backers to risks such as wash contributions, milestone abandonment, and artificial traction inflation. 

This project introduces **RadiantFund AI**, an off-chain explainable machine learning risk detection service integrated with an existing Web3 crowdfunding platform. The system extracts 12 numerical behavioral features directly from smart contract state (campaign funding velocity, contribution dispersion, top donor concentration, milestone release rates, and governance vote participation), feeds them into a Random Forest classifier, and produces an interpretable 0–100 risk score with plain-language diagnostic signals. Crucially, the system operates as an off-chain advisory layer: high scores represent statistical risk patterns rather than accusations of fraud, and core smart contract functionality (contributions, refunds, and milestone releases) remains unblocked if the AI service is unreachable.

---

## 2. Motivation & Problem Statement

### 2.1 Limitations of Traditional Decentralized Crowdfunding
1. **Pseudonymity vs. Accountability**: Anyone can deploy a campaign using a newly generated wallet address without KYC verification.
2. **Sybil & Wash Contributions**: A malicious creator can circulate their own funds through multiple dummy wallets to simulate viral interest and trick legitimate investors.
3. **Milestone Neglect**: Creators can structure campaigns with minimal accountability, collecting early capital before failing to deliver scheduled milestones.
4. **Information Asymmetry**: Prospective donors cannot easily inspect raw blockchain events or parse transaction arrays to evaluate if a single donor controls the majority of the funding.

### 2.2 Proposed Solution
An off-chain explainable machine-learning service that:
- Collects measurable on-chain campaign data in real time via RPC (`getCampaign`, `getDonators`, `getMilestones`).
- Computes non-linear behavioral features.
- Employs a supervised Random Forest model trained on multivariate anomalous crowdfunding archetypes.
- Generates human-readable explanations (XAI) to clarify why a score was generated.
- Presents actionable risk indicators inside the campaign page without interfering with smart contract execution.

---

## 3. System Architecture & Data Flow

```
[ Contributor / User ]
         │
         ▼
[ RadiantFund Frontend (Next.js 16 + Wagmi) ]
         │
         │  1. Read Campaign (ID)
         ▼
[ Ethereum / Sepolia Smart Contract (CrowdfundingTokenized.sol) ]
         │
         │  2. On-Chain Data (Target, Amounts, Donator Wallets, Milestones)
         ▼
[ Next.js API Bridge (/api/risk-analysis) ]
         │
         │  3. Compute 12 Normalized Numerical Features
         ▼
[ FastAPI AI Microservice (/api/risk-score) ]
         │
         │  4. Feature Order Alignment & Model Inference
         ▼
[ Trained Random Forest Classifier (model.joblib) ]
         │
         │  5. Predicted Probability (P(Suspicious))
         ▼
[ Risk Scoring & Explainable AI (explainer.py) ]
         │  - Scale P -> Score (0 - 100)
         │  - Categorize (LOW, MEDIUM, HIGH)
         │  - Extract Rule-Based Explanations
         ▼
[ Structured JSON Response ]
         │
         ▼
[ Frontend <RiskAssessmentCard /> ]
(Displays score badge, progress bar, signals, and advisory disclaimer)
```

### 3.1 Key Architectural Decisions
- **Off-Chain AI Inference**: Machine learning inference requires floating-point matrix multiplications that are computationally prohibitive on the Ethereum Virtual Machine (EVM). Storing models off-chain keeps gas costs zero for creators and contributors.
- **Fail-Safe Decoupling**: If the Python service experiences downtime, the Next.js API returns a graceful fallback notice. The smart contract's state transition functions (`donateToCampaign`, `refund`, `releaseMilestone`) remain completely unaffected.

---

## 4. Feature Engineering

Features are extracted from smart contract read functions without requiring contract modifications:

| # | Feature Name | Description & Formula | Source Contract Function | Fraud Signal Hypothesis |
|---|---|---|---|---|
| 1 | `funding_progress` | $\frac{\text{amountCollected}}{\text{target}}$ | `getCampaign` | Abnormal progress with zero milestones completed. |
| 2 | `contributor_count` | Total length of contributor array | `getDonators` | Evaluates overall community scale. |
| 3 | `unique_contributor_count` | Number of distinct wallet addresses | `getDonators` | Identifies repeat contributions from same wallet. |
| 4 | `avg_contribution_eth` | $\text{Mean}(\text{donations})$ | `getDonators` | Average stake size per donor. |
| 5 | `contribution_std_eth` | $\sigma(\text{donations})$ | `getDonators` | Near-zero standard deviation indicates uniform automated transactions. |
| 6 | `top_contributor_share` | $\frac{\max(\text{donations})}{\text{amountCollected}}$ | `getDonators` | Capital centralization: single entity funding the majority of goal. |
| 7 | `milestone_count` | Length of milestone array | `getMilestones` | Project scope breakdown. |
| 8 | `milestone_completion_ratio` | $\frac{\text{releasedMilestones}}{\text{totalMilestones}}$ | `getMilestones` | Execution track record and fund release progress. |
| 9 | `milestone_vote_participation` | $\frac{\max(\text{voteWeight})}{\text{amountCollected}}$ | `getMilestones` | Low voter turnout indicates disengaged community. |
| 10 | `is_cancelled` | Binary flag (1 if cancelled, 0 if active) | `getCampaign` | Campaign abandonment indicator. |
| 11 | `days_until_deadline` | $\frac{\text{deadline} - \text{timestamp}}{86400}$ | `getCampaign` | Velocity and urgency pressure analysis. |
| 12 | `creator_campaign_count` | Campaigns deployed by owner wallet | `getCampaigns` | Frequency of campaign creation by creator address. |

---

## 5. Dataset Generation & Labeling Strategy

### 5.1 Why Synthetic Data?
No public, verified dataset of fraudulent Ethereum crowdfunding campaigns exists due to privacy constraints, legal definitions of fraud, and pseudonymous transactions. To construct a working end-to-end pipeline, we generated a balanced synthetic dataset of **1,200 campaign profiles** (70% normal, 30% suspicious).

### 5.2 Multi-Signal Anomaly Archetypes
To avoid naive rules (e.g., claiming "every new wallet is fraudulent"), suspicious examples were generated using **combinations of features**:
- **Archetype A (Wash Contribution)**: High transaction count ($>30$), low donor diversity ($<60\%$), and near-zero standard deviation in donation amounts ($\sigma < 0.015\text{ ETH}$).
- **Archetype B (Single-Wallet Centralization)**: Rapid progress ($>70\%$) where a single contributor supplies $\ge 70\%$ of all capital, combined with low milestone governance voting ($<10\%$).
- **Archetype C (Milestone Neglect)**: Substantial capital collected ($>50\%$), low completion ratio ($<10\%$), low voting engagement, and elevated cancellation rates.

---

## 6. Machine Learning Model Selection & Training

### 6.1 Model Choice: Random Forest Classifier
- **Why Random Forest over Deep Learning?**
  - Tabular data with numerical features is best handled by tree-based ensembles (Breiman, 2001).
  - Neural networks require large datasets, complex feature normalization, and extensive hyperparameter tuning.
  - Random Forest provides built-in feature importance rankings, natively handles varying feature scales, and resists overfitting via bootstrap aggregating (bagging).

### 6.2 Training Setup
- **Train/Test Split**: 80% Training (960 records), 20% Held-Out Testing (240 records).
- **Stratification**: Preserves identical class proportions (70:30) across both splits.
- **Hyperparameters**:
  - `n_estimators`: 100 decision trees
  - `max_depth`: 6 levels (controls tree complexity and prevents memorization)
  - `class_weight`: "balanced" (ensures the minority suspicious class receives equal attention)
  - `random_state`: 42 (ensures absolute reproducibility)

### 6.3 Evaluation Results (Held-Out Test Set)

| Metric | Score | Interpretation in Crowdfunding Context |
|---|---|---|
| **Precision** | **98.63%** | Of campaigns flagged as suspicious, 98.6% exhibited actual anomaly patterns (1 false alarm). |
| **Recall** | **100.0%** | The model detected 100% of suspicious campaigns in the test set (zero missed threats). |
| **F1-Score** | **0.9931** | Optimal harmonic mean between false alarms and missed anomalies. |
| **ROC-AUC** | **1.0000** | Perfect separation across all classification threshold boundaries. |

### 6.4 Confusion Matrix
```
                  Predicted Normal    Predicted Suspicious
Actual Normal           167                    1 (False Positive)
Actual Suspicious         0 (False Negative)  72 (True Positive)
```

### 6.5 Top Informative Features (Gini Importance)
1. `milestone_vote_participation` (49.17%)
2. `milestone_completion_ratio` (18.96%)
3. `top_contributor_share` (10.32%)
4. `creator_campaign_count` (4.73%)
5. `funding_progress` (4.10%)

---

## 7. Explainable AI (XAI) & Risk Scoring

### 7.1 Risk Score Scale
The model probability $P(\text{suspicious}) \in [0, 1]$ is scaled to an integer index:
$$\text{risk\_score} = \text{round}(P(\text{suspicious}) \times 100)$$
- **0 – 34**: **LOW RISK** (Green) — Normal distributed funding patterns.
- **35 – 69**: **MEDIUM RISK** (Amber) — Mixed or borderline activity detected.
- **70 – 100**: **HIGH RISK** (Rose/Red) — Multiple high-risk anomaly signals present.

### 7.2 Human-Readable Explanations
Rather than presenting raw statistical probabilities, `explainer.py` evaluates feature thresholds to produce actionable diagnostic messages:
- *"High fund concentration: A single donor supplied 85% of total raised capital."*
- *"Low donor diversity: Only 5 unique wallets across 14 total contributions."*
- *"Milestone stall: Over 70% funded with zero completed milestones."*
- *"Low governance participation: Less than 10% of investor voting weight active."*

---

## 8. Critical Academic Limitations (Must Document)

1. **Synthetic Data Constraint**: The model learned our synthetic labeling rules. It cannot prove real-world fraud detection accuracy until evaluated against real historical incidents.
2. **Advisory Role**: The system estimates risk patterns, not fraud verdicts. A high score does not prove crime; a low score does not guarantee delivery.
3. **Missing Off-Chain Context**: Code repositories (GitHub), team reputation, external social signals, and real-world identities are not visible on-chain.
4. **Wallet History Limitation**: New wallets are common in Web3; wallet age alone is never treated as proof of malicious intent.

---

## 9. Future Work
- **SHAP (SHapley Additive exPlanations)**: Implement game-theoretic local feature attribution for mathematical explanation fidelity.
- **The Graph Indexer**: Index historical block events (`DonationReceived`, `Refunded`) to extract temporal velocity metrics (`contributions_last_hour`).
- **Creator Identity & IPFS Analysis**: Analyze campaign whitepapers and images using NLP / Computer Vision to detect duplicate or plagiarized project proposals.
