import React from "react";
import { Search, Bell, User, MoreHorizontal, Sun, Moon, Laptop, Shield } from "lucide-react";
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
    <header className="h-14 border-b border-border-sub bg-bg-header flex items-center justify-between px-6 select-none shrink-0 z-50 transition-colors">
      {/* Left: Brand + Product Name */}
      <div
        className="flex items-center gap-2.5 cursor-pointer"
        onClick={() => setActiveTab("overview")}
      >
        <div className="w-7 h-7 rounded-md bg-status-green-bg border border-green-800/40 flex items-center justify-center text-status-green shrink-0">
          <Shield className="w-4 h-4 stroke-[2.2]" />
        </div>
        <span className="font-bold text-text-main text-base tracking-tight">HORA-Q</span>
      </div>

      {/* Center: Protection Status Pill */}
      <button
        onClick={() => setActiveTab("alerts")}
        className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 border ${
          activeAlerts === 0
            ? "bg-status-green-bg text-status-green border-green-800/40 hover:opacity-90"
            : "bg-status-red-bg text-red-400 border-red-800/40 hover:opacity-90"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${activeAlerts === 0 ? "bg-status-green" : "bg-red-500"}`}
        ></span>
        <span>{activeAlerts === 0 ? "Protection active" : `${activeAlerts} Threats active`}</span>
      </button>

      {/* Right: Search, Theme Toggle, Notification Bell, User, More Actions */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-input border border-border-card text-xs text-text-sub hover:border-text-dim transition-colors w-36">
          <Search className="w-3.5 h-3.5 text-text-sub shrink-0" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-text-main w-full placeholder:text-text-dim"
          />
        </div>

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
          title="Alerts & Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          {activeAlerts > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#ef4444] rounded-full"></span>
          )}
        </button>

        {/* User Profile */}
        <button className="w-7 h-7 rounded-full bg-bg-btn border border-border-card flex items-center justify-center text-text-sub hover:text-text-main transition-colors">
          <User className="w-3.5 h-3.5" />
        </button>

        <button className="text-text-sub hover:text-text-main transition-colors px-1">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
