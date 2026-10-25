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
      summary: "Establishes reference baseline for 192.0.2.0/24 from authorized AS64496 without firing false alarms.",
      expected: "0 Alerts (Clean)",
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
      // Strictly require exact match of generated alerts to expected alerts, and affirmative success
      const isPass = res && res.success !== false && res.alerts_generated === res.expected_alerts;
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
      setLogs((prev) => [
        {
          id: Math.random().toString(36).substring(7),
          time: new Date().toLocaleTimeString(),
          scenario: scenarioId,
          alerts: 0,
          expected: 1,
          status: "FAIL",
        },
        ...prev.slice(0, 9),
      ]);
    } finally {
      setRunningId(null);
    }
  };

  const handleRunAll = async () => {
    setRunningId("run-all");
    try {
      const res = await runScenarioAction("run-all");
      // Calculate suite outcome from actual individual results: all 5 scenarios must pass exactly
      const suiteResults = res.suite_results || [];
      const isSuitePass =
        res &&
        res.success === true &&
        res.alerts_generated === res.expected_alerts &&
        suiteResults.length === 5 &&
        suiteResults.every(
          (sc: any) => sc.alerts_generated === sc.expected_alerts && sc.success === true
        );

      setLogs((prev) => [
        {
          id: Math.random().toString(36).substring(7),
          time: new Date().toLocaleTimeString(),
          scenario: "Full Evaluation Suite",
          alerts: res.alerts_generated,
          expected: res.expected_alerts,
          status: isSuitePass ? "PASS" : "FAIL",
        },
        ...prev.slice(0, 9),
      ]);
    } catch {
      setLogs((prev) => [
        {
          id: Math.random().toString(36).substring(7),
          time: new Date().toLocaleTimeString(),
          scenario: "Full Evaluation Suite",
          alerts: 0,
          expected: 4,
          status: "FAIL",
        },
        ...prev.slice(0, 9),
      ]);
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
    <div className="max-w-[1360px] w-full space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-divider">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-text-main tracking-tight">
            Scenario Runner & Test Matrix
          </h1>
          <p className="text-sm text-text-sub mt-1">
            Deterministic BGP routing test suite simulating origin conflicts, subprefix hijacks, and baseline migrations.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            onClick={handleRunAll}
            disabled={!!runningId}
            className="px-4 py-2 rounded-md bg-brand-blue hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${runningId === "run-all" ? "animate-spin" : ""}`} />
            <span>{runningId === "run-all" ? "Executing Suite..." : "Run Complete Test Suite"}</span>
          </button>

          <button
            onClick={() => seedDemoDataAction()}
            disabled={!!runningId}
            className="px-3.5 py-2 rounded-md bg-bg-btn border border-border-card hover:bg-bg-interactive text-xs font-medium text-text-main transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
            <span>Seed Benchmarks</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={!!runningId}
            className="px-3.5 py-2 rounded-md bg-bg-btn border border-border-card hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/20 text-xs font-medium text-text-sub hover:text-status-critical transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset DB</span>
          </button>
        </div>
      </div>

      {/* Explicit Synthetic Demo Notice */}
      <div className="p-3.5 rounded-lg border border-divider bg-bg-interactive flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-brand-blue/15 text-brand-blue border border-brand-blue/30 uppercase tracking-wide">
            SYNTHETIC DEMO
          </span>
          <span className="font-medium text-text-main">
            Controlled RFC 5737 / RFC 3849 Testbed
          </span>
          <span className="text-text-dim">•</span>
          <span className="text-text-sub">
            All scenario announcements are simulated locally against reserved documentation blocks. No mutated routes are broadcast to the Internet.
          </span>
        </div>
      </div>

      {/* Scenarios Table / List */}
      <div className="card-panel overflow-hidden divide-y divide-divider">
        {scenarios.map((sc) => {
          const isRunning = runningId === sc.id;
          const isExpanded = expandedId === sc.id;

          const badgeStyle =
            sc.expectedType === "clean"
              ? "bg-badge-green-bg text-status-green border border-green-300 dark:border-green-900"
              : sc.expectedType === "alert"
              ? "bg-status-critical-bg text-status-critical border border-red-300 dark:border-red-900"
              : "bg-badge-amber-bg text-status-warning border border-amber-300 dark:border-amber-900";

          return (
            <div key={sc.id} className="p-4 hover:bg-bg-hover-row transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-sm font-semibold text-text-main">
                      {sc.name}
                    </h2>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${badgeStyle}`}>
                      {sc.expected}
                    </span>
                  </div>
                  <p className="text-xs text-text-sub leading-relaxed max-w-4xl">
                    {sc.summary}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : sc.id)}
                    className="text-xs text-text-sub hover:text-text-main px-2.5 py-1.5 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleRun(sc.id)}
                    disabled={!!runningId}
                    className="px-3.5 py-1.5 rounded-md bg-bg-btn border border-border-card hover:bg-bg-interactive text-xs font-semibold text-text-main transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? "animate-spin text-brand-blue" : "text-brand-blue"}`} />
                    <span>{isRunning ? "Running..." : "Run Scenario"}</span>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-divider text-xs space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-text-dim">Prefix Tested:</span>{" "}
                      <span className="text-text-main font-bold">{sc.prefix}</span>
                    </div>
                    <div>
                      <span className="text-text-dim">Announced Origin:</span>{" "}
                      <span className="text-text-main font-bold">{sc.asn}</span>
                    </div>
                  </div>
                  <p className="text-xs text-text-sub pt-1 leading-relaxed">
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
            <h2 className="text-base font-semibold text-text-main flex items-center gap-2">
              <History className="w-4 h-4 text-brand-blue" />
              <span>Execution Results</span>
            </h2>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-text-sub hover:text-text-main cursor-pointer"
            >
              Clear Log
            </button>
          </div>

          <div className="card-panel overflow-hidden">
            <div className="divide-y divide-divider text-xs font-mono">
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
                          ? "bg-badge-green-bg text-status-green"
                          : "bg-status-critical-bg text-status-critical"
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

      {/* Reset Modal */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="w-full max-w-md bg-bg-card border border-border-card rounded-lg p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-status-critical-bg text-status-critical flex items-center justify-center border border-red-300 dark:border-red-900">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-main">
                  Reset Routing Database?
                </h3>
                <p className="text-xs text-text-sub mt-0.5">
                  Clear all recorded anomalies, custom baselines, and evidence records.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-md bg-bg-btn border border-border-card text-xs font-medium text-text-main hover:bg-bg-interactive transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={runningId === "reset"}
                className="px-4 py-2 rounded-md bg-status-critical hover:bg-red-700 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                {runningId === "reset" ? "Resetting..." : "Confirm Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
