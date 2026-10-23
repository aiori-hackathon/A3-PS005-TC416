import React from "react";
import { Search, Bell, Sun, Moon, Menu, X } from "lucide-react";
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
    <header className="h-14 border-b border-border-card bg-bg-header backdrop-blur-md flex items-center justify-between px-3 sm:px-6 select-none shrink-0 z-50 transition-colors">
      {/* Left: Mobile Menu Toggle + Expressive Brand Wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-1.5 rounded-lg bg-bg-btn border border-border-card text-text-sub hover:text-text-main transition-colors cursor-pointer"
          title="Toggle Navigation"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        <div
          className="flex items-center cursor-pointer group"
          onClick={() => setActiveTab("overview")}
        >
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-text-main text-[16px] sm:text-[17px] tracking-tight group-hover:text-brand-blue transition-colors">
              HORA-Q
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-blue shadow-[0_0_8px_rgba(98,168,255,0.6)]" />
          </div>
        </div>
      </div>

      {/* Center: Expressive Status Pill */}
      <button
        onClick={() => setActiveTab("alerts")}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-2 border cursor-pointer active:scale-[0.98] ${
          activeIncidents === 0
            ? "bg-status-green-bg text-status-green border-emerald-500/30 hover:border-emerald-500/50 shadow-xs"
            : "bg-status-red-bg text-status-red border-red-500/35 hover:border-red-500/55 shadow-xs"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            activeIncidents === 0 ? "bg-status-green animate-pulse" : "bg-status-red"
          }`}
        />
        <span className="truncate max-w-[130px] sm:max-w-none">
          {activeIncidents === 0 ? "Monitoring active" : `${activeIncidents} Anomalies detected`}
        </span>
      </button>

      {/* Right: Rounded Search, Theme Toggle, Notification Bell */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-input border border-border-card text-xs text-text-sub focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/20 transition-all w-28 sm:w-40 md:w-48 shadow-2xs">
          <Search className="w-3.5 h-3.5 text-text-dim shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-text-main w-full placeholder:text-text-dim"
          />
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-full bg-bg-btn border border-border-card flex items-center justify-center text-text-sub hover:text-text-main hover:border-brand-blue/40 transition-all cursor-pointer active:scale-95 shadow-2xs"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          <ThemeIcon className="w-3.5 h-3.5" />
        </button>

        {/* Notification Bell Icon */}
        <button
          onClick={() => setActiveTab("alerts")}
          className="w-8 h-8 rounded-full bg-bg-btn border border-border-card flex items-center justify-center text-text-sub hover:text-text-main hover:border-brand-blue/40 transition-all cursor-pointer relative active:scale-95 shadow-2xs"
          title="Alerts & Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          {activeIncidents > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-status-red rounded-full shadow-[0_0_6px_rgba(255,113,133,0.8)]" />
          )}
        </button>
      </div>
    </header>
  );
};
