import React, { useState } from "react";
import { Globe, Search, SearchCheck, CheckCircle2, Sparkles, X } from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";

export const RoutesView: React.FC = () => {
  const { routes, setRpkiTarget, searchQuery, setSearchQuery, seedDemoDataAction } = useHoraqStore();
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-text-main tracking-tight">
              Tracked Route Baselines
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-brand-blue border border-sky-500/20">
              {routes.length} Active Baselines
            </span>
          </div>
          <p className="text-xs text-text-sub mt-0.5">
            Cryptographically bounded IP prefixes with confirmed legitimate origin-AS assignments.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-input border border-border-card text-xs text-text-sub w-64 relative">
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
              className="absolute right-2 text-text-dim hover:text-text-main"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Routes Table */}
      <div className="card-panel overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 text-xs text-text-dim font-medium px-4 py-2.5 border-b border-border-card">
          <span className="col-span-4">Prefix (CIDR)</span>
          <span className="col-span-2">Origin ASN</span>
          <span className="col-span-2">Observations</span>
          <span className="col-span-2">First Seen</span>
          <span className="col-span-2 text-right">RPKI Check</span>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border-item">
          {filteredRoutes.length === 0 ? (
            <div className="px-4 py-10 text-center space-y-3">
              <p className="text-xs text-text-sub">
                No matching route baselines found.
              </p>
              <button
                onClick={() => seedDemoDataAction()}
                className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-brand-blue text-xs font-semibold hover:bg-sky-500/20 transition-colors inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Seed Benchmark Baselines</span>
              </button>
            </div>
          ) : (
            filteredRoutes.map((route) => {
              const firstSeenStr = route.first_seen
                ? new Date(route.first_seen).toLocaleDateString()
                : "Unknown";

              return (
                <div
                  key={route.prefix}
                  className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-bg-hover-row transition-colors"
                >
                  <span className="col-span-4 font-mono font-semibold text-text-main flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                    <span>{route.prefix}</span>
                  </span>
                  <span className="col-span-2 font-mono font-bold text-brand-blue">
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
                      onClick={() =>
                        setRpkiTarget({
                          prefix: route.prefix,
                          asn: route.origin_asn,
                        })
                      }
                      className="px-3 py-1 rounded-md bg-bg-btn border border-border-card hover:bg-bg-nav-hover hover:border-text-dim text-text-sub hover:text-text-main text-[11px] font-semibold transition-colors inline-flex items-center gap-1.5"
                      title="Validate with RPKI"
                    >
                      <SearchCheck className="w-3 h-3 text-brand-blue" />
                      <span>Validate</span>
                    </button>
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
