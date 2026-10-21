import React from "react";
import { Shield, RefreshCw, Activity, AlertTriangle, Radio } from "lucide-react";

interface HeaderProps {
  isOnline: boolean;
  isAutoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  isAutoRefresh,
  onToggleAutoRefresh,
  onManualRefresh,
  isRefreshing,
  onReset,
}) => {
  return (
    <header className="app-header" role="banner">
      {/* Left: Brand Identity */}
      <div className="brand-wrapper">
        <div className="brand-logo-icon">
          <Shield size={22} strokeWidth={2.5} />
        </div>
        <div>
          <span className="brand-kicker">AIORI-3 CYBER DEFENSE</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
            <span className="brand-title">
              HORA<span className="brand-gradient">-Q</span>
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                color: "var(--brand-violet)",
                background: "rgba(124, 92, 252, 0.12)",
                padding: "2px 7px",
                borderRadius: "4px",
                border: "1px solid rgba(124, 92, 252, 0.25)",
                fontWeight: 700,
              }}
            >
              TC416
            </span>
          </div>
        </div>
      </div>

      {/* Center: Ecosystem Status Pill Badge */}
      <div className="security-session-badge" title="AIORI-3 Track 2 Problem PS-005: Explainable BGP Anomaly Monitor">
        <span className="pulse-dot" style={{ background: isOnline ? "#00d4aa" : "#f43f5e", boxShadow: isOnline ? "0 0 8px #00d4aa" : "0 0 8px #f43f5e" }} />
        <span>TRACK 2 • PS-005 CYBER SECURITY</span>
      </div>

      {/* Right: Operational Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Backend Connectivity Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.3rem 0.65rem",
            borderRadius: "var(--radius-sm)",
            background: isOnline ? "var(--badge-green-bg)" : "var(--badge-red-bg)",
            border: `1px solid ${isOnline ? "var(--badge-green-border)" : "var(--badge-red-border)"}`,
            fontSize: "0.75rem",
            fontWeight: 700,
            color: isOnline ? "var(--badge-green-text)" : "var(--badge-red-text)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <Radio size={12} className={isOnline ? "spin-slow" : ""} />
          {isOnline ? "API 8000 ONLINE" : "API OFFLINE"}
        </div>

        {/* Auto Refresh Toggle */}
        <button
          className="btn btn-secondary"
          style={{
            fontSize: "0.75rem",
            padding: "0.4rem 0.75rem",
            borderColor: isAutoRefresh ? "var(--brand-cyan)" : "var(--border-card)",
          }}
          onClick={onToggleAutoRefresh}
          title="Toggle live 5s auto-polling"
        >
          <Activity size={13} color={isAutoRefresh ? "var(--brand-cyan)" : "var(--text-dim)"} />
          Auto-Poll: {isAutoRefresh ? "ON" : "OFF"}
        </button>

        {/* Manual Refresh */}
        <button
          className="btn btn-secondary"
          style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem" }}
          onClick={onManualRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw size={13} className={isRefreshing ? "spin" : ""} />
          Sync
        </button>

        {/* Clean Reset */}
        <button
          className="btn btn-danger"
          style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem" }}
          onClick={onReset}
          title="Clear database for fresh evaluation run"
        >
          <AlertTriangle size={13} />
          Reset
        </button>
      </div>
    </header>
  );
};
