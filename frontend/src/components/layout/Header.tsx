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
  CheckCircle2,
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
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => setActiveTab("overview")}
      >
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-brand-blue shadow-sm group-hover:border-brand-blue transition-colors">
          <Shield className="w-4 h-4 stroke-[2.2]" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-text-main text-base tracking-tight leading-none">
              HORA-Q
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-sky-500/10 text-brand-blue border border-sky-500/20 leading-none">
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
        className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-2 border cursor-pointer ${
          activeAlerts > 0
            ? "bg-status-red-bg text-red-500 border-red-800/40 hover:opacity-90"
            : "bg-status-green-bg text-status-green border-green-800/40 hover:opacity-90"
        }`}
        title={activeAlerts > 0 ? "Click to view active alerts" : "BGP Route Monitor healthy"}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            activeAlerts > 0 ? "bg-red-500 animate-ping" : "bg-status-green"
          }`}
        />
        <span>
          {activeAlerts > 0
            ? `${activeAlerts} Threat Anomaly Active`
            : "Continuous BGP Guard Active"}
        </span>
      </button>

      {/* Right Actions: Quick Search, Seed Demo, Live Toggle, Refresh, Theme, Bell */}
      <div className="flex items-center gap-2.5">
        {/* Search with Clear button & Keyboard hint */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-input border border-border-card text-xs text-text-sub hover:border-text-dim transition-colors w-52 relative">
          <Search className="w-3.5 h-3.5 text-text-sub shrink-0" />
          <input
            type="text"
            placeholder="Search prefix, ASN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-text-main placeholder-text-dim w-full"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="text-text-dim hover:text-text-main"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block text-[10px] text-text-dim border border-border-card px-1 rounded bg-bg-app font-mono">
              /
            </kbd>
          )}
        </div>

        {/* Live Auto-Refresh Toggle */}
        <button
          onClick={toggleAutoRefresh}
          title={isAutoRefresh ? "Live polling active (every 3s)" : "Auto-refresh paused"}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            isAutoRefresh
              ? "bg-emerald-500/10 text-status-green border-emerald-500/30"
              : "bg-bg-btn text-text-sub border-border-card hover:text-text-main"
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${isAutoRefresh ? "animate-pulse text-emerald-400" : ""}`} />
          <span className="hidden md:inline">{isAutoRefresh ? "Live 3s" : "Paused"}</span>
        </button>

        {/* Manual Refresh */}
        <button
          onClick={() => fetchAllData()}
          disabled={isLoading}
          className="btn-icon"
          title="Refresh telemetry"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-brand-blue" : ""}`} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="btn-icon"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="w-3.5 h-3.5" />
        </button>

        {/* Notifications badge */}
        <button
          onClick={() => setActiveTab("alerts")}
          className="btn-icon relative"
          title="Security Alerts"
        >
          <Bell className="w-3.5 h-3.5" />
          {activeAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
      </div>
    </header>
  );
};
