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

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, alerts } = useHoraqStore();

  const activeAlertsCount = alerts.filter((a) => a.status === "ACTIVE").length;

  const mainNav = [
    { id: "overview" as NavTab, label: "Overview", icon: LayoutGrid },
    {
      id: "alerts" as NavTab,
      label: "Alerts",
      icon: Bell,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
    },
    { id: "routes" as NavTab, label: "Baselines", icon: Globe },
    { id: "scenarios" as NavTab, label: "Scenarios", icon: Terminal },
  ];

  const resourceNav = [
    { id: "evidence" as NavTab, label: "Audit ledger", icon: History },
    { id: "rpki" as NavTab, label: "RPKI Inspector", icon: SearchCheck },
    { id: "inject" as NavTab, label: "Inject Route", icon: Radio },
  ];

  return (
    <aside className="w-56 bg-bg-sidebar border-r border-border-sub flex flex-col justify-between p-3 select-none shrink-0 h-[calc(100vh-3.5rem)] transition-colors">
      {/* Top Navigation */}
      <div className="space-y-6">
        <div className="space-y-1">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 w-full text-left cursor-pointer active:scale-[0.99] ${
                  isActive
                    ? "bg-bg-nav-active text-text-main font-semibold shadow-xs"
                    : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-text-main" : "text-text-sub"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ef4444] text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Resources Section */}
        <div>
          <div className="px-3 text-[11px] text-text-dim font-medium uppercase tracking-wider mb-2">
            Verification
          </div>
          <div className="space-y-1">
            {resourceNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 w-full text-left cursor-pointer active:scale-[0.99] ${
                    isActive
                      ? "bg-bg-nav-active text-text-main font-semibold shadow-xs"
                      : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-text-main" : "text-text-sub"
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom: Settings */}
      <div className="pt-2 border-t border-border-sub space-y-2">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 w-full text-left cursor-pointer active:scale-[0.99] ${
            activeTab === "settings"
              ? "bg-bg-nav-active text-text-main font-semibold shadow-xs"
              : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
          }`}
        >
          <Settings className="w-4 h-4 text-text-sub shrink-0" />
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
