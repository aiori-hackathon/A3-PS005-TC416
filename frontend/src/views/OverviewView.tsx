import React, { useState } from "react";
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
  SearchCheck,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";
import { groupAlertObservations, GroupedIncident } from "../utils/incidentGrouping";
import { EvaluatorGuideCard } from "../components/EvaluatorGuideCard";
import { getCollectorStatusDisplay } from "../utils/collectorStatus";
import { formatCount } from "../utils/format";

export const OverviewView: React.FC = () => {
  const {
    overview,
    alerts,
    routes,
    observations,
    evidence,
    setActiveTab,
    setSelectedAlert,
    setSelectedEvidence,
    setRpkiTarget,
  } = useHoraqStore();

  const [walkthroughOpen, setWalkthroughOpen] = useState<boolean>(false);

  const groupedIncidents = groupAlertObservations(alerts);
  const activeIncidents = groupedIncidents.filter((g) => g.status === "ACTIVE");
  const topIncident = activeIncidents[0] || null;

  const prefixesTracked = overview?.tracked_routes ?? (routes.length || 0);
  const updatesEvaluated = overview?.total_observations ?? 0;
  const activeAnomaliesCount = overview?.active_alerts ?? activeIncidents.length;
  const resolvedAnomaliesCount = overview?.resolved_alerts ?? alerts.filter((a) => a.status === "RESOLVED").length;
  const unresolvedIncidentsCount =
    overview?.unresolved_alerts ?? (overview?.active_alerts ?? 0) + (overview?.acknowledged_alerts ?? 0);

  const collectorInfo = getCollectorStatusDisplay(overview?.collector_status);
  const isCollectorConnected = collectorInfo.state === "CONNECTED";

  // Operating mode derivation
  const operatingMode = overview?.operating_mode || (isCollectorConnected ? "LIVE" : "SYNTHETIC");

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
      return "Zero active routing conflicts detected across evaluated BGP updates. Historical records are preserved in the audit ledger.";
    }
    if (incident.kind === "ORIGIN_CHANGE") {
      return `Prefix ${incident.prefix} was observed announced by origin ${incident.observed_asn}, conflicting with reference baseline ${incident.baseline_asn || "unauthorized"}.`;
    }
    if (incident.kind === "SUBPREFIX_ANOMALY") {
      return `More-specific prefix ${incident.prefix} announced by ${incident.observed_asn} overlaps established baseline route ${incident.parent_prefix || "parent prefix"}.`;
    }
    return incident.explanation || incident.title;
  };

  const formatTimestamp = (ts: string | null | undefined) => {
    if (!ts) return "Standby";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return ts;
    }
  };

  const getClassificationLabel = (obs: any) => {
    if (obs.scenario === "authorized-baseline-seed" || obs.scenario === "baseline") {
      return { label: "Baseline Seed", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" };
    }
    if (obs.alert_kind === "SUBPREFIX_ANOMALY") {
      return { label: "Subprefix Anomaly", color: "text-red-500 bg-red-500/10 border-red-500/20" };
    }
    if (obs.alert_kind === "ORIGIN_CHANGE") {
      return { label: "Origin Conflict", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
    }
    return { label: "Announcement", color: "text-text-sub bg-bg-interactive border-divider" };
  };

  const getLifecycleBadge = (obs: any) => {
    if (obs.alert_status === "ACTIVE") {
      return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-status-critical-bg text-status-critical border border-red-300 dark:border-red-900/40">Active Alert</span>;
    }
    if (obs.alert_status === "RESOLVED") {
      return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-badge-green-bg text-status-green border border-green-300 dark:border-green-900/40">Resolved</span>;
    }
    if (obs.alert_status === "ACKNOWLEDGED") {
      return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-bg-interactive text-text-sub border border-divider">Acknowledged</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-badge-green-bg/50 text-status-green border border-green-200 dark:border-green-900/30">Clean</span>;
  };

  return (
    <div className="max-w-[1360px] w-full space-y-6 animate-fadeIn pb-8">
      {/* A. Page Header + Operating Mode Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-divider">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-text-main tracking-tight">
            Routing Overview
          </h1>
          <p className="text-sm text-text-sub mt-1 leading-relaxed">
            Continuous BGP origin and subprefix anomaly monitoring with explainable cryptographic evidence.
          </p>
        </div>

        {/* Operating Mode Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-interactive border border-divider text-xs text-text-sub">
            <span
              className={`w-2 h-2 rounded-full ${
                operatingMode === "LIVE"
                  ? "bg-status-green animate-pulse"
                  : operatingMode === "SYNTHETIC"
                  ? "bg-brand-blue"
                  : "bg-amber-500"
              }`}
            />
            <span className="font-semibold text-text-main tracking-wide">
              {operatingMode === "LIVE"
                ? "LIVE TELEMETRY"
                : operatingMode === "SYNTHETIC"
                ? "SYNTHETIC EVALUATION"
                : "HISTORICAL ARCHIVE"}
            </span>
            <span className="text-text-dim">•</span>
            <span className="text-text-sub font-mono text-[11px]">
              {operatingMode === "LIVE"
                ? "RIPE RIS Live"
                : "RFC 5737 / RFC 3849 Testbed"}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bg-card border border-divider text-[11px] text-text-sub">
            <span className={`w-1.5 h-1.5 rounded-full ${collectorInfo.dotStyle}`} />
            <span>{collectorInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Operational Mode Disclosure Notice */}
      <div className="p-3.5 rounded-lg border border-divider bg-bg-interactive/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Server className="w-4 h-4 text-brand-blue shrink-0" />
          <span className="font-medium text-text-main">
            {operatingMode === "LIVE"
              ? "Live RIPE RIS telemetry ingestion is active across configured route collectors."
              : "Deterministic Evaluation Mode: Live collector is paused (HORAQ_LIVE_COLLECTOR=false) for reproducible testing."}
          </span>
          <span className="text-text-dim hidden md:inline">•</span>
          <span className="text-text-sub hidden md:inline">
            {collectorInfo.description}
          </span>
        </div>
        {overview?.demo_mode && (
          <span className="self-start sm:self-auto px-2.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue font-semibold border border-brand-blue/20 shrink-0">
            Public Demo Protection Active
          </span>
        )}
      </div>

      {/* B. Compact Monitoring Status Section — 6 Independent KPI Cards */}
      <div className="card-panel overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-divider">
          {/* 1. Active Anomalies */}
          <div className="p-4 space-y-1">
            <div className="text-xs font-medium text-text-sub flex items-center justify-between">
              <span>Active Anomalies</span>
              <Activity className={`w-3.5 h-3.5 ${activeAnomaliesCount > 0 ? "text-status-critical" : "text-status-green"}`} />
            </div>
            <div
              className={`text-2xl font-bold font-mono tracking-tight ${
                activeAnomaliesCount > 0 ? "text-status-critical" : "text-text-main"
              }`}
            >
              {activeAnomaliesCount}
            </div>
            <div className="text-[11px] text-text-dim">
              {activeAnomaliesCount > 0 ? "Requires review" : "Zero conflicts"}
            </div>
          </div>

          {/* 2. Unresolved Incidents */}
          <div className="p-4 space-y-1">
            <div className="text-xs font-medium text-text-sub flex items-center justify-between">
              <span>Unresolved</span>
              <ShieldAlert className="w-3.5 h-3.5 text-text-dim" />
            </div>
            <div className="text-2xl font-bold font-mono text-text-main tracking-tight">
              {unresolvedIncidentsCount}
            </div>
            <div className="text-[11px] text-text-dim">
              Active + Acknowledged
            </div>
          </div>

          {/* 3. Resolved Incidents */}
          <div className="p-4 space-y-1">
            <div className="text-xs font-medium text-text-sub flex items-center justify-between">
              <span>Resolved</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
            </div>
            <div className="text-2xl font-bold font-mono text-status-green tracking-tight">
              {resolvedAnomaliesCount}
            </div>
            <div className="text-[11px] text-text-dim">
              Withdrawal verified
            </div>
          </div>

          {/* 4. Tracked Baselines */}
          <div className="p-4 space-y-1">
            <div className="text-xs font-medium text-text-sub flex items-center justify-between">
              <span>Tracked Baselines</span>
              <Globe className="w-3.5 h-3.5 text-text-dim" />
            </div>
            <div className="text-2xl font-bold font-mono text-text-main tracking-tight">
              {prefixesTracked}
            </div>
            <div className="text-[11px] text-text-dim">
              Route origin policies
            </div>
          </div>

          {/* 5. Updates Evaluated */}
          <div className="p-4 space-y-1">
            <div className="text-xs font-medium text-text-sub flex items-center justify-between">
              <span>Evaluated Updates</span>
              <Radio className="w-3.5 h-3.5 text-text-dim" />
            </div>
            <div className="text-2xl font-bold font-mono text-text-main tracking-tight">
              {updatesEvaluated}
            </div>
            <div className="text-[11px] text-text-dim">
              {overview?.total_alerts ?? alerts.length} total anomalies
            </div>
          </div>

          {/* 6. Latest Processed Observation */}
          <div className="p-4 space-y-1">
            <div className="text-xs font-medium text-text-sub flex items-center justify-between">
              <span>Latest Observation</span>
              <Clock className="w-3.5 h-3.5 text-text-dim" />
            </div>
            <div className="text-lg font-bold font-mono text-text-main tracking-tight truncate" title={overview?.latest_observation_time || "None"}>
              {formatTimestamp(overview?.latest_observation_time)}
            </div>
            <div className="text-[11px] text-text-dim truncate">
              {overview?.latest_collector ? `Source: ${overview.latest_collector}` : "Collector idle"}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Condition Callout */}
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
                  {formatCount(topIncident.occurrenceCount, "observation")}
                </span>
              )}
              <span className="text-xs text-text-dim font-mono">
                {topIncident.lastSeen ? new Date(topIncident.lastSeen).toLocaleTimeString() : "Recent observation"}
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
              Zero Active Anomalies
            </h2>
            <p className="text-xs text-text-sub">
              {resolvedAnomaliesCount > 0
                ? `All detected anomalies have been resolved (${resolvedAnomaliesCount} resolved incident${resolvedAnomaliesCount > 1 ? "s" : ""} logged in audit ledger). Monitored prefixes currently conform to baseline policies.`
                : "No active routing conflicts require operator attention. Monitored prefixes match established routing policies."}
            </p>
          </div>
        </div>
      )}

      {/* C. Primary Operational Content: Recent Routing Activity Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-text-main">
              Recent Routing Activity
            </h2>
            <p className="text-xs text-text-sub mt-0.5">
              Ingested BGP route updates evaluated against reference baselines and post-quantum trust ledger.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("routes")}
              className="text-xs text-text-sub hover:text-text-main border border-divider px-2.5 py-1.5 rounded-md hover:bg-bg-interactive transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>View Baselines ({prefixesTracked})</span>
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className="text-xs text-brand-blue hover:text-blue-700 border border-brand-blue/30 px-2.5 py-1.5 rounded-md hover:bg-brand-blue/10 transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>View All Alerts ({alerts.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="card-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-interactive border-b border-divider text-[11px] font-bold uppercase tracking-wider text-text-sub">
                  <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-4 font-semibold">Prefix</th>
                  <th className="py-2.5 px-4 font-semibold">Observed Origin</th>
                  <th className="py-2.5 px-4 font-semibold">Baseline Origin</th>
                  <th className="py-2.5 px-4 font-semibold">Classification</th>
                  <th className="py-2.5 px-4 font-semibold">Lifecycle Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider text-[13px]">
                {observations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-text-sub">
                      No routing observations recorded in local trust store yet. Announcements from live telemetry or synthetic scenarios will appear here.
                    </td>
                  </tr>
                ) : (
                  observations.slice(0, 10).map((obs) => {
                    const cls = getClassificationLabel(obs);
                    const matchingAlert = obs.alert_id ? alerts.find((a) => a.id === obs.alert_id) : null;
                    const matchingEvidence = obs.evidence_id
                      ? evidence.find((e) => e.id === obs.evidence_id || e.alert_id === obs.alert_id)
                      : null;

                    return (
                      <tr key={obs.id} className="hover:bg-bg-hover-row transition-colors group">
                        <td className="py-3 px-4 font-mono text-xs text-text-sub whitespace-nowrap" title={obs.observed_at}>
                          {formatTimestamp(obs.observed_at)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-text-main group-hover:text-brand-blue transition-colors">
                          {obs.prefix}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-text-main">
                          {obs.origin_asn}
                        </td>
                        <td className="py-3 px-4 font-mono text-text-sub">
                          {obs.baseline_asn || <span className="text-text-dim text-xs">First Seen</span>}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${cls.color}`}>
                            {cls.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getLifecycleBadge(obs)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                          {matchingEvidence && (
                            <button
                              onClick={() => setSelectedEvidence(matchingEvidence)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-bg-interactive hover:bg-brand-blue/10 border border-divider hover:border-brand-blue/40 text-[11px] font-medium text-brand-blue transition-colors cursor-pointer"
                              title="Inspect cryptographic evidence record"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Evidence</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setRpkiTarget({
                                prefix: obs.prefix,
                                asn: obs.origin_asn.replace(/^AS/i, ""),
                              });
                              setActiveTab("rpki");
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-bg-interactive hover:bg-bg-card border border-divider text-[11px] font-medium text-text-sub hover:text-text-main transition-colors cursor-pointer"
                            title="Inspect prefix and ASN in live RPKI validator"
                          >
                            <SearchCheck className="w-3 h-3 text-text-dim" />
                            <span>RPKI</span>
                          </button>
                          {matchingAlert && (
                            <button
                              onClick={() => {
                                setSelectedAlert(matchingAlert);
                                setActiveTab("alerts");
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-bg-interactive hover:bg-bg-card border border-divider text-[11px] font-medium text-text-main transition-colors cursor-pointer"
                              title="View full alert details"
                            >
                              <span>Details</span>
                            </button>
                          )}
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

      {/* D. Evaluator Guided Walkthrough (Secondary Collapsible Panel) */}
      <div className="card-panel overflow-hidden border border-brand-blue/30 transition-all">
        <div
          onClick={() => setWalkthroughOpen((prev) => !prev)}
          className="p-4 bg-bg-interactive/50 hover:bg-bg-interactive flex items-center justify-between gap-3 cursor-pointer select-none transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-text-main tracking-tight">
                  AIORI-3 Evaluator Guided Walkthrough
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                  6-Stage Lifecycle
                </span>
                <span className="text-xs text-text-dim hidden sm:inline">•</span>
                <span className="text-xs text-text-sub hidden sm:inline">
                  Step-by-step verification of detection, explainability, live RPKI, post-quantum signing, and recovery.
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-brand-blue hidden sm:inline">
              {walkthroughOpen ? "Hide Walkthrough" : "Expand Walkthrough"}
            </span>
            <button
              type="button"
              className="p-1 rounded text-text-sub hover:text-text-main"
              aria-label={walkthroughOpen ? "Collapse walkthrough" : "Expand walkthrough"}
            >
              {walkthroughOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {walkthroughOpen && (
          <div className="p-4 border-t border-divider bg-bg-card">
            <EvaluatorGuideCard defaultCollapsed={false} />
          </div>
        )}
      </div>
    </div>
  );
};
