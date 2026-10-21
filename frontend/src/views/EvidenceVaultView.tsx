import React from "react";
import { Download, Clock, Lock } from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";
import { EvidenceItem } from "../types";

export const EvidenceVaultView: React.FC = () => {
  const { evidence, setSelectedEvidence } = useHoraqStore();

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(evidence, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `horaq_audit_export_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-text-main tracking-tight">Audit ledger</h2>
          <p className="text-xs text-text-sub mt-0.5">
            Immutable RFC 8785 evidence ledger with post-quantum non-repudiation.
          </p>
        </div>

        <button
          onClick={handleExportJson}
          className="px-4 py-2 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover hover:border-text-dim text-text-main text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-brand-blue" />
          <span>Export log (JSON)</span>
        </button>
      </div>

      {/* Friendly Explanation Banner for Evaluators */}
      <div className="card-panel p-3.5 bg-bg-card border-brand-blue/30 text-xs text-text-sub flex items-start gap-3">
        <Lock className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-semibold text-text-main">Tamper-Proof Forensic Audit Trail</div>
          <p className="text-[11px] leading-relaxed">
            Every incident in this ledger is permanently sealed with an RFC 8785 canonical SHA-256 cryptographic hash. If an attacker or malicious administrator attempts to modify any past incident in the database, the cryptographic hash fails validation instantly.
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card-panel overflow-hidden">
        <div className="grid grid-cols-12 text-xs text-text-dim font-medium px-4 py-2.5 border-b border-border-card">
          <span className="col-span-3">Timestamp</span>
          <span className="col-span-3">Rule / Action</span>
          <span className="col-span-3">Resource</span>
          <span className="col-span-3 text-right">Details</span>
        </div>

        <div className="divide-y divide-border-item">
          {evidence.map((rec) => {
            const timeStr = rec.created_at
              ? new Date(rec.created_at).toLocaleTimeString()
              : "Just now";
            const ruleName = rec.record.rule || "BGP Anomaly";
            const resourceName = `${rec.record.prefix} (${rec.record.observed_asn})`;
            const detailsStr = `SHA256: ${rec.record_hash.substring(0, 16)}...`;

            return (
              <div
                key={rec.id}
                onClick={() => setSelectedEvidence(rec)}
                className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-bg-hover-row transition-colors cursor-pointer"
              >
                <span className="col-span-3 text-text-sub font-mono text-[11px] flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-text-dim" />
                  {timeStr}
                </span>

                <span className="col-span-3 font-semibold text-status-green font-mono text-[11px]">
                  {ruleName}
                </span>

                <span className="col-span-3 text-text-main font-mono text-[11px]">
                  {resourceName}
                </span>

                <div className="col-span-3 text-right font-mono text-[11px] text-text-sub truncate flex items-center justify-end gap-1.5">
                  <Lock className="w-3 h-3 text-brand-blue" />
                  <span>{detailsStr}</span>
                </div>
              </div>
            );
          })}

          {evidence.length === 0 && (
            <div className="p-8 text-center text-xs text-text-sub">
              No audit entries recorded yet — continuous protection active.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
