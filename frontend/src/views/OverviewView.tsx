import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Globe,
  Radio,
  Sparkles,
  Layers,
  Activity,
  Server,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";
import { groupAlertObservations, GroupedIncident } from "../utils/incidentGrouping";

export const OverviewView: React.FC = () => {
  const {
    overview,
    alerts,
    routes,
    setActiveTab,
    setSelectedAlert,
  } = useHoraqStore();

  // Group raw alert observations into distinct routing incidents
  const groupedIncidents = groupAlertObservations(alerts);
  const activeIncidents = groupedIncidents.filter((g) => g.status === "ACTIVE");
  const topIncident = activeIncidents[0] || null;

  const prefixesTracked = overview?.tracked_routes || routes.length || 0;
  const updatesEvaluated = (overview?.total_observations || 0) + alerts.length;
  const connectedPeers = "3 Tier-1";

  // Display top 6 distinct incidents in recent history
  const recentIncidents = groupedIncidents.slice(0, 6);

  const getAlertHeadline = (incident: GroupedIncident | null) => {
    if (!incident) return "Zero unresolved anomalies";
    if (incident.kind === "ORIGIN_CHANGE") {
      return "Origin conflict requires operator review";
    }
    if (incident.kind === "SUBPREFIX_ANOMALY") {
      return "Subprefix anomaly requires operator review";
    }
    return incident.title || "Routing anomaly requires review";
  };

  const getAlertDescription = (incident: GroupedIncident | null) => {
    if (!incident) {
      return "No active routing conflicts require operator attention. Monitored prefixes match established routing policies.";
    }
    if (incident.kind === "ORIGIN_CHANGE") {
      return `Prefix ${incident.prefix} was observed announced by origin ${incident.observed_asn}, conflicting with reference baseline ${incident.baseline_asn || "unauthorized"}.`;
    }
    if (incident.kind === "SUBPREFIX_ANOMALY") {
      return `More-specific prefix ${incident.prefix} announced by ${incident.observed_asn} overlaps established baseline route ${incident.parent_prefix || "parent prefix"}.`;
    }
    return incident.explanation || incident.title;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-7 animate-fadeIn">
      {/* 1. Page Header & Single Runtime State Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-card">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            Routing overview
          </h1>
          <p className="text-xs sm:text-sm text-text-sub mt-0.5 max-w-xl leading-relaxed">
            Continuous BGP origin and subprefix anomaly monitoring with explainable cryptographic evidence.
          </p>
        </div>

        {/* Runtime State Indicator — Single, Truthful */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-card border border-border-card text-xs text-text-sub shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-status-green animate-pulse" />
            <span className="font-semibold text-text-main">Evaluation Replay</span>
            <span className="text-text-dim">•</span>
            <span className="text-text-dim text-[11px]">RIPE RIS Telemetry</span>
          </div>
        </div>
      </div>

      {/* 2. Prominent Operational Condition Callout */}
      {topIncident ? (
        <div className="card-panel p-5 sm:p-6 border-red-500/30 aurora-critical-glow relative overflow-hidden transition-all">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-500/15 text-status-red border border-red-500/30">
                  <AlertTriangle className="w-3 h-3" />
                  {topIncident.severity} Alert
                </span>
                <span className="font-mono text-xs font-bold text-text-main px-2 py-0.5 rounded bg-bg-interactive border border-border-card">
                  {topIncident.prefix}
                </span>
                {topIncident.occurrenceCount > 1 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-bg-interactive text-text-sub border border-border-card">
                    <Layers className="w-3 h-3 text-brand-blue" />
                    {topIncident.occurrenceCount} observations
                  </span>
                )}
                <span className="text-xs text-text-dim font-mono">
                  {topIncident.lastSeen
                    ? new Date(topIncident.lastSeen).toLocaleTimeString()
                    : "Recent observation"}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-text-main tracking-tight">
                {getAlertHeadline(topIncident)}
              </h2>

              <p className="text-xs sm:text-sm text-text-sub max-w-2xl leading-relaxed">
                {getAlertDescription(topIncident)}
              </p>

              {activeIncidents.length > 1 && (
                <div className="text-xs text-brand-blue pt-1 font-medium flex items-center gap-1">
                  <span>+ {activeIncidents.length - 1} additional active anomaly requires review</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0 pt-1 sm:pt-0">
              <button
                onClick={() => {
                  setSelectedAlert(topIncident.primaryAlert);
                  setActiveTab("alerts");
                }}
                className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98] shadow-xs"
              >
                <span>Review incident</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-panel p-5 sm:p-6 border-emerald-500/30 aurora-success-glow flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-status-green-bg border border-emerald-500/35 text-status-green flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-text-main flex items-center gap-2">
              <span>Zero unresolved anomalies</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-status-green-bg text-status-green border border-emerald-500/30">
                Healthy
              </span>
            </h2>
            <p className="text-xs text-text-sub leading-relaxed">
              No active routing conflicts require operator attention. Monitored prefixes match established routing policies. Historical acknowledged and resolved events are logged below.
            </p>
          </div>
        </div>
      )}

      {/* 3. Compact Operational Metric System — Unified Strip with Clean Dividers */}
      <div className="card-panel overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border-card">
          {/* Metric 1: Active Anomalies */}
          <div className="p-4 sm:p-5 space-y-1.5">
            <div className="text-xs font-medium text-text-sub flex items-center justify-between">
              <span>Active anomalies</span>
              <Activity className={`w-3.5 h-3.5 ${activeIncidents.length > 0 ? "text-status-red" : "text-status-green"}`} />
            </div>
            <div
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
                activeIncidents.length > 0 ? "text-status-red" : "text-text-main"
              }`}
            >
              {activeIncidents.length}
            </div>
            <div className="text-[11px] text-text-dim">
              {activeIncidents.length > 0 ? "Requires review" : "Routing state normal"}
            </div>
          </div>

          {/* Metric 2: Prefixes Tracked */}
          <div className="p-4 sm:p-5 space-y-1.5">
            <div className="text-xs font-medium text-text-sub flex items-center justify-between">
              <span>Prefixes tracked</span>
              <Globe className="w-3.5 h-3.5 text-text-dim" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight font-mono">
              {prefixesTracked}
            </div>
            <div className="text-[11px] text-text-dim">
              Established baselines
            </div>
          </div>

          {/* Metric 3: Updates Evaluated */}
          <div className="p-4 sm:p-5 space-y-1.5">
            <div className="text-xs font-medium text-text-sub flex items-center justify-between">
              <span>Updates evaluated</span>
              <Radio className="w-3.5 h-3.5 text-text-dim" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight font-mono">
              {updatesEvaluated}
            </div>
            <div className="text-[11px] text-text-dim">
              Normalized BGP updates
            </div>
          </div>

          {/* Metric 4: Connected Peers */}
          <div className="p-4 sm:p-5 space-y-1.5">
            <div className="text-xs font-medium text-text-sub flex items-center justify-between">
              <span>Connected peers</span>
              <Server className="w-3.5 h-3.5 text-text-dim" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight font-mono">
              {connectedPeers}
            </div>
            <div className="text-[11px] text-text-dim">
              RIPE RIS collectors
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Incidents Ledger */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-text-main">
              Recent incident ledger
            </h2>
            <p className="text-xs text-text-sub mt-0.5">
              Chronological log of routing evaluations, deduplicated by incident with occurrence counts.
            </p>
          </div>
          {recentIncidents.length > 0 && (
            <button
              onClick={() => setActiveTab("alerts")}
              className="text-xs text-brand-blue hover:text-blue-400 transition-colors flex items-center gap-1 cursor-pointer font-semibold shrink-0 ml-2"
            >
              <span>View all alerts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="card-panel overflow-hidden border-border-card">
          {/* Desktop Table Header */}
          <div className="hidden sm:grid grid-cols-12 text-[11px] text-text-dim font-bold uppercase tracking-wider px-4 py-3 bg-bg-app border-b border-border-card">
            <span className="col-span-2">Time</span>
            <span className="col-span-3">Prefix & Count</span>
            <span className="col-span-2">Observed Origin</span>
            <span className="col-span-2">Baseline</span>
            <span className="col-span-3 text-right">Lifecycle Status</span>
          </div>

          <div className="hidden sm:block divide-y divide-border-item">
            {recentIncidents.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-text-sub">
                No routing incidents recorded — continuous baseline monitoring active.
              </div>
            ) : (
              recentIncidents.map((inc) => {
                const isActive = inc.status === "ACTIVE";
                const isAck = inc.status === "ACKNOWLEDGED";
                const timeStr = inc.lastSeen
                  ? new Date(inc.lastSeen).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "Just now";

                return (
                  <div
                    key={inc.id}
                    onClick={() => {
                      setSelectedAlert(inc.primaryAlert);
                      setActiveTab("alerts");
                    }}
                    className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-bg-hover-row transition-colors cursor-pointer group"
                  >
                    <span className="col-span-2 text-text-sub font-mono text-[11px]">
                      {timeStr}
                    </span>
                    <div className="col-span-3 flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-text-main group-hover:text-brand-blue transition-colors">
                        {inc.prefix}
                      </span>
                      {inc.occurrenceCount > 1 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-bg-interactive text-text-sub border border-border-card">
                          ×{inc.occurrenceCount}
                        </span>
                      )}
                    </div>
                    <span className="col-span-2 font-mono text-xs font-semibold text-status-red">
                      {inc.observed_asn}
                    </span>
                    <span className="col-span-2 font-mono text-xs text-text-sub">
                      {inc.baseline_asn || "None (Rogue)"}
                    </span>
                    <div className="col-span-3 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          isActive
                            ? "bg-status-red-bg text-status-red border border-red-500/35"
                            : isAck
                            ? "bg-bg-interactive text-text-sub border border-border-card"
                            : "bg-status-green-bg text-status-green border border-emerald-500/30"
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Mobile Stacked View */}
          <div className="sm:hidden divide-y divide-border-item">
            {recentIncidents.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-text-sub">
                No routing incidents recorded — continuous baseline monitoring active.
              </div>
            ) : (
              recentIncidents.map((inc) => {
                const isActive = inc.status === "ACTIVE";
                const isAck = inc.status === "ACKNOWLEDGED";
                const timeStr = inc.lastSeen
                  ? new Date(inc.lastSeen).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "Just now";

                return (
                  <div
                    key={inc.id}
                    onClick={() => {
                      setSelectedAlert(inc.primaryAlert);
                      setActiveTab("alerts");
                    }}
                    className="p-3.5 space-y-2 hover:bg-bg-hover-row transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-text-main">
                          {inc.prefix}
                        </span>
                        {inc.occurrenceCount > 1 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-bg-interactive text-text-sub border border-border-card">
                            ×{inc.occurrenceCount}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isActive
                            ? "bg-status-red-bg text-status-red border border-red-500/35"
                            : isAck
                            ? "bg-bg-interactive text-text-sub border border-border-card"
                            : "bg-status-green-bg text-status-green border border-emerald-500/30"
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-text-dim font-mono">
                      <span>Origin: <span className="text-status-red font-semibold">{inc.observed_asn}</span></span>
                      <span>•</span>
                      <span>{timeStr}</span>
                    </div>
                    <p className="text-xs text-text-sub leading-relaxed line-clamp-2">
                      {inc.explanation || inc.title}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. Demonstration Shortcut */}
      <div className="card-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-brand-blue shrink-0" />
          <span className="text-text-sub">
            Testing detection capabilities? Run the deterministic scenario test suite in{" "}
            <span className="font-semibold text-text-main">Scenarios</span>.
          </span>
        </div>
        <button
          onClick={() => setActiveTab("scenarios")}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-bg-btn border border-border-card hover:border-brand-blue/40 hover:bg-bg-nav-hover text-xs font-semibold text-text-main transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
        >
          <span>Explore scenarios</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
