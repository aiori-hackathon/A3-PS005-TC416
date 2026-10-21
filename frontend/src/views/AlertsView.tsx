import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  FileText,
  Ban,
  Check,
  CheckCheck,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";
import { AlertItem } from "../types";

export const AlertsView: React.FC = () => {
  const {
    alerts,
    updateAlertStatus,
    dismissAllAlerts,
    setSelectedAlert,
    searchQuery,
  } = useHoraqStore();

  const [filterSeverity, setFilterSeverity] = useState<"all" | "high" | "medium">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "acknowledged" | "resolved">("all");
  const [isGrouped, setIsGrouped] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Reconciled Counts directly from the raw alert array
  const totalAlertsCount = alerts.length;
  const activeCount = alerts.filter((a) => a.status === "ACTIVE").length;
  const highSeverityCount = alerts.filter((a) => a.severity === "HIGH").length;
  const resolvedCount = alerts.filter((a) => a.status === "RESOLVED").length;

  // Filter raw alerts first based on search and filters
  const filteredAlerts = useMemo(() => {
    return alerts.filter((e) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          e.prefix.toLowerCase().includes(q) ||
          e.observed_asn.toLowerCase().includes(q) ||
          (e.baseline_asn && e.baseline_asn.toLowerCase().includes(q)) ||
          e.title.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterSeverity !== "all" && e.severity.toLowerCase() !== filterSeverity) {
        return false;
      }
      if (filterStatus !== "all" && e.status.toLowerCase() !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [alerts, searchQuery, filterSeverity, filterStatus]);

  // Group alerts by (prefix, observed_asn, kind) to solve repeated row visual noise
  const groupedIncidents = useMemo(() => {
    if (!isGrouped) return null;
    const map = new Map<string, { latest: AlertItem; items: AlertItem[] }>();

    for (const item of filteredAlerts) {
      const key = `${item.prefix}::${item.observed_asn}::${item.kind}`;
      if (!map.has(key)) {
        map.set(key, { latest: item, items: [item] });
      } else {
        const group = map.get(key)!;
        group.items.push(item);
        // keep latest timestamp
        if (new Date(item.created_at) > new Date(group.latest.created_at)) {
          group.latest = item;
        }
      }
    }
    return Array.from(map.values());
  }, [filteredAlerts, isGrouped]);

  const toggleGroupExpand = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleRecordSuppression = (alert: AlertItem) => {
    updateAlertStatus(alert.id, "ACKNOWLEDGED");
    setActionFeedback(
      `Recorded operator policy intent: Suppress route ${alert.prefix} from ${alert.observed_asn}. Alert acknowledged.`
    );
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleAuthorizeOrigin = (alert: AlertItem) => {
    updateAlertStatus(alert.id, "RESOLVED");
    setActionFeedback(
      `Authorized policy exception for ${alert.observed_asn} on ${alert.prefix}. Incident marked resolved.`
    );
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleAcknowledge = (alert: AlertItem) => {
    updateAlertStatus(alert.id, "ACKNOWLEDGED");
    setActionFeedback(`Incident ${alert.id.slice(0, 8)} acknowledged without policy change.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-main tracking-tight">
              Security alerts ledger
            </h1>
            <span className="px-2 py-0.2 rounded text-[11px] font-semibold bg-status-red-bg text-status-red border border-status-red">
              {activeCount} Unreviewed
            </span>
          </div>
          <p className="text-xs text-text-sub mt-0.5">
            Investigate origin ASN conflicts, subprefix containment anomalies, and record operator policy decisions.
          </p>
        </div>

        {activeCount > 0 && (
          <button
            onClick={() => dismissAllAlerts()}
            className="px-3 py-1.5 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-text-sub hover:text-text-main text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <CheckCheck className="w-3.5 h-3.5 text-status-green" />
            <span>Mark all unreviewed as resolved</span>
          </button>
        )}
      </div>

      {/* 2. Reconciled Metrics Cards (Single Source of Truth) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-panel p-3.5 space-y-1">
          <div className="text-[11px] text-text-dim font-medium uppercase tracking-wider">
            Total recorded
          </div>
          <div className="text-xl font-bold text-text-main font-mono">
            {totalAlertsCount}
          </div>
          <div className="text-[11px] text-text-sub">
            All stored anomaly events
          </div>
        </div>

        <div className="card-panel p-3.5 space-y-1">
          <div className="text-[11px] text-text-dim font-medium uppercase tracking-wider">
            Unreviewed
          </div>
          <div className="text-xl font-bold text-status-red font-mono">
            {activeCount}
          </div>
          <div className="text-[11px] text-text-sub">
            Status: ACTIVE
          </div>
        </div>

        <div className="card-panel p-3.5 space-y-1">
          <div className="text-[11px] text-text-dim font-medium uppercase tracking-wider">
            High severity
          </div>
          <div className="text-xl font-bold text-text-main font-mono">
            {highSeverityCount}
          </div>
          <div className="text-[11px] text-text-sub">
            Origin & subprefix risks
          </div>
        </div>

        <div className="card-panel p-3.5 space-y-1">
          <div className="text-[11px] text-text-dim font-medium uppercase tracking-wider">
            Resolved / Authorized
          </div>
          <div className="text-xl font-bold text-status-green font-mono">
            {resolvedCount}
          </div>
          <div className="text-[11px] text-text-sub">
            Status: RESOLVED
          </div>
        </div>
      </div>

      {/* Action Notification Feedback Banner */}
      {actionFeedback && (
        <div className="p-3 rounded bg-bg-card border border-brand-blue/30 text-xs text-text-main flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-blue shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* 3. Filters & Grouping Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-b border-border-card pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-3.5 h-3.5 text-text-dim mr-1" />
          
          {/* Severity Filter */}
          <div className="flex items-center rounded bg-bg-app border border-border-card p-0.5">
            {(["all", "high", "medium"] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors cursor-pointer ${
                  filterSeverity === sev
                    ? "bg-bg-btn text-text-main shadow-xs"
                    : "text-text-sub hover:text-text-main"
                }`}
              >
                {sev === "all" ? "All Severities" : `${sev} Severity`}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center rounded bg-bg-app border border-border-card p-0.5">
            {(["all", "active", "acknowledged", "resolved"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors cursor-pointer ${
                  filterStatus === st
                    ? "bg-bg-btn text-text-main shadow-xs"
                    : "text-text-sub hover:text-text-main"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Grouping Toggle */}
        <label className="flex items-center gap-2 text-text-sub cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isGrouped}
            onChange={(e) => setIsGrouped(e.target.checked)}
            className="rounded border-border-card bg-bg-input text-brand-blue"
          />
          <span>Group repeated updates for same prefix/ASN</span>
        </label>
      </div>

      {/* 4. Incident Cards List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="card-panel p-10 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-status-green mx-auto" />
            <h3 className="text-sm font-semibold text-text-main">
              No matching alerts found
            </h3>
            <p className="text-xs text-text-sub max-w-sm mx-auto">
              No security anomalies match your active filters. All observed BGP announcements comply with baseline policies.
            </p>
          </div>
        ) : isGrouped && groupedIncidents ? (
          // Grouped Display
          groupedIncidents.map(({ latest, items }) => {
            const groupKey = `${latest.prefix}::${latest.observed_asn}::${latest.kind}`;
            const isExpanded = expandedGroups.has(groupKey);
            const isOrigin = latest.kind === "ORIGIN_CHANGE";
            const isSubprefix = latest.kind === "SUBPREFIX_ANOMALY";
            const isResolved = latest.status === "RESOLVED";

            return (
              <div
                key={groupKey}
                className={`card-panel transition-colors ${
                  isResolved
                    ? "opacity-60 bg-bg-card/50"
                    : "border-border-card hover:border-text-dim"
                }`}
              >
                {/* Main Incident Summary Row */}
                <div className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Tags & Title */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                            latest.severity === "HIGH"
                              ? "bg-status-red-bg text-status-red border border-status-red"
                              : "bg-status-amber-bg text-status-amber border border-status-amber"
                          }`}
                        >
                          {latest.severity}
                        </span>

                        <span className="font-semibold text-xs text-text-main">
                          {isOrigin
                            ? "Origin ASN Conflict"
                            : isSubprefix
                            ? "Subprefix Containment Anomaly"
                            : latest.title}
                        </span>

                        <span className="font-mono text-xs text-text-main bg-bg-app px-2 py-0.5 rounded border border-border-card font-medium">
                          {latest.prefix}
                        </span>

                        {items.length > 1 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-bg-app text-text-sub border border-border-card">
                            {items.length} observations
                          </span>
                        )}

                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-semibold uppercase ${
                            latest.status === "ACTIVE"
                              ? "bg-status-red-bg text-status-red border border-status-red"
                              : latest.status === "RESOLVED"
                              ? "bg-status-green-bg text-status-green border border-status-green"
                              : "bg-status-amber-bg text-status-amber border border-status-amber"
                          }`}
                        >
                          {latest.status}
                        </span>
                      </div>

                      {/* ASN Relationship Comparison */}
                      <div className="text-xs text-text-sub flex items-center gap-3 flex-wrap">
                        <span>
                          Observed origin:{" "}
                          <strong className="font-mono text-status-red font-semibold">
                            {latest.observed_asn}
                          </strong>
                        </span>
                        {latest.baseline_asn && (
                          <span>
                            Reference baseline:{" "}
                            <strong className="font-mono text-status-green font-semibold">
                              {latest.baseline_asn}
                            </strong>
                          </span>
                        )}
                        <span className="text-text-dim flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>Latest: {new Date(latest.created_at).toLocaleTimeString()}</span>
                        </span>
                      </div>

                      {/* Plain-English Explanation */}
                      <div className="p-2.5 rounded bg-bg-app border border-border-card text-xs text-text-sub leading-relaxed">
                        <strong className="text-text-main font-semibold block mb-0.5">
                          {isOrigin
                            ? "Why this matters: Unauthorized Origin Claim"
                            : "Why this matters: Longest Prefix Match Interception Risk"}
                        </strong>
                        <p className="text-[11px] text-text-sub">
                          {isOrigin
                            ? `Autonomous System ${latest.observed_asn} announced route ${latest.prefix}, which differs from the established baseline origin ${latest.baseline_asn || "of this prefix"}. External routers accepting this update will direct traffic away from the legitimate owner.`
                            : `A more-specific subnet (${latest.prefix}) was announced by ${latest.observed_asn}. In BGP, routers prefer the most specific prefix length regardless of path attributes, placing all traffic to this slice at risk of interception.`}
                        </p>
                      </div>
                    </div>

                    {/* Operational Decision Actions */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 sm:self-start">
                      <button
                        onClick={() => handleRecordSuppression(latest)}
                        className="px-2.5 py-1.5 rounded bg-bg-btn border border-border-card hover:border-status-red hover:text-status-red text-text-sub text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Record operator decision to suppress/filter this route"
                      >
                        <Ban className="w-3 h-3 text-status-red" />
                        <span>Suppress route</span>
                      </button>

                      <button
                        onClick={() => handleAuthorizeOrigin(latest)}
                        className="px-2.5 py-1.5 rounded bg-bg-btn border border-border-card hover:border-status-green hover:text-status-green text-text-sub text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Authorize this origin as a legitimate exception/migration"
                      >
                        <Check className="w-3 h-3 text-status-green" />
                        <span>Authorize</span>
                      </button>

                      {latest.status === "ACTIVE" && (
                        <button
                          onClick={() => handleAcknowledge(latest)}
                          className="px-2.5 py-1.5 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-text-sub hover:text-text-main text-xs font-medium transition-colors cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedAlert(latest)}
                        className="px-2.5 py-1.5 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-brand-blue text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Inspect RFC 8785 evidence record and SHA-256 integrity"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Evidence</span>
                      </button>
                    </div>
                  </div>

                  {/* Expand History Toggle for Groups with Multiple Occurrences */}
                  {items.length > 1 && (
                    <div className="pt-2 border-t border-border-item">
                      <button
                        onClick={() => toggleGroupExpand(groupKey)}
                        className="text-[11px] text-text-dim hover:text-text-main flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        <span>
                          {isExpanded ? "Hide" : "Show"} history ({items.length} occurrences from{" "}
                          {new Date(items[items.length - 1].created_at).toLocaleTimeString()})
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1 pl-4 border-l border-border-card">
                          {items.map((subItem) => (
                            <div
                              key={subItem.id}
                              className="text-[11px] font-mono text-text-dim flex items-center justify-between py-1 border-b border-border-item/40"
                            >
                              <span>{new Date(subItem.created_at).toLocaleString()}</span>
                              <span>Collector: {subItem.collector || "rrc00"}</span>
                              <span className="text-text-sub">Status: {subItem.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          // Stream Display (Un-grouped)
          filteredAlerts.map((alert) => (
            <div key={alert.id} className="card-panel p-4 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-status-red-bg text-status-red border border-status-red">
                    {alert.severity}
                  </span>
                  <span className="font-semibold text-xs text-text-main">{alert.title}</span>
                  <span className="font-mono text-xs text-text-main bg-bg-app px-1.5 py-0.2 rounded border border-border-card">
                    {alert.prefix}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className="px-2.5 py-1 rounded bg-bg-btn border border-border-card text-brand-blue text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3" />
                  <span>Evidence</span>
                </button>
              </div>
              <div className="text-xs text-text-sub flex items-center gap-3">
                <span>Observed: <strong className="font-mono text-status-red">{alert.observed_asn}</strong></span>
                {alert.baseline_asn && (
                  <span>Expected: <strong className="font-mono text-status-green">{alert.baseline_asn}</strong></span>
                )}
                <span className="text-text-dim font-mono text-[11px]">
                  {new Date(alert.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
