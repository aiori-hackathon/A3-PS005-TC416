import React from "react";
import { Search, Bell, Sun, Moon, Laptop, Shield, Radio } from "lucide-react";
import { useHoraqStore } from "../../stores/useHoraqStore";

export const Header: React.FC = () => {
  const { alerts, activeTab, setActiveTab, theme, setTheme, searchQuery, setSearchQuery } = useHoraqStore();

  const activeAlerts = alerts.filter((a) => a.status === "ACTIVE").length;

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Laptop;

  return (
    <header className="h-13 border-b border-border-sub bg-bg-header flex items-center justify-between px-5 select-none shrink-0 z-40 transition-colors">
      {/* Left: Brand + Identity */}
      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => setActiveTab("overview")}
        >
          <div className="w-7 h-7 rounded bg-bg-card border border-border-card flex items-center justify-center text-brand-blue shrink-0">
            <Shield className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-text-main text-sm tracking-tight leading-none">
              HORA-Q
            </span>
            <span className="text-[10px] text-text-dim mt-0.5 tracking-normal font-normal">
              Explainable BGP Monitor
            </span>
          </div>
        </div>

        {/* Data Source Mode Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-border-card bg-bg-card text-[11px] text-text-sub font-normal">
          <Radio className="w-3 h-3 text-brand-blue" />
          <span>Feed: <strong className="text-text-main font-medium">Evaluation Replay</strong></span>
        </div>
      </div>

      {/* Center: Monitored Route Status */}
      <div className="flex items-center">
        <button
          onClick={() => setActiveTab("alerts")}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-2 border cursor-pointer ${
            activeAlerts === 0
              ? "bg-status-green-bg text-status-green border-status-green"
              : "bg-status-red-bg text-status-red border-status-red"
          }`}
          title="Click to view alert investigation ledger"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              activeAlerts === 0 ? "bg-status-green" : "bg-status-red animate-pulse"
            }`}
          />
          <span>
            {activeAlerts === 0
              ? "All monitored routes normal"
              : `${activeAlerts} unreviewed ${activeAlerts === 1 ? "anomaly" : "anomalies"}`}
          </span>
        </button>
      </div>

      {/* Right: Search, Theme Toggle, Notification Bell */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-bg-input border border-border-card text-xs text-text-sub hover:border-text-dim transition-colors w-40 sm:w-52">
          <Search className="w-3.5 h-3.5 text-text-dim shrink-0" />
          <input
            type="text"
            placeholder="Filter prefix or ASN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-text-main w-full placeholder:text-text-dim font-normal"
          />
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={cycleTheme}
          className="w-7 h-7 rounded bg-bg-btn border border-border-card flex items-center justify-center text-text-sub hover:text-text-main hover:bg-bg-nav-hover transition-colors cursor-pointer"
          title={`Theme: ${theme.toUpperCase()} (Click to change)`}
          aria-label="Toggle theme"
        >
          <ThemeIcon className="w-3.5 h-3.5" />
        </button>

        {/* Alerts Shortcut Bell */}
        <button
          onClick={() => setActiveTab("alerts")}
          className="w-7 h-7 rounded bg-bg-btn border border-border-card flex items-center justify-center text-text-sub hover:text-text-main hover:bg-bg-nav-hover transition-colors relative cursor-pointer"
          title="View security alerts"
          aria-label="View alerts"
        >
          <Bell className="w-3.5 h-3.5" />
          {activeAlerts > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-status-red rounded-full" />
          )}
        </button>
      </div>
    </header>
  );
};
