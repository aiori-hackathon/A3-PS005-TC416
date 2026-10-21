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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-text-main tracking-tight">
              Route baselines
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#12161B] text-brand-blue border border-border-card">
              {routes.length} Monitored
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            Learned IP prefix baselines and authorized origin-AS assignments.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-input border border-border-card text-xs text-text-sub w-full sm:w-64 relative focus-within:border-brand-blue/60 focus-within:ring-1 focus-within:ring-brand-blue/30 transition-all">
          <Search className="w-3.5 h-3.5 text-text-sub shrink-0" />
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
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Routes Table */}
      <div className="card-panel overflow-hidden">
        {/* Desktop Table Header */}
        <div className="hidden sm:grid grid-cols-12 text-[11px] text-text-dim font-medium uppercase tracking-wider px-4 py-2.5 border-b border-border-card">
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
                className="px-3.5 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-brand-blue text-xs font-medium hover:bg-sky-500/20 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                  className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-bg-hover-row transition-colors duration-150"
                >
                  <span className="col-span-4 font-mono font-medium text-text-main flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                    <span>{route.prefix}</span>
                  </span>
                  <span className="col-span-2 font-mono font-medium text-brand-blue">
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
                      onClick={() => handleValidate(route.prefix, route.origin_asn)}
                      className="px-2.5 py-1 rounded-md bg-bg-btn border border-border-card hover:bg-bg-nav-hover hover:border-text-dim text-text-sub hover:text-text-main text-[11px] font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
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
                className="px-3.5 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-brand-blue text-xs font-medium hover:bg-sky-500/20 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
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
                    <span className="font-mono text-xs font-semibold text-text-main flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-brand-blue" />
                      {route.prefix}
                    </span>
                    <button
                      onClick={() => handleValidate(route.prefix, route.origin_asn)}
                      className="px-2.5 py-1 rounded-md bg-bg-btn border border-border-card text-text-sub text-[11px] font-medium flex items-center gap-1"
                    >
                      <SearchCheck className="w-3 h-3 text-brand-blue" />
                      <span>Check RPKI</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-text-sub font-mono">
                    <span>Origin: <span className="text-brand-blue font-medium">{route.origin_asn}</span></span>
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
