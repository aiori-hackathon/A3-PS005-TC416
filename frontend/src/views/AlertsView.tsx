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
import { groupAlertObservations, GroupedIncident } from "../utils/incidentGrouping";

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

  // Group raw observations into distinct incidents
  const allIncidents = groupAlertObservations(alerts);
  const activeIncidents = allIncidents.filter((inc) => inc.status === "ACTIVE");
  const activeIncidentsCount = activeIncidents.length;

  // Filter grouped incidents
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
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-card">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
              Alerts
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                activeIncidentsCount > 0
                  ? "bg-status-red-bg text-status-red border-red-500/35 shadow-xs"
                  : "bg-status-green-bg text-status-green border-emerald-500/35 shadow-xs"
              }`}
            >
              {activeIncidentsCount} {activeIncidentsCount === 1 ? "Active Incident" : "Active Incidents"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            Grouped routing anomaly incidents, policy conflicts, and origin observations.
          </p>
        </div>

        {activeIncidentsCount > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => dismissAllAlerts()}
              className="px-3.5 py-1.5 rounded-xl bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-text-sub hover:text-text-main text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
              <span>Acknowledge all active</span>
            </button>
          </div>
        )}
      </div>

      {actionNotice && (
        <div className="bg-status-green-bg border border-emerald-500/35 text-status-green px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all">
          <Check className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Segmented Filter Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl bg-bg-card border border-border-card text-xs">
          <button
            onClick={() => setFilterSeverity("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterSeverity === "active"
                ? "bg-bg-interactive text-brand-blue border border-border-card"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            Active ({activeIncidentsCount})
          </button>
          <button
            onClick={() => setFilterSeverity("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterSeverity === "all"
                ? "bg-bg-interactive text-brand-blue border border-border-card"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            All incidents ({allIncidents.length})
          </button>
          <button
            onClick={() => setFilterSeverity("high")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterSeverity === "high"
                ? "bg-bg-interactive text-status-red border border-border-card"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            High severity
          </button>
          <button
            onClick={() => setFilterSeverity("medium")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterSeverity === "medium"
                ? "bg-bg-interactive text-status-amber border border-border-card"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            Medium severity
          </button>
        </div>

        <div className="text-xs text-text-dim">
          {filterSeverity === "active" && (
            <span>Showing unresolved incidents requiring operator attention.</span>
          )}
          {filterSeverity === "all" && (
            <span>Includes historical acknowledged and resolved events ({alerts.length} total observations).</span>
          )}
        </div>
      </div>

      {/* Incident List */}
      {filteredIncidents.length === 0 ? (
        <div className="card-panel p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-status-green-bg text-status-green flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-main">
              {filterSeverity === "active"
                ? "Zero active incidents"
                : "No incidents matching filter"}
            </h2>
            <p className="text-xs text-text-sub mt-1 max-w-sm mx-auto">
              {filterSeverity === "active"
                ? "All known routing anomalies are currently acknowledged or resolved. Switch to 'All incidents' to inspect historical records."
                : "No incidents found matching the current search or severity criteria."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIncidents.map((inc) => {
            const isExpanded = expandedIds.has(inc.id);
            const isHigh = inc.severity === "HIGH";
            const isActive = inc.status === "ACTIVE";
            const isAck = inc.status === "ACKNOWLEDGED";

            return (
              <div
                key={inc.id}
                className="card-panel overflow-hidden transition-all duration-150 hover:border-brand-blue/30"
              >
                {/* Main Incident Row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                        isHigh
                          ? "bg-red-500/15 text-status-red border border-red-500/30"
                          : "bg-amber-500/15 text-status-amber border border-amber-500/30"
                      }`}
                    >
                      {inc.severity}
                    </span>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-text-main">
                          {inc.title}
                        </span>
                        <span className="font-mono text-xs font-bold text-text-main bg-bg-interactive border border-border-card px-2 py-0.5 rounded">
                          {inc.prefix}
                        </span>
                        {inc.occurrenceCount > 1 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-bg-interactive text-text-sub border border-border-card">
                            <Layers className="w-2.5 h-2.5 text-brand-blue" />
                            {inc.occurrenceCount} observations
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-text-sub flex items-center gap-2 flex-wrap pt-0.5">
                        <span>
                          Observed: <span className="font-mono text-status-red font-semibold">{inc.observed_asn}</span>
                        </span>
                        {inc.baseline_asn && (
                          <>
                            <span>•</span>
                            <span>
                              Baseline: <span className="font-mono text-text-main font-semibold">{inc.baseline_asn}</span>
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

                  {/* Lifecycle Status & Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        isActive
                          ? "bg-status-red-bg text-status-red border border-red-500/35"
                          : isAck
                          ? "bg-bg-interactive text-text-sub border border-border-card"
                          : "bg-status-green-bg text-status-green border border-emerald-500/30"
                      }`}
                    >
                      {inc.status}
                    </span>

                    {isActive && (
                      <button
                        onClick={() => handleAcknowledge(inc.primaryAlert)}
                        className="px-3 py-1.5 rounded-xl bg-bg-btn border border-border-card hover:border-brand-blue/40 text-[11px] font-semibold text-text-main transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Acknowledge this incident"
                      >
                        <Check className="w-3 h-3 text-status-green" />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedAlert(inc.primaryAlert)}
                      className="px-3 py-1.5 rounded-xl bg-bg-btn border border-border-card hover:border-brand-blue/40 text-[11px] font-semibold text-text-sub hover:text-text-main transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Inspect Cryptographic Evidence"
                    >
                      <Lock className="w-3 h-3 text-brand-blue" />
                      <span>Evidence</span>
                    </button>

                    <button
                      onClick={() => toggleExpand(inc.id)}
                      className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-bg-nav-hover transition-colors cursor-pointer"
                      title={isExpanded ? "Collapse details" : "Expand details"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Progressive Disclosure: Observation Timeline & Actions */}
                {isExpanded && (
                  <div className="px-4 py-3.5 bg-bg-app border-t border-border-item text-xs space-y-3.5">
                    <div className="space-y-1">
                      <div className="text-[11px] text-text-dim font-bold uppercase tracking-wider">
                        Incident Explanation
                      </div>
                      <p className="text-text-sub font-mono text-[11px] bg-bg-card p-3 rounded-xl border border-border-card leading-relaxed">
                        {inc.explanation || inc.title}
                      </p>
                    </div>

                    {/* Timeline of Individual Preserved Observations */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-text-dim font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1 text-text-sub">
                          <History className="w-3 h-3 text-brand-blue" />
                          Individual Preserved Observations ({inc.observations.length})
                        </span>
                        <span className="text-[10px] text-text-dim">All raw evidence records intact</span>
                      </div>

                      <div className="divide-y divide-border-item bg-bg-card rounded-xl border border-border-card max-h-48 overflow-y-auto">
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
                              className="px-3 py-2 flex items-center justify-between text-[11px] font-mono hover:bg-bg-hover-row transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-text-dim">#{inc.observations.length - idx}</span>
                                <span className="text-text-sub">{obsTime}</span>
                                <span className="text-text-dim">•</span>
                                <span className="text-text-dim">Collector: {obs.collector || "default"}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                                    obs.status === "ACTIVE"
                                      ? "bg-status-red-bg text-status-red"
                                      : obs.status === "ACKNOWLEDGED"
                                      ? "bg-bg-interactive text-text-sub"
                                      : "bg-status-green-bg text-status-green"
                                  }`}
                                >
                                  {obs.status}
                                </span>
                                <button
                                  onClick={() => setSelectedAlert(obs)}
                                  className="text-brand-blue hover:underline text-[10px]"
                                >
                                  Hash
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Operator Remediation Tools */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-border-item">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCheckRpki(inc.primaryAlert)}
                          className="px-3 py-1.5 rounded-lg bg-bg-card border border-border-card hover:border-brand-blue/40 text-xs font-semibold text-text-main flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <SearchCheck className="w-3.5 h-3.5 text-brand-blue" />
                          <span>Check RPKI / ROA</span>
                        </button>
                        <button
                          onClick={() => handleAuthorizeOrigin(inc.primaryAlert)}
                          className="px-3 py-1.5 rounded-lg bg-bg-card border border-border-card hover:border-emerald-500/40 text-xs font-semibold text-text-main flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-status-green" />
                          <span>Authorize Origin</span>
                        </button>
                        <button
                          onClick={() => handleRecordSuppression(inc.primaryAlert)}
                          className="px-3 py-1.5 rounded-lg bg-bg-card border border-border-card hover:border-amber-500/40 text-xs font-semibold text-text-main flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Ban className="w-3.5 h-3.5 text-status-amber" />
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
