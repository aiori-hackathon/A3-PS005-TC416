import React from "react";
import {
  LayoutGrid,
  Bell,
  Globe,
  Terminal,
  History,
  SearchCheck,
  Radio,
  Settings,
} from "lucide-react";
import { useHoraqStore, NavTab } from "../../stores/useHoraqStore";
import { groupAlertObservations } from "../../utils/incidentGrouping";

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, alerts, sidebarOpen, setSidebarOpen } = useHoraqStore();

  const activeIncidentsCount = groupAlertObservations(alerts).filter((a) => a.status === "ACTIVE").length;

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const monitorNav = [
    { id: "overview" as NavTab, label: "Overview", icon: LayoutGrid },
    {
      id: "alerts" as NavTab,
      label: "Alerts",
      icon: Bell,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
    },
    { id: "routes" as NavTab, label: "Route baselines", icon: Globe },
  ];

  const investigateNav = [
    { id: "rpki" as NavTab, label: "RPKI check", icon: SearchCheck },
    { id: "inject" as NavTab, label: "Test a route", icon: Radio },
  ];

  const evidenceNav = [
    { id: "evidence" as NavTab, label: "Audit history", icon: History },
    { id: "scenarios" as NavTab, label: "Scenarios", icon: Terminal },
  ];

  const renderNavGroup = (title: string, items: typeof monitorNav) => (
    <div>
      <div className="px-3 text-[11px] text-text-dim font-semibold uppercase tracking-wider mb-1.5">
        {title}
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 w-full text-left cursor-pointer active:scale-[0.99] ${
                isActive
                  ? "bg-bg-nav-active border border-brand-blue/25 text-text-main font-semibold shadow-xs"
                  : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover border border-transparent"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-brand-blue rounded-r-full shadow-[0_0_8px_rgba(98,168,255,0.7)]" />
              )}
              <div className="flex items-center gap-2.5 pl-1">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-brand-blue" : "text-text-dim"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-status-red text-white shadow-[0_0_6px_rgba(255,113,133,0.6)]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside
      className={`w-56 bg-bg-sidebar border-r border-border-card flex flex-col justify-between p-3 select-none shrink-0 h-[calc(100vh-3.5rem)] transition-all duration-200 z-40 ${
        sidebarOpen
          ? "fixed top-14 left-0 bottom-0 shadow-2xl md:relative md:top-0"
          : "hidden md:flex"
      }`}
    >
      {/* Top Navigation: 3 Distinct Groups */}
      <div className="space-y-5">
        {renderNavGroup("Monitor", monitorNav)}
        {renderNavGroup("Investigate", investigateNav)}
        {renderNavGroup("Evidence & Testing", evidenceNav)}
      </div>

      {/* Bottom: Settings */}
      <div className="pt-2 border-t border-border-card space-y-2">
        <button
          onClick={() => handleNavClick("settings")}
          className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 w-full text-left cursor-pointer active:scale-[0.99] ${
            activeTab === "settings"
              ? "bg-bg-nav-active border border-brand-blue/25 text-text-main font-semibold shadow-xs"
              : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover border border-transparent"
          }`}
        >
          {activeTab === "settings" && (
            <span className="absolute left-0 top-2 bottom-2 w-1 bg-brand-blue rounded-r-full shadow-[0_0_8px_rgba(98,168,255,0.7)]" />
          )}
          <Settings
            className={`w-4 h-4 shrink-0 pl-1 ${
              activeTab === "settings" ? "text-brand-blue" : "text-text-dim"
            }`}
          />
          <span>Settings</span>
        </button>

        <div className="px-3 pt-1 text-[11px] text-text-dim flex items-center justify-between">
          <span className="font-semibold text-text-sub">HORA-Q</span>
          <span className="font-mono text-[10px]">v1.0 (AIORI-3)</span>
        </div>
      </div>
    </aside>
  );
};
