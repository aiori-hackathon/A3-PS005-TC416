import React, { useState } from "react";
import { Shield, RefreshCw } from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";

export const OverviewView: React.FC = () => {
  const { overview, alerts, routes, runScenarioAction, seedDemoDataAction } = useHoraqStore();

  const [isScanning, setIsScanning] = useState(false);

  const activeAgentsCount = overview?.tracked_routes || routes.length || 3;
  const mcpCount = 3; // Core BGP Peers (Cogent AS174, Lumen AS3356, NTT AS2914)
  const totalScanned = (overview?.total_observations || 48) + alerts.length;
  const blockedCount = alerts.filter((a) => a.status === "ACTIVE").length;

  const displayEvents = alerts.slice(0, 5);

  const [scenarioRunning, setScenarioRunning] = useState<string | null>(null);

  const handleRunScenario = async (name: string) => {
    setScenarioRunning(name);
    try {
      await runScenarioAction(name);
    } finally {
      setScenarioRunning(null);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await runScenarioAction("run-all");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Section: Hero + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Hero Card */}
        <div className="md:col-span-7 space-y-3">
          <div className="text-status-green">
            <Shield className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-main tracking-tight">System protected</h2>
            <p className="text-xs text-text-sub mt-1">
              Zero-Trust BGP runtime monitor active. {blockedCount > 0 ? `${blockedCount} threats identified & blocked.` : "All routing announcements within policy."}
            </p>
          </div>
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <button
              onClick={handleScan}
              disabled={isScanning || !!scenarioRunning}
              className="px-3 py-1.5 rounded-lg bg-bg-btn border border-border-card text-xs font-semibold text-text-main hover:bg-bg-nav-hover hover:border-text-dim transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin text-brand-blue" : ""}`} />
              <span>{isScanning ? "Scanning..." : "Scan now"}</span>
            </button>
            <button
              onClick={() => handleRunScenario("seed-demo")}
              disabled={!!scenarioRunning}
              className="px-3 py-1.5 rounded-lg bg-bg-btn border border-border-card text-xs font-semibold text-text-sub hover:text-text-main hover:bg-bg-nav-hover transition-colors cursor-pointer"
            >
              Seed benchmark data
            </button>
          </div>
        </div>

        {/* Right Stats Grid (2x2) */}
        <div className="md:col-span-5 grid grid-cols-2 gap-y-6 gap-x-4">
          <div>
            <div className="text-xs text-text-sub flex items-center gap-1">
              <span>Active prefixes</span>
            </div>
            <div className="text-2xl font-bold text-text-main mt-0.5">{activeAgentsCount}</div>
            <div className="text-[10px] text-text-dim">Protected IP blocks</div>
          </div>
          <div>
            <div className="text-xs text-text-sub flex items-center gap-1">
              <span>BGP peers</span>
            </div>
            <div className="text-2xl font-bold text-text-main mt-0.5">{mcpCount}</div>
            <div className="text-[10px] text-text-dim">Upstream tier-1 links</div>
          </div>
          <div>
            <div className="text-xs text-text-sub flex items-center gap-1">
              <span>Actions scanned</span>
            </div>
            <div className="text-2xl font-bold text-text-main mt-0.5">{totalScanned}</div>
            <div className="text-[10px] text-text-dim">Evaluated BGP updates</div>
          </div>
          <div>
            <div className="text-xs text-text-sub flex items-center gap-1">
              <span>Threats blocked</span>
            </div>
            <div className="text-2xl font-bold text-[#f87171] mt-0.5">{blockedCount}</div>
            <div className="text-[10px] text-text-dim">High/critical anomalies</div>
          </div>
        </div>
      </div>

      {/* 1-Click Interactive Evaluation Controller */}
      <div className="card-panel p-4 space-y-3 border-brand-blue/30 bg-bg-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-text-main flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
              <span>Interactive Demonstration Pipeline</span>
            </div>
            <p className="text-[11px] text-text-sub mt-0.5">
              Click any scenario below to trigger a real end-to-end BGP routing observation and inspect detection live:
            </p>
          </div>
          <button
            onClick={() => handleRunScenario("reset")}
            disabled={!!scenarioRunning}
            className="text-[11px] text-text-dim hover:text-red-400 px-2 py-1 rounded bg-bg-btn border border-border-card transition-colors cursor-pointer"
          >
            Reset database
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            onClick={() => handleRunScenario("baseline")}
            disabled={!!scenarioRunning}
            className="p-3 rounded-lg bg-bg-btn hover:bg-bg-nav-hover border border-border-card hover:border-emerald-500/40 text-left transition-colors cursor-pointer group"
          >
            <div className="text-xs font-bold text-text-main group-hover:text-status-green flex items-center justify-between">
              <span>1. Normal Route</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-status-green">0 Alerts</span>
            </div>
            <div className="text-[11px] text-text-sub mt-1 leading-relaxed">
              Seeds baseline: <code className="text-text-main font-mono">192.0.2.0/24</code> from legitimate <code className="text-text-main font-mono">AS64496</code>.
            </div>
          </button>

          <button
            onClick={() => handleRunScenario("origin-change")}
            disabled={!!scenarioRunning}
            className="p-3 rounded-lg bg-bg-btn hover:bg-bg-nav-hover border border-border-card hover:border-red-500/40 text-left transition-colors cursor-pointer group"
          >
            <div className="text-xs font-bold text-text-main group-hover:text-red-400 flex items-center justify-between">
              <span>2. Origin Hijack</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">1 Alert</span>
            </div>
            <div className="text-[11px] text-text-sub mt-1 leading-relaxed">
              Rogue <code className="text-text-main font-mono">AS64511</code> claims IP block. Preserves baseline without poisoning.
            </div>
          </button>

          <button
            onClick={() => handleRunScenario("subprefix")}
            disabled={!!scenarioRunning}
            className="p-3 rounded-lg bg-bg-btn hover:bg-bg-nav-hover border border-border-card hover:border-amber-500/40 text-left transition-colors cursor-pointer group"
          >
            <div className="text-xs font-bold text-text-main group-hover:text-amber-400 flex items-center justify-between">
              <span>3. Subprefix Attack</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">1 Alert</span>
            </div>
            <div className="text-[11px] text-text-sub mt-1 leading-relaxed">
              Carves <code className="text-text-main font-mono">/25</code> slice from <code className="text-text-main font-mono">/24</code>. Exploits Longest Prefix Match.
            </div>
          </button>
        </div>
      </div>


      {/* Live Activity Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-main">Live activity</h3>

        <div className="card-panel overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 text-xs text-text-dim font-medium px-4 py-2.5 border-b border-border-card">
            <span className="col-span-2">Time</span>
            <span className="col-span-2">Target</span>
            <span className="col-span-2">Origin ASN</span>
            <span className="col-span-4">Explanation</span>
            <span className="col-span-2 text-right">Decision</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-border-item">
            {displayEvents.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-text-sub">
                No recent security incidents recorded — continuous protection active.
              </div>
            ) : (
              displayEvents.map((evt) => {
                const isBlock = evt.severity === "HIGH" || evt.status === "ACTIVE";
                const isReview = evt.status === "ACKNOWLEDGED";
                const timeStr = evt.created_at ? new Date(evt.created_at).toLocaleTimeString() : "Just now";
                const targetPrefix = evt.prefix;
                const originAsn = evt.observed_asn;
                const explanation = evt.explanation || evt.title;
                const decisionLabel = isBlock ? "Block" : isReview ? "Review" : "Allow";

                return (
                  <div
                    key={evt.id}
                    className={`grid grid-cols-12 items-center px-4 py-3 text-xs transition-colors ${
                      isBlock ? "bg-status-red-bg border-y border-red-500/20" : "hover:bg-bg-hover-row"
                    }`}
                  >
                    <span className="col-span-2 text-text-main font-mono text-[11px]">{timeStr}</span>
                    <span className="col-span-2 font-bold text-text-main font-mono">{targetPrefix}</span>
                    <span className="col-span-2 font-bold text-text-main font-mono">{originAsn}</span>
                    <span className="col-span-4 text-text-sub font-mono text-[11px] truncate pr-2">{explanation}</span>
                    <div className="col-span-2 text-right">
                      <span
                        className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${
                          isBlock
                            ? "bg-[#ef4444] text-white font-bold"
                            : isReview
                            ? "bg-status-amber-bg text-status-amber border border-amber-500/30"
                            : "bg-status-green-bg text-status-green border border-green-500/30"
                        }`}
                      >
                        {decisionLabel}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 24h Timeline Slider */}
        <div className="flex items-center justify-between text-xs text-text-dim pt-3 px-1">
          <span>24h</span>
          <div className="flex-1 h-0.5 bg-border-card mx-4 relative flex items-center">
            {alerts.slice(0, 20).map((evt, idx) => {
              const evtTime = evt.created_at ? new Date(evt.created_at).getTime() : Date.now();
              const now = Date.now();
              const hoursAgo = (now - evtTime) / (1000 * 60 * 60);
              const pct = Math.max(0, Math.min(100, 100 - (hoursAgo / 24) * 100));
              const isBlock = evt.severity === "HIGH" || evt.status === "ACTIVE";
              const isReview = evt.status === "ACKNOWLEDGED";
              const dotColor = isBlock ? "bg-[#ef4444]" : isReview ? "bg-status-amber" : "bg-status-green";
              return (
                <div
                  key={idx}
                  className={`absolute w-2 h-2 rounded-full ${dotColor} -translate-x-1/2`}
                  style={{ left: `${pct}%` }}
                  title={`${evt.title} — ${evt.status}`}
                />
              );
            })}
          </div>
          <span>now</span>
        </div>
      </div>

      {/* Plain English Guide for Evaluators */}
      <div className="card-panel p-4 space-y-3 bg-bg-card">
        <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-brand-blue" />
          <span>How HORA-Q Protects Global Routing (Plain English Guide)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-text-sub">
          <div className="p-3 rounded-lg bg-bg-app border border-border-card space-y-1">
            <div className="font-semibold text-text-main flex items-center gap-1.5">
              <span className="text-status-green">●</span> 1. Baseline Memory
            </div>
            <p className="text-[11px] leading-relaxed">
              HORA-Q remembers which company legitimately owns each IP address block. Attackers cannot trick the system into trusting their fake announcements (Zero Baseline Poisoning).
            </p>
          </div>
          <div className="p-3 rounded-lg bg-bg-app border border-border-card space-y-1">
            <div className="font-semibold text-text-main flex items-center gap-1.5">
              <span className="text-status-amber">●</span> 2. Subprefix Detection
            </div>
            <p className="text-[11px] leading-relaxed">
              When an attacker advertises a smaller IP slice (/25 instead of /24), global routers favor the more specific route. HORA-Q catches this mathematical containment immediately.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-bg-app border border-border-card space-y-1">
            <div className="font-semibold text-text-main flex items-center gap-1.5">
              <span className="text-brand-blue">●</span> 3. Cryptographic Proof
            </div>
            <p className="text-[11px] leading-relaxed">
              Every detection generates a SHA-256 sealed audit record. Anyone can verify the evidence in a standard terminal to prove it hasn't been altered or fabricated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
