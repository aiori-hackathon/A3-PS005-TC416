import React from "react";
import { Download, Clock, Lock, FileText, CheckCircle2 } from "lucide-react";
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
      `horaq_evidence_ledger_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-main tracking-tight">
              Evidence ledger
            </h1>
            <span className="px-2 py-0.2 rounded text-[11px] font-semibold bg-bg-card border border-border-card text-brand-blue font-mono">
              {evidence.length} Records
            </span>
          </div>
          <p className="text-xs text-text-sub mt-0.5">
            Cryptographic digest archive of routing incident records serialized under RFC 8785 JSON canonicalization.
          </p>
        </div>

        <button
          onClick={handleExportJson}
          className="px-3.5 py-1.5 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-text-main text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-brand-blue" />
          <span>Export ledger (.json)</span>
        </button>
      </div>

      {/* Honest Purpose & Integrity Notice */}
      <div className="p-3.5 rounded bg-bg-card border border-border-card text-xs text-text-sub space-y-1">
        <div className="font-semibold text-text-main flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-brand-blue shrink-0" />
          <span>Content Integrity Archive (SHA-256 Digest Verification)</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Each record in this ledger represents a detected routing event serialized into deterministic JSON (RFC 8785) and hashed using SHA-256. The hash confirms that record content matches its original state upon creation. Click any entry to inspect the full canonical payload and run independent verification.
        </p>
      </div>

      {/* Evidence Table */}
      <div className="card-panel overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 text-xs text-text-dim font-medium px-4 py-2.5 border-b border-border-card bg-bg-raised">
          <span className="col-span-3 sm:col-span-2">Timestamp</span>
          <span className="col-span-4 sm:col-span-3">Detection rule</span>
          <span className="col-span-3 sm:col-span-3">Resource</span>
          <span className="hidden sm:inline-block sm:col-span-2">Signature</span>
          <span className="col-span-2 sm:col-span-2 text-right">Integrity hash</span>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border-item">
          {evidence.map((rec) => {
            const timeStr = rec.created_at
              ? new Date(rec.created_at).toLocaleTimeString()
              : "Recent";
            const ruleName = rec.record.rule || "ORIGIN_AS_DIFFERENCE_RULE";
            const resourceName = `${rec.record.prefix} (${rec.record.observed_asn})`;
            const isSigned = rec.signer_status === "SIGNED" || Boolean(rec.signature);

            return (
              <div
                key={rec.id}
                onClick={() => setSelectedEvidence(rec)}
                className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-bg-hover-row transition-colors cursor-pointer"
                title="Click to inspect evidence details"
              >
                {/* Timestamp */}
                <span className="col-span-3 sm:col-span-2 text-text-dim font-mono text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-text-dim shrink-0" />
                  <span>{timeStr}</span>
                </span>

                {/* Rule */}
                <span className="col-span-4 sm:col-span-3 font-medium text-text-main font-mono text-[11px] truncate pr-2">
                  {ruleName}
                </span>

                {/* Resource */}
                <span className="col-span-3 sm:col-span-3 font-mono text-text-sub text-[11px] truncate pr-2">
                  {resourceName}
                </span>

                {/* Signature State */}
                <span className="hidden sm:inline-block sm:col-span-2">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                      isSigned
                        ? "bg-status-green-bg text-status-green border-status-green"
                        : "bg-bg-app text-text-dim border-border-card"
                    }`}
                  >
                    {isSigned ? "Signed" : "Unsigned"}
                  </span>
                </span>

                {/* Hash Digest */}
                <div className="col-span-2 sm:col-span-2 text-right font-mono text-[11px] text-text-dim truncate flex items-center justify-end gap-1">
                  <Lock className="w-3 h-3 text-brand-blue shrink-0" />
                  <span className="hover:text-text-main">{rec.record_hash.substring(0, 10)}…</span>
                </div>
              </div>
            );
          })}

          {evidence.length === 0 && (
            <div className="p-8 text-center text-xs text-text-sub space-y-1">
              <p>No evidence records generated yet.</p>
              <p className="text-[11px] text-text-dim">
                Records are automatically produced whenever an origin-AS change or subprefix anomaly is detected.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
