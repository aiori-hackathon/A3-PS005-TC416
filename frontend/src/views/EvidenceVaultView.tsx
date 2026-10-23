import React, { useState } from "react";
import { Download, Clock, Copy, Check } from "lucide-react";
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
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-card">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">
              Audit history
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-bg-card text-text-sub border border-border-card">
              {evidence.length} Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            Forensic audit log of routing anomaly observations with RFC 8785 canonical SHA-256 integrity digests.
          </p>
        </div>

        {evidence.length > 0 && (
          <button
            onClick={handleExportJson}
            className="px-3.5 py-1.5 rounded-xl bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-text-main text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-brand-blue" />
            <span>Export log (JSON)</span>
          </button>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="card-panel overflow-hidden">
        {/* Desktop Table Header */}
        <div className="hidden sm:grid grid-cols-12 text-[11px] text-text-dim font-semibold uppercase tracking-wider px-4 py-3 border-b border-border-card">
          <span className="col-span-2">Timestamp</span>
          <span className="col-span-3">Event</span>
          <span className="col-span-3">Resource</span>
          <span className="col-span-2">Integrity Digest</span>
          <span className="col-span-2 text-right">Signature</span>
        </div>

        {/* Desktop Table Rows */}
        <div className="hidden sm:block divide-y divide-border-item">
          {evidence.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-sub">
              No audit entries recorded yet — continuous baseline monitoring active.
            </div>
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
              const shortHash = `${rec.record_hash.substring(0, 8)}...${rec.record_hash.substring(rec.record_hash.length - 6)}`;
              const isSigned = !!rec.signature && rec.signature !== "UNSIGNED";

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedEvidence(rec)}
                  className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-bg-hover-row transition-colors cursor-pointer"
                >
                  <span className="col-span-2 text-text-sub font-mono text-[11px] flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-text-dim" />
                    {timeStr}
                  </span>

                  <span className="col-span-3 font-semibold text-text-main font-mono text-[11px]">
                    {ruleName}
                  </span>

                  <span className="col-span-3 text-text-main font-mono text-[11px]">
                    {resourceName}
                  </span>

                  <div className="col-span-2 flex items-center gap-1.5 font-mono text-[11px] text-text-sub">
                    <span title={rec.record_hash}>{shortHash}</span>
                    <button
                      onClick={(e) => copyHash(rec.record_hash, e)}
                      className="p-1 hover:text-text-main text-text-dim cursor-pointer"
                      title="Copy full SHA-256 hash"
                    >
                      {copiedHash === rec.record_hash ? (
                        <Check className="w-3 h-3 text-status-green" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <div className="col-span-2 text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                        isSigned
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                          : "bg-slate-500/15 text-slate-300 border border-slate-500/25"
                      }`}
                    >
                      {isSigned ? "ML-DSA-65 Signed" : "Unsigned (SHA-256)"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Mobile Stacked Card View */}
        <div className="sm:hidden divide-y divide-border-item">
          {evidence.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-sub">
              No audit entries recorded yet — continuous baseline monitoring active.
            </div>
          ) : (
            evidence.map((rec) => {
              const timeStr = rec.created_at
                ? new Date(rec.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Just now";
              const ruleName = rec.record.rule || "Origin Anomaly";
              const resourceName = `${rec.record.prefix} (${rec.record.observed_asn})`;
              const isSigned = !!rec.signature && rec.signature !== "UNSIGNED";

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedEvidence(rec)}
                  className="p-3.5 space-y-2 hover:bg-bg-hover-row transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-text-main">
                      {resourceName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        isSigned
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                          : "bg-slate-500/15 text-slate-300 border border-slate-500/25"
                      }`}
                    >
                      {isSigned ? "ML-DSA-65 Signed" : "Unsigned"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-text-sub font-mono">
                    <span className="text-text-main font-medium">{ruleName}</span>
                    <span>•</span>
                    <span className="text-text-sub">{timeStr}</span>
                  </div>

                  <div className="text-[10px] font-mono text-text-dim truncate">
                    Hash: {rec.record_hash}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
