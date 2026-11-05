"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw, Info, HelpCircle } from "lucide-react";

export default function RiskAssessmentCard({ campaignId }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRiskAssessment = async () => {
    if (campaignId === null || campaignId === undefined) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/risk-analysis?campaignId=${campaignId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch risk assessment (HTTP ${res.status})`);
      }
      const json = await res.json();
      if (!json.success && !json.assessment) {
        setError(json.message || "AI risk analysis service is currently unavailable.");
      } else {
        setData(json.assessment);
      }
    } catch (err) {
      setError("AI analysis service is offline. Crowdfunding features remain fully functional.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskAssessment();
  }, [campaignId]);

  // Risk styling mapping
  const getBadgeStyle = (category) => {
    switch (category) {
      case "LOW":
        return {
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          progressBg: "bg-emerald-500",
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          label: "Low Risk",
        };
      case "MEDIUM":
        return {
          badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          progressBg: "bg-amber-500",
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          label: "Medium Risk",
        };
      case "HIGH":
      default:
        return {
          badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          progressBg: "bg-rose-500",
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
          label: "High Risk",
        };
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              AI Fraud-Risk Assessment
            </h3>
            <p className="text-xs text-muted-foreground">
              Explainable on-chain pattern analysis (Random Forest baseline)
            </p>
          </div>
        </div>

        <button
          onClick={fetchRiskAssessment}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3 py-4 text-center">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Evaluating on-chain features & extracting risk signals...
            </p>
          </div>
        ) : error || !data ? (
          <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-amber-500 font-medium mb-1">
              <Info className="h-4 w-4" />
              <span>Assessment Notice</span>
            </div>
            <p>{error || "Risk assessment data is not available."}</p>
            <p className="mt-2 text-xs text-muted-foreground/80">
              Note: This is an off-chain advisory layer. Contributing, milestone voting, and refunds are unaffected.
            </p>
          </div>
        ) : (
          (() => {
            const style = getBadgeStyle(data.risk_category);
            return (
              <div className="space-y-6">
                {/* Score Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/20 border border-border">
                  <div className="flex items-center gap-3">
                    {style.icon}
                    <div>
                      <div className="text-xs text-muted-foreground">Risk Category</div>
                      <div className={`mt-0.5 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${style.badge}`}>
                        {style.label}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Risk Score</div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-bold text-foreground">
                        {data.risk_score}
                      </span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Model & Version</div>
                    <div className="text-sm font-medium text-foreground mt-0.5">
                      Random Forest v{data.model_version}
                    </div>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Risk Probability Index</span>
                    <span>{data.risk_score}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${style.progressBg}`}
                      style={{ width: `${Math.max(4, data.risk_score)}%` }}
                    />
                  </div>
                </div>

                {/* Signals / Explanations */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    Signals Contributing to this Assessment:
                  </h4>
                  {data.signals && data.signals.length > 0 ? (
                    <ul className="space-y-2">
                      {data.signals.map((sig, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/10 p-2.5 rounded-lg border border-border/50"
                        >
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No anomalous indicators detected. Activity follows baseline parameters.
                    </p>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="rounded-xl border border-border/60 bg-muted/10 p-3.5 text-xs text-muted-foreground flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Advisory Disclaimer: </span>
                    {data.disclaimer}
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </section>
  );
}
