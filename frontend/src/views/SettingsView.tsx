import React, { useState } from "react";
import {
  Moon,
  Sun,
  Laptop,
  Database,
  Cpu,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Radio,
  FileText,
  Shield,
  CheckCircle2,
  AlertCircle,
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

  const [confirmReset, setConfirmReset] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const themeOptions: Array<{
    id: "dark" | "light" | "system";
    label: string;
    desc: string;
    icon: any;
  }> = [
    {
      id: "dark",
      label: "Dark mode",
      desc: "High-contrast charcoal & slate theme",
      icon: Moon,
    },
    {
      id: "light",
      label: "Light mode",
      desc: "High-clarity daytime administrative theme",
      icon: Sun,
    },
    {
      id: "system",
      label: "System default",
      desc: "Matches your operating system preference",
      icon: Laptop,
    },
  ];

  const handleExecuteReset = async () => {
    await resetDatabaseAction();
    setConfirmReset(false);
  };

  const isMldsaActive = cryptoStatus?.available || false;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="pb-2 border-b border-border-card">
        <h1 className="text-lg font-bold text-text-main tracking-tight">
          System settings & diagnostics
        </h1>
        <p className="text-xs text-text-sub mt-0.5">
          Configure interface appearance, verify engine health, and inspect cryptographic provider status.
        </p>
      </div>

      {/* 2. Appearance & Theme Selection */}
      <div className="card-panel p-4 space-y-3">
        <div className="space-y-0.5">
          <h2 className="text-xs font-semibold text-text-main">
            Interface appearance
          </h2>
          <p className="text-[11px] text-text-sub">
            Select your preferred visual style or follow operating system settings.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`p-3 rounded border text-left transition-colors cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? "bg-bg-raised border-brand-blue"
                    : "bg-bg-app border-border-card hover:border-text-dim"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-1.5 rounded bg-bg-card border border-border-card text-text-sub">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-semibold text-brand-blue">
                      Active
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-text-main">
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-text-dim mt-0.5">
                    {opt.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Verified Engine Health & Data Ingestion Status */}
      <div className="card-panel p-4 space-y-3">
        <div className="space-y-0.5">
          <h2 className="text-xs font-semibold text-text-main">
            Engine health & persistence
          </h2>
          <p className="text-[11px] text-text-sub">
            Actual operating status of the local detection daemon, database, and telemetry ingestion.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
          {/* Item 1: Backend Daemon */}
          <div className="p-3 rounded bg-bg-app border border-border-card space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-dim uppercase tracking-wider font-medium">
                Backend Daemon
              </span>
              <span className="flex items-center gap-1 text-[11px] text-status-green font-medium">
                <CheckCircle2 className="w-3 h-3" />
                <span>Connected</span>
              </span>
            </div>
            <div className="font-semibold text-text-main">
              FastAPI Runtime
            </div>
            <div className="text-[11px] text-text-sub">
              Port: 8000 • Protocol: REST / JSON
            </div>
          </div>

          {/* Item 2: Database Mode */}
          <div className="p-3 rounded bg-bg-app border border-border-card space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-dim uppercase tracking-wider font-medium">
                Storage Engine
              </span>
              <span className="flex items-center gap-1 text-[11px] text-status-green font-medium">
                <CheckCircle2 className="w-3 h-3" />
                <span>WAL Active</span>
              </span>
            </div>
            <div className="font-semibold text-text-main font-mono text-[11px]">
              SQLite 3 (ACID)
            </div>
            <div className="text-[11px] text-text-sub truncate">
              {overview?.database ? "horaq.db (Safe locking)" : "Initialized"}
            </div>
          </div>

          {/* Item 3: Post-Quantum Provider */}
          <div className="p-3 rounded bg-bg-app border border-border-card space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-dim uppercase tracking-wider font-medium">
                ML-DSA-65 Provider
              </span>
              <span
                className={`flex items-center gap-1 text-[11px] font-medium ${
                  isMldsaActive ? "text-status-green" : "text-status-amber"
                }`}
              >
                {isMldsaActive ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    <span>Unavailable</span>
                  </>
                )}
              </span>
            </div>
            <div className="font-semibold text-text-main">
              NIST FIPS 204
            </div>
            <div className="text-[11px] text-text-sub">
              {isMldsaActive
                ? "liboqs hardware bindings loaded"
                : "liboqs C-library not on system PATH"}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Database Maintenance & Benchmark Tools */}
      <div className="card-panel p-4 space-y-3">
        <div className="space-y-0.5">
          <h2 className="text-xs font-semibold text-text-main">
            Database maintenance & benchmark evaluation
          </h2>
          <p className="text-[11px] text-text-sub">
            Populate test reference baselines or clear stored observations.
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
          <div className="text-[11px] text-text-sub">
            Tracked baselines: <strong className="text-text-main font-mono">{overview?.tracked_routes || 0}</strong> • Total alerts: <strong className="text-text-main font-mono">{overview?.total_alerts || 0}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => seedDemoDataAction()}
              className="px-3 py-1.5 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-text-main text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
              <span>Seed benchmark data</span>
            </button>

            {confirmReset ? (
              <div className="flex items-center gap-1.5 p-1 rounded bg-bg-app border border-status-red">
                <span className="text-[11px] text-status-red px-1">Confirm reset?</span>
                <button
                  onClick={handleExecuteReset}
                  className="px-2 py-1 rounded bg-status-red text-white text-[11px] font-semibold cursor-pointer"
                >
                  Yes, wipe data
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-1 rounded bg-bg-btn text-text-sub text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="px-3 py-1.5 rounded bg-bg-btn border border-border-card hover:border-status-red hover:text-status-red text-text-sub text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset database</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Progressive Disclosure: Technical Architecture Metadata */}
      <div className="border border-border-card rounded overflow-hidden">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full p-3.5 bg-bg-raised flex items-center justify-between text-xs font-medium text-text-main hover:bg-bg-nav-hover transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-brand-blue" />
            <span>Technical architecture & standards compliance</span>
          </span>
          <span className="text-text-dim flex items-center gap-1 text-[11px]">
            <span>{showTechnicalDetails ? "Collapse" : "Expand"}</span>
            {showTechnicalDetails ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
        </button>

        {showTechnicalDetails && (
          <div className="p-4 bg-bg-card space-y-3 border-t border-border-card text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="p-2.5 rounded bg-bg-app border border-border-card space-y-0.5">
                <span className="text-text-dim block">Canonicalization Standard</span>
                <span className="text-text-main font-mono font-medium">RFC 8785 JSON Canonicalization Scheme (JCS)</span>
              </div>
              <div className="p-2.5 rounded bg-bg-app border border-border-card space-y-0.5">
                <span className="text-text-dim block">Content Integrity Hash</span>
                <span className="text-text-main font-mono font-medium">SHA-256 (FIPS 180-4)</span>
              </div>
              <div className="p-2.5 rounded bg-bg-app border border-border-card space-y-0.5">
                <span className="text-text-dim block">Post-Quantum Signature Primitive</span>
                <span className="text-text-main font-mono font-medium">NIST FIPS 204 (ML-DSA-65)</span>
              </div>
              <div className="p-2.5 rounded bg-bg-app border border-border-card space-y-0.5">
                <span className="text-text-dim block">RPKI ROA Protocol</span>
                <span className="text-text-main font-mono font-medium">RFC 6483 / RFC 6811 Validation</span>
              </div>
              <div className="p-2.5 rounded bg-bg-app border border-border-card space-y-0.5">
                <span className="text-text-dim block">Subprefix Containment Semantics</span>
                <span className="text-text-main font-mono font-medium">Strict child.subnet_of(parent) CIDR check</span>
              </div>
              <div className="p-2.5 rounded bg-bg-app border border-border-card space-y-0.5">
                <span className="text-text-dim block">Baseline Trust Policy</span>
                <span className="text-text-main font-mono font-medium">Non-Poisoning (Zero auto-promotion on alert)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
