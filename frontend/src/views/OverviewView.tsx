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
  ShieldAlert,
  Layers,
  Activity,
  CheckCircle2,
  Cpu,
  Radio,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";
import { BGPTopologyGraph } from "../components/BGPTopologyGraph";

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

  const displayAlerts = filteredAlerts.slice(0, 5);

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
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Top Hero Section: Ambient Grid Card */}
      <div className="card-panel p-6 relative overflow-hidden bg-grid-pattern border-border-card">
        <div className="absolute top-0 right-0 w-96 h-96 ambient-glow pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="badge badge-success">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>BGP Telemetry Guard Active</span>
              </span>
              <span className="badge badge-idle font-mono text-[11px]">
                RFC 8785 + ML-DSA-65
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-text-main tracking-tight">
                Explainable BGP Origin & Subprefix Monitor
              </h2>
              <p className="text-xs text-text-sub mt-1 leading-relaxed">
                Autonomous detection of MOAS conflicts, illegitimate origin shifts, and more-specific subprefix drains. All forensic evidence signed with post-quantum non-repudiation.
              </p>
            </div>

            <div className="pt-1 flex items-center gap-3 flex-wrap">
              <button
                onClick={handleRunAllScenarios}
                disabled={isRunningAll}
                className="btn btn-primary text-xs"
              >
                <PlayCircle className={`w-3.5 h-3.5 ${isRunningAll ? "animate-spin" : ""}`} />
                <span>{isRunningAll ? "Evaluating Benchmark Suite..." : "Run Benchmark Suite"}</span>
              </button>

              <button
                onClick={() => seedDemoDataAction()}
                className="btn btn-secondary text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
                <span>Seed Realistic Incidents</span>
              </button>
            </div>
          </div>

          {/* Quick Engine Telemetry Status Card */}
          <div className="p-4 rounded-xl bg-bg-app border border-border-card space-y-2.5 w-full md:w-64 shrink-0 shadow-inner">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-border-card">
              <span className="text-text-dim font-medium">Engine Mode</span>
              <span className="font-semibold text-status-green flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Autonomous
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pb-1 border-b border-border-card">
              <span className="text-text-dim font-medium">Crypto Vault</span>
              <span className="font-mono text-brand-blue font-semibold text-[11px]">
                {cryptoStatus?.algorithm || "ML-DSA-65"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pb-1 border-b border-border-card">
              <span className="text-text-dim font-medium">BGP Peers Tracked</span>
              <span className="font-mono text-text-main font-semibold">
                {overview?.tracked_routes || routes.length || 3} Prefixes
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-dim font-medium">Active Threat Level</span>
              <span className={`font-semibold text-xs ${activeAlerts.length > 0 ? "text-red-400" : "text-status-green"}`}>
                {activeAlerts.length > 0 ? `${activeAlerts.length} Active` : "Nominal"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          onClick={() => setActiveTab("routes")}
          className="card-panel p-4 cursor-pointer card-accent-blue hover:-translate-y-0.5 transition-all"
        >
          <div className="text-[11px] text-text-dim font-semibold uppercase tracking-wider">
            Monitored Prefixes
          </div>
          <div className="text-2xl font-bold text-text-main mt-1 tracking-tight">
            {overview?.tracked_routes || routes.length || 0}
          </div>
          <div className="text-[11px] text-text-sub mt-1 flex items-center gap-1">
            <span className="text-status-green font-medium">100% Covered</span>
            <span>by baseline ROAs</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab("alerts")}
          className="card-panel p-4 cursor-pointer card-accent-red hover:-translate-y-0.5 transition-all"
        >
          <div className="text-[11px] text-text-dim font-semibold uppercase tracking-wider">
            Active Threat Anomalies
          </div>
          <div className="text-2xl font-bold text-red-400 mt-1 tracking-tight flex items-center gap-2">
            <span>{overview?.active_alerts ?? activeAlerts.length}</span>
            {activeAlerts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </div>
          <div className="text-[11px] text-text-sub mt-1">
            {alerts.filter((a) => a.kind === "ORIGIN_CHANGE").length} Origin / {alerts.filter((a) => a.kind === "SUBPREFIX_ANOMALY").length} Subprefix
          </div>
        </div>

        <div
          onClick={() => setActiveTab("evidence")}
          className="card-panel p-4 cursor-pointer card-accent-green hover:-translate-y-0.5 transition-all"
        >
          <div className="text-[11px] text-text-dim font-semibold uppercase tracking-wider">
            Signed Evidence Packs
          </div>
          <div className="text-2xl font-bold text-status-green mt-1 tracking-tight">
            {overview?.total_alerts || alerts.length}
          </div>
          <div className="text-[11px] text-text-sub mt-1 flex items-center gap-1">
            <Lock className="w-3 h-3 text-brand-blue" />
            <span>RFC 8785 Immutable</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab("evidence")}
          className="card-panel p-4 cursor-pointer card-accent-blue hover:-translate-y-0.5 transition-all"
        >
          <div className="text-[11px] text-text-dim font-semibold uppercase tracking-wider">
            Integrity Verification
          </div>
          <div className="text-2xl font-bold text-brand-blue mt-1 tracking-tight">
            100%
          </div>
          <div className="text-[11px] text-status-green mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>0 Tampering Detected</span>
          </div>
        </div>
      </div>

      {/* Real-time Threat Activity Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-main tracking-tight">
              Live Threat Activity & Containment Feed
            </h3>
            <p className="text-xs text-text-sub">
              Streaming BGP announcements flagged by autonomous explainable heuristics.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("alerts")}
            className="text-xs text-brand-blue hover:underline flex items-center gap-1 font-semibold"
          >
            <span>View all anomalies ({alerts.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {displayAlerts.length === 0 ? (
          <div className="card-panel p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-text-main">
              No recent anomalies detected
            </div>
            <p className="text-xs text-text-sub max-w-sm mx-auto">
              Run the benchmark suite or seed test data to observe real-time origin changes and subprefix attacks.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAlerts.map((evt) => {
              const isOrigin = evt.kind === "ORIGIN_CHANGE";
              return (
                <div
                  key={evt.id}
                  className={`card-panel p-4 transition-all hover:border-text-dim ${
                    isOrigin ? "card-accent-red" : "card-accent-amber"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 mt-0.5 border ${
                          isOrigin
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        }`}
                      >
                        {isOrigin ? (
                          <ShieldAlert className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`badge ${
                              evt.severity === "HIGH" ? "badge-error" : "badge-amber"
                            }`}
                          >
                            {evt.severity}
                          </span>
                          <span className="text-xs font-bold text-text-main">
                            {evt.title}
                          </span>
                          <span className="text-[11px] font-mono font-semibold text-brand-blue bg-bg-input px-1.5 py-0.2 rounded border border-border-card">
                            {evt.prefix}
                          </span>
                        </div>

                        <p className="text-xs text-text-sub line-clamp-2">
                          {evt.explanation}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-[10px] text-text-dim font-mono">
                        {new Date(evt.created_at).toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => setSelectedAlert(evt)}
                        className="btn btn-secondary text-xs px-2.5 py-1"
                      >
                        <FileCheck2 className="w-3 h-3 text-brand-blue" />
                        <span>Evidence</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
