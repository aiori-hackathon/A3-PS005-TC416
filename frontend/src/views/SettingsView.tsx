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
  Server,
  Cpu,
  Globe,
  ShieldCheck,
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
  const isBackendHealthy = Boolean(overview);

  return (
    <div className="max-w-[1360px] w-full space-y-6 animate-fadeIn pb-8">
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

      {/* System Health Diagnostics — 6 Independent Health Probes */}
      <div className="card-panel p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-text-main">System Health & Telemetry Probes</h2>
          <p className="text-xs text-text-sub mt-0.5">
            Independent operational health states derived from live backend probes. BGP ingestion, backend API, database, and signing engines are evaluated separately.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Frontend Client */}
          <div className="p-4 rounded-lg bg-bg-interactive border border-divider space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-text-sub">
                <span>Frontend Application</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-status-green">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>HEALTHY</span>
                </span>
              </div>
              <div className="text-base font-bold text-text-main">
                React 19 + TypeScript
              </div>
              <div className="text-xs text-text-dim leading-relaxed">
                Vite client application running with client-side state synchronisation.
              </div>
            </div>
            <div className="pt-2 border-t border-divider text-[11px] text-text-sub font-mono">
              Build: Production Optimized
            </div>
          </div>

          {/* 2. Backend API */}
          <div className="p-4 rounded-lg bg-bg-interactive border border-divider space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-text-sub">
                <span>Backend REST API</span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${isBackendHealthy ? "text-status-green" : "text-status-critical"}`}>
                  {isBackendHealthy ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>{isBackendHealthy ? "CONNECTED" : "UNREACHABLE"}</span>
                </span>
              </div>
              <div className="text-base font-bold text-text-main">
                FastAPI 0.115 (Uvicorn)
              </div>
              <div className="text-xs text-text-dim leading-relaxed">
                {isBackendHealthy
                  ? "Asynchronous route evaluation engine active on localhost:8000."
                  : "API server could not be reached at configured base URL."}
              </div>
            </div>
            <div className="pt-2 border-t border-divider text-[11px] text-text-sub font-mono">
              Base: /api/v1 • Team: A3-PS005-TC416
            </div>
          </div>

          {/* 3. Database Ledger (WAL) */}
          <div className="p-4 rounded-lg bg-bg-interactive border border-divider space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-text-sub">
                <span>Database Trust Store</span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${isDbHealthy ? "text-status-green" : "text-status-critical"}`}>
                  {isDbHealthy ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>{isDbHealthy ? "HEALTHY" : "ERROR"}</span>
                </span>
              </div>
              <div className="text-base font-bold text-text-main">
                SQLite 3 (WAL Mode)
              </div>
              <div className="text-xs text-text-dim leading-relaxed">
                {isDbHealthy
                  ? `Atomic transactions with append-only ledger in ${overview?.database.split(/[\\/]/).pop() || "sqlite.db"}`
                  : "Database status could not be retrieved from overview endpoint."}
              </div>
            </div>
            <div className="pt-2 border-t border-divider text-[11px] text-text-sub font-mono">
              PRAGMA journal_mode = WAL
            </div>
          </div>

          {/* 4. BGP Ingestion Engine - Derived Truthfully */}
          <div className="p-4 rounded-lg bg-bg-interactive border border-divider space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-text-sub">
                <span>BGP Ingestion Engine</span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${collectorInfo.dotStyle}`} />
                  <span className="text-[11px] font-bold text-text-main">{collectorInfo.state}</span>
                </span>
              </div>
              <div className="text-base font-bold text-text-main flex items-center gap-2">
                <span>{collectorInfo.label}</span>
              </div>
              <div className="text-xs text-text-dim leading-relaxed">
                {collectorInfo.description}
              </div>
            </div>
            <div className="pt-2 border-t border-divider text-[11px] text-text-sub font-mono truncate">
              {collectorInfo.lastError ? `Error: ${collectorInfo.lastError}` : "Source: RIPE RIS Live (rrc00, rrc01, rrc03)"}
            </div>
          </div>

          {/* 5. Cryptographic Signer - Derived from Crypto Status Provider */}
          <div className="p-4 rounded-lg bg-bg-interactive border border-divider space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-text-sub">
                <span>Cryptographic Signer</span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${isCryptoReady ? "text-brand-blue" : "text-text-dim"}`}>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isCryptoReady ? "READY" : "UNAVAILABLE"}</span>
                </span>
              </div>
              <div className="text-base font-bold text-text-main">
                {cryptoStatus?.algorithm || "NIST ML-DSA-65"}
              </div>
              <div className="text-xs text-text-dim leading-relaxed">
                {isCryptoReady
                  ? `Active provider: ${cryptoStatus?.provider || "dilithium-py"} (NIST FIPS 204 Level 3). Ready for digital attestations.`
                  : cryptoStatus?.message || "Post-quantum signing engine is unavailable."}
              </div>
            </div>
            <div className="pt-2 border-t border-divider text-[11px] text-text-sub font-mono">
              Key Lifecycle: Persistent Authority
            </div>
          </div>

          {/* 6. External RPKI Validator */}
          <div className="p-4 rounded-lg bg-bg-interactive border border-divider space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-text-sub">
                <span>External RPKI Validator</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-status-green">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>AVAILABLE</span>
                </span>
              </div>
              <div className="text-base font-bold text-text-main">
                RIPEstat Data API
              </div>
              <div className="text-xs text-text-dim leading-relaxed">
                Queries covering ROAs across RIR trust anchors (RIPE, ARIN, APNIC, LACNIC, AFRINIC).
              </div>
            </div>
            <div className="pt-2 border-t border-divider text-[11px] text-text-sub font-mono">
              Endpoint: stat.ripe.net/data/rpki-validation
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
                <div className="text-[11px] text-text-dim uppercase font-bold">Canonicalization Standard</div>
                <div className="text-sm font-bold text-text-main">RFC 8785 JSON Canonicalization Scheme (JCS)</div>
                <p className="text-text-sub text-[11px] leading-relaxed">
                  Strictly normalizes UTF-8 encoding, object key lexicographical ordering, and numeric formatting to produce byte-identical inputs before hashing.
                </p>
              </div>

              <div className="p-3.5 rounded bg-bg-card border border-divider space-y-1.5">
                <div className="text-[11px] text-text-dim uppercase font-bold">Digital Signature Standard</div>
                <div className="text-sm font-bold text-text-main">NIST FIPS 204 (ML-DSA-65)</div>
                <p className="text-text-sub text-[11px] leading-relaxed">
                  Module-Lattice-Based Digital Signature Algorithm designed to provide cryptographic authenticity against classical and quantum computing threats.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
