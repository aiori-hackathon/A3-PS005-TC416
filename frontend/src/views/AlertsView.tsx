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
  Network,
  Lock,
  ArrowUpRight,
  Shield,
  Activity,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";
import { AlertItem } from "../types";
import { BGPTopologyGraph } from "../components/BGPTopologyGraph";

export const AlertsView: React.FC = () => {
  const {
    alerts,
    updateAlertStatus,
    dismissAllAlerts,
    setSelectedAlert,
    setRpkiTarget,
    searchQuery,
    seedDemoDataAction,
    setActiveTab,
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
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-text-main tracking-tight">
              Explainable Anomaly Telemetry
            </h2>
            <span className="badge badge-error">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              <span>{activeAlerts.length} Active Threat{activeAlerts.length !== 1 ? "s" : ""}</span>
            </span>
          </div>
          <p className="text-xs text-text-sub mt-0.5">
            Real-time origin-AS conflicts, subprefix hijacks, and visual RFC 8785 containment telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeAlerts.length > 0 && (
            <button
              onClick={() => dismissAllAlerts()}
              className="btn btn-secondary text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
              <span>Resolve all active</span>
            </button>
          )}
        </div>
      </div>

      {/* Triage Status Banner (3 Interactive KPI Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div
          onClick={() => setFilterType("ORIGIN_CHANGE")}
          className={`card-panel p-4 flex items-center justify-between cursor-pointer card-accent-red hover:-translate-y-0.5 transition-all ${
            filterType === "ORIGIN_CHANGE" ? "ring-2 ring-red-500/40" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-text-dim font-semibold uppercase tracking-wider">
                Origin Conflicts
              </div>
              <div className="text-xl font-bold text-text-main tracking-tight">
                {originAlerts.length}
              </div>
            </div>
          </div>
          <span className="text-xs text-text-dim hover:text-text-main">
            {filterType === "ORIGIN_CHANGE" ? "● Active" : "Filter →"}
          </span>
        </div>

        <div
          onClick={() => setFilterType("SUBPREFIX_ANOMALY")}
          className={`card-panel p-4 flex items-center justify-between cursor-pointer card-accent-amber hover:-translate-y-0.5 transition-all ${
            filterType === "SUBPREFIX_ANOMALY" ? "ring-2 ring-amber-500/40" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-text-dim font-semibold uppercase tracking-wider">
                Subprefix Hijacks
              </div>
              <div className="text-xl font-bold text-text-main tracking-tight">
                {subprefixAlerts.length}
              </div>
            </div>
          </div>
          <span className="text-xs text-text-dim hover:text-text-main">
            {filterType === "SUBPREFIX_ANOMALY" ? "● Active" : "Filter →"}
          </span>
        </div>

        <div
          onClick={() => setFilterType("all")}
          className={`card-panel p-4 flex items-center justify-between cursor-pointer card-accent-green hover:-translate-y-0.5 transition-all ${
            filterType === "all" ? "ring-2 ring-emerald-500/40" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-text-dim font-semibold uppercase tracking-wider">
                Resolved / Inactive
              </div>
              <div className="text-xl font-bold text-text-main tracking-tight">
                {resolvedAlerts.length}
              </div>
            </div>
          </div>
          <span className="text-xs text-text-dim hover:text-text-main">
            {filterType === "all" ? "● All" : "Reset →"}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Quick Action */}
      <div className="flex items-center justify-between border-b border-border-card pb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal className="w-3.5 h-3.5 text-text-dim mr-1" />
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
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterType === tab.id
                  ? "bg-bg-nav-active text-text-main font-semibold shadow-xs"
                  : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-text-dim font-mono">
          Showing {filteredAlerts.length} of {alerts.length} events
        </span>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="card-panel p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
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
            className="btn btn-primary text-xs mt-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seed Benchmark Incidents</span>
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
                    ? "opacity-65 card-accent-green"
                    : isAck
                    ? "card-accent-amber"
                    : isOrigin
                    ? "card-accent-red"
                    : "card-accent-amber"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 border ${
                        isOrigin
                          ? "bg-red-500/10 border-red-500/20 text-red-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
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
                          className={`badge ${
                            evt.severity === "HIGH" ? "badge-error" : "badge-amber"
                          }`}
                        >
                          {evt.severity}
                        </span>
                        <span className="text-sm font-bold text-text-main tracking-tight">
                          {evt.title}
                        </span>
                        <span className="text-xs font-mono font-semibold text-brand-blue px-2 py-0.5 rounded-md bg-bg-input border border-border-card">
                          {evt.prefix}
                        </span>
                        {evt.scenario && (
                          <span className="text-[10px] font-medium text-text-dim bg-bg-app border border-border-card px-2 py-0.5 rounded-md">
                            {evt.scenario}
                          </span>
                        )}
                      </div>

                      {/* Plain-Language Explanation */}
                      <p className="text-xs text-text-sub leading-relaxed">
                        {evt.explanation}
                      </p>

                      {/* Interactive SVG BGP Route Topology Diagram Component */}
                      <BGPTopologyGraph alert={evt} />

                      {/* Quick Meta Footer */}
                      <div className="flex items-center gap-4 text-xs text-text-dim pt-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {new Date(evt.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-brand-blue" />
                          <span className="font-mono text-[11px] text-text-sub">
                            Evidence ID: {evt.id.substring(0, 12)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        isResolved
                          ? "bg-emerald-500/10 text-status-green border-emerald-500/20"
                          : isAck
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse"
                      }`}
                    >
                      {evt.status}
                    </span>

                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        onClick={() => setSelectedAlert(evt)}
                        title="Inspect RFC 8785 Canonical JSON & Post-Quantum Signatures"
                        className="btn btn-secondary text-xs px-2.5 py-1.5"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-brand-blue" />
                        <span>Evidence</span>
                      </button>

                      <button
                        onClick={() => {
                          setRpkiTarget({
                            asn: evt.observed_asn,
                            prefix: evt.prefix,
                          });
                          setActiveTab("rpki");
                        }}
                        title="Query RPKI ROA Table"
                        className="btn btn-secondary text-xs px-2.5 py-1.5"
                      >
                        <SearchCheck className="w-3.5 h-3.5 text-text-sub" />
                        <span>RPKI</span>
                      </button>

                      {evt.status === "ACTIVE" && (
                        <button
                          onClick={() => updateAlertStatus(evt.id, "ACKNOWLEDGED")}
                          title="Mark as Acknowledged"
                          className="btn btn-secondary text-xs px-2 py-1.5"
                        >
                          Ack
                        </button>
                      )}

                      {evt.status !== "RESOLVED" && (
                        <button
                          onClick={() => updateAlertStatus(evt.id, "RESOLVED")}
                          title="Resolve Anomaly"
                          className="btn btn-secondary text-xs px-2 py-1.5 text-status-green hover:bg-emerald-500/10 hover:border-emerald-500/30"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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
