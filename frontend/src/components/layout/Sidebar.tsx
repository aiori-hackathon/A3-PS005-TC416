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
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 w-full text-left cursor-pointer active:scale-[0.99] ${
                isActive
                  ? "bg-bg-nav-active text-text-main font-semibold shadow-xs"
                  : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-brand-blue" : "text-text-dim"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#ff453a] text-white">
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
      className={`w-56 bg-bg-sidebar border-r border-border-sub flex flex-col justify-between p-3 select-none shrink-0 h-[calc(100vh-3.5rem)] transition-all duration-200 z-40 ${
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
      <div className="pt-2 border-t border-border-sub space-y-2">
        <button
          onClick={() => handleNavClick("settings")}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 w-full text-left cursor-pointer active:scale-[0.99] ${
            activeTab === "settings"
              ? "bg-bg-nav-active text-text-main font-semibold shadow-xs"
              : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
          }`}
        >
          <Settings
            className={`w-4 h-4 shrink-0 ${
              activeTab === "settings" ? "text-brand-blue" : "text-text-dim"
            }`}
          />
          <span>Settings</span>
        </button>

        <div className="px-3 pt-1 text-[11px] text-text-dim flex items-center justify-between">
          <span>HORA-Q</span>
          <span>v1.0 (AIORI-3)</span>
        </div>
      </div>
    </aside>
  );
};
