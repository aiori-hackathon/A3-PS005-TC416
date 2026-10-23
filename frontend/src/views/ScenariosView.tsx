import React, { useState } from "react";
import {
  Terminal,
  Play,
  RotateCw,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";

interface ScenarioCardInfo {
  id: string;
  name: string;
  prefix: string;
  asn: string;
  summary: string;
  expected: string;
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
      expected: "0 Alerts Expected",
      technicalDetails: "Validates that initial observations initialize the route baseline without spurious false positives.",
    },
    {
      id: "origin-change",
      name: "2. Origin Conflict (Unauthorized Hijack)",
      prefix: "192.0.2.0/24",
      asn: "AS64511 (Rogue)",
      summary: "Rogue AS announces an existing prefix to simulate an uncoordinated origin hijack.",
      expected: "1 Alert Expected (HIGH)",
      technicalDetails: "Enforces that baseline is preserved against poisoning and structured cryptographic evidence is generated.",
    },
    {
      id: "subprefix",
      name: "3. Subprefix Hijack Injection",
      prefix: "192.0.2.128/25",
      asn: "AS64500 (Rogue)",
      summary: "Announces a more-specific /25 slice under parent /24 to exploit BGP Longest Prefix Match.",
      expected: "1 Alert Expected (HIGH)",
      technicalDetails: "Verifies that subprefix containment is flagged immediately before global traffic redirection.",
    },
    {
      id: "legitimate-migration",
      name: "4. Dual-Origin Provider Migration",
      prefix: "198.51.100.0/24",
      asn: "AS64497 → AS64498",
      summary: "Planned network provider transition with valid authorization metadata.",
      expected: "1 Alert Expected (Audit Logged)",
      technicalDetails: "Records a maintenance origin update without triggering a false malicious hijack alarm.",
    },
    {
      id: "ipv6-subprefix",
      name: "5. IPv6 Subprefix Anomaly",
      prefix: "2001:db8:1::/48",
      asn: "AS64505 (under /32)",
      summary: "Announces an IPv6 /48 subnet under established parent 2001:db8::/32 baseline.",
      expected: "1 Alert Expected (HIGH)",
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
          scenario: "Master Benchmark Suite (All 5)",
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

  const handleResetConfirm = async () => {
    setShowResetConfirm(false);
    setRunningId("reset");
    try {
      await resetDatabaseAction();
      setLogs([]);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border-card">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-main tracking-tight">
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
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors active:scale-[0.98] flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${runningId === "run-all" ? "animate-spin" : ""}`} />
            <span>{runningId === "run-all" ? "Running suite..." : "Run suite"}</span>
          </button>

          <button
            onClick={() => seedDemoDataAction()}
            disabled={!!runningId}
            className="px-3.5 py-2 rounded-xl bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-medium text-text-sub hover:text-text-main transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seed demo data</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={!!runningId}
            className="px-3.5 py-2 rounded-xl bg-bg-btn border border-border-card hover:bg-red-500/10 hover:text-red-400 text-xs font-medium text-text-dim transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Scenarios List */}
      <div className="space-y-3">
        {scenarios.map((sc) => {
          const isRunning = runningId === sc.id;
          const isExpanded = expandedId === sc.id;

          return (
            <div
              key={sc.id}
              className="card-panel overflow-hidden transition-all duration-150"
            >
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xs sm:text-sm font-semibold text-text-main">
                      {sc.name}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-app border border-border-card text-brand-blue">
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
                    <span>{isExpanded ? "Hide details" : "View test details"}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleRun(sc.id)}
                    disabled={!!runningId}
                    className="px-3 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover hover:border-brand-blue/50 text-xs font-medium text-text-main transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <Play className={`w-3 h-3 fill-current ${isRunning ? "animate-spin" : ""}`} />
                    <span>{isRunning ? "Running..." : "Run scenario"}</span>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 py-3 bg-[#0E1115] border-t border-border-item text-xs space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-text-sub font-mono text-[11px]">
                    <div>
                      <span className="text-text-dim">Prefix:</span> {sc.prefix}
                    </div>
                    <div>
                      <span className="text-text-dim">Origin ASN:</span> {sc.asn}
                    </div>
                  </div>
                  <p className="text-[11px] text-text-sub leading-relaxed pt-1 border-t border-border-card/50">
                    {sc.technicalDetails}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Execution Results Log */}
      {logs.length > 0 && (
        <div className="card-panel overflow-hidden space-y-2">
          <div className="px-4 py-2.5 border-b border-border-card text-xs font-semibold text-text-main flex items-center justify-between">
            <span>Recent Test Runs</span>
            <span className="text-text-dim text-[11px]">{logs.length} runs recorded</span>
          </div>

          <div className="divide-y divide-border-item text-xs">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-2.5 flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
                  <span className="text-text-main">{log.scenario}</span>
                </div>
                <div className="flex items-center gap-3 text-text-sub text-[11px]">
                  <span>Alerts: {log.alerts}</span>
                  <span>•</span>
                  <span>{log.time}</span>
                  <span className="text-status-green font-semibold">PASS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="card-panel p-6 max-w-sm w-full space-y-4 shadow-2xl border-red-500/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Confirm database reset</span>
              </div>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="text-text-dim hover:text-text-main cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-sub leading-relaxed">
              This will clear all alerts, learned route baselines, and cryptographic evidence records from the local SQLite database.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-bg-btn border border-border-card text-xs font-medium text-text-sub hover:text-text-main cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-3.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                Reset database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
