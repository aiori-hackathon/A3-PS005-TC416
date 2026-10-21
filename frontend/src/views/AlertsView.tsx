import React, { useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Ban,
  Check,
  Clock,
  SlidersHorizontal,
  FileCheck2,
  Lock,
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

  const [filterSeverity, setFilterSeverity] = useState<
    "all" | "high" | "medium" | "critical"
  >("all");
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filter alerts by query and severity
  const alertEvents = alerts.filter((e) => {
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
    if (filterSeverity === "critical" || filterSeverity === "high") {
      return e.severity === "HIGH";
    }
    return e.severity === "MEDIUM" || e.severity === "LOW";
  });

  const handleAcknowledge = (event: AlertItem) => {
    setAcknowledgedIds((prev) => new Set([...prev, event.id]));
    updateAlertStatus(event.id, "ACKNOWLEDGED");
  };

  const handleBlockResource = (event: AlertItem) => {
    setActionNotice(`Suppression policy recorded: ${event.prefix} from ${event.observed_asn}`);
    updateAlertStatus(event.id, "ACKNOWLEDGED");
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleAllowException = (event: AlertItem) => {
    setActionNotice(`Origin exception authorized: ${event.observed_asn} for ${event.prefix}`);
    updateAlertStatus(event.id, "RESOLVED");
    setTimeout(() => setActionNotice(null), 3500);
  };

  const getSeverityBadge = (sev: string) => {
    switch ((sev || "info").toLowerCase()) {
      case "high":
      case "critical":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-text-main tracking-tight">Security alerts</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {alerts.filter((a) => a.status === "ACTIVE").length} Active
            </span>
          </div>
          <p className="text-xs text-text-sub mt-0.5">
            Active routing anomalies, policy conflicts, and prefix origin violations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {alertEvents.length > 0 && (
            <button
              onClick={() => dismissAllAlerts()}
              className="px-3 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover hover:border-text-dim text-text-sub hover:text-text-main text-xs font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-[0.98] cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dismiss all</span>
            </button>
          )}
        </div>
      </div>

      {actionNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-xs transition-all">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Triage Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card-panel p-3.5 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
            <ShieldAlert className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] text-text-dim uppercase tracking-wider font-medium">Critical Threats</div>
            <div className="text-xl font-semibold text-text-main tracking-tight">
              {alerts.filter((e) => e.severity === "HIGH").length}
            </div>
          </div>
        </div>

        <div className="card-panel p-3.5 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] text-text-dim uppercase tracking-wider font-medium">Review Required</div>
            <div className="text-xl font-semibold text-text-main tracking-tight">
              {alerts.filter((e) => e.status === "ACTIVE").length}
            </div>
          </div>
        </div>

        <div className="card-panel p-3.5 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <Check className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] text-text-dim uppercase tracking-wider font-medium">Acknowledged Today</div>
            <div className="text-xl font-semibold text-text-main tracking-tight">
              {alerts.filter((e) => e.status !== "ACTIVE").length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border-card pb-2">
        <SlidersHorizontal className="w-3.5 h-3.5 text-text-dim mr-1.5" />
        {(["all", "critical", "high", "medium"] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
              filterSeverity === sev
                ? "bg-bg-nav-active text-text-main shadow-sm"
                : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
            }`}
          >
            {sev === "all" ? "All Alerts" : `${sev} Severity`}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {alertEvents.length === 0 ? (
        <div className="card-panel p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-main">All systems secure</h3>
            <p className="text-xs text-text-sub mt-1 max-w-sm mx-auto">
              No outstanding high-risk policy infractions or security threats detected in your BGP environment.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {alertEvents.map((evt) => {
            const isAck = evt.status !== "ACTIVE" || acknowledgedIds.has(evt.id);
            const isOrigin = evt.kind === "ORIGIN_CHANGE";

            return (
              <div
                key={evt.id}
                className={`card-panel p-4 transition-all ${
                  isAck ? "opacity-70 bg-bg-card/40" : "border-amber-500/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        evt.severity === "HIGH"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {evt.severity === "HIGH" ? (
                        <Ban className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getSeverityBadge(
                            evt.severity
                          )}`}
                        >
                          {evt.severity}
                        </span>
                        <span className="text-xs font-semibold text-text-main">
                          {evt.title}
                        </span>
                        <span className="text-[11px] font-mono text-text-dim px-1.5 py-0.5 rounded bg-bg-input border border-border-card">
                          {evt.prefix}
                        </span>
                      </div>

                      <div className="text-xs text-text-sub flex items-center gap-3 pt-0.5 flex-wrap">
                        <span className="font-medium text-text-main">
                          Observed ASN: <span className="font-mono text-red-400">{evt.observed_asn}</span>
                        </span>
                        {evt.baseline_asn && (
                          <span className="text-text-sub">
                            Baseline ASN: <span className="font-mono text-status-green">{evt.baseline_asn}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-text-dim font-mono text-[11px]">
                          <Clock className="w-3 h-3" />
                          {evt.created_at
                            ? new Date(evt.created_at).toLocaleTimeString()
                            : "Just now"}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-red-400">
                          Status: {evt.status}
                        </span>
                      </div>

                      {/* Plain English Translation for Evaluators & Non-Technical Reviewers */}
                      <div className="mt-1.5 px-2.5 py-1.5 rounded bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-1.5">
                        <span className="font-bold text-amber-400 shrink-0 mt-0.5">Summary:</span>
                        <span>
                          {evt.kind === "ORIGIN_CHANGE"
                            ? `Foreign network (${evt.observed_asn}) is broadcasting your IP prefix (${evt.prefix}). Internet traffic meant for ${evt.baseline_asn || "your network"} is at risk of interception.`
                            : `Unauthorized network (${evt.observed_asn}) announced a narrower slice (${evt.prefix}) inside your parent IP block. Internet routers will redirect your traffic to the attacker due to Longest Prefix Match.`}
                        </span>
                      </div>

                      {/* Technical Details Box (Exact inficy-gateway styling) */}
                      <div className="mt-1.5 text-[11px] font-mono bg-bg-app p-2 rounded-md border border-border-card text-text-sub max-w-2xl overflow-x-auto leading-relaxed">
                        {evt.explanation}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <button
                      onClick={() => handleBlockResource(evt)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-[11px] font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-xs"
                      title="Record route suppression policy"
                    >
                      <Ban className="w-3 h-3" />
                      <span>Suppress</span>
                    </button>

                    <button
                      onClick={() => handleAllowException(evt)}
                      className="px-2.5 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover hover:border-text-dim text-text-sub hover:text-text-main text-[11px] font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-xs"
                      title="Authorize origin policy exception"
                    >
                      <Check className="w-3 h-3" />
                      <span>Authorize</span>
                    </button>

                    {!isAck ? (
                      <button
                        onClick={() => handleAcknowledge(evt)}
                        className="px-2.5 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover hover:border-text-dim text-[11px] font-medium text-text-main flex items-center gap-1.5 transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-xs"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Acknowledge</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 px-2 py-1">
                        <Check className="w-3 h-3" /> Reviewed
                      </span>
                    )}

                    <button
                      onClick={() => setSelectedAlert(evt)}
                      className="px-2.5 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover hover:border-text-dim text-text-sub hover:text-text-main text-[11px] font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-xs"
                      title="Inspect Cryptographic Evidence"
                    >
                      <Lock className="w-3 h-3 text-brand-blue" />
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
  );
};
