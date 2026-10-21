import React from "react";
import {
  Shield,
  RefreshCw,
  AlertTriangle,
  PlayCircle,
  FileCheck2,
  ExternalLink,
  Lock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";

export const OverviewView: React.FC = () => {
  const {
    overview,
    alerts,
    routes,
    cryptoStatus,
    fetchAllData,
    isLoading,
    setActiveTab,
    setSelectedAlert,
    runScenarioAction,
    seedDemoDataAction,
    searchQuery,
  } = useHoraqStore();

  const activeAlerts = alerts.filter((a) => a.status === "ACTIVE");

  // Filter live activity by searchQuery if provided
  const filteredAlerts = alerts.filter((evt) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      evt.prefix.toLowerCase().includes(q) ||
      evt.observed_asn.toLowerCase().includes(q) ||
      (evt.baseline_asn && evt.baseline_asn.toLowerCase().includes(q)) ||
      evt.title.toLowerCase().includes(q)
    );
  });

  const displayAlerts = filteredAlerts.slice(0, 7);

  const [isRunningAll, setIsRunningAll] = React.useState(false);

  const handleRunAllScenarios = async () => {
    setIsRunningAll(true);
    try {
      await runScenarioAction("run-all");
    } finally {
      setIsRunningAll(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Section: Hero + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Hero Card */}
        <div className="md:col-span-7 space-y-3">
          <div className="text-status-green flex items-center gap-2">
            <Shield className="w-8 h-8 stroke-[2.2]" />
            {activeAlerts.length > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                Action Required
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-main tracking-tight">
              BGP Guard Active
            </h2>
            <p className="text-xs text-text-sub mt-1 leading-relaxed">
              Real-time origin-AS and subprefix containment monitor. Enforces
              RFC 8785 canonical evidence with ML-DSA-65 post-quantum non-repudiation.
              {activeAlerts.length > 0
                ? ` ${activeAlerts.length} anomaly incidents require attention.`
                : " All tracked prefixes operating within baseline boundaries."}
            </p>
          </div>

          <div className="pt-1 flex items-center gap-3 flex-wrap">
            <button
              onClick={handleRunAllScenarios}
              disabled={isRunningAll}
              className="px-4 py-2 rounded-lg bg-brand-blue text-slate-950 hover:bg-sky-400 text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <PlayCircle
                className={`w-3.5 h-3.5 ${
                  isRunningAll ? "animate-spin" : ""
                }`}
              />
              <span>{isRunningAll ? "Evaluating Suite..." : "Run Benchmark Suite"}</span>
            </button>

            <button
              onClick={() => seedDemoDataAction()}
              className="px-3 py-2 rounded-lg bg-bg-btn border border-border-card text-xs font-semibold text-text-main hover:bg-bg-nav-hover hover:border-text-dim transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
              <span>Seed Demo Data</span>
            </button>

            <button
              onClick={() => fetchAllData()}
              disabled={isLoading}
              className="px-3 py-2 rounded-lg bg-bg-app border border-border-card text-xs font-medium text-text-sub hover:text-text-main transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Right Stats Grid (Interactive Cards) */}
        <div className="md:col-span-5 grid grid-cols-2 gap-y-4 gap-x-4">
          <div
            onClick={() => setActiveTab("routes")}
            className="p-3 rounded-xl bg-bg-card border border-border-card hover:border-brand-blue/50 transition-colors cursor-pointer"
            title="Click to view tracked baselines"
          >
            <div className="text-xs text-text-sub">Tracked Baselines</div>
            <div className="text-2xl font-bold text-text-main mt-0.5">
              {overview?.tracked_routes ?? routes.length}
            </div>
            <span className="text-[10px] text-brand-blue flex items-center gap-1 mt-1">
              <span>View routes</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>

          <div className="p-3 rounded-xl bg-bg-card border border-border-card">
            <div className="text-xs text-text-sub">Total Observations</div>
            <div className="text-2xl font-bold text-text-main mt-0.5">
              {overview?.total_observations ?? 0}
            </div>
            <span className="text-[10px] text-text-dim block mt-1">
              Zero-Trust BGP log
            </span>
          </div>

          <div
            onClick={() => setActiveTab("alerts")}
            className={`p-3 rounded-xl border transition-colors cursor-pointer ${
              activeAlerts.length > 0
                ? "bg-red-500/5 border-red-500/30 hover:border-red-500/60"
                : "bg-bg-card border-border-card hover:border-status-green"
            }`}
            title="Click to view alerts"
          >
            <div className="text-xs text-text-sub">Active Anomalies</div>
            <div
              className={`text-2xl font-bold mt-0.5 ${
                activeAlerts.length > 0 ? "text-red-500" : "text-status-green"
              }`}
            >
              {activeAlerts.length}
            </div>
            <span
              className={`text-[10px] flex items-center gap-1 mt-1 ${
                activeAlerts.length > 0 ? "text-red-400 font-semibold" : "text-text-dim"
              }`}
            >
              <span>{activeAlerts.length > 0 ? "Triage alerts" : "All clean"}</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>

          <div
            onClick={() => setActiveTab("evidence")}
            className="p-3 rounded-xl bg-bg-card border border-border-card hover:border-brand-blue/50 transition-colors cursor-pointer"
            title="Click to inspect evidence vault"
          >
            <div className="text-xs text-text-sub">Post-Quantum Signer</div>
            <div className="text-2xl font-bold text-brand-blue mt-0.5 text-base truncate">
              {cryptoStatus?.algorithm || "ML-DSA-65"}
            </div>
            <span className="text-[10px] text-brand-blue flex items-center gap-1 mt-1">
              <span>Inspect vault</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Live Activity Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-main">
              Live BGP Route Activity
            </h3>
            {searchQuery && (
              <span className="text-xs text-brand-blue font-medium">
                (Filtered by "{searchQuery}")
              </span>
            )}
          </div>
          <button
            onClick={() => setActiveTab("alerts")}
            className="text-xs text-brand-blue hover:underline flex items-center gap-1"
          >
            <span>View all anomalies ({alerts.length})</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="card-panel overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 text-xs text-text-dim font-medium px-4 py-2.5 border-b border-border-card">
            <span className="col-span-2">Time</span>
            <span className="col-span-3">Target Prefix</span>
            <span className="col-span-2">Observed Origin</span>
            <span className="col-span-3">Incident Classification</span>
            <span className="col-span-2 text-right">Evidence</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-border-item">
            {displayAlerts.length === 0 ? (
              <div className="px-4 py-10 text-center space-y-3">
                <p className="text-xs text-text-sub">
                  No matching route activity recorded.
                </p>
                <button
                  onClick={() => seedDemoDataAction()}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-brand-blue text-xs font-semibold hover:bg-sky-500/20 transition-colors inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Seed Realistic Demo Scenarios</span>
                </button>
              </div>
            ) : (
              displayAlerts.map((evt) => {
                const isOrigin = evt.kind === "ORIGIN_CHANGE";
                const isHigh = evt.severity === "HIGH";
                const timeStr = evt.created_at
                  ? new Date(evt.created_at).toLocaleTimeString()
                  : "Just now";

                return (
                  <div
                    key={evt.id}
                    className={`grid grid-cols-12 items-center px-4 py-3 text-xs transition-colors ${
                      isHigh
                        ? "bg-status-red-bg border-y border-red-500/20"
                        : "hover:bg-bg-hover-row"
                    }`}
                  >
                    <span className="col-span-2 text-text-main font-mono text-[11px]">
                      {timeStr}
                    </span>
                    <span className="col-span-3 font-mono font-semibold text-text-main">
                      {evt.prefix}
                    </span>
                    <span className="col-span-2 text-text-sub font-mono">
                      <span className="font-semibold text-text-main">
                        {evt.observed_asn}
                      </span>
                      {evt.baseline_asn && (
                        <span className="text-[10px] text-text-dim block">
                          Base: {evt.baseline_asn}
                        </span>
                      )}
                    </span>
                    <span className="col-span-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isOrigin
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>
                          {isOrigin ? "Origin Conflict" : "Subprefix Hijack"}
                        </span>
                      </span>
                    </span>
                    <div className="col-span-2 text-right">
                      <button
                        onClick={() => setSelectedAlert(evt)}
                        className="px-2.5 py-1 rounded-md bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-text-sub hover:text-text-main text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                        title="Inspect forensic evidence"
                      >
                        <FileCheck2 className="w-3 h-3 text-brand-blue" />
                        <span>Inspect</span>
                      </button>
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
              const evtTime = evt.created_at
                ? new Date(evt.created_at).getTime()
                : Date.now();
              const now = Date.now();
              const hoursAgo = (now - evtTime) / (1000 * 60 * 60);
              const pct = Math.max(0, Math.min(100, 100 - (hoursAgo / 24) * 100));
              const isHigh = evt.severity === "HIGH";
              const dotColor = isHigh ? "bg-red-500" : "bg-amber-500";
              return (
                <div
                  key={idx}
                  className={`absolute w-2.5 h-2.5 rounded-full ${dotColor} -translate-x-1/2 cursor-pointer hover:scale-150 transition-transform`}
                  style={{ left: `${pct}%` }}
                  title={`${evt.prefix} — ${evt.title}`}
                  onClick={() => setSelectedAlert(evt)}
                />
              );
            })}
          </div>
          <span>now</span>
        </div>
      </div>

      {/* Post-Quantum & Standards Security Ribbon */}
      <div className="card-panel p-4 flex items-center justify-between text-xs text-text-sub">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-brand-blue shrink-0" />
          <span>
            <strong className="text-text-main font-semibold">Post-Quantum Cryptography: </strong>
            Evidence signed using ML-DSA-65 (NIST FIPS 204). Deterministic RFC 8785 Canonical JSON hashes guaranteed tamper-evident.
          </span>
        </div>
        <button
          onClick={() => setActiveTab("evidence")}
          className="text-brand-blue hover:underline shrink-0 ml-4 font-semibold"
        >
          Inspect Vault →
        </button>
      </div>
    </div>
  );
};
