import React, { useState } from "react";
import { Download, Clock, Copy, Check, Lock } from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";

export const EvidenceVaultView: React.FC = () => {
  const { evidence, setSelectedEvidence } = useHoraqStore();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

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

  const copyHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="max-w-[1360px] w-full space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-divider">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[28px] font-semibold text-text-main tracking-tight">
              Cryptographic Audit Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-bg-interactive text-text-sub border border-divider">
              {evidence.length} Anomaly Evidence Records
            </span>
          </div>
          <p className="text-sm text-text-sub mt-1">
            Tamper-evident forensic ledger preserving RFC 8785 canonical SHA-256 digests and ML-DSA-65 post-quantum digital signatures for detected routing anomalies.
          </p>
        </div>

        {evidence.length > 0 && (
          <button
            onClick={handleExportJson}
            className="px-4 py-2 rounded-md bg-bg-btn border border-border-card hover:bg-bg-interactive text-text-main text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-brand-blue" />
            <span>Export Ledger (JSON)</span>
          </button>
        )}
      </div>

      {/* Cryptographic Guarantees Disclosure Callout */}
      <div className="p-3.5 rounded-lg border border-divider bg-bg-interactive/40 flex items-start gap-3 text-xs leading-relaxed">
        <Lock className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-text-main">Cryptographic Tamper-Evidence & Verification Scope:</span>
          <p className="text-text-sub">
            Each evidence envelope binds the canonical observation payload (RFC 8785 JCS) to a SHA-256 digest and an optional ML-DSA-65 post-quantum digital signature (NIST FIPS 204). While the application layer enforces append-only semantics in SQLite, cryptographic signatures guarantee that any alteration to exported or stored records is immediately detected by the independent CLI verifier.
          </p>
        </div>
      </div>

      {/* Structured Ledger Table */}
      <div className="card-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-interactive border-b border-divider text-[11px] font-bold uppercase tracking-wider text-text-sub">
                <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                <th className="py-2.5 px-4 font-semibold">Anomaly Rule</th>
                <th className="py-2.5 px-4 font-semibold">Target Resource</th>
                <th className="py-2.5 px-4 font-semibold">RFC 8785 SHA-256 Digest</th>
                <th className="py-2.5 px-4 font-semibold text-right">Digital Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider text-[13px]">
              {evidence.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-text-sub">
                    No audit records generated yet — continuous baseline monitoring active.
                  </td>
                </tr>
              ) : (
                evidence.map((rec) => {
                  const timeStr = rec.created_at
                    ? new Date(rec.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "Just now";
                  const ruleName = rec.record.rule || "Origin Anomaly";
                  const resourceName = `${rec.record.prefix} (${rec.record.observed_asn})`;
                  const shortHash = `${rec.record_hash.substring(0, 10)}...${rec.record_hash.substring(rec.record_hash.length - 8)}`;
                  const isSigned = !!rec.signature && rec.signature !== "UNSIGNED";

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedEvidence(rec)}
                      className="hover:bg-bg-hover-row transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono text-xs text-text-sub whitespace-nowrap">
                        {timeStr}
                      </td>

                      <td className="py-3 px-4 font-bold text-text-main font-mono text-xs group-hover:text-brand-blue transition-colors">
                        {ruleName}
                      </td>

                      <td className="py-3 px-4 text-brand-blue font-mono text-xs font-semibold">
                        {resourceName}
                      </td>

                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-text-main">
                          <span title={rec.record_hash}>{shortHash}</span>
                          <button
                            onClick={(e) => copyHash(rec.record_hash, e)}
                            className="p-1 hover:text-brand-blue text-text-dim cursor-pointer transition-colors"
                            title="Copy full SHA-256 hash"
                          >
                            {copiedHash === rec.record_hash ? (
                              <Check className="w-3.5 h-3.5 text-status-green" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                            isSigned
                              ? "bg-badge-green-bg text-status-green border border-green-300 dark:border-green-900"
                              : "bg-bg-interactive text-text-sub border border-divider"
                          }`}
                        >
                          {isSigned ? "ML-DSA-65 Signed" : "Digest Recorded (Unsigned)"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
