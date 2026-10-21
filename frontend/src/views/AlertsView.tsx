import React, { useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Check,
  Clock,
  SlidersHorizontal,
  FileCheck2,
  SearchCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
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
    seedDemoDataAction,
  } = useHoraqStore();

  const [filterType, setFilterType] = useState<
    "all" | "ORIGIN_CHANGE" | "SUBPREFIX_ANOMALY" | "high" | "active"
  >("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Search and category filtering
  const filteredAlerts = alerts.filter((a) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        a.prefix.toLowerCase().includes(q) ||
        a.observed_asn.toLowerCase().includes(q) ||
        (a.baseline_asn && a.baseline_asn.toLowerCase().includes(q)) ||
        a.title.toLowerCase().includes(q) ||
        a.explanation.toLowerCase().includes(q) ||
        (a.scenario && a.scenario.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (filterType === "all") return true;
    if (filterType === "active") return a.status === "ACTIVE";
    if (filterType === "high") return a.severity === "HIGH";
    return a.kind === filterType;
  });

  const activeAlerts = alerts.filter((a) => a.status === "ACTIVE");
  const originAlerts = alerts.filter((a) => a.kind === "ORIGIN_CHANGE");
  const subprefixAlerts = alerts.filter((a) => a.kind === "SUBPREFIX_ANOMALY");
  const resolvedAlerts = alerts.filter((a) => a.status !== "ACTIVE");

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-text-main tracking-tight">
              Security Alerts & Explainable Anomalies
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
              {activeAlerts.length} Active
            </span>
          </div>
          <p className="text-xs text-text-sub mt-0.5">
            Real-time origin-AS conflicts, subprefix hijacks, and explainable containment telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeAlerts.length > 0 && (
            <button
              onClick={() => dismissAllAlerts()}
              className="px-3 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover hover:border-text-dim text-text-sub hover:text-text-main text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
              <span>Resolve all active</span>
            </button>
          )}
        </div>
      </div>

      {/* Triage Status Banner (3 Interactive Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          onClick={() => setFilterType("ORIGIN_CHANGE")}
          className="card-panel p-4 flex items-center gap-3 cursor-pointer hover:border-red-500/50 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-dim font-medium">Origin Conflicts</div>
            <div className="text-lg font-bold text-text-main">
              {originAlerts.length}
            </div>
          </div>
        </div>

        <div
          onClick={() => setFilterType("SUBPREFIX_ANOMALY")}
          className="card-panel p-4 flex items-center gap-3 cursor-pointer hover:border-amber-500/50 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-dim font-medium">Subprefix Hijacks</div>
            <div className="text-lg font-bold text-text-main">
              {subprefixAlerts.length}
            </div>
          </div>
        </div>

        <div
          onClick={() => setFilterType("all")}
          className="card-panel p-4 flex items-center gap-3 cursor-pointer hover:border-emerald-500/50 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-dim font-medium">Resolved / Inactive</div>
            <div className="text-lg font-bold text-text-main">
              {resolvedAlerts.length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border-card pb-2">
        <SlidersHorizontal className="w-3.5 h-3.5 text-text-dim mr-1.5" />
        {[
          { id: "all", label: "All Anomalies" },
          { id: "active", label: `Active (${activeAlerts.length})` },
          { id: "ORIGIN_CHANGE", label: `Origin Conflicts (${originAlerts.length})` },
          { id: "SUBPREFIX_ANOMALY", label: `Subprefix Hijacks (${subprefixAlerts.length})` },
          { id: "high", label: "High Severity" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as any)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              filterType === tab.id
                ? "bg-bg-nav-active text-text-main shadow-sm font-semibold"
                : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="card-panel p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-main">
              No anomalies found matching criteria
            </h3>
            <p className="text-xs text-text-sub mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No alerts match query "${searchQuery}". Clear search to view all.`
                : "All BGP announcements comply with established origin baselines."}
            </p>
          </div>
          <button
            onClick={() => seedDemoDataAction()}
            className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-brand-blue text-xs font-semibold hover:bg-sky-500/20 transition-colors inline-flex items-center gap-1.5 mt-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seed Realistic Benchmark Incidents</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((evt) => {
            const isResolved = evt.status === "RESOLVED";
            const isAck = evt.status === "ACKNOWLEDGED";
            const isOrigin = evt.kind === "ORIGIN_CHANGE";
            const isExpanded = expandedId === evt.id;

            return (
              <div
                key={evt.id}
                className={`card-panel p-5 transition-all ${
                  isResolved
                    ? "opacity-60 bg-bg-card/40"
                    : isAck
                    ? "border-amber-500/30"
                    : isOrigin
                    ? "border-red-500/40 shadow-sm"
                    : "border-amber-500/40 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                        isOrigin
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {isOrigin ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Title & Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            evt.severity === "HIGH"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {evt.severity}
                        </span>
                        <span className="text-sm font-bold text-text-main">
                          {evt.title}
                        </span>
                        <span className="text-xs font-mono font-semibold text-brand-blue px-2 py-0.5 rounded bg-bg-input border border-border-card">
                          {evt.prefix}
                        </span>
                        {evt.scenario && (
                          <span className="text-[10px] font-medium text-text-dim bg-bg-app border border-border-card px-2 py-0.5 rounded">
                            {evt.scenario}
                          </span>
                        )}
                      </div>

                      {/* Plain-Language Explanation */}
                      <p className="text-xs text-text-sub leading-relaxed">
                        {evt.explanation}
                      </p>

                      {/* Visual Containment & Hijack Breakdown */}
                      {isOrigin ? (
                        <div className="p-3 rounded-lg bg-bg-app border border-border-card space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-main">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                            <span>Origin-AS Conflict Analysis</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded bg-bg-card border border-border-card">
                              <span className="text-[10px] text-text-dim block">Authorized Reference Origin</span>
                              <span className="font-mono font-bold text-status-green">
                                {evt.baseline_asn || "N/A"}
                              </span>
                              <span className="text-[10px] text-text-dim block">First recorded legitimate baseline</span>
                            </div>
                            <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                              <span className="text-[10px] text-red-400 block font-semibold">Observed Rogue Origin</span>
                              <span className="font-mono font-bold text-red-400">
                                {evt.observed_asn}
                              </span>
                              <span className="text-[10px] text-red-400/80 block">Unauthorized origin injection</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-bg-app border border-border-card space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-main">
                            <Layers className="w-3.5 h-3.5 text-brand-blue" />
                            <span>BGP Subprefix Containment Breakdown</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded bg-bg-card border border-border-card">
                              <span className="text-[10px] text-text-dim block">Legitimate Parent Baseline</span>
                              <span className="font-mono font-bold text-text-main">
                                {evt.parent_prefix}
                              </span>
                              <span className="text-[10px] text-brand-blue block">
                                Origin: {evt.baseline_asn}
                              </span>
                            </div>
                            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                              <span className="text-[10px] text-amber-400 block font-semibold">Hijacked Specific Subnet</span>
                              <span className="font-mono font-bold text-amber-400">
                                {evt.prefix}
                              </span>
                              <span className="text-[10px] text-amber-400/80 block">
                                Rogue Origin: {evt.observed_asn}
                              </span>
                            </div>
                          </div>
                          <p className="text-[10px] text-text-dim italic">
                            Routing impact: Due to RFC 4271 Longest Prefix Match (LPM), routers worldwide will prefer this more-specific announcement, steering traffic away from {evt.parent_prefix}.
                          </p>
                        </div>
                      )}

                      {/* Telemetry metadata ribbon */}
                      <div className="text-xs text-text-sub flex items-center gap-4 pt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-text-dim font-mono text-[11px]">
                          <Clock className="w-3 h-3" />
                          {evt.created_at
                            ? new Date(evt.created_at).toLocaleTimeString()
                            : "Just now"}
                        </span>
                        <span className="text-[11px] text-text-dim">
                          Collector: <strong className="text-text-main font-mono">{evt.collector}</strong>
                        </span>
                        <span className="text-[11px] text-text-dim font-mono">
                          Evidence ID: {evt.evidence_id.slice(0, 16)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions on right */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <button
                      onClick={() => {
                        setRpkiTarget({
                          prefix: evt.prefix,
                          asn: evt.observed_asn,
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover hover:border-text-dim text-xs font-semibold text-text-sub hover:text-text-main flex items-center gap-1.5 transition-colors"
                      title="Validate route origin with RPKI via RIPEstat"
                    >
                      <SearchCheck className="w-3.5 h-3.5 text-brand-blue" />
                      <span>RPKI Check</span>
                    </button>

                    <button
                      onClick={() => setSelectedAlert(evt)}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 text-brand-blue text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Inspect RFC 8785 canonical evidence & test tamper resistance"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Inspect Evidence</span>
                    </button>

                    {evt.status === "ACTIVE" && (
                      <button
                        onClick={() => updateAlertStatus(evt.id, "ACKNOWLEDGED")}
                        className="px-3 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-semibold text-text-main flex items-center gap-1 transition-colors"
                        title="Acknowledge incident"
                      >
                        <Check className="w-3 h-3 text-status-amber" />
                        <span>Ack</span>
                      </button>
                    )}

                    {evt.status !== "RESOLVED" && (
                      <button
                        onClick={() => updateAlertStatus(evt.id, "RESOLVED")}
                        className="p-1.5 rounded-lg text-text-dim hover:text-status-green hover:bg-bg-nav-hover transition-colors"
                        title="Mark as resolved"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
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
