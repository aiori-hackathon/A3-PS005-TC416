import React from "react";
import {
  LayoutGrid,
  ShieldAlert,
  Globe,
  Terminal,
  Lock,
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
      label: "Anomalies",
      icon: ShieldAlert,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
    },
    { id: "routes" as NavTab, label: "Baselines", icon: Globe },
    { id: "scenarios" as NavTab, label: "Scenarios", icon: Terminal },
  ];

  const resourceNav = [
    { id: "evidence" as NavTab, label: "Evidence Vault", icon: Lock },
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
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all w-full text-left ${
                  isActive
                    ? "bg-bg-nav-active text-text-main font-medium shadow-sm"
                    : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-brand-blue" : "text-text-sub"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Resources Section */}
        <div>
          <div className="px-3 text-xs text-text-dim font-semibold mb-2">
            Resources
          </div>
          <div className="space-y-1">
            {resourceNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all w-full text-left ${
                    isActive
                      ? "bg-bg-nav-active text-text-main font-medium shadow-sm"
                      : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-brand-blue" : "text-text-sub"
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom: Settings & Hackathon Version info */}
      <div className="pt-2 border-t border-border-sub space-y-2">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all w-full text-left ${
            activeTab === "settings"
              ? "bg-bg-nav-active text-text-main font-medium shadow-sm"
              : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
          }`}
        >
          <Settings className="w-4 h-4 text-text-sub" />
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
