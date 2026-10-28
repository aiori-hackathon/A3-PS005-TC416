import { OverviewStats } from "../types";

export type CollectorState =
  | "CONNECTED"
  | "CONNECTING"
  | "STALE"
  | "FAILED"
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
 * Truthfully distinguishes DISABLED, CONNECTING, CONNECTED, STALE, and FAILED states.
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

  const { enabled, running, connected, last_error, last_message_at, messages_received } = collectorStatus;

  // 1. Deliberately disabled (default for reproducible judging)
  if (!enabled) {
    return {
      state: "DISABLED",
      label: "Disabled (Controlled Testbed)",
      badgeStyle: "text-text-sub border-divider bg-bg-interactive",
      dotStyle: "bg-text-dim",
      description: "Live WebSocket feed is disabled (HORAQ_LIVE_COLLECTOR=false for reproducible judging)",
      lastError: last_error || null,
    };
  }

  // 2. Collector error or failed reconnection
  if (last_error && !connected) {
    return {
      state: "FAILED",
      label: "Failed",
      badgeStyle: "text-status-critical border-red-500/20 bg-red-500/10",
      dotStyle: "bg-status-critical",
      description: `Collector connection failed: ${last_error}`,
      lastError: last_error,
    };
  }

  // 3. Enabled, process active, socket established
  if (running && connected) {
    // Check for stale stream if connected but no messages in > 180 seconds
    const isStale = (() => {
      if (!last_message_at) return false;
      try {
        const lastMs = new Date(last_message_at).getTime();
        const nowMs = Date.now();
        return nowMs - lastMs > 180000; // 3 minutes
      } catch {
        return false;
      }
    })();

    if (isStale) {
      return {
        state: "STALE",
        label: "Connected (Stale)",
        badgeStyle: "text-amber-500 border-amber-500/20 bg-amber-500/10",
        dotStyle: "bg-amber-500",
        description: `Connected to RIPE RIS Live, but no updates received in >3 minutes (Last: ${last_message_at})`,
        lastError: null,
      };
    }

    return {
      state: "CONNECTED",
      label: "Connected (Live)",
      badgeStyle: "text-status-green border-green-500/20 bg-green-500/10",
      dotStyle: "bg-status-green animate-pulse",
      description: `Active WebSocket stream from RIPE RIS Live (rrc00, rrc01, rrc03) — ${messages_received ?? 0} msgs ingested`,
      lastError: null,
    };
  }

  // 4. Enabled, process active, attempting connection / reconnecting
  if (running && !connected) {
    return {
      state: "CONNECTING",
      label: "Connecting...",
      badgeStyle: "text-amber-500 border-amber-500/20 bg-amber-500/10",
      dotStyle: "bg-amber-500 animate-pulse",
      description: "Establishing WebSocket connection to RIPE RIS Live telemetry feed...",
      lastError: last_error || null,
    };
  }

  // 5. Enabled but not running
  return {
    state: "DISCONNECTED",
    label: "Disconnected",
    badgeStyle: "text-red-500 border-red-500/20 bg-red-500/10",
    dotStyle: "bg-red-500",
    description: last_error
      ? `Collector halted: ${last_error}`
      : "Collector is enabled in configuration but ingestion loop is not running",
    lastError: last_error || null,
  };
}
