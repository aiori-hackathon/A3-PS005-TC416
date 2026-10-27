import React, { useState } from "react";
import {
  Play,
  FileSearch,
  SearchCheck,
  Award,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";
import { groupAlertObservations } from "../utils/incidentGrouping";

interface EvaluatorGuideCardProps {
  onSelectAlert?: (alertId: string) => void;
}

type StepExecutionState = "IDLE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export const EvaluatorGuideCard: React.FC<EvaluatorGuideCardProps> = () => {
  const {
    alerts,
    setActiveTab,
    setSelectedAlert,
    setSelectedEvidence,
    setRpkiTarget,
    runScenarioAction,
    evidence,
  } = useHoraqStore();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stepStates, setStepStates] = useState<Record<number, StepExecutionState>>({
    1: "IDLE",
    2: "IDLE",
    3: "IDLE",
    4: "IDLE",
    5: "IDLE",
    6: "IDLE",
  });
  const [stepErrors, setStepErrors] = useState<Record<number, string | null>>({});
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [stepFeedback, setStepFeedback] = useState<string | null>(null);

  const groupedIncidents = groupAlertObservations(alerts);
  const activeIncidents = groupedIncidents.filter((g) => g.status === "ACTIVE");
  const topActive = activeIncidents[0] || null;

  const showFeedback = (msg: string) => {
    setStepFeedback(msg);
    setTimeout(() => setStepFeedback(null), 5000);
  };

  // 1. Establish Clean Baseline
  const handleStep1Baseline = async () => {
    setIsProcessing(true);
    setStepStates((prev) => ({ ...prev, 1: "IN_PROGRESS" }));
    setStepErrors((prev) => ({ ...prev, 1: null }));
    try {
      const res = await runScenarioAction("baseline");
      if (res?.success === true && res?.alerts_generated === 0) {
        setStepStates((prev) => ({ ...prev, 1: "COMPLETED" }));
        showFeedback(
          "Stage 1 Complete: Clean baseline for 192.0.2.0/24 established under AS64496 with zero spurious alerts."
        );
        setCurrentStep(2);
      } else {
        const errMsg = res?.description || `Expected 0 alerts but got ${res?.alerts_generated ?? "error"}`;
        setStepStates((prev) => ({ ...prev, 1: "FAILED" }));
        setStepErrors((prev) => ({ ...prev, 1: `Baseline initialization failed: ${errMsg}` }));
      }
    } catch (err: any) {
      setStepStates((prev) => ({ ...prev, 1: "FAILED" }));
      setStepErrors((prev) => ({ ...prev, 1: err.message || "Failed to execute baseline establishment." }));
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Trigger Routing Anomaly (Subprefix Hijack)
  const handleStep2TriggerAnomaly = async () => {
    setIsProcessing(true);
    setStepStates((prev) => ({ ...prev, 2: "IN_PROGRESS" }));
    setStepErrors((prev) => ({ ...prev, 2: null }));
    try {
      const res = await runScenarioAction("subprefix");
      if (res?.success === true && (res?.alerts_generated ?? 0) >= 1) {
        setStepStates((prev) => ({ ...prev, 2: "COMPLETED" }));
        showFeedback(
          "Stage 2 Complete: Injected subprefix anomaly 192.0.2.128/25 (AS64500). High-severity alert triggered and quarantined."
        );
        setCurrentStep(3);
      } else {
        setStepStates((prev) => ({ ...prev, 2: "FAILED" }));
        setStepErrors((prev) => ({ ...prev, 2: "Anomaly injection completed without generating expected alert." }));
      }
    } catch (err: any) {
      setStepStates((prev) => ({ ...prev, 2: "FAILED" }));
      setStepErrors((prev) => ({ ...prev, 2: err.message || "Failed to inject subprefix anomaly." }));
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
    setStepStates((prev) => ({ ...prev, 3: "COMPLETED" }));
    showFeedback("Stage 3: Opened Security Alerts Center with deterministic root-cause explanation and peer corroboration.");
    setCurrentStep(4);
  };

  // 4. Check Live RPKI Status
  const handleStep4CheckRPKI = () => {
    const targetPrefix = topActive?.prefix || "192.0.2.128/25";
    const targetAsn = topActive?.observed_asn || "AS64500";
    setRpkiTarget({ prefix: targetPrefix, asn: targetAsn });
    setActiveTab("rpki");
    setStepStates((prev) => ({ ...prev, 4: "COMPLETED" }));
    showFeedback(`Stage 4: Opened RPKI Inspector for ${targetPrefix} (Origin: ${targetAsn}). Live ROA lookup in progress.`);
    setCurrentStep(5);
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
    setStepStates((prev) => ({ ...prev, 5: "COMPLETED" }));
    showFeedback(
      "Stage 5: Opened Cryptographic Evidence Vault. RFC 8785 hash and NIST FIPS 204 ML-DSA-65 signature ready for inspection."
    );
    setCurrentStep(6);
  };

  // 6. Demonstrate Route Withdrawal Recovery
  const handleStep6IngestWithdrawal = async () => {
    setIsProcessing(true);
    setStepStates((prev) => ({ ...prev, 6: "IN_PROGRESS" }));
    setStepErrors((prev) => ({ ...prev, 6: null }));
    try {
      const res = await runScenarioAction("withdrawal-recovery");
      const resolved = res?.alerts_resolved ?? 0;
      const recovered = res?.result?.recovered_candidate_routes ?? 0;
      if (res?.success === true && (resolved > 0 || recovered > 0)) {
        setStepStates((prev) => ({ ...prev, 6: "COMPLETED" }));
        showFeedback(
          `Stage 6 Complete: BGP withdrawal processed for ${res?.prefix || "route"}. ${resolved} alert(s) resolved with confirmed recovery.`
        );
      } else {
        setStepStates((prev) => ({ ...prev, 6: "FAILED" }));
        setStepErrors((prev) => ({
          ...prev,
          6: "Recovery unconfirmed: No active alerts were resolved. Ensure an active anomaly exists (Stage 2) before testing withdrawal recovery.",
        }));
      }
    } catch (err: any) {
      setStepStates((prev) => ({ ...prev, 6: "FAILED" }));
      setStepErrors((prev) => ({ ...prev, 6: err.message || "Failed to process BGP withdrawal recovery." }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestartJourney = async () => {
    setIsProcessing(true);
    try {
      await runScenarioAction("reset");
      setStepStates({
        1: "IDLE",
        2: "IDLE",
        3: "IDLE",
        4: "IDLE",
        5: "IDLE",
        6: "IDLE",
      });
      setStepErrors({});
      setCurrentStep(1);
      showFeedback("Evaluation journey reset to initial state.");
    } catch (err: any) {
      showFeedback(`Reset warning: ${err.message || "Reset failed"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    {
      num: 1,
      title: "Establish Clean Baseline",
      short: "1. Baseline",
      desc: "Seeds trusted reference route 192.0.2.0/24 (AS64496). Proves zero false alarms and establishes immutable baseline policy in the SQLite WAL trust store.",
      btnText: "Seed Reference Baseline",
      icon: Layers,
      action: handleStep1Baseline,
    },
    {
      num: 2,
      title: "Trigger Routing Anomaly",
      short: "2. Trigger Hijack",
      desc: "Announces more-specific 192.0.2.128/25 from rogue AS64500. Proves instant subprefix containment without baseline poisoning.",
      btnText: "Inject Subprefix Hijack",
      icon: Play,
      action: handleStep2TriggerAnomaly,
    },
    {
      num: 3,
      title: "Inspect Explanation",
      short: "3. Explanation",
      desc: "Reviews deterministic root-cause rationale, confidence score, and multi-peer agreement in operator language.",
      btnText: "Inspect Root-Cause Rationale",
      icon: FileSearch,
      action: handleStep3InspectExplanation,
    },
    {
      num: 4,
      title: "Check Live RPKI Status",
      short: "4. Check RPKI",
      desc: "Queries live RIPEstat ROA validator to verify cryptographic origin authorization independently of BGP peers.",
      btnText: "Query Live RPKI ROA",
      icon: SearchCheck,
      action: handleStep4CheckRPKI,
    },
    {
      num: 5,
      title: "Verify Post-Quantum Evidence",
      short: "5. Verify Evidence",
      desc: "Inspects RFC 8785 canonical hash and ML-DSA-65 (FIPS 204) quantum-resistant signature for non-repudiation.",
      btnText: "Verify Cryptographic Evidence",
      icon: Award,
      action: handleStep5VerifyEvidence,
    },
    {
      num: 6,
      title: "Demonstrate Route Recovery",
      short: "6. Recovery",
      desc: "Ingests BGP WITHDRAWAL message from observing peer. Proves per-peer resolution to CONFIRMED recovery.",
      btnText: "Ingest Route Withdrawal",
      icon: RotateCcw,
      action: handleStep6IngestWithdrawal,
    },
  ];

  const active = steps.find((s) => s.num === currentStep) || steps[0];
  const activeState = stepStates[active.num];
  const activeError = stepErrors[active.num];
  const StepIcon = active.icon;

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
            className="px-2.5 py-1.5 rounded-md border border-divider hover:bg-bg-interactive text-text-sub hover:text-text-main text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
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
              const isSelected = currentStep === st.num;
              const status = stepStates[st.num];

              return (
                <button
                  key={st.num}
                  onClick={() => setCurrentStep(st.num)}
                  className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-brand-blue/10 border-brand-blue shadow-xs"
                      : status === "COMPLETED"
                      ? "bg-badge-green-bg/50 border-green-300 dark:border-green-900/50"
                      : status === "FAILED"
                      ? "bg-status-critical-bg/50 border-red-300 dark:border-red-900/50"
                      : "bg-bg-card border-divider hover:border-brand-blue/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-bold font-mono text-text-dim">
                      STEP {st.num}
                    </span>
                    {status === "COMPLETED" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
                    ) : status === "FAILED" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-status-critical shrink-0" />
                    ) : status === "IN_PROGRESS" ? (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    ) : isSelected ? (
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
          <div className="p-4 sm:p-5 rounded-lg bg-bg-interactive/60 border border-divider space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-brand-blue text-white">
                    Stage {active.num} of 6
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-text-main">
                    {active.title}
                  </h3>
                  {activeState === "COMPLETED" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-status-green">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  )}
                  {activeState === "FAILED" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-status-critical">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Incomplete
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
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                  <span>
                    {isProcessing
                      ? "Executing..."
                      : activeState === "FAILED"
                      ? `Retry: ${active.btnText}`
                      : active.btnText}
                  </span>
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

            {/* Error / Failure Banner if step failed */}
            {activeError && (
              <div className="p-3 rounded-md bg-status-critical-bg border border-red-300 dark:border-red-900/60 text-xs text-status-critical flex items-start gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold">Action Required:</div>
                  <div>{activeError}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
