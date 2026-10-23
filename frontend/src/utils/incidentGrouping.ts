import { AlertItem } from "../types";

export interface GroupedIncident {
  id: string; // key representing the incident group
  prefix: string;
  observed_asn: string;
  baseline_asn: string | null;
  parent_prefix: string | null;
  kind: "ORIGIN_CHANGE" | "SUBPREFIX_ANOMALY";
  severity: "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  explanation: string;
  
  // Aggregate stats
  occurrenceCount: number;
  firstSeen: string;
  lastSeen: string;
  
  // Lifecycle status
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  activeCount: number;
  acknowledgedCount: number;
  resolvedCount: number;
  
  // Preserved observations (sorted newest to oldest)
  observations: AlertItem[];
  primaryAlert: AlertItem;
}

/**
 * Groups raw alert observations into distinct routing incidents.
 * Preserves all underlying observations and evidence links.
 */
export function groupAlertObservations(alerts: AlertItem[]): GroupedIncident[] {
  const groups: Map<string, AlertItem[]> = new Map();

  for (const alert of alerts) {
    // A distinct incident is keyed by kind, prefix, and observed_asn
    const key = `${alert.kind}_${alert.prefix}_${alert.observed_asn}`;
    const list = groups.get(key) || [];
    list.push(alert);
    groups.set(key, list);
  }

  const result: GroupedIncident[] = [];

  for (const [key, obsList] of groups.entries()) {
    // Sort observations newest to oldest
    obsList.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    const primary = obsList[0];
    const oldest = obsList[obsList.length - 1];

    const activeCount = obsList.filter((o) => o.status === "ACTIVE").length;
    const acknowledgedCount = obsList.filter((o) => o.status === "ACKNOWLEDGED").length;
    const resolvedCount = obsList.filter((o) => o.status === "RESOLVED").length;

    // Overall status: if any observation is active, the incident is ACTIVE.
    // If none are active, but any are acknowledged, status is ACKNOWLEDGED.
    // If all are resolved, status is RESOLVED.
    let status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED" = "RESOLVED";
    if (activeCount > 0) {
      status = "ACTIVE";
    } else if (acknowledgedCount > 0) {
      status = "ACKNOWLEDGED";
    }

    // Highest severity among observations
    let severity: "HIGH" | "MEDIUM" | "LOW" | "INFO" = "LOW";
    if (obsList.some((o) => o.severity === "HIGH")) {
      severity = "HIGH";
    } else if (obsList.some((o) => o.severity === "MEDIUM")) {
      severity = "MEDIUM";
    } else if (obsList.some((o) => o.severity === "INFO")) {
      severity = "INFO";
    }

    result.push({
      id: key,
      prefix: primary.prefix,
      observed_asn: primary.observed_asn,
      baseline_asn: primary.baseline_asn,
      parent_prefix: primary.parent_prefix,
      kind: primary.kind,
      severity,
      title: primary.title,
      explanation: primary.explanation,
      occurrenceCount: obsList.length,
      firstSeen: oldest.created_at || primary.created_at,
      lastSeen: primary.created_at,
      status,
      activeCount,
      acknowledgedCount,
      resolvedCount,
      observations: obsList,
      primaryAlert: primary,
    });
  }

  // Sort grouped incidents: Active first, then by lastSeen descending
  result.sort((a, b) => {
    if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
    if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
    const timeA = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
    const timeB = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
    return timeB - timeA;
  });

  return result;
}
