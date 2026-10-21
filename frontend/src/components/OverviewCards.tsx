import React from "react";
import { Route, Eye, AlertOctagon, KeyRound, Radio } from "lucide-react";
import { OverviewStats } from "../types";

interface OverviewCardsProps {
  stats: OverviewStats | null;
  onSelectTab: (tab: "alerts" | "routes" | "scenarios" | "manual" | "evidence" | "rpki") => void;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ stats, onSelectTab }) => {
  const routesCount = stats?.tracked_routes ?? 0;
  const obsCount = stats?.total_observations ?? 0;
  const activeAlerts = stats?.active_alerts ?? 0;
  const totalAlerts = stats?.total_alerts ?? 0;
  const cryptoAvailable = stats?.crypto_status?.available ?? false;
  const cryptoMsg = stats?.crypto_status?.message ?? "Checking provider...";

  return (
    <div className="stats-ribbon">
      {/* 1. Tracked Routes */}
      <div
        className="stat-item"
        style={{ cursor: "pointer" }}
        onClick={() => onSelectTab("routes")}
      >
        <div className="stat-header">
          <span>TRACKED BASELINES</span>
          <Route size={15} color="var(--brand-cyan)" />
        </div>
        <div className="stat-value">{routesCount}</div>
        <div className="stat-subtext">Active prefix baselines</div>
      </div>

      {/* 2. Total Observations */}
      <div className="stat-item">
        <div className="stat-header">
          <span>TOTAL OBSERVATIONS</span>
          <Eye size={15} color="#60a5fa" />
        </div>
        <div className="stat-value">{obsCount}</div>
        <div className="stat-subtext">Normalized route events</div>
      </div>

      {/* 3. Active Anomalies */}
      <div
        className="stat-item"
        style={{
          cursor: "pointer",
          background: activeAlerts > 0 ? "rgba(244, 63, 94, 0.06)" : undefined,
          borderRadius: "var(--radius-sm)",
        }}
        onClick={() => onSelectTab("alerts")}
      >
        <div className="stat-header">
          <span>ACTIVE ANOMALIES</span>
          <AlertOctagon size={15} color={activeAlerts > 0 ? "var(--badge-red-text)" : "#34d399"} />
        </div>
        <div
          className="stat-value"
          style={{ color: activeAlerts > 0 ? "var(--badge-red-text)" : "#ffffff" }}
        >
          {activeAlerts}
        </div>
        <div className="stat-subtext">
          {totalAlerts} total alerts fired
        </div>
      </div>

      {/* 4. Post-Quantum Crypto (ML-DSA-65) */}
      <div
        className="stat-item"
        onClick={() => onSelectTab("evidence")}
        style={{ cursor: "pointer" }}
      >
        <div className="stat-header">
          <span>PQC SIGNATURE ENGINE</span>
          <KeyRound size={15} color={cryptoAvailable ? "var(--badge-green-text)" : "var(--badge-amber-text)"} />
        </div>
        <div style={{ marginTop: "0.2rem" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: "4px",
              background: cryptoAvailable ? "var(--badge-green-bg)" : "var(--badge-amber-bg)",
              color: cryptoAvailable ? "var(--badge-green-text)" : "var(--badge-amber-text)",
              border: `1px solid ${cryptoAvailable ? "var(--badge-green-border)" : "var(--badge-amber-border)"}`,
            }}
          >
            {cryptoAvailable ? "ML-DSA-65 READY" : "PROVIDER OFFLINE"}
          </span>
        </div>
        <div className="stat-subtext" style={{ marginTop: "auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={cryptoMsg}>
          {cryptoAvailable ? "FIPS 204 liboqs active" : "Strict no-fallback mode"}
        </div>
      </div>

      {/* 5. Live Collector */}
      <div className="stat-item">
        <div className="stat-header">
          <span>RIPE RIS LIVE</span>
          <Radio size={15} color="var(--text-dim)" />
        </div>
        <div style={{ marginTop: "0.2rem" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: "4px",
              background: "var(--badge-idle-bg)",
              color: "var(--badge-idle-text)",
              border: "1px solid var(--badge-idle-border)",
            }}
          >
            OPT-IN FEED
          </span>
        </div>
        <div className="stat-subtext" style={{ marginTop: "auto" }}>
          Synthetic suite active
        </div>
      </div>
    </div>
  );
};
