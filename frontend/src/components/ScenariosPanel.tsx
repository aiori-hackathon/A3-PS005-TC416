import React, { useState } from "react";
import { Play, CheckCircle2, RotateCcw, Terminal, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { api } from "../api";

interface ScenariosPanelProps {
  onScenarioCompleted: () => void;
}

export const ScenariosPanel: React.FC<ScenariosPanelProps> = ({ onScenarioCompleted }) => {
  const [running, setRunning] = useState<string | null>(null);
  const [scenarioLog, setScenarioLog] = useState<Array<{ name: string; time: string; msg: string; status: "success" | "alert" | "error" }>>([]);

  const executeScenario = async (name: string, label: string) => {
    setRunning(name);
    try {
      const res = await api.runScenario(name);
      const now = new Date().toLocaleTimeString();
      let status: "success" | "alert" = "success";
      let msg = res.description;

      if (res.alerts_generated > 0) {
        status = "alert";
        msg += ` ➜ Generated ${res.alerts_generated} alert(s)!`;
      } else {
        msg += " ➜ Seeding successful (0 alerts, baseline established).";
      }

      setScenarioLog((prev) => [{ name: label, time: now, msg, status }, ...prev.slice(0, 9)]);
      onScenarioCompleted();
    } catch (err: any) {
      const now = new Date().toLocaleTimeString();
      setScenarioLog((prev) => [
        { name: label, time: now, msg: `Failed: ${err.message}`, status: "error" },
        ...prev.slice(0, 9),
      ]);
    } finally {
      setRunning(null);
    }
  };

  const scenarios = [
    {
      id: "baseline",
      label: "1. Baseline Route Seeding",
      prefix: "192.0.2.0/24",
      asn: "AS64496",
      desc: "Establishes reference origin baseline for TEST-NET-1. Verifies that initial observation creates route without false alerts.",
      expected: "0 Alerts (Seeding)",
      expectedBadge: "badge-valid",
    },
    {
      id: "origin-change",
      label: "2. Origin-AS Hijack / Conflict",
      prefix: "192.0.2.0/24",
      asn: "AS64511",
      desc: "Announces conflicting origin ASN for previously tracked baseline. Detector flags difference and protects baseline against silent overwrite.",
      expected: "1 Origin Conflict",
      expectedBadge: "badge-high",
    },
    {
      id: "subprefix",
      label: "3. Subprefix / More-Specific Anomaly",
      prefix: "192.0.2.128/25",
      asn: "AS64500",
      desc: "Announces strict subnet /25 inside parent /24. Longest-prefix match in BGP gives this child precedence. Triggers subprefix alert.",
      expected: "1 Subprefix Anomaly",
      expectedBadge: "badge-high",
    },
    {
      id: "legitimate-migration",
      label: "4. Tagged Provider Migration",
      prefix: "198.51.100.0/24",
      asn: "AS64497 ➜ AS64498",
      desc: "Simulates planned datacenter provider migration. Detector alerts on origin change while transparently preserving change-ticket context.",
      expected: "1 Explainable Alert",
      expectedBadge: "badge-medium",
    },
    {
      id: "ipv6-subprefix",
      label: "5. Dual-Stack IPv6 Subprefix Anomaly",
      prefix: "2001:db8:1::/48",
      asn: "AS64505 (under /32)",
      desc: "Validates dual-stack IPv6 address family isolation and strict subnet matching across IPv6 prefixes.",
      expected: "1 IPv6 Anomaly",
      expectedBadge: "badge-high",
    },
    {
      id: "reset",
      label: "6. Purge & Reset Test Environment",
      prefix: "Clear All Tables",
      asn: "N/A",
      desc: "Purges observations, baselines, alerts, and evidence for an exact, repeatable test walkthrough.",
      expected: "Clean Reset",
      expectedBadge: "badge-unknown",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.01em", marginBottom: "0.25rem" }}>
          Synthetic Scenarios & Controlled Evaluation
        </h2>
        <p style={{ color: "var(--text-sub)", fontSize: "0.82rem" }}>
          Execute reproducible anomaly sequences specified in Document 21 to test baseline seeding,
          origin discrepancy rules, and subprefix containment without waiting for live external incidents.
        </p>
      </div>

      {/* Grid of Scenarios */}
      <div className="scenarios-grid">
        {scenarios.map((sc) => {
          const isCurrentRunning = running === sc.id;
          return (
            <div key={sc.id} className="scenario-card">
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#f8fafc" }}>
                    {sc.label}
                  </span>
                  <span className={`badge ${sc.expectedBadge}`}>{sc.expected}</span>
                </div>
                <div style={{ display: "flex", gap: "0.45rem", marginBottom: "0.75rem", fontSize: "0.75rem" }}>
                  <span className="mono-text" style={{ color: "var(--brand-cyan)", background: "rgba(0, 212, 170, 0.08)", border: "1px solid rgba(0, 212, 170, 0.2)", padding: "2px 7px", borderRadius: "4px", fontWeight: 700 }}>
                    {sc.prefix}
                  </span>
                  <span className="mono-text" style={{ color: "#cbd5e1", background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--border-item)", padding: "2px 7px", borderRadius: "4px" }}>
                    {sc.asn}
                  </span>
                </div>
                <p style={{ color: "var(--text-dim)", fontSize: "0.8rem", lineHeight: "1.45" }}>
                  {sc.desc}
                </p>
              </div>

              <button
                className={`btn ${sc.id === "reset" ? "btn-secondary" : "btn-primary"}`}
                style={{ width: "100%", fontSize: "0.82rem", marginTop: "0.5rem" }}
                onClick={() => executeScenario(sc.id, sc.label)}
                disabled={Boolean(running)}
              >
                {sc.id === "reset" ? <RotateCcw size={14} /> : <Play size={14} />}
                {isCurrentRunning ? "Executing..." : `Run Scenario`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Console Terminal Execution Output */}
      {scenarioLog.length > 0 && (
        <div className="card" style={{ background: "#0a0d14", border: "1px solid var(--border-card)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Terminal size={15} color="var(--brand-cyan)" />
            <h3 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-sub)" }}>
              Scenario Execution Telemetry
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {scenarioLog.map((log, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.45rem 0.75rem",
                  background: "rgba(255, 255, 255, 0.015)",
                  border: "1px solid var(--border-item)",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span className="mono-text" style={{ color: "var(--text-dim)", fontSize: "0.72rem" }}>
                    [{log.time}]
                  </span>
                  <span style={{ fontWeight: 700, color: "#e2e8f0" }}>{log.name}:</span>
                  <span style={{ color: log.status === "alert" ? "var(--badge-red-text)" : log.status === "error" ? "#f43f5e" : "var(--badge-green-text)", fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
                    {log.msg}
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
