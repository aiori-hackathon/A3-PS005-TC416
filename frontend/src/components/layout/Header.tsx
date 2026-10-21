import React from "react";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Laptop,
  RotateCw,
  Shield,
  Radio,
  X,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useHoraqStore } from "../../stores/useHoraqStore";

export const Header: React.FC = () => {
  const {
    overview,
    alerts,
    theme,
    setTheme,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    fetchAllData,
    isLoading,
    isAutoRefresh,
    toggleAutoRefresh,
    seedDemoDataAction,
    resetDatabaseAction,
  } = useHoraqStore();

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Laptop;
  const activeAlerts = alerts.filter((a) => a.status === "ACTIVE").length;

  return (
    <header className="h-14 border-b border-border-sub bg-bg-header flex items-center justify-between px-6 select-none shrink-0 z-50 transition-colors">
      {/* Left: Brand Logo + Product Name */}
      <div
        className="flex items-center gap-2.5 cursor-pointer"
        onClick={() => setActiveTab("overview")}
      >
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-brand-blue shadow-sm">
          <Shield className="w-4 h-4 stroke-[2.2]" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-text-main text-base tracking-tight leading-none">
              HORA-Q
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-500/10 text-brand-blue border border-sky-500/20 leading-none">
              AIORI-3
            </span>
          </div>
          <span className="text-[10px] text-text-dim leading-none mt-1">
            Explainable BGP Anomaly Monitor
          </span>
        </div>
      </div>

      {/* Center: Protection Status Pill */}
      <button
        onClick={() => setActiveTab("alerts")}
        className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 border ${
          activeAlerts > 0
            ? "bg-status-red-bg text-red-500 border-red-800/40 hover:opacity-90 animate-pulse"
            : "bg-status-green-bg text-status-green border-green-800/40 hover:opacity-90"
        }`}
        title={activeAlerts > 0 ? "Click to view active alerts" : "BGP Route Monitor healthy"}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            activeAlerts > 0 ? "bg-red-500" : "bg-status-green"
          }`}
        />
        <span>
          {activeAlerts > 0
            ? `${activeAlerts} Anomalies active`
            : "Continuous BGP Guard active"}
        </span>
      </button>

      {/* Right Actions: Quick Search, Seed Demo, Live Toggle, Refresh, Theme, Bell */}
      <div className="flex items-center gap-2.5">
        {/* Search with Clear button */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-input border border-border-card text-xs text-text-sub hover:border-text-dim transition-colors w-48 relative">
          <Search className="w-3.5 h-3.5 text-text-sub shrink-0" />
          <input
            type="text"
            placeholder="Search prefix, ASN, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-text-main w-full placeholder:text-text-dim pr-4"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 text-text-dim hover:text-text-main"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Demo Data Quick Seeder */}
        <button
          onClick={() => seedDemoDataAction()}
          className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-brand-blue hover:bg-sky-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Seed realistic demo routes & anomalies (Cloudflare, Google, Quad9)"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Seed Demo</span>
        </button>

        {/* Live Auto-Refresh Toggle */}
        <button
          onClick={toggleAutoRefresh}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
            isAutoRefresh
              ? "bg-bg-btn border-border-card text-text-main hover:bg-bg-nav-hover"
              : "bg-bg-app border-border-card text-text-dim hover:text-text-main"
          }`}
          title={isAutoRefresh ? "Live polling active (every 5s)" : "Live polling paused"}
        >
          <Radio className={`w-3 h-3 ${isAutoRefresh ? "text-status-green animate-pulse" : "text-text-dim"}`} />
          <span className="text-[11px]">{isAutoRefresh ? "Live" : "Paused"}</span>
        </button>

        {/* Refresh Data */}
        <button
          onClick={() => fetchAllData()}
          disabled={isLoading}
          className="w-7 h-7 rounded-full bg-bg-btn border border-border-card flex items-center justify-center text-text-sub hover:text-text-main transition-colors disabled:opacity-50"
          title="Refresh telemetry"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-brand-blue" : ""}`} />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={cycleTheme}
          className="w-7 h-7 rounded-full bg-bg-btn border border-border-card flex items-center justify-center text-text-sub hover:text-text-main transition-colors"
          title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
        >
          <ThemeIcon className="w-3.5 h-3.5" />
        </button>

        {/* Notification Bell Icon */}
        <button
          onClick={() => setActiveTab("alerts")}
          className="w-7 h-7 rounded-full bg-bg-btn border border-border-card flex items-center justify-center text-text-sub hover:text-text-main transition-colors relative"
          title="Security Alerts"
        >
          <Bell className="w-3.5 h-3.5" />
          {activeAlerts > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      </div>
    </header>
  );
};
