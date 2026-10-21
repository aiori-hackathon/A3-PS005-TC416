import React, { useState } from "react";
import { Search, ShieldCheck, X, Sparkles, Clock, Globe } from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";
import { RouteBaseline } from "../types";

export const RoutesView: React.FC = () => {
  const { routes, setRpkiTarget, searchQuery, setSearchQuery, seedDemoDataAction, setActiveTab } = useHoraqStore();
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

  const handleValidateWithRpki = (route: RouteBaseline) => {
    setRpkiTarget({ prefix: route.prefix, asn: route.origin_asn });
    setActiveTab("rpki");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-main tracking-tight">
              Route baselines
            </h1>
            <span className="px-2 py-0.2 rounded text-[11px] font-semibold bg-bg-card border border-border-card text-brand-blue font-mono">
              {routes.length} Active
            </span>
          </div>
          <p className="text-xs text-text-sub mt-0.5">
            Reference origin assignments against which incoming BGP announcements are evaluated.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-bg-input border border-border-card text-xs text-text-sub w-full sm:w-64 relative">
          <Search className="w-3.5 h-3.5 text-text-dim shrink-0" />
          <input
            type="text"
            placeholder="Filter prefix or ASN..."
            value={activeFilter}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              setSearchQuery(e.target.value);
            }}
            className="bg-transparent border-none outline-none text-xs text-text-main w-full placeholder:text-text-dim pr-5 font-normal"
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

      {/* Explanatory Policy Notice */}
      <div className="p-3 rounded bg-bg-card border border-border-card text-xs text-text-sub flex items-start gap-2.5">
        <Globe className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-text-main">Non-Poisoning Baseline Guarantee</span>
          <p className="text-[11px] text-text-sub leading-relaxed">
            Baselines represent known initial observations or operator-seeded reference routes. When an origin-AS change or subprefix is observed, HORA-Q raises an alert while strictly preserving the reference baseline in storage, preventing automated attack poisoning.
          </p>
        </div>
      </div>

      {/* Routes Table */}
      <div className="card-panel overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 text-xs text-text-dim font-medium px-4 py-2.5 border-b border-border-card bg-bg-raised">
          <span className="col-span-4 sm:col-span-4">Prefix (CIDR)</span>
          <span className="col-span-3 sm:col-span-2">Reference origin</span>
          <span className="hidden sm:inline-block sm:col-span-2">Observations</span>
          <span className="col-span-3 sm:col-span-2">First seen</span>
          <span className="col-span-2 sm:col-span-2 text-right">RPKI status</span>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border-item">
          {filteredRoutes.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-xs text-text-sub">
                No matching route baselines in local storage.
              </p>
              <button
                onClick={() => seedDemoDataAction()}
                className="px-3 py-1.5 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-brand-blue text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Seed benchmark baselines</span>
              </button>
            </div>
          ) : (
            filteredRoutes.map((route) => {
              const firstSeenStr = route.first_seen
                ? new Date(route.first_seen).toLocaleDateString()
                : "Initial";

              return (
                <div
                  key={route.prefix}
                  className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-bg-hover-row transition-colors"
                >
                  {/* Prefix */}
                  <span className="col-span-4 sm:col-span-4 font-mono font-medium text-text-main text-xs">
                    {route.prefix}
                  </span>

                  {/* Reference Origin */}
                  <span className="col-span-3 sm:col-span-2 font-mono text-status-green font-semibold text-xs">
                    {route.origin_asn}
                  </span>

                  {/* Observations Count */}
                  <span className="hidden sm:inline-block sm:col-span-2 text-text-sub font-mono text-xs">
                    {route.observation_count} updates
                  </span>

                  {/* First Seen */}
                  <span className="col-span-3 sm:col-span-2 text-text-dim text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-text-dim shrink-0" />
                    <span>{firstSeenStr}</span>
                  </span>

                  {/* RPKI Check Action */}
                  <div className="col-span-2 sm:col-span-2 text-right">
                    <button
                      onClick={() => handleValidateWithRpki(route)}
                      className="px-2 py-1 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-[11px] text-text-sub hover:text-text-main inline-flex items-center gap-1 transition-colors cursor-pointer"
                      title="Validate prefix and origin ASN against RIPEstat ROA database"
                    >
                      <ShieldCheck className="w-3 h-3 text-brand-blue" />
                      <span>Check</span>
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
