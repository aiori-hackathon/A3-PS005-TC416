import React, { useState } from "react";
import {
  FlaskConical,
  Play,
  RotateCw,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Terminal,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";

interface ScenarioCardInfo {
  id: string;
  name: string;
  prefix: string;
  asn: string;
  description: string;
  expectedOutcome: string;
  expectedAlerts: number;
  whyItMatters: string;
}

export const ScenariosView: React.FC = () => {
  const { runScenarioAction, seedDemoDataAction, resetDatabaseAction } = useHoraqStore();

  const [runningId, setRunningId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
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
      name: "1. Normal Route Baseline Seeding",
      prefix: "192.0.2.0/24",
      asn: "AS64496",
      description: "Injects initial announcement for TEST-NET-1 from authorized origin AS64496.",
      expectedOutcome: "Baseline created in SQLite storage. 0 alerts triggered.",
      expectedAlerts: 0,
      whyItMatters: "First observation establishes the reference baseline and must not fire spurious alerts.",
    },
    {
      id: "origin-change",
      name: "2. Origin-AS Conflict (Unauthorized Hijack)",
      prefix: "192.0.2.0/24",
      asn: "AS64511 (Rogue)",
      description: "Injects announcement for 192.0.2.0/24 with rogue origin AS64511 differing from baseline AS64496.",
      expectedOutcome: "HIGH severity alert triggered. Reference baseline preserved without poisoning.",
      expectedAlerts: 1,
      whyItMatters: "Protects against direct origin spoofing where an attacker claims an entire IP block.",
    },
    {
      id: "subprefix",
      name: "3. Subprefix Containment Hijack (/25 under /24)",
      prefix: "192.0.2.128/25",
      asn: "AS64500 (Rogue)",
      description: "Announces more-specific /25 subnet carved inside tracked parent 192.0.2.0/24.",
      expectedOutcome: "HIGH severity subprefix anomaly triggered with link to parent baseline.",
      expectedAlerts: 1,
      whyItMatters: "BGP Longest Prefix Match causes global routers to send traffic to the /25 attacker.",
    },
    {
      id: "legitimate-migration",
      name: "4. Dual-Origin Carrier Migration",
      prefix: "198.51.100.0/24",
      asn: "AS64497 → AS64498",
      description: "Route seeded under AS64497, then announced under AS64498 with maintenance metadata.",
      expectedOutcome: "Origin change detected with planned maintenance context logged.",
      expectedAlerts: 1,
      whyItMatters: "Distinguishes planned network provider migrations from uncoordinated hostile hijacks.",
    },
    {
      id: "ipv6-subprefix",
      name: "5. IPv6 Subprefix Containment (/48 under /32)",
      prefix: "2001:db8:1::/48",
      asn: "AS64505",
      description: "Announces IPv6 /48 subnet under established parent 2001:db8::/32 baseline.",
      expectedOutcome: "HIGH severity alert verifying address-family-safe subnet_of() containment.",
      expectedAlerts: 1,
      whyItMatters: "Ensures detection rules operate with mathematical accuracy across both IPv4 and IPv6.",
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
          details: res.description || "Scenario evaluated successfully against local engine.",
        },
        ...prev.slice(0, 15),
      ]);
    } finally {
      setRunningId(null);
    }
  };

  const handleRunAll = async () => {
    setRunningId("run-all");
    try {
      await handleRun("baseline");
      await handleRun("origin-change");
      await handleRun("subprefix");
    } finally {
      setRunningId(null);
    }
  };

  const handleExecuteReset = async () => {
    await resetDatabaseAction();
    setConfirmReset(false);
    setLogs((prev) => [
      {
        id: Math.random().toString(36).substring(7),
        time: new Date().toLocaleTimeString(),
        scenario: "reset",
        alerts: 0,
        expected: 0,
        status: "PASS",
        details: "Database reset to clean initial state. All alerts and baselines cleared.",
      },
      ...prev,
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-main tracking-tight">
              Scenario evaluation lab
            </h1>
            <span className="px-2 py-0.2 rounded text-[11px] font-semibold bg-bg-card border border-border-card text-brand-blue">
              Synthetic Testing
            </span>
          </div>
          <p className="text-xs text-text-sub mt-0.5">
            Deterministic synthetic BGP test suite to demonstrate and verify detection rules, baselines, and RFC 8785 evidence.
          </p>
        </div>

        {/* Global Test Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {confirmReset ? (
            <div className="flex items-center gap-1.5 p-1 rounded bg-bg-card border border-status-red">
              <span className="text-[11px] text-status-red px-1.5">Confirm reset?</span>
              <button
                onClick={handleExecuteReset}
                className="px-2 py-1 rounded bg-status-red text-white text-[11px] font-semibold cursor-pointer"
              >
                Yes, reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-2 py-1 rounded bg-bg-btn text-text-sub text-[11px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="px-3 py-1.5 rounded bg-bg-btn border border-border-card hover:border-status-red hover:text-status-red text-xs font-medium text-text-sub flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Clear all stored database records"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset database</span>
            </button>
          )}

          <button
            onClick={() => seedDemoDataAction()}
            className="px-3 py-1.5 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-text-main text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Seed reference baselines for Cloudflare, Google, and Quad9"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
            <span>Seed benchmark data</span>
          </button>

          <button
            onClick={handleRunAll}
            disabled={runningId !== null}
            className="px-3.5 py-1.5 rounded bg-brand-blue text-slate-950 hover:opacity-90 text-xs font-semibold flex items-center gap-1.5 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Play className={`w-3.5 h-3.5 ${runningId === "run-all" ? "animate-spin" : ""}`} />
            <span>{runningId === "run-all" ? "Executing..." : "Run core suite"}</span>
          </button>
        </div>
      </div>

      {/* Notice on Isolation */}
      <div className="p-3 rounded bg-bg-card border border-border-card text-xs text-text-sub flex items-start gap-2.5">
        <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>Local Execution Notice:</strong> All scenarios inject announcements strictly into the local HORA-Q detection engine. No packets or BGP routes are propagated to real Internet routers.
        </p>
      </div>

      {/* 2. Grid of 5 Structured Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {scenarios.map((sc) => {
          const isRunning = runningId === sc.id;

          return (
            <div
              key={sc.id}
              className="card-panel p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-text-main">
                    {sc.name}
                  </h3>
                  <span className="font-mono text-[10px] text-text-dim px-1.5 py-0.5 rounded bg-bg-app border border-border-card">
                    {sc.expectedAlerts === 0 ? "0 Alerts expected" : "1 Alert expected"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-text-sub">
                  <span>Prefix: <strong className="text-text-main">{sc.prefix}</strong></span>
                  <span className="text-border-card">•</span>
                  <span>Origin: <strong className="text-brand-blue">{sc.asn}</strong></span>
                </div>

                <p className="text-[11px] text-text-sub leading-relaxed">
                  {sc.description}
                </p>

                <div className="p-2.5 rounded bg-bg-app border border-border-card text-[11px] text-text-sub space-y-1">
                  <div>
                    <strong className="text-text-main">Expected result: </strong>
                    {sc.expectedOutcome}
                  </div>
                  <div>
                    <strong className="text-text-dim">Why it matters: </strong>
                    {sc.whyItMatters}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border-item flex items-center justify-end">
                <button
                  onClick={() => handleRun(sc.id)}
                  disabled={runningId !== null}
                  className="px-3 py-1.5 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-medium text-text-main flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Play className={`w-3 h-3 text-brand-blue ${isRunning ? "animate-spin" : ""}`} />
                  <span>{isRunning ? "Executing..." : "Execute scenario"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Execution Console Output */}
      {logs.length > 0 && (
        <div className="card-panel p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-main flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-brand-blue" />
              <span>Execution results history</span>
            </span>
            <button
              onClick={() => setLogs([])}
              className="text-[11px] text-text-dim hover:text-text-main cursor-pointer"
            >
              Clear log
            </button>
          </div>

          <div className="space-y-1.5 divide-y divide-border-item max-h-48 overflow-y-auto font-mono text-[11px]">
            {logs.map((log) => (
              <div key={log.id} className="pt-1.5 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-text-dim">{log.time}</span>
                    <span className="text-text-main font-semibold">{log.scenario}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        log.status === "PASS"
                          ? "bg-status-green-bg text-status-green"
                          : "bg-status-red-bg text-status-red"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <p className="text-text-sub font-sans text-xs">{log.details}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-text-sub">
                    Alerts: <strong>{log.alerts}</strong> (expected: {log.expected})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
