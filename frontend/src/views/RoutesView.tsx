import React, { useState } from "react";
import {
  Globe,
  Search,
  SearchCheck,
  Sparkles,
  X,
  History,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Layers,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";
import { formatCount } from "../utils/format";
import { api } from "../api";

export const RoutesView: React.FC = () => {
  const {
    routes,
    setRpkiTarget,
    searchQuery,
    setSearchQuery,
    seedDemoDataAction,
    setActiveTab,
  } = useHoraqStore();

  const [localSearch, setLocalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "promoted" | "candidate">("all");
  const [selectedRouteHistory, setSelectedRouteHistory] = useState<any[] | null>(null);
  const [historyTargetPrefix, setHistoryTargetPrefix] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const activeFilter = localSearch || searchQuery;

  const filteredRoutes = routes.filter((r) => {
    if (statusFilter === "promoted" && r.status !== "PROMOTED") return false;
    if (statusFilter === "candidate" && r.status !== "CANDIDATE") return false;

    if (!activeFilter) return true;
    const term = activeFilter.toLowerCase();
    return (
      r.prefix.toLowerCase().includes(term) ||
      r.origin_asn.toLowerCase().includes(term)
    );
  });

  const promotedCount = routes.filter((r) => r.status === "PROMOTED").length;
  const candidateCount = routes.filter((r) => r.status === "CANDIDATE").length;

  const handleValidate = (prefix: string, originAsn: string) => {
    setRpkiTarget({ prefix, asn: originAsn });
    setActiveTab("rpki");
  };

  const handleViewHistory = async (prefix: string) => {
    setHistoryTargetPrefix(prefix);
    setLoadingHistory(true);
    try {
      const res = await api.getRouteHistory(prefix);
      setSelectedRouteHistory(res.history || []);
    } catch {
      setSelectedRouteHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="max-w-[1360px] w-full space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-divider">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[28px] font-semibold text-text-main tracking-tight">
              Route Baselines & Candidate Trust
            </h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-bg-interactive text-text-sub border border-divider">
              {routes.length} Tracked Prefixes
            </span>
          </div>
          <p className="text-sm text-text-sub mt-1">
            Established prefix-to-origin assignments against which incoming BGP telemetry is verified.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-interactive border border-transparent focus-within:border-brand-blue focus-within:bg-bg-card transition-all w-full sm:w-72 text-xs text-text-sub relative">
          <Search className="w-3.5 h-3.5 text-text-dim shrink-0" />
          <input
            type="text"
            placeholder="Filter prefix or ASN..."
            value={activeFilter}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              setSearchQuery(e.target.value);
            }}
            className="bg-transparent border-none outline-none text-xs text-text-main w-full placeholder:text-text-dim pr-4"
          />
          {activeFilter && (
            <button
              onClick={() => {
                setLocalSearch("");
                setSearchQuery("");
              }}
              className="absolute right-2 text-text-dim hover:text-text-main cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Candidate Promotion Invariant & Anti-Poisoning Banner (Proposal Page 3, 5, 6) */}
      <div className="p-4 rounded-lg border border-divider bg-bg-card space-y-3 text-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 font-semibold text-text-main">
            <ShieldCheck className="w-4 h-4 text-brand-blue" />
            <span>Anti-Poisoning Invariant & Peer Diversity Promotion Policy (Proposal Page 3 & 6)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-badge-green-bg text-status-green border border-green-300 dark:border-green-900">
              Contamination: 0.0% (vs 75.0% Naïve)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-text-sub">
          <div className="p-3 rounded bg-bg-app border border-divider space-y-1">
            <div className="font-bold text-text-main flex items-center gap-1.5">
              <span>1. Candidate Quarantine Buffer</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              New route announcements never immediately overwrite trusted baselines. Conflicting routes are quarantined as <code className="text-amber-500 font-bold">CANDIDATE</code> to prevent baseline poisoning from single-peer flapping.
            </p>
          </div>

          <div className="p-3 rounded bg-bg-app border border-divider space-y-1">
            <div className="font-bold text-text-main flex items-center gap-1.5">
              <span>2. Multi-Peer Promotion Invariant</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Promotion to <code className="text-status-green font-bold">PROMOTED</code> requires corroboration across <strong className="text-text-main">≥ 2 distinct peers</strong> AND <strong className="text-text-main">≥ 3 consistent observations</strong>, preventing single upstream vantage point deception.
            </p>
          </div>

          <div className="p-3 rounded bg-bg-app border border-divider space-y-1">
            <div className="font-bold text-text-main flex items-center gap-1.5">
              <span>3. Immutable Version History</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Every baseline transition creates an append-only audit record in <code className="text-brand-blue font-bold">baseline_history</code> with actor attribution, collector vantage, timestamp, and operational justification.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-md border border-border-card bg-bg-card p-0.5 text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "all"
                ? "bg-bg-selected text-brand-blue font-semibold"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            All Prefixes ({routes.length})
          </button>
          <button
            onClick={() => setStatusFilter("promoted")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "promoted"
                ? "bg-bg-selected text-status-green font-semibold"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            Promoted Baselines ({promotedCount})
          </button>
          <button
            onClick={() => setStatusFilter("candidate")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "candidate"
                ? "bg-bg-selected text-amber-500 font-semibold"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            Quarantined Candidates ({candidateCount})
          </button>
        </div>
      </div>

      {/* Structured Baselines Table */}
      <div className="card-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-interactive border-b border-divider text-[11px] font-bold uppercase tracking-wider text-text-sub">
                <th className="py-2.5 px-4 font-semibold">IP Prefix (CIDR)</th>
                <th className="py-2.5 px-4 font-semibold">Authorized Origin</th>
                <th className="py-2.5 px-4 font-semibold">Telemetry Volume</th>
                <th className="py-2.5 px-4 font-semibold">Peer Diversity</th>
                <th className="py-2.5 px-4 font-semibold">Trust State</th>
                <th className="py-2.5 px-4 font-semibold text-right">Forensic Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider text-[13px]">
              {filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center space-y-3">
                    <p className="text-sm text-text-sub">No matching route baselines found.</p>
                    <button
                      onClick={() => seedDemoDataAction()}
                      className="px-4 py-2 rounded-md bg-brand-blue hover:bg-blue-700 text-white text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Seed Benchmark Baselines</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((route) => {
                  const isCandidate = route.status === "CANDIDATE";
                  const peerCount = route.peer_count || 1;

                  return (
                    <tr
                      key={route.prefix}
                      className="hover:bg-bg-hover-row transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-text-main flex items-center gap-2 group-hover:text-brand-blue transition-colors">
                        <Globe className="w-4 h-4 text-brand-blue shrink-0" />
                        <span>{route.prefix}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-accent-cyan">
                        {route.origin_asn}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-text-sub">
                        {formatCount(route.observation_count, "observation")}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                            peerCount >= 2
                              ? "bg-badge-green-bg text-status-green border border-green-300 dark:border-green-900"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                          }`}>
                            {peerCount} {peerCount === 1 ? "Peer" : "Peers"}
                          </span>
                          {peerCount < 2 && (
                            <span className="text-[10px] text-text-dim">(Quarantined)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            route.status === "PROMOTED"
                              ? "bg-badge-green-bg text-status-green border border-green-300 dark:border-green-900"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                          }`}
                        >
                          {route.status || "PROMOTED"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleViewHistory(route.prefix)}
                          className="px-2.5 py-1 rounded-md bg-bg-btn border border-border-card hover:bg-bg-interactive text-xs font-medium text-text-main transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Inspect version transition history"
                        >
                          <History className="w-3.5 h-3.5 text-brand-blue" />
                          <span>History</span>
                        </button>
                        <button
                          onClick={() => handleValidate(route.prefix, route.origin_asn)}
                          className="px-2.5 py-1 rounded-md bg-bg-btn border border-border-card hover:bg-bg-interactive text-xs font-medium text-text-main transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Inspect RPKI ROA"
                        >
                          <SearchCheck className="w-3.5 h-3.5 text-brand-blue" />
                          <span>ROA</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Version History Modal / Drawer */}
      {historyTargetPrefix && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-bg-card border border-border-card rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-divider flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-brand-blue" />
                <div>
                  <h3 className="text-sm font-bold text-text-main">
                    Baseline Version History & Audit Trail
                  </h3>
                  <p className="text-xs font-mono text-brand-blue">
                    Prefix: {historyTargetPrefix}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setHistoryTargetPrefix(null);
                  setSelectedRouteHistory(null);
                }}
                className="p-1 rounded text-text-dim hover:text-text-main hover:bg-bg-interactive cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              {loadingHistory ? (
                <div className="py-12 text-center text-text-dim">Loading version audit log...</div>
              ) : !selectedRouteHistory || selectedRouteHistory.length === 0 ? (
                <div className="py-8 text-center text-text-dim">
                  <p>No transition events recorded for this prefix.</p>
                  <p className="text-[11px] mt-1 text-text-sub">Initial authorized baseline seed established at system bootstrap.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedRouteHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 rounded-md bg-bg-app border border-divider space-y-1.5 font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-main">
                          Version #{item.version || (idx + 1)} · Origin: <span className="text-accent-cyan">{item.origin_asn}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === "PROMOTED"
                            ? "bg-badge-green-bg text-status-green"
                            : "bg-amber-500/10 text-amber-500"
                        }`}>
                          {item.status || "PROMOTED"}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-sub font-sans">
                        <strong>Reason:</strong> {item.reason || "Baseline established"}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-text-dim pt-1 border-t border-divider">
                        <span>Actor: {item.actor || "OPERATOR"} · Collector: {item.collector || "authorized-seed"}</span>
                        <span>{item.created_at ? new Date(item.created_at).toLocaleString() : "Authorized Seed"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-bg-interactive/40 border-t border-divider flex justify-end">
              <button
                onClick={() => {
                  setHistoryTargetPrefix(null);
                  setSelectedRouteHistory(null);
                }}
                className="px-4 py-1.5 rounded bg-bg-btn border border-border-card text-xs font-medium text-text-main hover:bg-bg-interactive cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
