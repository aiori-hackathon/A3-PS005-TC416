import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Globe,
  Radio,
  Sparkles,
  Layers,
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
      return "No active incidents require operator attention. All monitored prefixes match established routing baselines. Historical acknowledged and resolved events are logged below.";
    }
    if (incident.kind === "ORIGIN_CHANGE") {
      return `Prefix ${incident.prefix} was observed with origin ${incident.observed_asn}, while the stored baseline is ${incident.baseline_asn || "unknown"}. (${incident.occurrenceCount} ${incident.occurrenceCount === 1 ? "occurrence" : "occurrences"} recorded)`;
    }
    if (incident.kind === "SUBPREFIX_ANOMALY") {
      return `More-specific prefix ${incident.prefix} announced by ${incident.observed_asn} overlaps baseline route ${incident.parent_prefix || "parent prefix"}. (${incident.occurrenceCount} ${incident.occurrenceCount === 1 ? "occurrence" : "occurrences"} recorded)`;
    }
    return incident.explanation || incident.title;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-card">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">
            Routing overview
          </h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1 max-w-xl leading-relaxed">
            Continuous BGP monitoring for uncoordinated origin conflicts and unexpected more-specific routes.
          </p>
        </div>

        {/* Feed Status Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-card border border-border-card text-xs text-text-sub">
            <span className="w-2 h-2 rounded-full bg-status-green animate-pulse" />
            <span className="font-medium text-text-main">Monitoring active</span>
            <span className="text-text-dim">•</span>
            <span className="text-text-dim text-[11px]">Evaluation Replay</span>
          </div>
        </div>
      </div>

      {/* Primary Alert Callout */}
      {topIncident ? (
        <div className="p-5 sm:p-6 rounded-2xl bg-red-500/[0.08] border border-red-500/25 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
                  <AlertTriangle className="w-3 h-3" />
                  {topIncident.severity}
                </span>
                <span className="text-xs text-text-dim font-mono">
                  {topIncident.lastSeen
                    ? new Date(topIncident.lastSeen).toLocaleTimeString()
                    : "Recent observation"}
                </span>
                {topIncident.occurrenceCount > 1 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-bg-card text-text-sub border border-border-card">
                    <Layers className="w-2.5 h-2.5 text-brand-blue" />
                    {topIncident.occurrenceCount} observations
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
                {getAlertHeadline(topIncident)}
              </h2>

              <p className="text-xs sm:text-sm text-text-sub max-w-2xl leading-relaxed font-mono">
                {getAlertDescription(topIncident)}
              </p>

              {activeIncidents.length > 1 && (
                <p className="text-xs text-text-dim pt-1 font-medium">
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
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              >
                <span>Review alert</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 sm:p-6 rounded-2xl bg-bg-card border border-border-card flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-status-green-bg border border-green-500/30 text-status-green flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-semibold text-text-main">
              Zero unresolved anomalies
            </h2>
            <p className="text-xs text-text-sub leading-relaxed">
              No active routing conflicts require operator attention. Monitored prefixes match established routing policies. Historical acknowledged and resolved events are logged below.
            </p>
          </div>
        </div>
      )}

      {/* Four Clean Metric Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="card-panel p-4 space-y-1">
          <div className="text-xs font-medium text-text-sub">Active anomalies</div>
          <div
            className={`text-2xl sm:text-3xl font-bold tracking-tight ${
              activeIncidents.length > 0 ? "text-[#ff453a]" : "text-text-main"
            }`}
          >
            {activeIncidents.length}
          </div>
        </div>

        <div className="card-panel p-4 space-y-1">
          <div className="text-xs font-medium text-text-sub">Prefixes tracked</div>
          <div className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">
            {prefixesTracked}
          </div>
        </div>

        <div className="card-panel p-4 space-y-1">
          <div className="text-xs font-medium text-text-sub">BGP updates evaluated</div>
          <div className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">
            {updatesEvaluated}
          </div>
        </div>

        <div className="card-panel p-4 space-y-1">
          <div className="text-xs font-medium text-text-sub">Connected peers</div>
          <div className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">
            {connectedPeers}
          </div>
        </div>
      </div>

      {/* Incident History & Recent Activity Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-main">
              Incident history & recent activity
            </h2>
            <p className="text-xs text-text-sub mt-0.5">
              Chronological ledger of routing evaluations, grouped by incident with occurrence counts.
            </p>
          </div>
          {recentIncidents.length > 0 && (
            <button
              onClick={() => setActiveTab("alerts")}
              className="text-xs text-brand-blue hover:underline transition-colors flex items-center gap-1 cursor-pointer font-medium shrink-0 ml-2"
            >
              <span>View all incidents</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="card-panel overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden sm:grid grid-cols-12 text-[11px] text-text-dim font-semibold uppercase tracking-wider px-4 py-3 border-b border-border-card">
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
                    className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-bg-hover-row transition-colors cursor-pointer"
                  >
                    <span className="col-span-2 text-text-sub font-mono text-[11px]">
                      {timeStr}
                    </span>
                    <div className="col-span-3 flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-text-main">
                        {inc.prefix}
                      </span>
                      {inc.occurrenceCount > 1 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-bg-btn text-text-dim border border-border-card">
                          ×{inc.occurrenceCount}
                        </span>
                      )}
                    </div>
                    <span className="col-span-2 font-mono text-[11px] font-medium text-brand-blue">
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
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                          isActive
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : isAck
                            ? "bg-slate-500/15 text-slate-300 border border-slate-500/25"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
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
                    className="p-3.5 space-y-1.5 hover:bg-bg-hover-row transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-text-main">
                          {inc.prefix}
                        </span>
                        {inc.occurrenceCount > 1 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-bg-btn text-text-dim border border-border-card">
                            ×{inc.occurrenceCount}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          isActive
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : isAck
                            ? "bg-slate-500/15 text-slate-300 border border-slate-500/25"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-text-dim font-mono">
                      <span>Origin: {inc.observed_asn}</span>
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
      <div className="card-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-brand-blue shrink-0" />
          <span className="text-text-sub">
            Testing detection capabilities? Run the deterministic scenario test suite in{" "}
            <span className="font-medium text-text-main">Scenarios</span>.
          </span>
        </div>
        <button
          onClick={() => setActiveTab("scenarios")}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-medium text-text-main transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>Explore scenarios</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
