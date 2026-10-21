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
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all w-full text-left cursor-pointer ${
                  isActive
                    ? "bg-bg-nav-active text-text-main font-semibold shadow-xs"
                    : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-brand-blue" : "text-text-sub"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="badge badge-error text-[10px] py-0 px-1.5 leading-tight">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Resources Section */}
        <div>
          <div className="px-3 text-[10px] text-text-dim font-bold uppercase tracking-wider mb-2">
            Resources & Forensic Tools
          </div>
          <div className="space-y-1">
            {resourceNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all w-full text-left cursor-pointer ${
                    isActive
                      ? "bg-bg-nav-active text-text-main font-semibold shadow-xs"
                      : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
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
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all w-full text-left cursor-pointer ${
            activeTab === "settings"
              ? "bg-bg-nav-active text-text-main font-semibold shadow-xs"
              : "text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
          }`}
        >
          <Settings className="w-4 h-4 text-text-sub" />
          <span>Settings</span>
        </button>

        <div className="px-3 pt-1 text-[11px] text-text-dim flex items-center justify-between">
          <span className="font-semibold text-text-sub">HORA-Q</span>
          <span className="font-mono text-[10px]">AIORI-3 Track 2</span>
        </div>
      </div>
    </aside>
  );
};
