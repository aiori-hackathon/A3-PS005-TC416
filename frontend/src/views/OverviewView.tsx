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

  const groupedIncidents = groupAlertObservations(alerts);
  const activeIncidents = groupedIncidents.filter((g) => g.status === "ACTIVE");
  const topIncident = activeIncidents[0] || null;

  const prefixesTracked = overview?.tracked_routes || routes.length || 0;
  // Truthful BGP update count directly from observation telemetry (does not double-count alerts)
  const updatesEvaluated = overview?.total_observations ?? 0;
  const anomaliesCount = overview?.total_alerts ?? alerts.length;

  const collectorStatus = (overview as any)?.collector_status;
  const isCollectorConnected = collectorStatus?.connected === true;
  const isCollectorEnabled = collectorStatus?.enabled === true;
  const risFeedStatusLabel = isCollectorConnected ? "CONNECTED" : (isCollectorEnabled ? "CONNECTING" : "OFFLINE (Opt-In)");
  const risFeedSubtitle = isCollectorConnected
    ? "Active WebSocket: rrc00, rrc01, rrc03"
    : "Configured feeds: rrc00, rrc01, rrc03";

  const recentIncidents = groupedIncidents.slice(0, 7);


  const getAlertHeadline = (incident: GroupedIncident | null) => {
    if (!incident) return "All monitored prefixes conform to baseline routing policies";
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
      return "Zero active routing conflicts detected across live BGP telemetry feeds. Historical events are logged below.";
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
    <div className="max-w-[1360px] w-full space-y-6 animate-fadeIn">
      {/* 1. Page Heading + Truthful Data Source Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-divider">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-text-main tracking-tight">
            Routing Overview
          </h1>
          <p className="text-sm text-text-sub mt-1 leading-relaxed">
            Continuous BGP origin and subprefix anomaly monitoring with explainable cryptographic evidence.
          </p>
        </div>

        {/* Single Data Source Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-interactive border border-divider text-xs text-text-sub">
            <span className="w-2 h-2 rounded-full bg-status-green" />
            <span className="font-medium text-text-main">
              {overview?.data_mode === "LIVE_TELEMETRY" ? "RIPE RIS Live Stream" : "Evaluation Benchmark Mode"}
            </span>
            <span className="text-text-dim">•</span>
            <span className="text-text-dim">
              {overview?.data_mode === "LIVE_TELEMETRY" ? "Active Ingestion" : "RIPE RIS Telemetry & Replay"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Operational Condition Callout */}
      {topIncident ? (
        <div className="p-4 sm:p-5 rounded-lg border border-red-200 dark:border-red-900/40 bg-status-critical-bg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-status-critical text-white">
                <AlertTriangle className="w-3 h-3" />
                {topIncident.severity} Alert
              </span>
              <span className="font-mono text-xs font-bold text-text-main px-2 py-0.5 rounded bg-bg-card border border-divider">
                {topIncident.prefix}
              </span>
              {topIncident.occurrenceCount > 1 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-bg-card border border-divider text-text-sub">
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

            <h2 className="text-base font-semibold text-text-main">
              {getAlertHeadline(topIncident)}
            </h2>

            <p className="text-sm text-text-sub leading-relaxed max-w-3xl">
              {getAlertDescription(topIncident)}
            </p>

            {activeIncidents.length > 1 && (
              <div className="text-xs font-medium text-brand-blue pt-0.5">
                + {activeIncidents.length - 1} additional active anomaly requires operator review
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setSelectedAlert(topIncident.primaryAlert);
              setActiveTab("alerts");
            }}
            className="px-4 py-2 rounded-md bg-brand-blue hover:bg-blue-700 text-white font-medium text-sm transition-colors cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <span>Review Incident</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-lg border border-green-200 dark:border-green-900/40 bg-badge-green-bg flex items-start gap-3.5">
          <CheckCircle2 className="w-5 h-5 text-status-green shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-text-main">
              Zero Unresolved Anomalies
            </h2>
            <p className="text-xs text-text-sub">
              No active routing conflicts require operator attention. Monitored prefixes match established routing policies. Historical records are logged below.
            </p>
          </div>
        </div>
      )}

      {/* 3. Compact Operational Metric System — Unified Strip with Google Cloud Dividers */}
      <div className="card-panel overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-divider">
          {/* Active Anomalies */}
          <div className="p-5 space-y-1">
            <div className="text-xs font-medium text-text-sub flex items-center justify-between">
              <span>Active anomalies</span>
              <Activity className={`w-4 h-4 ${activeIncidents.length > 0 ? "text-status-critical" : "text-status-green"}`} />
            </div>
            <div
              className={`text-3xl font-bold font-mono tracking-tight ${
                activeIncidents.length > 0 ? "text-status-critical" : "text-text-main"
              }`}
            >
              {activeIncidents.length}
            </div>
            <div className="text-xs text-text-dim">
              {activeIncidents.length > 0 ? "Requires review" : "Policies healthy"}
            </div>
          </div>

          {/* Prefixes Tracked */}
          <div className="p-5 space-y-1">
            <div className="text-xs font-medium text-text-sub flex items-center justify-between">
              <span>Prefixes tracked</span>
              <Globe className="w-4 h-4 text-text-dim" />
            </div>
            <div className="text-3xl font-bold font-mono text-text-main tracking-tight">
              {prefixesTracked}
            </div>
            <div className="text-xs text-text-dim">
              Established baselines
            </div>
          </div>

          {/* Updates Evaluated */}
          <div className="p-5 space-y-1">
            <div className="text-xs font-medium text-text-sub flex items-center justify-between">
              <span>Updates evaluated</span>
              <Radio className="w-4 h-4 text-text-dim" />
            </div>
            <div className="text-3xl font-bold font-mono text-text-main tracking-tight">
              {updatesEvaluated}
            </div>
            <div className="text-xs text-text-dim">
              {anomaliesCount} {anomaliesCount === 1 ? "anomaly flagged" : "anomalies flagged"}
            </div>
          </div>

          {/* RIPE RIS Telemetry Feeds */}
          <div className="p-5 space-y-1">
            <div className="text-xs font-medium text-text-sub flex items-center justify-between">
              <span>RIPE RIS Feed</span>
              <Server className={`w-4 h-4 ${isCollectorConnected ? "text-status-green" : "text-text-dim"}`} />
            </div>
            <div className={`text-xl font-bold font-mono tracking-tight ${isCollectorConnected ? "text-status-green" : "text-text-main"}`}>
              {risFeedStatusLabel}
            </div>
            <div className="text-xs text-text-dim">
              {risFeedSubtitle}
            </div>
          </div>
        </div>
      </div>


      {/* 4. Recent Incidents Structured Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-main">
              Recent Incident Activity
            </h2>
            <p className="text-xs text-text-sub mt-0.5">
              Deduplicated routing observations with occurrence counters and lifecycle status.
            </p>
          </div>
          {recentIncidents.length > 0 && (
            <button
              onClick={() => setActiveTab("alerts")}
              className="text-xs text-brand-blue hover:text-blue-700 transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>View all incidents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="card-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-interactive border-b border-divider text-[11px] font-bold uppercase tracking-wider text-text-sub">
                  <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-4 font-semibold">Prefix</th>
                  <th className="py-2.5 px-4 font-semibold">Observations</th>
                  <th className="py-2.5 px-4 font-semibold">Observed Origin</th>
                  <th className="py-2.5 px-4 font-semibold">Baseline Origin</th>
                  <th className="py-2.5 px-4 font-semibold">Anomaly Type</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider text-[13px]">
                {recentIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-text-sub">
                      No routing incidents recorded — continuous baseline monitoring active.
                    </td>
                  </tr>
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
                      <tr
                        key={inc.id}
                        onClick={() => {
                          setSelectedAlert(inc.primaryAlert);
                          setActiveTab("alerts");
                        }}
                        className="hover:bg-bg-hover-row transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-mono text-xs text-text-sub whitespace-nowrap">
                          {timeStr}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-text-main group-hover:text-brand-blue transition-colors">
                          {inc.prefix}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono">
                          {inc.occurrenceCount > 1 ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-bg-interactive text-text-sub border border-divider">
                              ×{inc.occurrenceCount}
                            </span>
                          ) : (
                            <span className="text-text-dim">1 msg</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-status-critical">
                          {inc.observed_asn}
                        </td>
                        <td className="py-3 px-4 font-mono text-text-sub">
                          {inc.baseline_asn || "None"}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-sub max-w-xs truncate" title={inc.title}>
                          {inc.title}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                              isActive
                                ? "bg-status-critical-bg text-status-critical border border-red-300 dark:border-red-900"
                                : isAck
                                ? "bg-bg-interactive text-text-sub border border-divider"
                                : "bg-badge-green-bg text-status-green border border-green-300 dark:border-green-900"
                            }`}
                          >
                            {inc.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Scenario Runner Shortcut Banner */}
      <div className="card-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-bg-card">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-brand-blue shrink-0" />
          <span className="text-text-sub">
            Testing detection capabilities? Run the deterministic evaluation suite in{" "}
            <span className="font-semibold text-text-main">Scenarios</span>.
          </span>
        </div>
        <button
          onClick={() => setActiveTab("scenarios")}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-md bg-bg-btn border border-border-card hover:bg-bg-interactive text-xs font-medium text-text-main transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>Open Scenarios</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
