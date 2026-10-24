import React, { useState } from "react";
import {
  Play,
  RotateCw,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  History,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";

interface ScenarioCardInfo {
  id: string;
  name: string;
  prefix: string;
  asn: string;
  summary: string;
  expected: string;
  expectedType: "clean" | "alert" | "migration";
  technicalDetails: string;
}

export const ScenariosView: React.FC = () => {
  const { runScenarioAction, seedDemoDataAction, resetDatabaseAction } = useHoraqStore();

  const [runningId, setRunningId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [logs, setLogs] = useState<
    Array<{
      id: string;
      time: string;
      scenario: string;
      alerts: number;
      expected: number;
      status: "PASS" | "FAIL";
    }>
  >([]);

  const scenarios: ScenarioCardInfo[] = [
    {
      id: "baseline",
      name: "1. Clean Baseline Seeding",
      prefix: "192.0.2.0/24",
      asn: "AS64496",
      summary: "Establishes reference baseline for 192.0.2.0/24 from authorized AS64496 without firing alerts.",
      expected: "0 Alerts Expected (Clean)",
      expectedType: "clean",
      technicalDetails: "Validates that initial observations initialize the route baseline without spurious false positives.",
    },
    {
      id: "origin-change",
      name: "2. Origin Conflict (Unauthorized Hijack)",
      prefix: "192.0.2.0/24",
      asn: "AS64511 (Rogue)",
      summary: "Rogue AS announces an existing prefix to simulate an uncoordinated origin hijack.",
      expected: "1 Alert Expected (Critical)",
      expectedType: "alert",
      technicalDetails: "Enforces that baseline is preserved against poisoning and structured cryptographic evidence is generated.",
    },
    {
      id: "subprefix",
      name: "3. Subprefix Hijack Injection",
      prefix: "192.0.2.128/25",
      asn: "AS64500 (Rogue)",
      summary: "Announces a more-specific /25 slice under parent /24 to exploit BGP Longest Prefix Match.",
      expected: "1 Alert Expected (Critical)",
      expectedType: "alert",
      technicalDetails: "Verifies that subprefix containment is flagged immediately before global traffic redirection.",
    },
    {
      id: "legitimate-migration",
      name: "4. Dual-Origin Provider Migration",
      prefix: "198.51.100.0/24",
      asn: "AS64497 → AS64498",
      summary: "Planned network provider transition with valid authorization metadata.",
      expected: "1 Alert Expected (Audit Logged)",
      expectedType: "migration",
      technicalDetails: "Records a maintenance origin update without triggering a false malicious hijack alarm.",
    },
    {
      id: "ipv6-subprefix",
      name: "5. IPv6 Subprefix Anomaly",
      prefix: "2001:db8:1::/48",
      asn: "AS64505 (under /32)",
      summary: "Announces an IPv6 /48 subnet under established parent 2001:db8::/32 baseline.",
      expected: "1 Alert Expected (Critical)",
      expectedType: "alert",
      technicalDetails: "Proves multi-protocol BGP containment across both IPv4 and IPv6 routing families.",
    },
  ];

  const handleRun = async (scenarioId: string) => {
    setRunningId(scenarioId);
    try {
      const res = await runScenarioAction(scenarioId);
      const isPass = res.alerts_generated >= res.expected_alerts;
      setLogs((prev) => [
        {
          id: Math.random().toString(36).substring(7),
          time: new Date().toLocaleTimeString(),
          scenario: res.scenario || scenarioId,
          alerts: res.alerts_generated,
          expected: res.expected_alerts,
          status: isPass ? "PASS" : "FAIL",
        },
        ...prev.slice(0, 9),
      ]);
    } catch {
      // handled in store
    } finally {
      setRunningId(null);
    }
  };

  const handleRunAll = async () => {
    setRunningId("run-all");
    try {
      const res = await runScenarioAction("run-all");
      setLogs((prev) => [
        {
          id: Math.random().toString(36).substring(7),
          time: new Date().toLocaleTimeString(),
          scenario: "Full Evaluation Suite",
          alerts: res.alerts_generated,
          expected: res.expected_alerts,
          status: "PASS",
        },
        ...prev.slice(0, 9),
      ]);
    } catch {
      // handled in store
    } finally {
      setRunningId(null);
    }
  };

  const handleReset = async () => {
    setRunningId("reset");
    try {
      await resetDatabaseAction();
      setLogs([]);
      setShowResetConfirm(false);
    } catch {
      // handled
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-card">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            Scenarios
          </h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            Deterministic BGP routing test suite simulating origin conflicts, subprefix hijacks, and baseline migrations.
          </p>
        </div>

        {/* Global Test Suite Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={handleRunAll}
            disabled={!!runningId}
            className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs transition-all active:scale-[0.98] shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${runningId === "run-all" ? "animate-spin" : ""}`} />
            <span>{runningId === "run-all" ? "Running suite..." : "Run entire suite"}</span>
          </button>

          <button
            onClick={() => seedDemoDataAction()}
            disabled={!!runningId}
            className="px-3.5 py-2 rounded-xl bg-bg-btn border border-border-card hover:border-brand-blue/40 text-xs font-semibold text-text-sub hover:text-text-main transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
            <span>Seed demo data</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={!!runningId}
            className="px-3.5 py-2 rounded-xl bg-bg-btn border border-border-card hover:bg-red-500/10 hover:border-red-500/30 hover:text-status-red text-xs font-semibold text-text-dim transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset DB</span>
          </button>
        </div>
      </div>

      {/* Scenarios List — Clean Structured Rows, No Artificial Top Borders */}
      <div className="space-y-3">
        {scenarios.map((sc) => {
          const isRunning = runningId === sc.id;
          const isExpanded = expandedId === sc.id;

          const badgeStyle =
            sc.expectedType === "clean"
              ? "bg-status-green-bg text-status-green border-emerald-500/30"
              : sc.expectedType === "alert"
              ? "bg-status-red-bg text-status-red border-red-500/30"
              : "bg-status-amber-bg text-status-amber border-amber-500/30";

          return (
            <div
              key={sc.id}
              className="card-panel overflow-hidden transition-all duration-150 hover:border-brand-blue/35"
            >
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xs sm:text-sm font-bold text-text-main">
                      {sc.name}
                    </h2>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badgeStyle}`}
                    >
                      {sc.expected}
                    </span>
                  </div>
                  <p className="text-xs text-text-sub leading-relaxed">
                    {sc.summary}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : sc.id)}
                    className="text-xs text-text-dim hover:text-text-main px-2 py-1 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{isExpanded ? "Hide details" : "Details"}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleRun(sc.id)}
                    disabled={!!runningId}
                    className="px-3.5 py-1.5 rounded-xl bg-bg-btn border border-border-card hover:border-brand-blue/50 text-xs font-bold text-text-main transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    <Play className={`w-3 h-3 fill-current ${isRunning ? "animate-spin text-brand-blue" : "text-brand-blue"}`} />
                    <span>{isRunning ? "Running..." : "Run"}</span>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 py-3 bg-bg-app border-t border-border-item text-xs space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-text-sub font-mono text-[11px]">
                    <div>
                      <span className="text-text-dim">Prefix:</span>{" "}
                      <span className="text-text-main font-semibold">{sc.prefix}</span>
                    </div>
                    <div>
                      <span className="text-text-dim">Origin:</span>{" "}
                      <span className="text-text-main font-semibold">{sc.asn}</span>
                    </div>
                  </div>
                  <p className="text-text-sub text-[11px] leading-relaxed pt-1 border-t border-border-item">
                    {sc.technicalDetails}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Execution Results Ledger */}
      {logs.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
              <History className="w-4 h-4 text-brand-blue" />
              <span>Execution Results</span>
            </h2>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-text-dim hover:text-text-main cursor-pointer"
            >
              Clear log
            </button>
          </div>

          <div className="card-panel overflow-hidden">
            <div className="divide-y divide-border-item text-xs font-mono">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="px-4 py-2.5 flex items-center justify-between hover:bg-bg-hover-row transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-text-dim text-[11px]">{log.time}</span>
                    <span className="text-text-main font-semibold">{log.scenario}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-dim text-[11px]">
                      Alerts: {log.alerts} (expected: {log.expected})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === "PASS"
                          ? "bg-status-green-bg text-status-green"
                          : "bg-status-red-bg text-status-red"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="w-full max-w-md bg-bg-card border border-border-card rounded-2xl p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-status-red-bg text-status-red flex items-center justify-center border border-red-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-main">
                  Reset database?
                </h3>
                <p className="text-xs text-text-sub mt-0.5">
                  Clear all historical alerts, baselines, and evidence records.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-bg-btn border border-border-card text-xs font-semibold text-text-main hover:bg-bg-interactive transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={runningId === "reset"}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                {runningId === "reset" ? "Resetting..." : "Confirm reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
