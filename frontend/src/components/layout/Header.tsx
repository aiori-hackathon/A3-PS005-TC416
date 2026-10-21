import React from "react";
import { Search, Bell, Sun, Moon, Laptop, Shield, Menu, X } from "lucide-react";
import { useHoraqStore } from "../../stores/useHoraqStore";

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

  const activeAlerts = alerts.filter((a) => a.status === "ACTIVE").length;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const ThemeIcon = theme === "dark" ? Sun : Moon;

  return (
    <header className="h-14 border-b border-border-sub bg-bg-header backdrop-blur-md flex items-center justify-between px-3 sm:px-6 select-none shrink-0 z-50 transition-colors">
      {/* Left: Mobile Menu Toggle + Apple-style Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-1.5 rounded-lg bg-bg-btn border border-border-card text-text-sub hover:text-text-main transition-colors cursor-pointer"
          title="Toggle Navigation"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => setActiveTab("overview")}
        >
          <div className="w-7 h-7 rounded-lg bg-[#0071e3] text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <Shield className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-semibold text-text-main text-[15px] tracking-tight">
            HORA-Q
          </span>
        </div>
      </div>

      {/* Center: Calm Apple-style Status Pill */}
      <button
        onClick={() => setActiveTab("alerts")}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-2 border cursor-pointer active:scale-[0.98] ${
          activeAlerts === 0
            ? "bg-status-green-bg text-status-green border-green-500/20 hover:border-green-500/40"
            : "bg-status-red-bg text-red-400 border-red-500/20 hover:border-red-500/40"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            activeAlerts === 0 ? "bg-status-green animate-pulse" : "bg-red-400"
          }`}
        />
        <span className="truncate max-w-[130px] sm:max-w-none">
          {activeAlerts === 0 ? "Monitoring active" : `${activeAlerts} Anomalies detected`}
        </span>
      </button>

      {/* Right: Apple Rounded Search, Theme Toggle, Notification Bell */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-input border border-border-card text-xs text-text-sub focus-within:border-brand-blue/60 focus-within:ring-1 focus-within:ring-brand-blue/20 transition-all w-28 sm:w-40 md:w-48">
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
          className="w-8 h-8 rounded-full bg-bg-btn border border-border-card flex items-center justify-center text-text-sub hover:text-text-main transition-colors cursor-pointer active:scale-95"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          <ThemeIcon className="w-3.5 h-3.5" />
        </button>

        {/* Notification Bell Icon */}
        <button
          onClick={() => setActiveTab("alerts")}
          className="w-8 h-8 rounded-full bg-bg-btn border border-border-card flex items-center justify-center text-text-sub hover:text-text-main transition-colors cursor-pointer relative active:scale-95"
          title="Alerts & Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          {activeAlerts > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#ff453a] rounded-full" />
          )}
        </button>
      </div>
    </header>
  );
};
