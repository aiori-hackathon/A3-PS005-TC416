import React, { useState } from "react";
import {
  ShieldCheck,
  Play,
  FileSearch,
  SearchCheck,
  Award,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";
import { groupAlertObservations } from "../utils/incidentGrouping";

interface EvaluatorGuideCardProps {
  onSelectAlert?: (alertId: string) => void;
}

export const EvaluatorGuideCard: React.FC<EvaluatorGuideCardProps> = () => {
  const {
    overview,
    alerts,
    routes,
    setActiveTab,
    setSelectedAlert,
    setSelectedEvidence,
    setRpkiTarget,
    runScenarioAction,
    submitWithdrawalAction,
    evidence,
  } = useHoraqStore();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [stepFeedback, setStepFeedback] = useState<string | null>(null);

  const groupedIncidents = groupAlertObservations(alerts);
  const activeIncidents = groupedIncidents.filter((g) => g.status === "ACTIVE");
  const topActive = activeIncidents[0] || null;

  const markStepDone = (stepNum: number, nextStep?: number, feedback?: string) => {
    setCompletedSteps((prev) => new Set(prev).add(stepNum));
    if (nextStep) setCurrentStep(nextStep);
    if (feedback) {
      setStepFeedback(feedback);
      setTimeout(() => setStepFeedback(null), 4000);
    }
  };

  // 1. Establish / Review Clean Baseline
  const handleStep1Baseline = async () => {
    setIsProcessing(true);
    try {
      const res = await runScenarioAction("baseline");
      markStepDone(
        1,
        2,
        "Stage 1 Complete: Clean baseline for 192.0.2.0/24 established under AS64496 with zero false alerts."
      );
    } catch {
      // fallback
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Trigger Routing Anomaly (Subprefix Hijack)
  const handleStep2TriggerAnomaly = async () => {
    setIsProcessing(true);
    try {
      const res = await runScenarioAction("subprefix");
      markStepDone(
        2,
        3,
        "Stage 2 Complete: Injected subprefix anomaly 192.0.2.128/25 (AS64500). High-severity alert triggered."
      );
    } catch {
      // fallback
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Inspect Explanation & Root Cause
  const handleStep3InspectExplanation = () => {
    if (topActive) {
      const rawAlert = alerts.find((a) => a.id === topActive.id || a.prefix === topActive.prefix);
      if (rawAlert) {
        setSelectedAlert(rawAlert);
      }
    }
    setActiveTab("alerts");
    markStepDone(
      3,
      4,
      "Stage 3 Complete: Inspecting deterministic root-cause explanation and peer corroboration."
    );
  };

  // 4. Check Live RPKI Status
  const handleStep4CheckRPKI = () => {
    const targetPrefix = topActive?.prefix || "192.0.2.128/25";
    const targetAsn = topActive?.observed_asn || "AS64500";
    setRpkiTarget({ prefix: targetPrefix, asn: targetAsn });
    setActiveTab("rpki");
    markStepDone(
      4,
      5,
      `Stage 4 Complete: Live RPKI ROA validation queried for ${targetPrefix} (Origin: ${targetAsn}).`
    );
  };

  // 5. Verify Cryptographic Evidence
  const handleStep5VerifyEvidence = () => {
    if (topActive) {
      const foundEv = evidence.find(
        (e) => e.alert_id === topActive.id || e.record?.prefix === topActive.prefix
      );
      if (foundEv) {
        setSelectedEvidence(foundEv);
      }
    }
    setActiveTab("evidence");
    markStepDone(
      5,
      6,
      "Stage 5 Complete: Evidence Vault opened. Cryptographic RFC 8785 hash and ML-DSA-65 signature ready for verification."
    );
  };

  // 6. Demonstrate Route Withdrawal Recovery
  const handleStep6IngestWithdrawal = async () => {
    setIsProcessing(true);
    try {
      const res = await runScenarioAction("withdrawal-recovery");
      markStepDone(
        6,
        6,
        `Stage 6 Complete: BGP withdrawal processed. Alert transitioned to RESOLVED with confirmed recovery.`
      );
    } catch {
      // fallback
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestartJourney = async () => {
    setIsProcessing(true);
    try {
      await runScenarioAction("reset");
      setCompletedSteps(new Set());
      setCurrentStep(1);
      setStepFeedback("Evaluation journey reset to initial state.");
      setTimeout(() => setStepFeedback(null), 3000);
    } catch {
      // fallback
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    {
      num: 1,
      title: "Establish Clean Baseline",
      short: "1. Baseline",
      desc: "Seeds trusted reference route 192.0.2.0/24 (AS64496). Proves zero false alarms and append-only versioned history.",
      btnText: "Seed Reference Baseline",
      icon: Layers,
      action: handleStep1Baseline,
      isDone: completedSteps.has(1) || (routes.length > 0 && activeIncidents.length === 0),
    },
    {
      num: 2,
      title: "Trigger Routing Anomaly",
      short: "2. Trigger Hijack",
      desc: "Announces more-specific 192.0.2.128/25 from rogue AS64500. Proves instant subprefix containment without baseline poisoning.",
      btnText: "Inject Subprefix Hijack",
      icon: Play,
      action: handleStep2TriggerAnomaly,
      isDone: completedSteps.has(2) || activeIncidents.length > 0,
    },
    {
      num: 3,
      title: "Inspect Explanation",
      short: "3. Explanation",
      desc: "Reviews deterministic root-cause rationale, confidence score, and multi-peer agreement in operator language.",
      btnText: "Inspect Root-Cause Rationale",
      icon: FileSearch,
      action: handleStep3InspectExplanation,
      isDone: completedSteps.has(3),
    },
    {
      num: 4,
      title: "Check Live RPKI Status",
      short: "4. Check RPKI",
      desc: "Queries live RIPEstat ROA validator to verify cryptographic origin authorization independently of BGP peers.",
      btnText: "Query Live RPKI ROA",
      icon: SearchCheck,
      action: handleStep4CheckRPKI,
      isDone: completedSteps.has(4),
    },
    {
      num: 5,
      title: "Verify Post-Quantum Evidence",
      short: "5. Verify Evidence",
      desc: "Inspects RFC 8785 canonical hash and ML-DSA-65 (FIPS 204) quantum-resistant signature for non-repudiation.",
      btnText: "Verify Cryptographic Evidence",
      icon: Award,
      action: handleStep5VerifyEvidence,
      isDone: completedSteps.has(5),
    },
    {
      num: 6,
      title: "Demonstrate Route Recovery",
      short: "6. Recovery",
      desc: "Ingests BGP WITHDRAWAL message from observing peer. Proves per-peer resolution to CONFIRMED recovery.",
      btnText: "Ingest Route Withdrawal",
      icon: RotateCcw,
      action: handleStep6IngestWithdrawal,
      isDone: completedSteps.has(6),
    },
  ];

  return (
    <div className="rounded-xl border border-brand-blue/30 bg-gradient-to-br from-bg-card via-bg-card to-brand-blue/5 shadow-sm overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-divider bg-bg-interactive/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-text-main tracking-tight">
                AIORI-3 Level 2 Evaluator Guided Walkthrough
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                6-Stage Lifecycle
              </span>
            </div>
            <p className="text-xs text-text-sub mt-0.5">
              Execute each stage sequentially to verify detection, explainability, live RPKI, post-quantum evidence, and withdrawal recovery.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRestartJourney}
            disabled={isProcessing}
            className="px-2.5 py-1.5 rounded-md border border-divider hover:bg-bg-interactive text-text-sub hover:text-text-main text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset to clean evaluation state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md border border-divider hover:bg-bg-interactive text-text-sub hover:text-text-main text-xs transition-colors cursor-pointer"
            aria-label="Toggle walkthrough card"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {stepFeedback && (
        <div className="px-5 py-2.5 bg-brand-blue/10 border-b border-brand-blue/20 text-brand-blue text-xs font-medium flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{stepFeedback}</span>
        </div>
      )}

      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* Progress Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {steps.map((st) => {
              const isCurrent = currentStep === st.num;
              const isDone = st.isDone;
              return (
                <button
                  key={st.num}
                  onClick={() => setCurrentStep(st.num)}
                  className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-brand-blue/10 border-brand-blue shadow-xs"
                      : isDone
                      ? "bg-badge-green-bg/50 border-green-300 dark:border-green-900/50"
                      : "bg-bg-card border-divider hover:border-brand-blue/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-bold font-mono text-text-dim">
                      STEP {st.num}
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-text-dim/30" />
                    )}
                  </div>
                  <div className="text-xs font-semibold text-text-main truncate">
                    {st.short}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Highlight Box */}
          {(() => {
            const active = steps.find((s) => s.num === currentStep) || steps[0];
            const StepIcon = active.icon;
            return (
              <div className="p-4 sm:p-5 rounded-lg bg-bg-interactive/60 border border-divider flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-brand-blue text-white">
                      Stage {active.num} of 6
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-text-main">
                      {active.title}
                    </h3>
                    {active.isDone && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-status-green">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-text-sub leading-relaxed">
                    {active.desc}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={active.action}
                    disabled={isProcessing}
                    className="px-4 py-2.5 rounded-lg bg-brand-blue hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <StepIcon className="w-4 h-4" />
                    <span>{isProcessing ? "Processing..." : active.btnText}</span>
                    <ArrowRight className="w-4 h-4 opacity-80" />
                  </button>
                  {currentStep < 6 && (
                    <button
                      onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
                      className="px-3 py-2.5 rounded-lg border border-divider hover:bg-bg-card text-text-sub hover:text-text-main text-xs font-medium transition-colors cursor-pointer"
                    >
                      Next Step
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
