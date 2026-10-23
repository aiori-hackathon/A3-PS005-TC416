import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Check,
  Clock,
  Lock,
  ChevronDown,
  ChevronUp,
  SearchCheck,
  Ban,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";
import { AlertItem } from "../types";

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

  const [filterSeverity, setFilterSeverity] = useState<"all" | "high" | "medium">("all");
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

  // Filter alerts by query and severity
  const filteredAlerts = alerts.filter((e) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        e.prefix.toLowerCase().includes(q) ||
        e.observed_asn.toLowerCase().includes(q) ||
        (e.baseline_asn && e.baseline_asn.toLowerCase().includes(q)) ||
        e.title.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterSeverity === "all") return true;
    if (filterSeverity === "high") {
      return e.severity === "HIGH";
    }
    return e.severity === "MEDIUM" || e.severity === "LOW";
  });

  const activeCount = alerts.filter((a) => a.status === "ACTIVE").length;

  const handleAcknowledge = (event: AlertItem) => {
    updateAlertStatus(event.id, "ACKNOWLEDGED");
    setActionNotice(`Acknowledged alert for ${event.prefix}.`);
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
            <h1 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">
              Alerts
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                activeCount > 0
                  ? "bg-red-500/15 text-red-400 border-red-500/30"
                  : "bg-status-green-bg text-status-green border-green-500/30"
              }`}
            >
              {activeCount} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            Active routing anomalies, policy conflicts, and origin conflicts.
          </p>
        </div>

        {activeCount > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => dismissAllAlerts()}
              className="px-3.5 py-1.5 rounded-xl bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-text-sub hover:text-text-main text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Acknowledge all</span>
            </button>
          </div>
        )}
      </div>

      {actionNotice && (
        <div className="bg-status-green-bg border border-green-500/30 text-status-green px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Apple Segmented Control */}
      <div className="inline-flex p-1 rounded-xl bg-bg-input border border-border-card text-xs">
        {(["all", "high", "medium"] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
              filterSeverity === sev
                ? "bg-bg-nav-active text-text-main shadow-xs font-semibold"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            {sev === "all" ? "All alerts" : `${sev} severity`}
          </button>
        ))}
      </div>

      {/* Alert List */}
      {filteredAlerts.length === 0 ? (
        <div className="card-panel p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-status-green-bg text-status-green flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-main">No alerts matching filter</h2>
            <p className="text-xs text-text-sub mt-1 max-w-sm mx-auto">
              All routing announcements are consistent with established baseline origins.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredAlerts.map((evt) => {
            const isExpanded = expandedIds.has(evt.id);
            const isHigh = evt.severity === "HIGH";
            const isActive = evt.status === "ACTIVE";

            return (
              <div
                key={evt.id}
                className={`card-panel overflow-hidden transition-all duration-150 ${
                  isActive ? "" : "opacity-75"
                }`}
              >
                {/* Main Incident Row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        isHigh
                          ? "bg-red-500/15 text-red-400 border border-red-500/25"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                      }`}
                    >
                      {evt.severity}
                    </span>

                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-text-main">
                          {evt.title}
                        </span>
                        <span className="font-mono text-xs font-semibold text-brand-blue bg-blue-500/10 px-1.5 py-0.5 rounded">
                          {evt.prefix}
                        </span>
                      </div>

                      <div className="text-[11px] text-text-sub flex items-center gap-2.5 flex-wrap pt-0.5">
                        <span>
                          Observed: <span className="font-mono text-red-400 font-medium">{evt.observed_asn}</span>
                        </span>
                        {evt.baseline_asn && (
                          <>
                            <span>•</span>
                            <span>
                              Baseline: <span className="font-mono text-status-green font-medium">{evt.baseline_asn}</span>
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-text-dim font-mono">
                          {evt.created_at
                            ? new Date(evt.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Just now"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {isActive ? (
                      <button
                        onClick={() => handleAcknowledge(evt)}
                        className="px-3 py-1.5 rounded-xl bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-[11px] font-medium text-text-main transition-colors flex items-center gap-1 cursor-pointer"
                        title="Acknowledge this incident"
                      >
                        <Check className="w-3 h-3 text-status-green" />
                        <span>Acknowledge</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-text-dim px-2 py-0.5 font-medium">
                        {evt.status}
                      </span>
                    )}

                    <button
                      onClick={() => setSelectedAlert(evt)}
                      className="px-3 py-1.5 rounded-xl bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-[11px] font-medium text-text-sub hover:text-text-main transition-colors flex items-center gap-1 cursor-pointer"
                      title="Inspect Cryptographic Evidence"
                    >
                      <Lock className="w-3 h-3 text-brand-blue" />
                      <span>Evidence</span>
                    </button>

                    <button
                      onClick={() => toggleExpand(evt.id)}
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

                {/* Progressive Disclosure: Expandable Detail Drawer */}
                {isExpanded && (
                  <div className="px-4 py-3.5 bg-bg-input border-t border-border-item text-xs space-y-3">
                    <div className="space-y-1">
                      <div className="text-[11px] text-text-dim font-medium uppercase tracking-wider">
                        Incident Explanation
                      </div>
                      <p className="text-text-sub font-mono text-[11px] bg-bg-card p-3 rounded-xl border border-border-card leading-relaxed">
                        {evt.explanation || evt.title}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border-card">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCheckRpki(evt)}
                          className="px-2.5 py-1 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-[11px] font-medium text-text-sub hover:text-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <SearchCheck className="w-3 h-3 text-brand-blue" />
                          <span>Check RPKI</span>
                        </button>

                        <button
                          onClick={() => handleRecordSuppression(evt)}
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Record route suppression policy"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Suppress route</span>
                        </button>

                        <button
                          onClick={() => handleAuthorizeOrigin(evt)}
                          className="px-2.5 py-1 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-[11px] font-medium text-text-sub hover:text-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Authorize origin exception"
                        >
                          <Check className="w-3 h-3 text-status-green" />
                          <span>Authorize origin</span>
                        </button>
                      </div>

                      <div className="text-[11px] text-text-dim font-mono">
                        Rule: {evt.kind || "ORIGIN_CHANGE"}
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
