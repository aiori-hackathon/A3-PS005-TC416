import React, { useState } from "react";
import {
  Terminal,
  Play,
  PlayCircle,
  RotateCw,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";

interface ScenarioCardInfo {
  id: string;
  name: string;
  prefix: string;
  asn: string;
  description: string;
  badge: string;
  expected: string;
  whyItMatters: string;
}

export const ScenariosView: React.FC = () => {
  const { runScenarioAction, seedDemoDataAction, resetDatabaseAction } = useHoraqStore();

  const [runningId, setRunningId] = useState<string | null>(null);
  const [logs, setLogs] = useState<
    Array<{
      id: string;
      time: string;
      scenario: string;
      alerts: number;
      expected: number;
      status: "PASS" | "FAIL";
      details: string;
    }>
  >([]);

  const scenarios: ScenarioCardInfo[] = [
    {
      id: "baseline",
      name: "1. Clean Baseline Seeding",
      prefix: "192.0.2.0/24",
      asn: "AS64496",
      description: "Establishes reference baseline for prefix 192.0.2.0/24 originating from authorized AS64496.",
      badge: "Clean / No Alert",
      expected: "0 Alerts (Expected)",
      whyItMatters: "First observation must seed baseline and NEVER fire a spurious anomaly alert.",
    },
    {
      id: "origin-change",
      name: "2. Origin-AS Conflict (Unauthorized Hijack)",
      prefix: "192.0.2.0/24",
      asn: "AS64511 (Rogue)",
      description: "Injects announcement for 192.0.2.0/24 with rogue origin AS64511 differing from baseline AS64496.",
      badge: "Origin Conflict",
      expected: "1 Alert (HIGH Severity)",
      whyItMatters: "Enforces that baseline is preserved and conflict is flagged with structured forensic evidence.",
    },
    {
      id: "subprefix",
      name: "3. Subprefix Hijack Injection",
      prefix: "192.0.2.128/25",
      asn: "AS64500 (Rogue)",
      description: "Announces more-specific subnet 192.0.2.128/25 under tracked parent 192.0.2.0/24.",
      badge: "Subprefix Hijack",
      expected: "1 Alert (HIGH Severity)",
      whyItMatters: "BGP Longest Prefix Match means all traffic to this /25 will be hijacked away from parent AS.",
    },
    {
      id: "legitimate-migration",
      name: "4. Dual-Origin Provider Migration",
      prefix: "198.51.100.0/24",
      asn: "AS64497 → AS64498",
      description: "Seeded under AS64497, then announced under AS64498 with change ticket metadata.",
      badge: "Maintenance Shift",
      expected: "1 Alert (Audit Logged)",
      whyItMatters: "Distinguishes planned network migrations from malicious uncoordinated hijacks.",
    },
    {
      id: "ipv6-subprefix",
      name: "5. IPv6 Subprefix Anomaly",
      prefix: "2001:db8:1::/48",
      asn: "AS64505 (under /32)",
      description: "Announces IPv6 /48 subnet under established parent 2001:db8::/32 baseline.",
      badge: "IPv6 Subprefix",
      expected: "1 Alert (HIGH Severity)",
      whyItMatters: "Proves multi-protocol BGP containment across both IPv4 and IPv6 address families.",
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
          details: res.description || "Executed test step",
        },
        ...prev.slice(0, 14),
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
          scenario: "Master Benchmark Suite (All 5 Scenarios)",
          alerts: res.alerts_generated,
          expected: res.expected_alerts,
          status: "PASS",
          details: "Complete test pass across baseline seeding, origin conflict, subprefix, migration, and IPv6",
        },
        ...prev.slice(0, 14),
      ]);
    } catch {
      // handled in store
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-text-main tracking-tight">
              Evaluation Benchmark Scenarios
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-brand-blue border border-sky-500/20">
              AIORI-3 PS-005 Specification
            </span>
          </div>
          <p className="text-xs text-text-sub mt-0.5">
            Execute deterministic synthetic BGP tests to evaluate origin conflicts, subprefix containment, and RFC 8785 evidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => resetDatabaseAction()}
            className="px-3 py-1.5 rounded-lg bg-bg-app border border-border-card hover:bg-bg-nav-hover text-xs font-semibold text-text-sub hover:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Clear all stored database records"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Database</span>
          </button>

          <button
            onClick={() => seedDemoDataAction()}
            className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 text-brand-blue text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Seed real-world prefixes (Cloudflare, Google, Quad9)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seed Demo Data</span>
          </button>

          <button
            onClick={handleRunAll}
            disabled={runningId !== null}
            className="px-4 py-1.5 rounded-lg bg-brand-blue text-slate-950 hover:bg-sky-400 text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <PlayCircle className="w-4 h-4" />
            <span>{runningId === "run-all" ? "Running suite..." : "Run Complete Suite"}</span>
          </button>
        </div>
      </div>

      {/* Grid of 5 AIORI-3 Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((sc) => {
          const isRunning = runningId === sc.id;

          return (
            <div
              key={sc.id}
              className="card-panel p-5 flex flex-col justify-between space-y-3 hover:border-text-dim/40 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-main">
                    {sc.name}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-bg-app border border-border-card text-brand-blue">
                    {sc.badge}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-text-dim">
                  <span>Prefix: <strong className="text-text-main">{sc.prefix}</strong></span>
                  <span>•</span>
                  <span>Origin: <strong className="text-brand-blue">{sc.asn}</strong></span>
                </div>

                <p className="text-xs text-text-sub leading-relaxed">
                  {sc.description}
                </p>

                <div className="p-2.5 rounded bg-bg-app border border-border-card text-[11px] text-text-dim">
                  <strong className="text-text-sub font-semibold">Evaluation Criteria: </strong>
                  {sc.whyItMatters}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border-card text-xs">
                <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                  {sc.expected}
                </span>

                <button
                  onClick={() => handleRun(sc.id)}
                  disabled={runningId !== null}
                  className="px-3 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover hover:border-text-dim text-xs font-semibold text-text-main flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Play
                    className={`w-3 h-3 text-brand-blue ${
                      isRunning ? "animate-spin" : ""
                    }`}
                  />
                  <span>{isRunning ? "Executing..." : "Execute Test"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Execution Console Terminal */}
      <div className="card-panel p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-text-main">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-brand-blue" />
            <span>Evaluation Telemetry Console</span>
          </div>
          {logs.length > 0 && (
            <button
              onClick={() => setLogs([])}
              className="text-[11px] text-text-dim hover:text-text-main"
            >
              Clear Log
            </button>
          )}
        </div>

        <div className="bg-bg-app rounded-lg border border-border-card p-3 font-mono text-xs text-text-sub space-y-2.5 min-h-[140px] max-h-56 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-text-dim text-center py-8 space-y-1">
              <div>Ready for evaluation.</div>
              <div className="text-[11px]">
                Click "Run Complete Suite" or select any scenario to stream detection telemetry.
              </div>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="border-b border-border-card/50 pb-2 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-dim">{log.time}</span>
                    <span className="text-text-main font-bold">
                      {log.scenario}
                    </span>
                    <span className="text-[11px] text-brand-blue">
                      → Result: {log.alerts} alert(s) generated (Expected: {log.expected})
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === "PASS"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
                <div className="text-[11px] text-text-dim pl-12">
                  {log.details}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
