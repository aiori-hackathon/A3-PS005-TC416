import React from "react";
import {
  Cpu,
  Server,
  CheckCircle2,
  Moon,
  Sun,
  Laptop,
  Lock,
  Database,
  Trash2,
  Sparkles,
  Shield,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";

export const SettingsView: React.FC = () => {
  const {
    theme,
    setTheme,
    cryptoStatus,
    overview,
    seedDemoDataAction,
    resetDatabaseAction,
  } = useHoraqStore();

  const themeOptions: Array<{
    id: "dark" | "light" | "system";
    label: string;
    desc: string;
    icon: any;
  }> = [
    {
      id: "dark",
      label: "Dark mode",
      desc: "Deep obsidian theme with high contrast",
      icon: Moon,
    },
    {
      id: "light",
      label: "Light mode",
      desc: "Clean, radiant high-clarity day theme",
      icon: Sun,
    },
    {
      id: "system",
      label: "System auto",
      desc: "Automatically matches your OS preference",
      icon: Laptop,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-base font-semibold text-text-main tracking-tight">
          Settings & System Architecture
        </h2>
        <p className="text-xs text-text-sub mt-0.5">
          Configure appearance, monitor parameters, and inspect cryptographic non-repudiation engines.
        </p>
      </div>

      {/* Appearance & Theme Card */}
      <div className="card-panel p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-text-main">Appearance & Theme</h3>
          <p className="text-xs text-text-sub mt-0.5">
            Choose your preferred visual theme or let the system decide automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`flex flex-col items-start p-4 rounded-xl text-left transition-all border cursor-pointer ${
                  isSelected
                    ? "bg-brand-blue/10 border-brand-blue shadow-sm"
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

      {/* Side-by-Side Daemon & Architecture Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core Daemon Config */}
        <div className="card-panel p-5 space-y-4">
          <div className="flex items-center gap-2 text-text-main font-semibold text-sm">
            <Cpu className="w-4 h-4 text-brand-blue" />
            <span>HORA-Q Monitor Daemon</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-sub">Hackathon Event</span>
              <span className="font-semibold text-text-main">AIORI-3 (Track 2 Cyber Security)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-sub">Problem Statement</span>
              <span className="font-semibold text-text-main">PS-005 (BGP Anomaly Monitor)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-sub">Team ID</span>
              <span className="font-mono text-brand-blue font-bold">A3-PS005-TC416</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-sub">Database Mode</span>
              <span className="text-text-main font-mono">SQLite WAL (Safe Lock Handling)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-sub">Canonical Serialization</span>
              <span className="text-status-green font-semibold">RFC 8785 (Deterministic JSON)</span>
            </div>
          </div>
        </div>

        {/* Cryptography & RPKI */}
        <div className="card-panel p-5 space-y-4">
          <div className="flex items-center gap-2 text-text-main font-semibold text-sm">
            <Lock className="w-4 h-4 text-brand-blue" />
            <span>Cryptographic & Network Stack</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-sub">Quantum Algorithm</span>
              <span className="font-mono text-purple-400 font-semibold">
                {cryptoStatus?.algorithm || "ML-DSA-65 (NIST FIPS 204)"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-sub">Fallback Semantics</span>
              <span className="text-status-green font-semibold">Strict (Zero Weak Fallback)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-sub">Integrity Hashing</span>
              <span className="text-text-main font-mono">SHA-256</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-sub">RPKI Live Provider</span>
              <span className="text-text-main font-mono">RIPEstat REST (stat.ripe.net)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-sub">Backend Daemon</span>
              <span className="text-status-green flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected (Port 8000)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Maintenance & Evaluation Seeder Card */}
      <div className="card-panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-main">
              Database Maintenance & Evaluation Seeding
            </h3>
            <p className="text-xs text-text-sub mt-0.5">
              Reset state or populate standard test benchmarks for demonstration evaluation.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={() => seedDemoDataAction()}
            className="px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 text-brand-blue text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seed Realistic Demonstration Data</span>
          </button>

          <button
            onClick={() => resetDatabaseAction()}
            className="px-4 py-2 rounded-lg bg-bg-app border border-border-card hover:bg-bg-nav-hover text-xs font-semibold text-text-sub hover:text-red-400 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear / Reset Database</span>
          </button>
        </div>
      </div>
    </div>
  );
};
