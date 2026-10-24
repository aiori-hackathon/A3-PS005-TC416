import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Check,
  Lock,
  ChevronDown,
  ChevronUp,
  SearchCheck,
  Ban,
  Layers,
  History,
  ShieldCheck,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";
import { AlertItem } from "../types";
import { groupAlertObservations } from "../utils/incidentGrouping";

export const AlertsView: React.FC = () => {
  const {
    alerts,
    updateAlertStatus,
    dismissAllAlerts,
    setSelectedAlert,
    setRpkiTarget,
    searchQuery,
    setActiveTab,
  } = useHoraqStore();

  const [filterSeverity, setFilterSeverity] = useState<"active" | "all" | "high" | "medium">("active");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allIncidents = groupAlertObservations(alerts);
  const activeIncidents = allIncidents.filter((inc) => inc.status === "ACTIVE");
  const activeIncidentsCount = activeIncidents.length;

  const filteredIncidents = allIncidents.filter((inc) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        inc.prefix.toLowerCase().includes(q) ||
        inc.observed_asn.toLowerCase().includes(q) ||
        (inc.baseline_asn && inc.baseline_asn.toLowerCase().includes(q)) ||
        inc.title.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterSeverity === "active") {
      return inc.status === "ACTIVE";
    }
    if (filterSeverity === "all") return true;
    if (filterSeverity === "high") {
      return inc.severity === "HIGH";
    }
    return inc.severity === "MEDIUM" || inc.severity === "LOW";
  });

  const handleAcknowledge = (event: AlertItem) => {
    updateAlertStatus(event.id, "ACKNOWLEDGED");
    setActionNotice(`Acknowledged incident for ${event.prefix}.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleRecordSuppression = (event: AlertItem) => {
    updateAlertStatus(event.id, "ACKNOWLEDGED");
    setActionNotice(`Suppression policy recorded: ${event.prefix} from ${event.observed_asn}.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleAuthorizeOrigin = (event: AlertItem) => {
    updateAlertStatus(event.id, "RESOLVED");
    setActionNotice(`Origin authorized: ${event.observed_asn} for ${event.prefix}.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleCheckRpki = (event: AlertItem) => {
    setRpkiTarget({ prefix: event.prefix, asn: event.observed_asn });
    setActiveTab("rpki");
  };

  return (
    <div className="max-w-[1360px] w-full space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-divider">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[28px] font-semibold text-text-main tracking-tight">
              Security Alerts & Incidents
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                activeIncidentsCount > 0
                  ? "bg-status-critical-bg text-status-critical border-red-300 dark:border-red-900"
                  : "bg-badge-green-bg text-status-green border-green-300 dark:border-green-900"
              }`}
            >
              {activeIncidentsCount} {activeIncidentsCount === 1 ? "Active Incident" : "Active Incidents"}
            </span>
          </div>
          <p className="text-sm text-text-sub mt-1">
            Grouped routing anomaly incidents, policy conflicts, and origin observations with cryptographic attestations.
          </p>
        </div>

        {activeIncidentsCount > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => dismissAllAlerts()}
              className="px-3.5 py-1.5 rounded-md bg-bg-btn border border-border-card hover:bg-bg-interactive text-text-sub hover:text-text-main text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-status-green" />
              <span>Acknowledge All Active</span>
            </button>
          </div>
        )}
      </div>

      {actionNotice && (
        <div className="bg-badge-green-bg border border-green-300 dark:border-green-900 text-status-green px-4 py-2.5 rounded-md text-xs font-medium flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Segmented Filter Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-md border border-border-card bg-bg-card p-0.5 text-xs">
          <button
            onClick={() => setFilterSeverity("active")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              filterSeverity === "active"
                ? "bg-bg-selected text-brand-blue font-semibold"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            Active ({activeIncidentsCount})
          </button>
          <button
            onClick={() => setFilterSeverity("all")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              filterSeverity === "all"
                ? "bg-bg-selected text-brand-blue font-semibold"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            All Incidents ({allIncidents.length})
          </button>
          <button
            onClick={() => setFilterSeverity("high")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              filterSeverity === "high"
                ? "bg-bg-selected text-status-critical font-semibold"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            High Severity
          </button>
          <button
            onClick={() => setFilterSeverity("medium")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              filterSeverity === "medium"
                ? "bg-bg-selected text-status-warning font-semibold"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            Medium / Low
          </button>
        </div>

        <div className="text-xs text-text-dim">
          {filterSeverity === "active" && (
            <span>Showing unresolved incidents requiring operator review.</span>
          )}
          {filterSeverity === "all" && (
            <span>Showing full history ({alerts.length} individual observations recorded).</span>
          )}
        </div>
      </div>

      {/* Incident List / Table */}
      {filteredIncidents.length === 0 ? (
        <div className="card-panel p-10 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-status-green mx-auto" />
          <h2 className="text-sm font-semibold text-text-main">
            {filterSeverity === "active"
              ? "Zero Active Incidents"
              : "No Incidents Matching Filter"}
          </h2>
          <p className="text-xs text-text-sub max-w-sm mx-auto">
            {filterSeverity === "active"
              ? "All known routing anomalies are currently acknowledged or resolved."
              : "Try adjusting your search query or filter selection."}
          </p>
        </div>
      ) : (
        <div className="card-panel overflow-hidden divide-y divide-divider">
          {filteredIncidents.map((inc) => {
            const isExpanded = expandedIds.has(inc.id);
            const isHigh = inc.severity === "HIGH";
            const isActive = inc.status === "ACTIVE";
            const isAck = inc.status === "ACKNOWLEDGED";

            return (
              <div key={inc.id} className="transition-colors hover:bg-bg-hover-row">
                {/* Main Incident Row */}
                <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider shrink-0 mt-0.5 ${
                        isHigh
                          ? "bg-status-critical-bg text-status-critical border border-red-200 dark:border-red-900/40"
                          : "bg-badge-amber-bg text-status-warning border border-amber-200 dark:border-amber-900/40"
                      }`}
                    >
                      {inc.severity}
                    </span>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-text-main">
                          {inc.title}
                        </span>
                        <span className="font-mono text-xs font-bold text-text-main px-2 py-0.5 rounded bg-bg-interactive border border-divider">
                          {inc.prefix}
                        </span>
                        {inc.occurrenceCount > 1 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-bg-interactive text-text-sub border border-divider">
                            <Layers className="w-3 h-3 text-brand-blue" />
                            {inc.occurrenceCount} observations
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-text-sub flex items-center gap-2.5 flex-wrap">
                        <span>
                          Observed Origin: <span className="font-mono text-status-critical font-bold">{inc.observed_asn}</span>
                        </span>
                        {inc.baseline_asn && (
                          <>
                            <span>•</span>
                            <span>
                              Baseline Origin: <span className="font-mono text-text-main font-semibold">{inc.baseline_asn}</span>
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-text-dim font-mono">
                          Last seen: {inc.lastSeen
                            ? new Date(inc.lastSeen).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : "Just now"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                        isActive
                          ? "bg-status-critical-bg text-status-critical border border-red-300 dark:border-red-900"
                          : isAck
                          ? "bg-bg-interactive text-text-sub border border-divider"
                          : "bg-badge-green-bg text-status-green border border-green-300 dark:border-green-900"
                      }`}
                    >
                      {inc.status}
                    </span>

                    {isActive && (
                      <button
                        onClick={() => handleAcknowledge(inc.primaryAlert)}
                        className="px-3 py-1.5 rounded-md bg-bg-btn border border-border-card hover:bg-bg-interactive text-xs font-medium text-text-main transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Acknowledge this incident"
                      >
                        <Check className="w-3.5 h-3.5 text-status-green" />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedAlert(inc.primaryAlert)}
                      className="px-3 py-1.5 rounded-md bg-bg-btn border border-border-card hover:bg-bg-interactive text-xs font-medium text-text-main transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Inspect Cryptographic Evidence"
                    >
                      <Lock className="w-3.5 h-3.5 text-brand-blue" />
                      <span>Evidence</span>
                    </button>

                    <button
                      onClick={() => toggleExpand(inc.id)}
                      className="p-1.5 rounded-md text-text-dim hover:text-text-main hover:bg-bg-interactive transition-colors cursor-pointer"
                      title={isExpanded ? "Collapse details" : "Expand details"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Forensic Drawer */}
                {isExpanded && (
                  <div className="px-5 py-4 bg-bg-app border-t border-divider space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <div className="text-[11px] text-text-dim font-bold uppercase tracking-wider">
                        Detection Rationale
                      </div>
                      <p className="text-xs text-text-sub bg-bg-card p-3 rounded-md border border-divider font-mono leading-relaxed">
                        {inc.explanation || inc.title}
                      </p>
                    </div>

                    {/* Timeline of Individual Preserved Observations */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-text-dim font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5 text-text-sub">
                          <History className="w-3.5 h-3.5 text-brand-blue" />
                          Individual Telemetry Observations ({inc.observations.length})
                        </span>
                        <span className="text-[11px] text-text-dim">All raw RFC 8785 digests intact</span>
                      </div>

                      <div className="divide-y divide-divider bg-bg-card rounded-md border border-divider max-h-48 overflow-y-auto">
                        {inc.observations.map((obs, idx) => {
                          const obsTime = obs.created_at
                            ? new Date(obs.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : "Just now";

                          return (
                            <div
                              key={obs.id}
                              className="px-3.5 py-2 flex items-center justify-between text-xs font-mono hover:bg-bg-hover-row transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-text-dim">#{inc.observations.length - idx}</span>
                                <span className="text-text-sub">{obsTime}</span>
                                <span className="text-text-dim">•</span>
                                <span className="text-text-dim">Collector: {obs.collector || "default"}</span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span
                                  className={`px-2 py-0.2 rounded text-[10px] font-semibold ${
                                    obs.status === "ACTIVE"
                                      ? "bg-status-critical-bg text-status-critical"
                                      : obs.status === "ACKNOWLEDGED"
                                      ? "bg-bg-interactive text-text-sub"
                                      : "bg-badge-green-bg text-status-green"
                                  }`}
                                >
                                  {obs.status}
                                </span>
                                <button
                                  onClick={() => setSelectedAlert(obs)}
                                  className="text-brand-blue hover:underline text-xs"
                                >
                                  Hash Record
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-divider">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCheckRpki(inc.primaryAlert)}
                          className="px-3 py-1.5 rounded-md bg-bg-card border border-border-card hover:bg-bg-interactive text-xs font-medium text-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <SearchCheck className="w-3.5 h-3.5 text-brand-blue" />
                          <span>Check RPKI / ROA</span>
                        </button>
                        <button
                          onClick={() => handleAuthorizeOrigin(inc.primaryAlert)}
                          className="px-3 py-1.5 rounded-md bg-bg-card border border-border-card hover:bg-bg-interactive text-xs font-medium text-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-status-green" />
                          <span>Authorize Origin</span>
                        </button>
                        <button
                          onClick={() => handleRecordSuppression(inc.primaryAlert)}
                          className="px-3 py-1.5 rounded-md bg-bg-card border border-border-card hover:bg-bg-interactive text-xs font-medium text-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5 text-status-warning" />
                          <span>Suppress Policy</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
