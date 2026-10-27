import React, { useState } from "react";
import {
  Moon,
  Sun,
  Laptop,
  ChevronDown,
  ChevronUp,
  Lock,
  Database,
  Radio,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";
import { getCollectorStatusDisplay } from "../utils/collectorStatus";

export const SettingsView: React.FC = () => {
  const {
    theme,
    setTheme,
    cryptoStatus,
    overview,
  } = useHoraqStore();

  const [showTechnical, setShowTechnical] = useState(false);

  const themeOptions: Array<{
    id: "light" | "dark" | "system";
    label: string;
    desc: string;
    icon: any;
  }> = [
    {
      id: "light",
      label: "Light Theme",
      desc: "Clean daylight operations palette",
      icon: Sun,
    },
    {
      id: "dark",
      label: "Dark Theme",
      desc: "Deep graphite command-centre palette",
      icon: Moon,
    },
    {
      id: "system",
      label: "System Automatic",
      desc: "Matches your operating system preference",
      icon: Laptop,
    },
  ];

  const collectorInfo = getCollectorStatusDisplay(overview?.collector_status);
  const isDbHealthy = Boolean(overview?.database);
  const isCryptoReady = cryptoStatus?.status === "READY";

  return (
    <div className="max-w-[1360px] w-full space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-4 border-b border-divider">
        <h1 className="text-2xl sm:text-[28px] font-semibold text-text-main tracking-tight">
          System Preferences & Diagnostics
        </h1>
        <p className="text-sm text-text-sub mt-1">
          Interface appearance settings, live ingestion telemetry health, and post-quantum cryptographic engine diagnostics.
        </p>
      </div>

      {/* Appearance Section */}
      <div className="card-panel p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-text-main">Appearance</h2>
          <p className="text-xs text-text-sub mt-0.5">Select your preferred interface appearance theme.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`flex items-start gap-3 p-3.5 rounded-lg text-left transition-colors border cursor-pointer ${
                  isSelected
                    ? "bg-bg-selected border-brand-blue"
                    : "bg-bg-card border-border-card hover:bg-bg-interactive"
                }`}
              >
                <div
                  className={`p-2 rounded-md ${
                    isSelected
                      ? "bg-brand-blue text-white"
                      : "bg-bg-interactive text-text-sub"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                    <span>{opt.label}</span>
                    {isSelected && (
                      <span className="text-[11px] font-medium text-brand-blue">(Active)</span>
                    )}
                  </div>
                  <div className="text-xs text-text-sub mt-0.5">{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* System Health Diagnostics */}
      <div className="card-panel p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-text-main">System Health & Telemetry Status</h2>
          <p className="text-xs text-text-sub mt-0.5">
            Active runtime parameters derived from live backend probes. Live ingestion and application health are reported independently.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. BGP Ingestion Engine - Derived Truthfully from Collector Telemetry */}
          <div className="p-4 rounded-lg bg-bg-interactive border border-divider space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-text-sub">
                <span>BGP Ingestion Engine</span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${collectorInfo.dotStyle}`} />
                  <Radio
                    className={`w-4 h-4 ${
                      collectorInfo.state === "CONNECTED"
                        ? "text-status-green"
                        : collectorInfo.state === "CONNECTING"
                        ? "text-amber-500"
                        : collectorInfo.state === "DISCONNECTED"
                        ? "text-status-critical"
                        : "text-text-dim"
                    }`}
                  />
                </span>
              </div>
              <div className="text-base font-bold text-text-main flex items-center gap-2">
                <span>{collectorInfo.label}</span>
              </div>
              <div className="text-xs text-text-dim leading-relaxed">
                {collectorInfo.description}
              </div>
            </div>

            {collectorInfo.lastError && (
              <div className="pt-2 border-t border-divider text-[11px] text-amber-500 font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate" title={collectorInfo.lastError}>
                  {collectorInfo.lastError}
                </span>
              </div>
            )}
          </div>

          {/* 2. Database Ledger (WAL) - Derived from Backend Overview Probe */}
          <div className="p-4 rounded-lg bg-bg-interactive border border-divider space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-text-sub">
                <span>Database Ledger (WAL)</span>
                {isDbHealthy ? (
                  <CheckCircle2 className="w-4 h-4 text-status-green" />
                ) : (
                  <HelpCircle className="w-4 h-4 text-text-dim" />
                )}
              </div>
              <div className="text-base font-bold text-text-main">
                {isDbHealthy ? "SQLite 3 (WAL Mode)" : "Database Unreachable"}
              </div>
              <div className="text-xs text-text-dim leading-relaxed">
                {isDbHealthy
                  ? `ACID-compliant storage at ${overview?.database.split(/[\\/]/).pop() || "local file"}`
                  : "Database status could not be retrieved from overview endpoint."}
              </div>
            </div>
            {isDbHealthy && (
              <div className="pt-2 border-t border-divider text-[11px] text-text-sub font-mono">
                PRAGMA journal_mode = WAL (Atomic)
              </div>
            )}
          </div>

          {/* 3. Cryptographic Signer - Derived from Crypto Status Provider */}
          <div className="p-4 rounded-lg bg-bg-interactive border border-divider space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-text-sub">
                <span>Cryptographic Signer</span>
                <Lock
                  className={`w-4 h-4 ${
                    isCryptoReady ? "text-brand-blue" : "text-text-dim"
                  }`}
                />
              </div>
              <div className="text-base font-bold text-text-main">
                {cryptoStatus?.algorithm || "NIST ML-DSA-65"}
              </div>
              <div className="text-xs text-text-dim leading-relaxed">
                {isCryptoReady
                  ? `Active provider: ${cryptoStatus?.provider || "dilithium-py"} (NIST Level 3)`
                  : cryptoStatus?.message || "Post-quantum signing engine is unavailable."}
              </div>
            </div>
            <div className="pt-2 border-t border-divider text-[11px] text-text-sub font-mono">
              Status: {cryptoStatus?.status || "UNKNOWN"}
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications (Collapsible) */}
      <div className="card-panel overflow-hidden">
        <button
          onClick={() => setShowTechnical(!showTechnical)}
          className="w-full p-4 flex items-center justify-between text-sm font-semibold text-text-main hover:bg-bg-interactive transition-colors cursor-pointer"
        >
          <span>Technical Architecture & Cryptographic Engine Specifications</span>
          {showTechnical ? (
            <ChevronUp className="w-4 h-4 text-text-dim" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-dim" />
          )}
        </button>

        {showTechnical && (
          <div className="p-6 border-t border-divider bg-bg-app space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded bg-bg-card border border-divider space-y-1.5">
                <div className="text-[11px] text-text-dim uppercase font-bold">Canonicalization Scheme</div>
                <div className="text-sm font-bold text-text-main">RFC 8785 JSON Canonicalization</div>
                <p className="text-text-sub text-[11px] leading-relaxed">
                  Eliminates whitespace, key order, and float representation ambiguities before SHA-256 digest calculation.
                </p>
              </div>

              <div className="p-3.5 rounded bg-bg-card border border-divider space-y-1.5">
                <div className="text-[11px] text-text-dim uppercase font-bold">Digital Signature Standard</div>
                <div className="text-sm font-bold text-text-main">NIST FIPS 204 (ML-DSA-65)</div>
                <p className="text-text-sub text-[11px] leading-relaxed">
                  Module-Lattice-Based Digital Signature Standard designed to withstand quantum cryptanalytic attacks.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
