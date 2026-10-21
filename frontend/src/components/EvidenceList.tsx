import React from "react";
import { EvidenceItem } from "../types";
import { ShieldCheck, KeyRound, Clock, Download, ExternalLink } from "lucide-react";

interface EvidenceListProps {
  evidenceList: EvidenceItem[];
  onInspect: (item: EvidenceItem) => void;
}

export const EvidenceList: React.FC<EvidenceListProps> = ({ evidenceList, onInspect }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
          Cryptographic Evidence Records ({evidenceList.length})
        </h2>
        <p style={{ color: "var(--text-sub)", fontSize: "0.82rem" }}>
          Immutable RFC 8785 canonical JSON records with SHA-256 content hashes and optional ML-DSA-65 post-quantum signatures.
        </p>
      </div>

      {evidenceList.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "3.5rem 1.5rem",
            color: "var(--text-sub)",
          }}
        >
          <ShieldCheck size={40} color="var(--brand-cyan)" style={{ margin: "0 auto 1rem", opacity: 0.7 }} />
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>No Cryptographic Evidence Records Yet</p>
          <p style={{ fontSize: "0.82rem", marginTop: "0.35rem", color: "var(--text-dim)" }}>
            Evidence records are automatically created whenever an anomaly alert is triggered.
          </p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>EVIDENCE ID</th>
                <th>LINKED ALERT</th>
                <th>CANONICAL SHA-256 DIGEST</th>
                <th>POST-QUANTUM SIGNER</th>
                <th>GENERATED AT (UTC)</th>
                <th style={{ textAlign: "right" }}>VERIFICATION</th>
              </tr>
            </thead>
            <tbody>
              {evidenceList.map((item) => (
                <tr key={item.id}>
                  <td className="mono-text" style={{ fontWeight: 700, color: "var(--brand-cyan)" }}>
                    {item.id}
                  </td>
                  <td className="mono-text" style={{ color: "#cbd5e1" }}>
                    {item.alert_id}
                  </td>
                  <td className="mono-text" style={{ color: "var(--brand-blue)", fontSize: "0.75rem" }}>
                    {item.record_hash ? `${item.record_hash.slice(0, 20)}...${item.record_hash.slice(-8)}` : "None"}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        item.signer_status === "SIGNED"
                          ? "badge-valid"
                          : "badge-unavailable"
                      }`}
                    >
                      {item.signer_status === "SIGNED" ? "ML-DSA-65 SIGNED" : "UNSIGNED"}
                    </span>
                  </td>
                  <td className="mono-text" style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    {item.created_at.replace("T", " ").replace("Z", "")}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                      onClick={() => onInspect(item)}
                    >
                      <ShieldCheck size={13} />
                      Inspect & Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
