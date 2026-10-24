import React from "react";
import { Search, Bell, Sun, Moon, Menu, X, ShieldCheck } from "lucide-react";
import { useHoraqStore } from "../../stores/useHoraqStore";
import { groupAlertObservations } from "../../utils/incidentGrouping";

export const Header: React.FC = () => {
  const {
    alerts,
    setActiveTab,
    theme,
    setTheme,
    searchQuery,
    setSearchQuery,
    sidebarOpen,
    toggleSidebar,
  } = useHoraqStore();

  const activeIncidents = groupAlertObservations(alerts).filter((a) => a.status === "ACTIVE").length;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const ThemeIcon = theme === "dark" ? Sun : Moon;

  return (
    <header className="h-14 border-b border-border-card bg-bg-header flex items-center justify-between px-4 sm:px-6 select-none shrink-0 z-50 transition-colors">
      {/* Left: Brand Wordmark + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-1.5 rounded-md bg-bg-btn border border-border-card text-text-sub hover:text-text-main transition-colors cursor-pointer"
          title="Toggle Navigation"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setActiveTab("overview")}
        >
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-text-main text-lg tracking-tight group-hover:text-brand-blue transition-colors">
              HORA-Q
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
          </div>

          <div className="hidden sm:flex items-center gap-2 border-l border-divider pl-3 text-xs text-text-sub font-medium">
            <span>BGP Origin & Subprefix Anomaly Monitor</span>
          </div>
        </div>
      </div>

      {/* Right: Search, Theme Toggle, Notifications, Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-interactive border border-transparent focus-within:border-brand-blue focus-within:bg-bg-card transition-all w-32 sm:w-56 md:w-64 text-xs text-text-sub">
          <Search className="w-3.5 h-3.5 text-text-dim shrink-0" />
          <input
            type="text"
            placeholder="Search prefix, ASN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-text-main w-full placeholder:text-text-dim"
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-md bg-bg-btn hover:bg-bg-interactive border border-border-card flex items-center justify-center text-text-sub hover:text-text-main transition-all cursor-pointer"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          <ThemeIcon className="w-3.5 h-3.5" />
        </button>

        {/* Notifications & Active Incident Counter */}
        <button
          onClick={() => setActiveTab("alerts")}
          className={`h-8 px-2.5 rounded-md border flex items-center gap-1.5 text-xs font-medium transition-all cursor-pointer ${
            activeIncidents > 0
              ? "bg-status-critical-bg text-status-critical border-red-300 dark:border-red-800"
              : "bg-bg-btn hover:bg-bg-interactive border-border-card text-text-sub hover:text-text-main"
          }`}
          title="Incident Alerts"
        >
          <Bell className="w-3.5 h-3.5" />
          {activeIncidents > 0 ? (
            <span className="font-bold">{activeIncidents}</span>
          ) : (
            <span className="hidden sm:inline text-text-dim">0</span>
          )}
        </button>
      </div>
    </header>
  );
};
