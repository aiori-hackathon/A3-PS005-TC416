import React, { useState } from "react";
import { AlertItem } from "../types";
import { AlertOctagon, ChevronDown, ChevronRight, ShieldCheck, Globe, Search, ArrowRight } from "lucide-react";

interface AlertsTableProps {
  alerts: AlertItem[];
  onStatusChange: (alertId: string, newStatus: string) => void;
  onInspectEvidence: (alert: AlertItem) => void;
  onCheckRPKI: (prefix: string, asn: string) => void;
}

export const AlertsTable: React.FC<AlertsTableProps> = ({
  alerts,
  onStatusChange,
  onInspectEvidence,
  onCheckRPKI,
}) => {
  const [filterKind, setFilterKind] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedAlerts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterKind !== "ALL" && a.kind !== filterKind) return false;
    if (filterStatus !== "ALL" && a.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.prefix.toLowerCase().includes(q) ||
        a.observed_asn.toLowerCase().includes(q) ||
        (a.baseline_asn && a.baseline_asn.toLowerCase().includes(q)) ||
        (a.parent_prefix && a.parent_prefix.toLowerCase().includes(q)) ||
        a.explanation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Controls Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
            Detected Anomaly Alerts ({filteredAlerts.length})
          </h2>
          <p style={{ color: "var(--text-sub)", fontSize: "0.82rem" }}>
            Explainable findings generated deterministically from baseline origin comparisons and subnet containment.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          {/* Search Box */}
          <div style={{ position: "relative", minWidth: "220px" }}>
            <Search
              size={14}
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }}
            />
            <input
              type="text"
              className="form-input mono-text"
              style={{ paddingLeft: "2rem", paddingRight: "0.75rem", fontSize: "0.8rem", height: "34px" }}
              placeholder="Filter prefix, ASN, alert..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Kind Filter */}
          <select
            className="form-input"
            style={{ width: "auto", fontSize: "0.8rem", height: "34px", padding: "0 0.75rem" }}
            value={filterKind}
            onChange={(e) => setFilterKind(e.target.value)}
          >
            <option value="ALL">All Anomaly Types</option>
            <option value="ORIGIN_CHANGE">Origin Conflicts</option>
            <option value="SUBPREFIX_ANOMALY">Subprefix Anomalies</option>
          </select>

          {/* Status Filter */}
          <select
            className="form-input"
            style={{ width: "auto", fontSize: "0.8rem", height: "34px", padding: "0 0.75rem" }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      {filteredAlerts.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "3.5rem 1.5rem",
            color: "var(--text-sub)",
          }}
        >
          <AlertOctagon size={40} color="var(--brand-cyan)" style={{ margin: "0 auto 1rem", opacity: 0.7 }} />
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>Zero Anomaly Alerts Matching Filter</p>
          <p style={{ fontSize: "0.82rem", marginTop: "0.35rem", color: "var(--text-dim)" }}>
            Run synthetic scenarios or submit new route observations to exercise the detection rules.
          </p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "36px" }}></th>
                <th>SEVERITY</th>
                <th>ANOMALY KIND</th>
                <th>TARGET PREFIX</th>
                <th>OBSERVED ORIGIN</th>
                <th>BASELINE CONTEXT</th>
                <th>TIMESTAMP (UTC)</th>
                <th>STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((alert) => {
                const isExpanded = !!expandedAlerts[alert.id];
                return (
                  <React.Fragment key={alert.id}>
                    <tr>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => toggleExpand(alert.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-dim)",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px",
                          }}
                          title="Expand Root Cause Explanation"
                        >
                          {isExpanded ? <ChevronDown size={15} color="var(--brand-cyan)" /> : <ChevronRight size={15} />}
                        </button>
                      </td>
                      <td>
                        <span className={`badge badge-${alert.severity.toLowerCase()}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            fontFamily: "var(--font-mono)",
                            color: alert.kind === "ORIGIN_CHANGE" ? "#fda4af" : "#fcd34d",
                          }}
                        >
                          {alert.kind === "ORIGIN_CHANGE" ? "ORIGIN CONFLICT" : "SUBPREFIX ANOMALY"}
                        </span>
                      </td>
                      <td className="mono-text" style={{ fontWeight: 700, color: "var(--brand-blue)" }}>
                        {alert.prefix}
                      </td>
                      <td className="mono-text">
                        <span
                          style={{
                            background: "var(--badge-red-bg)",
                            color: "var(--badge-red-text)",
                            border: "1px solid var(--badge-red-border)",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontWeight: 700,
                          }}
                        >
                          {alert.observed_asn}
                        </span>
                      </td>
                      <td className="mono-text" style={{ color: "var(--text-sub)" }}>
                        {alert.kind === "ORIGIN_CHANGE" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>Base:</span>
                            <span style={{ color: "var(--badge-green-text)", fontWeight: 700 }}>
                              {alert.baseline_asn || "None"}
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>Parent:</span>
                            <span style={{ color: "var(--badge-purple-text)", fontWeight: 700 }}>
                              {alert.parent_prefix || "None"}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="mono-text" style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                        {alert.created_at.replace("T", " ").replace("Z", "")}
                      </td>
                      <td>
                        <select
                          className="form-input"
                          style={{
                            width: "auto",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            height: "28px",
                            padding: "0 0.5rem",
                            borderRadius: "var(--radius-sm)",
                            background:
                              alert.status === "ACTIVE"
                                ? "var(--badge-red-bg)"
                                : alert.status === "ACKNOWLEDGED"
                                ? "var(--badge-amber-bg)"
                                : "var(--badge-green-bg)",
                            color:
                              alert.status === "ACTIVE"
                                ? "var(--badge-red-text)"
                                : alert.status === "ACKNOWLEDGED"
                                ? "var(--badge-amber-text)"
                                : "var(--badge-green-text)",
                            borderColor: "transparent",
                          }}
                          value={alert.status}
                          onChange={(e) => onStatusChange(alert.id, e.target.value)}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                          <option value="RESOLVED">RESOLVED</option>
                        </select>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                            onClick={() => onCheckRPKI(alert.prefix, alert.observed_asn)}
                            title="Query RPKI ROA status on RIPEstat"
                          >
                            <Globe size={13} color="var(--brand-blue)" />
                            RPKI
                          </button>
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                            onClick={() => onInspectEvidence(alert)}
                            title="Inspect canonical evidence and verify cryptographic integrity"
                          >
                            <ShieldCheck size={13} />
                            Evidence
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Root-Cause Breakdown */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} style={{ background: "rgba(10, 14, 23, 0.9)", padding: "1.25rem 1.75rem" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                              <span style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--brand-cyan)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                🔍 Explainable Root Cause Reasoning
                              </span>
                              <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                                <span>Alert ID: {alert.id}</span>
                                <span>•</span>
                                <span>Collector: {alert.collector}</span>
                                {alert.scenario && (
                                  <>
                                    <span>•</span>
                                    <span>Scenario: {alert.scenario}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <p style={{ fontSize: "0.85rem", color: "#e2e8f0", lineHeight: "1.6", background: "rgba(255, 255, 255, 0.02)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-item)" }}>
                              {alert.explanation}
                            </p>

                            {/* Visual Conflict Summary Badge */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem" }}>
                              {alert.kind === "ORIGIN_CHANGE" ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
                                  <span style={{ color: "var(--text-dim)" }}>Stored Reference:</span>
                                  <span className="mono-text" style={{ color: "var(--badge-green-text)", fontWeight: 700 }}>{alert.baseline_asn}</span>
                                  <ArrowRight size={14} color="var(--text-dim)" />
                                  <span style={{ color: "var(--text-dim)" }}>Conflicting Origin:</span>
                                  <span className="mono-text" style={{ color: "var(--badge-red-text)", fontWeight: 700 }}>{alert.observed_asn}</span>
                                </div>
                              ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
                                  <span style={{ color: "var(--text-dim)" }}>Tracked Enclosing Parent:</span>
                                  <span className="mono-text" style={{ color: "var(--badge-purple-text)", fontWeight: 700 }}>{alert.parent_prefix}</span>
                                  <ArrowRight size={14} color="var(--text-dim)" />
                                  <span style={{ color: "var(--text-dim)" }}>More-Specific Subnet:</span>
                                  <span className="mono-text" style={{ color: "var(--brand-cyan)", fontWeight: 700 }}>{alert.prefix}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
