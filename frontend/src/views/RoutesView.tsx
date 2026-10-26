import React, { useState } from "react";
import { Globe, Search, SearchCheck, Sparkles, X } from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";

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
  const activeFilter = localSearch || searchQuery;

  const filteredRoutes = routes.filter((r) => {
    if (!activeFilter) return true;
    const term = activeFilter.toLowerCase();
    return (
      r.prefix.toLowerCase().includes(term) ||
      r.origin_asn.toLowerCase().includes(term)
    );
  });

  const handleValidate = (prefix: string, originAsn: string) => {
    setRpkiTarget({ prefix, asn: originAsn });
    setActiveTab("rpki");
  };

  return (
    <div className="max-w-[1360px] w-full space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-divider">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[28px] font-semibold text-text-main tracking-tight">
              Route Baselines
            </h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-bg-interactive text-text-sub border border-divider">
              {routes.length} Monitored Baselines
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

      {/* Structured Baselines Table */}
      <div className="card-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-interactive border-b border-divider text-[11px] font-bold uppercase tracking-wider text-text-sub">
                <th className="py-2.5 px-4 font-semibold">IP Prefix (CIDR)</th>
                <th className="py-2.5 px-4 font-semibold">Authorized Origin</th>
                <th className="py-2.5 px-4 font-semibold">Telemetry Messages</th>
                <th className="py-2.5 px-4 font-semibold">First Established</th>
                <th className="py-2.5 px-4 font-semibold">Baseline Policy</th>
                <th className="py-2.5 px-4 font-semibold text-right">RPKI Check</th>
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
                  const firstSeenStr = route.first_seen
                    ? new Date(route.first_seen).toLocaleDateString()
                    : "Benchmark";

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
                        {route.observation_count.toLocaleString()} observations
                      </td>
                      <td className="py-3 px-4 text-xs text-text-dim">
                        {firstSeenStr}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              route.status === "PROMOTED"
                                ? "bg-badge-green-bg text-status-green border border-green-300 dark:border-green-900"
                                : route.status === "CANDIDATE"
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                                : "bg-bg-interactive text-text-dim border border-divider"
                            }`}
                          >
                            {route.status || "PROMOTED"}
                          </span>
                          {route.peer_count && route.peer_count > 1 && (
                            <span className="text-[10px] font-mono text-text-dim px-1.5 py-0.5 rounded bg-bg-interactive border border-divider">
                              {route.peer_count} peers
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleValidate(route.prefix, route.origin_asn)}
                          className="px-3 py-1 rounded-md bg-bg-btn border border-border-card hover:bg-bg-interactive text-xs font-medium text-text-main transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <SearchCheck className="w-3.5 h-3.5 text-brand-blue" />
                          <span>Inspect ROA</span>
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
    </div>
  );
};
