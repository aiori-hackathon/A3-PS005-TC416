import React, { useEffect, useState } from "react";
import {
  History,
  X,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Clock,
  Layers,
  Users,
  Eye,
  Info,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { api } from "../api";
import { BaselineHistoryItem, RouteBaseline } from "../types";
import { formatCount } from "../utils/format";

interface BaselineProvenanceTimelineProps {
  prefix: string;
  baseline?: RouteBaseline | null;
  onClose: () => void;
}

export const BaselineProvenanceTimeline: React.FC<BaselineProvenanceTimelineProps> = ({
  prefix,
  baseline,
  onClose,
}) => {
  const [history, setHistory] = useState<BaselineHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getRouteHistory(prefix);
      setHistory(res.history || []);
    } catch (err: any) {
      setError(err.message || "Failed to load baseline provenance history.");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [prefix]);

  const currentStatus = baseline?.status || (history.length > 0 ? history[0].new_status : "PROMOTED");
  const currentOrigin = baseline?.origin_asn || (history.length > 0 ? history[0].origin_asn : "Unavailable");
  const currentPeers = baseline?.peer_count ?? (history.length > 0 ? history[0].peer_count : 0);
  const currentObs = baseline?.observation_count ?? (history.length > 0 ? history[0].observation_count : 0);

  // Anti-poisoning invariant threshold checks (Proposal Page 3: Min 2 peers, 3 observations)
  const peerThresholdMet = currentPeers >= 2;
  const obsThresholdMet = currentObs >= 3;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-2xl bg-bg-app border-l border-divider h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-divider bg-bg-card flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                <History className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-text-main tracking-tight">
                Baseline Provenance Timeline
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  currentStatus === "PROMOTED"
                    ? "bg-badge-green-bg text-status-green border border-green-300 dark:border-green-900"
                    : currentStatus === "CANDIDATE"
                    ? "bg-badge-amber-bg text-amber-500 border border-amber-500/30"
                    : "bg-status-critical-bg text-status-critical border border-red-300 dark:border-red-900"
                }`}
              >
                {currentStatus}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-text-sub">
              <span>Prefix: <strong className="text-brand-blue">{prefix}</strong></span>
              <span>•</span>
              <span>Origin: <strong className="text-accent-cyan">{currentOrigin}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="p-1.5 rounded-md text-text-dim hover:text-text-main hover:bg-bg-interactive transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh timeline records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-text-dim hover:text-text-main hover:bg-bg-interactive transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Invariant Policy & Multi-Peer Corroboration Status */}
          <div className="card-panel p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-main flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-brand-blue" />
                Anti-Poisoning & Peer Diversity Thresholds
              </span>
              <span className="text-[10px] font-mono text-text-dim">
                RFC-aligned Route Sanitization
              </span>
            </div>

            <p className="text-[11px] text-text-sub leading-relaxed">
              Under HORA-Q's strict baseline policy, unexpected announcements are isolated as{" "}
              <code className="text-amber-500 font-bold">CANDIDATE</code> until corroborated by at least 2 distinct BGP peers across 3 observations.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
              <div className="p-2.5 rounded bg-bg-app border border-divider flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-text-dim uppercase">Distinct Peers</div>
                  <div className="font-bold text-text-main text-sm">
                    {currentPeers} <span className="text-xs text-text-dim font-normal">/ 2 req</span>
                  </div>
                </div>
                {peerThresholdMet ? (
                  <CheckCircle2 className="w-4 h-4 text-status-green" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500" />
                )}
              </div>

              <div className="p-2.5 rounded bg-bg-app border border-divider flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-text-dim uppercase">Total Observations</div>
                  <div className="font-bold text-text-main text-sm">
                    {currentObs} <span className="text-xs text-text-dim font-normal">/ 3 req</span>
                  </div>
                </div>
                {obsThresholdMet ? (
                  <CheckCircle2 className="w-4 h-4 text-status-green" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500" />
                )}
              </div>
            </div>
          </div>

          {/* Timeline Records Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-main uppercase tracking-wider">
                  Append-Only Audit Log
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-bg-interactive text-text-sub border border-divider">
                  {formatCount(history.length, "Transition Record", "Transition Records")}
                </span>
              </div>
              <span className="text-[10px] text-text-dim">Source: SQLite `baseline_history`</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-text-dim space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-blue" />
                <p>Loading immutable provenance records...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-md bg-status-critical-bg border border-red-300 dark:border-red-900 text-status-critical space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Unable to retrieve provenance trail</span>
                </div>
                <p className="text-[11px]">{error}</p>
                <button
                  onClick={fetchHistory}
                  className="px-3 py-1 rounded bg-bg-card border border-divider text-text-main text-xs font-medium cursor-pointer"
                >
                  Retry Request
                </button>
              </div>
            ) : history.length === 0 ? (
              <div className="card-panel p-8 text-center space-y-2">
                <Info className="w-8 h-8 text-text-dim mx-auto" />
                <div className="text-sm font-semibold text-text-main">
                  No Explicit Transition Records
                </div>
                <p className="text-xs text-text-sub max-w-md mx-auto leading-relaxed">
                  No subsequent state changes recorded for <code className="text-brand-blue">{prefix}</code>.
                  The route baseline operates on initial authorized configuration.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-divider">
                {history.map((item, idx) => {
                  const isSeed = item.transition_type === "AUTHORIZED_SEED";
                  const isPromoted = item.new_status === "PROMOTED";
                  const isCandidate = item.new_status === "CANDIDATE";
                  const isWithdrawn = item.new_status === "WITHDRAWN";

                  return (
                    <div key={item.id} className="relative group">
                      {/* Timeline Dot */}
                      <span
                        className={`absolute -left-[19px] top-1.5 w-3 h-3 rounded-full border-2 bg-bg-app ${
                          isSeed || isPromoted
                            ? "border-status-green bg-status-green"
                            : isCandidate
                            ? "border-amber-500 bg-amber-500"
                            : isWithdrawn
                            ? "border-brand-blue bg-brand-blue"
                            : "border-text-dim bg-bg-card"
                        }`}
                      />

                      {/* Card Content */}
                      <div className="card-panel p-3.5 space-y-2 border-divider hover:border-brand-blue/50 transition-colors">
                        {/* Event Header */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-text-main">
                              Audit #{item.id}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                                isSeed
                                  ? "bg-badge-green-bg text-status-green border border-green-300 dark:border-green-900"
                                  : isPromoted
                                  ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30"
                                  : isCandidate
                                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                                  : "bg-bg-interactive text-text-sub border border-divider"
                              }`}
                            >
                              {item.transition_type}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 font-mono text-[10px] text-text-dim">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(item.created_at).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* State Transition Diagram */}
                        <div className="flex items-center gap-2 p-2 rounded bg-bg-app border border-divider font-mono text-xs">
                          <span className="text-text-dim">
                            {item.prior_status ? item.prior_status : "[NONE]"}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-text-dim shrink-0" />
                          <span
                            className={`font-bold ${
                              isPromoted
                                ? "text-status-green"
                                : isCandidate
                                ? "text-amber-500"
                                : "text-text-main"
                            }`}
                          >
                            {item.new_status}
                          </span>
                          <span className="text-text-dim">•</span>
                          <span className="text-text-sub">
                            Origin: <strong className="text-accent-cyan">{item.origin_asn}</strong>
                          </span>
                        </div>

                        {/* Decision Reason */}
                        <div className="text-[11px] text-text-sub leading-snug">
                          <strong className="text-text-main font-semibold">Decision Reason: </strong>
                          <span>{item.reason}</span>
                        </div>

                        {/* Provenance Metadata Footer */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-divider text-[10px] text-text-dim font-mono">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-text-sub" />
                              <span>Peers: <strong className="text-text-main">{item.peer_count}</strong></span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-text-sub" />
                              <span>Observations: <strong className="text-text-main">{item.observation_count}</strong></span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {item.triggering_observation_id && (
                              <span>Obs Trigger: #{item.triggering_observation_id}</span>
                            )}
                            <span className="px-1.5 py-0.5 rounded bg-bg-interactive text-text-sub border border-divider">
                              Actor: {item.actor}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Truthful Telemetry Disclaimer */}
          <div className="p-3 rounded-md bg-bg-card border border-divider text-[11px] text-text-dim flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Truthful Provenance Invariant:</strong> Transitions depicted above are direct records from the append-only database audit log. No hypothetical transitions, synthetic peering observations, or artificial timestamps are generated.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-bg-card border-t border-divider flex items-center justify-between">
          <span className="text-xs text-text-dim font-mono">
            Immutable Baseline Table: <code className="text-text-sub">baseline_history</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-bg-btn border border-border-card text-xs font-semibold text-text-main hover:bg-bg-interactive transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
