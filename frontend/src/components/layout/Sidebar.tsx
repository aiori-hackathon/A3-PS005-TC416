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
      <div className="px-3 text-[11px] text-text-dim font-bold uppercase tracking-wider mb-1.5">
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
              className={`flex items-center justify-between px-3 py-2 rounded-r-full text-sm font-medium transition-colors w-full text-left cursor-pointer ${
                isActive
                  ? "bg-bg-nav-active text-brand-blue font-semibold"
                  : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-brand-blue" : "text-text-dim"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-status-critical text-white">
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
      className={`w-60 bg-bg-sidebar border-r border-border-card flex flex-col justify-between py-4 pr-3 pl-2 select-none shrink-0 h-[calc(100vh-3.5rem)] transition-all duration-200 z-40 ${
        sidebarOpen
          ? "fixed top-14 left-0 bottom-0 shadow-xl md:relative md:top-0"
          : "hidden md:flex"
      }`}
    >
      {/* Top Navigation */}
      <div className="space-y-6">
        {renderNavGroup("Monitoring", monitorNav)}
        {renderNavGroup("Investigation", investigateNav)}
        {renderNavGroup("Evidence & Verification", evidenceNav)}
      </div>

      {/* Bottom Settings Link */}
      <div className="pt-3 border-t border-divider">
        <button
          onClick={() => handleNavClick("settings")}
          className={`flex items-center gap-3 px-3 py-2 rounded-r-full text-sm font-medium transition-colors w-full text-left cursor-pointer ${
            activeTab === "settings"
              ? "bg-bg-nav-active text-brand-blue font-semibold"
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
      </div>
    </aside>
  );
};
