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
  ShieldAlert,
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
      return "Origin conflict requires review";
    }
    if (incident.kind === "SUBPREFIX_ANOMALY") {
      return "Subprefix anomaly requires review";
    }
    return incident.title || "Routing anomaly requires review";
  };

  const getAlertDescription = (incident: GroupedIncident | null) => {
    if (!incident) {
      return "No active routing conflicts require operator attention. Monitored prefixes match established routing policies. Historical acknowledged and resolved events are logged below.";
    }
    if (incident.kind === "ORIGIN_CHANGE") {
      return `Prefix ${incident.prefix} was observed with origin ${incident.observed_asn}, differing from reference baseline ${incident.baseline_asn || "unknown"}. (${incident.occurrenceCount} ${incident.occurrenceCount === 1 ? "observation" : "observations"} recorded)`;
    }
    if (incident.kind === "SUBPREFIX_ANOMALY") {
      return `More-specific prefix ${incident.prefix} announced by ${incident.observed_asn} overlaps baseline route ${incident.parent_prefix || "parent prefix"}. (${incident.occurrenceCount} ${incident.occurrenceCount === 1 ? "observation" : "observations"} recorded)`;
    }
    return incident.explanation || incident.title;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-card">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            Routing overview
          </h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1 max-w-xl leading-relaxed">
            Continuous BGP origin and subprefix anomaly monitoring with explainable cryptographic evidence.
          </p>
        </div>

        {/* Ambient Feed Status Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bg-card border border-border-card text-xs text-text-sub shadow-sm">
            <span className="w-2 h-2 rounded-full bg-status-green animate-pulse shadow-[0_0_8px_rgba(67,217,155,0.7)]" />
            <span className="font-semibold text-text-main">Monitoring active</span>
            <span className="text-text-dim">•</span>
            <span className="text-accent-teal text-[11px] font-medium">Evaluation Replay</span>
          </div>
        </div>
      </div>

      {/* Primary Alert Callout / Zero Unresolved Banner */}
      {topIncident ? (
        <div className="card-panel p-5 sm:p-6 rounded-2xl border-red-500/35 aurora-critical-glow relative overflow-hidden transition-all">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-status-red border border-red-500/35 shadow-xs">
                  <AlertTriangle className="w-3 h-3" />
                  {topIncident.severity}
                </span>
                <span className="text-xs text-text-dim font-mono">
                  {topIncident.lastSeen
                    ? new Date(topIncident.lastSeen).toLocaleTimeString()
                    : "Recent observation"}
                </span>
                {topIncident.occurrenceCount > 1 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-bg-interactive text-brand-blue border border-brand-blue/30">
                    <Layers className="w-3 h-3" />
                    {topIncident.occurrenceCount} observations
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-bold text-text-main tracking-tight">
                {getAlertHeadline(topIncident)}
              </h2>

              <p className="text-xs sm:text-sm text-text-sub max-w-2xl leading-relaxed font-mono">
                {getAlertDescription(topIncident)}
              </p>

              {activeIncidents.length > 1 && (
                <p className="text-xs text-accent-indigo pt-0.5 font-medium">
                  + {activeIncidents.length - 1} other active anomaly requiring review
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0 pt-1 sm:pt-0">
              <button
                onClick={() => {
                  setSelectedAlert(topIncident.primaryAlert);
                  setActiveTab("alerts");
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-brand-blue hover:from-blue-500 hover:to-blue-400 text-white font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98] shadow-md shadow-blue-500/20"
              >
                <span>Review alert</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-panel p-5 sm:p-6 rounded-2xl border-emerald-500/30 aurora-success-glow flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-status-green-bg border border-emerald-500/40 text-status-green flex items-center justify-center shrink-0 shadow-xs">
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

      {/* Four Metric Widgets with Aurora Obsidian Tonal Distinction */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Active Anomalies */}
        <div className={`card-panel p-4 space-y-1 ${activeIncidents.length > 0 ? "accent-top-coral" : "accent-top-green"}`}>
          <div className="text-xs font-medium text-text-sub flex items-center justify-between">
            <span>Active anomalies</span>
            <Activity className={`w-3.5 h-3.5 ${activeIncidents.length > 0 ? "text-status-red" : "text-status-green"}`} />
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              activeIncidents.length > 0 ? "text-status-red" : "text-text-main"
            }`}
          >
            {activeIncidents.length}
          </div>
          <div className="text-[11px] text-text-dim">
            {activeIncidents.length > 0 ? "Requires review" : "All clear"}
          </div>
        </div>

        {/* Metric 2: Prefixes Tracked (Indigo Accent) */}
        <div className="card-panel p-4 space-y-1 accent-top-indigo">
          <div className="text-xs font-medium text-text-sub flex items-center justify-between">
            <span>Prefixes tracked</span>
            <Globe className="w-3.5 h-3.5 text-accent-indigo" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            {prefixesTracked}
          </div>
          <div className="text-[11px] text-text-dim">
            Monitored baselines
          </div>
        </div>

        {/* Metric 3: BGP Updates (Electric Blue Accent) */}
        <div className="card-panel p-4 space-y-1 accent-top-blue">
          <div className="text-xs font-medium text-text-sub flex items-center justify-between">
            <span>Updates evaluated</span>
            <Radio className="w-3.5 h-3.5 text-brand-blue" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            {updatesEvaluated}
          </div>
          <div className="text-[11px] text-text-dim">
            Normalized streams
          </div>
        </div>

        {/* Metric 4: Connected Peers (Teal Accent) */}
        <div className="card-panel p-4 space-y-1 accent-top-teal">
          <div className="text-xs font-medium text-text-sub flex items-center justify-between">
            <span>Connected peers</span>
            <Sparkles className="w-3.5 h-3.5 text-accent-teal" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            {connectedPeers}
          </div>
          <div className="text-[11px] text-text-dim">
            RIS telemetry
          </div>
        </div>
      </div>

      {/* Incident History & Recent Activity Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-text-main">
              Incident history & recent activity
            </h2>
            <p className="text-xs text-text-sub mt-0.5">
              Chronological ledger of routing evaluations, grouped by incident with occurrence counts.
            </p>
          </div>
          {recentIncidents.length > 0 && (
            <button
              onClick={() => setActiveTab("alerts")}
              className="text-xs text-brand-blue hover:text-blue-400 transition-colors flex items-center gap-1 cursor-pointer font-semibold shrink-0 ml-2"
            >
              <span>View all incidents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="card-panel overflow-hidden border-border-card">
          {/* Desktop Table Header */}
          <div className="hidden sm:grid grid-cols-12 text-[11px] text-text-dim font-bold uppercase tracking-wider px-4 py-3 bg-bg-app border-b border-border-card">
            <span className="col-span-2">Last Seen</span>
            <span className="col-span-3">Prefix & Count</span>
            <span className="col-span-2">Observed Origin</span>
            <span className="col-span-3">Explanation</span>
            <span className="col-span-2 text-right">Lifecycle Status</span>
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
                      <span className="font-mono text-[11px] font-bold text-text-main group-hover:text-brand-blue transition-colors">
                        {inc.prefix}
                      </span>
                      {inc.occurrenceCount > 1 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-accent-indigo/15 text-accent-indigo border border-accent-indigo/30">
                          ×{inc.occurrenceCount}
                        </span>
                      )}
                    </div>
                    <span className="col-span-2 font-mono text-[11px] font-semibold text-accent-teal">
                      {inc.observed_asn}
                    </span>
                    <span
                      className="col-span-3 text-text-sub text-xs truncate pr-2"
                      title={inc.explanation || inc.title}
                    >
                      {inc.explanation || inc.title}
                    </span>
                    <div className="col-span-2 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          isActive
                            ? "bg-status-red-bg text-status-red border border-red-500/35 shadow-xs"
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

          {/* Mobile Stacked Card View */}
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
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-accent-indigo/15 text-accent-indigo border border-accent-indigo/30">
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
                      <span>Origin: <span className="text-accent-teal font-semibold">{inc.observed_asn}</span></span>
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

      {/* Demonstration Shortcut */}
      <div className="card-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs aurora-ambient-glow">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-accent-indigo shrink-0" />
          <span className="text-text-sub">
            Testing detection capabilities? Run the deterministic scenario test suite in{" "}
            <span className="font-semibold text-text-main">Scenarios</span>.
          </span>
        </div>
        <button
          onClick={() => setActiveTab("scenarios")}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-bg-btn border border-border-card hover:border-brand-blue/40 hover:bg-bg-nav-hover text-xs font-semibold text-text-main transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
        >
          <span>Explore scenarios</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
