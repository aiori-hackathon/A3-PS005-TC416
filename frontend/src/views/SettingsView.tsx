import React, { useState } from "react";
import {
  Cpu,
  Moon,
  Sun,
  Laptop,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Server,
  Lock,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";

export const SettingsView: React.FC = () => {
  const {
    theme,
    setTheme,
    cryptoStatus,
    overview,
  } = useHoraqStore();

  const [showTechnical, setShowTechnical] = useState(false);

  const themeOptions: Array<{
    id: "dark" | "light" | "system";
    label: string;
    desc: string;
    icon: any;
  }> = [
    {
      id: "dark",
      label: "Dark mode",
      desc: "Deep obsidian palette with high contrast",
      icon: Moon,
    },
    {
      id: "light",
      label: "Light mode",
      desc: "Clean, radiant daylight theme",
      icon: Sun,
    },
    {
      id: "system",
      label: "System auto",
      desc: "Matches your operating system preference",
      icon: Laptop,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-2 border-b border-border-card">
        <h1 className="text-xl sm:text-2xl font-semibold text-text-main tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-text-sub mt-1">
          Appearance preferences, system health, and technical verification specifications.
        </p>
      </div>

      {/* Appearance & Theme */}
      <div className="card-panel p-5 space-y-3">
        <h2 className="text-sm font-semibold text-text-main">Appearance</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`flex flex-col items-start p-4 rounded-xl text-left transition-all border cursor-pointer ${
                  isSelected
                    ? "bg-brand-blue/10 border-brand-blue shadow-xs"
                    : "bg-bg-app border-border-card hover:border-text-dim"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? "bg-brand-blue text-slate-950 font-bold"
                        : "bg-bg-btn text-text-sub"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="text-[11px] font-semibold text-brand-blue">
                      Active
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-text-main">
                  {opt.label}
                </span>
                <span className="text-[11px] text-text-sub mt-0.5 leading-normal">
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* System Health */}
      <div className="card-panel p-5 space-y-3">
        <h2 className="text-sm font-semibold text-text-main">System health</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-bg-app border border-border-card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-status-green" />
              <span className="text-text-sub">HORA-Q Backend API</span>
            </div>
            <span className="text-status-green font-semibold flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Online (FastAPI)
            </span>
          </div>

          <div className="p-3 rounded-lg bg-bg-app border border-border-card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-blue" />
              <span className="text-text-sub">Local Database</span>
            </div>
            <span className="text-status-green font-semibold flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected (SQLite WAL)
            </span>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure: Technical Details */}
      <div className="card-panel p-5 space-y-3">
        <button
          onClick={() => setShowTechnical(!showTechnical)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div>
            <h2 className="text-sm font-semibold text-text-main">
              Technical specifications
            </h2>
            <p className="text-xs text-text-sub mt-0.5">
              Algorithms, hackathon project identity, and cryptographic standards.
            </p>
          </div>
          <div className="text-text-dim hover:text-text-main">
            {showTechnical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showTechnical && (
          <div className="pt-3 border-t border-border-card space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-sub">Hackathon Event</span>
              <span className="font-semibold text-text-main">AIORI-3 (Track 2 Cyber Security)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-sub">Problem Statement</span>
              <span className="font-semibold text-text-main">PS-005 (BGP Anomaly Monitor)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-sub">Team ID</span>
              <span className="font-mono text-brand-blue font-bold">A3-PS005-TC416</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-sub">Canonicalization Standard</span>
              <span className="text-text-main font-mono">RFC 8785 (JSON Canonicalization Scheme)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-sub">Integrity Digest</span>
              <span className="text-text-main font-mono">SHA-256 (FIPS 180-4)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-sub">Signature Engine</span>
              <span className="text-text-main font-mono">ML-DSA-65 (NIST FIPS 204 Post-Quantum)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
