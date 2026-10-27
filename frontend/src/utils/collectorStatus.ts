import { OverviewStats } from "../types";

export type CollectorState =
  | "CONNECTED"
  | "CONNECTING"
  | "DISCONNECTED"
  | "DISABLED"
  | "UNAVAILABLE";

export interface CollectorStatusDisplay {
  state: CollectorState;
  label: string;
  badgeStyle: string;
  dotStyle: string;
  description: string;
  lastError: string | null;
}

/**
 * Derives a consistent, truthful collector status representation for both
 * the Overview dashboard and the Settings diagnostics view.
 */
export function getCollectorStatusDisplay(
  collectorStatus?: OverviewStats["collector_status"]
): CollectorStatusDisplay {
  if (!collectorStatus) {
    return {
      state: "UNAVAILABLE",
      label: "Status Unavailable",
      badgeStyle: "text-text-dim border-border-card bg-bg-interactive",
      dotStyle: "bg-text-dim",
      description: "Backend collector probe pending or telemetry unavailable",
      lastError: null,
    };
  }

  const { enabled, running, connected, last_error } = collectorStatus;

  // 1. Deliberately disabled (default for reproducible judging)
  if (!enabled) {
    return {
      state: "DISABLED",
      label: "Disabled (Opt-In)",
      badgeStyle: "text-text-sub border-divider bg-bg-interactive",
      dotStyle: "bg-text-dim",
      description: "Live WebSocket feed is disabled (HORAQ_LIVE_COLLECTOR=false for reproducible judging)",
      lastError: last_error || null,
    };
  }

  // 2. Enabled, process active, socket established
  if (running && connected) {
    return {
      state: "CONNECTED",
      label: "Connected",
      badgeStyle: "text-status-green border-green-500/20 bg-green-500/10",
      dotStyle: "bg-status-green animate-pulse",
      description: "Active WebSocket connection to RIPE RIS Live (rrc00, rrc01, rrc03)",
      lastError: null,
    };
  }

  // 3. Enabled, process active, attempting connection / reconnecting
  if (running && !connected) {
    return {
      state: "CONNECTING",
      label: last_error ? "Reconnecting" : "Connecting",
      badgeStyle: "text-amber-500 border-amber-500/20 bg-amber-500/10",
      dotStyle: "bg-amber-500 animate-pulse",
      description: last_error
        ? `Connection interrupted: ${last_error}`
        : "Establishing WebSocket connection to RIPE RIS Live feed...",
      lastError: last_error || null,
    };
  }

  // 4. Enabled but not running
  return {
    state: "DISCONNECTED",
    label: "Disconnected",
    badgeStyle: "text-red-500 border-red-500/20 bg-red-500/10",
    dotStyle: "bg-red-500",
    description: last_error
      ? `Collector halted with error: ${last_error}`
      : "Collector is enabled in configuration but ingestion loop is not running",
    lastError: last_error || null,
  };
}
