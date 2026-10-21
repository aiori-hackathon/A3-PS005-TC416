import React from "react";
import {
  LayoutGrid,
  AlertTriangle,
  Globe,
  FlaskConical,
  FileText,
  ShieldCheck,
  SendHorizontal,
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
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
    },
    { id: "routes" as NavTab, label: "Baselines", icon: Globe },
    { id: "scenarios" as NavTab, label: "Scenario lab", icon: FlaskConical },
  ];

  const toolsNav = [
    { id: "evidence" as NavTab, label: "Evidence ledger", icon: FileText },
    { id: "rpki" as NavTab, label: "RPKI inspector", icon: ShieldCheck },
    { id: "inject" as NavTab, label: "Manual route test", icon: SendHorizontal },
  ];

  return (
    <aside className="w-52 bg-bg-sidebar border-r border-border-sub flex flex-col justify-between p-2.5 select-none shrink-0 h-[calc(100vh-3.25rem)] transition-colors">
      {/* Top Navigation */}
      <div className="space-y-5">
        <div className="space-y-0.5">
          <div className="px-2.5 py-1 text-[11px] font-medium text-text-dim uppercase tracking-wider">
            Monitoring
          </div>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors w-full text-left cursor-pointer ${
                  isActive
                    ? "bg-bg-nav-active text-text-main font-medium border-l-2 border-brand-blue pl-2"
                    : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? "text-brand-blue" : "text-text-dim"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-status-red text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Verification & Analysis Tools Section */}
        <div className="space-y-0.5">
          <div className="px-2.5 py-1 text-[11px] font-medium text-text-dim uppercase tracking-wider">
            Verification
          </div>
          {toolsNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-colors w-full text-left cursor-pointer ${
                  isActive
                    ? "bg-bg-nav-active text-text-main font-medium border-l-2 border-brand-blue pl-2"
                    : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? "text-brand-blue" : "text-text-dim"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Settings */}
      <div className="pt-2 border-t border-border-item">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors w-full text-left cursor-pointer ${
            activeTab === "settings"
              ? "bg-bg-nav-active text-text-main font-medium border-l-2 border-brand-blue pl-2"
              : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Settings
              className={`w-3.5 h-3.5 shrink-0 ${
                activeTab === "settings" ? "text-brand-blue" : "text-text-dim"
              }`}
            />
            <span>Settings</span>
          </div>
          <span className="text-[10px] text-text-dim font-mono">v1.0</span>
        </button>
      </div>
    </aside>
  );
};
