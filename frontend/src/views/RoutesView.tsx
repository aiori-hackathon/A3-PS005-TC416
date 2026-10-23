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
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-card">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
              Route baselines
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-bg-interactive text-brand-blue border border-brand-blue/30 shadow-xs">
              {routes.length} Monitored
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            Learned IP prefix baselines and authorized reference origin-AS assignments.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bg-input border border-border-card text-xs text-text-sub w-full sm:w-64 relative focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/20 transition-all shadow-2xs">
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
              className="absolute right-2.5 text-text-dim hover:text-text-main cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Routes Table */}
      <div className="card-panel overflow-hidden border-border-card">
        {/* Desktop Table Header */}
        <div className="hidden sm:grid grid-cols-12 text-[11px] text-text-dim font-bold uppercase tracking-wider px-4 py-3 bg-bg-app border-b border-border-card">
          <span className="col-span-4">Prefix (CIDR)</span>
          <span className="col-span-2">Origin ASN</span>
          <span className="col-span-2">Observations</span>
          <span className="col-span-2">First Seen</span>
          <span className="col-span-2 text-right">RPKI Check</span>
        </div>

        {/* Desktop Table Rows */}
        <div className="hidden sm:block divide-y divide-border-item">
          {filteredRoutes.length === 0 ? (
            <div className="px-4 py-10 text-center space-y-3">
              <p className="text-xs text-text-sub">No matching route baselines found.</p>
              <button
                onClick={() => seedDemoDataAction()}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-brand-blue hover:from-blue-500 hover:to-blue-400 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Seed benchmark baselines</span>
              </button>
            </div>
          ) : (
            filteredRoutes.map((route) => {
              const firstSeenStr = route.first_seen
                ? new Date(route.first_seen).toLocaleDateString()
                : "Initial seed";

              return (
                <div
                  key={route.prefix}
                  className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-bg-hover-row transition-colors group cursor-pointer"
                  onClick={() => handleValidate(route.prefix, route.origin_asn)}
                >
                  <span className="col-span-4 font-mono font-bold text-text-main flex items-center gap-2 group-hover:text-brand-blue transition-colors">
                    <Globe className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                    <span>{route.prefix}</span>
                  </span>
                  <span className="col-span-2 font-mono font-bold text-accent-teal">
                    {route.origin_asn}
                  </span>
                  <span className="col-span-2 text-text-sub font-mono text-[11px]">
                    {route.observation_count.toLocaleString()} msgs
                  </span>
                  <span className="col-span-2 text-text-dim text-[11px]">
                    {firstSeenStr}
                  </span>
                  <div className="col-span-2 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleValidate(route.prefix, route.origin_asn);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-bg-btn border border-border-card hover:border-brand-blue/40 text-text-sub hover:text-text-main text-[11px] font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Validate with RPKI"
                    >
                      <SearchCheck className="w-3 h-3 text-brand-blue" />
                      <span>Check RPKI</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Mobile Stacked Card View */}
        <div className="sm:hidden divide-y divide-border-item">
          {filteredRoutes.length === 0 ? (
            <div className="px-4 py-8 text-center space-y-3">
              <p className="text-xs text-text-sub">No matching route baselines found.</p>
              <button
                onClick={() => seedDemoDataAction()}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-brand-blue text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Seed benchmark baselines</span>
              </button>
            </div>
          ) : (
            filteredRoutes.map((route) => {
              const firstSeenStr = route.first_seen
                ? new Date(route.first_seen).toLocaleDateString()
                : "Initial seed";

              return (
                <div key={route.prefix} className="p-3.5 space-y-2 hover:bg-bg-hover-row transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-text-main flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-brand-blue" />
                      {route.prefix}
                    </span>
                    <button
                      onClick={() => handleValidate(route.prefix, route.origin_asn)}
                      className="px-2.5 py-1 rounded-lg bg-bg-btn border border-border-card text-text-sub text-[11px] font-semibold flex items-center gap-1"
                    >
                      <SearchCheck className="w-3 h-3 text-brand-blue" />
                      <span>Check RPKI</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-text-sub font-mono">
                    <span>Origin: <span className="text-accent-teal font-bold">{route.origin_asn}</span></span>
                    <span>•</span>
                    <span>{route.observation_count.toLocaleString()} msgs</span>
                    <span>•</span>
                    <span className="text-text-dim">{firstSeenStr}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
