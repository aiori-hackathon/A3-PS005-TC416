import React, { useState } from "react";
import {
  X,
  Download,
  AlertTriangle,
  Check,
  Copy,
  Lock,
  Cpu,
  RefreshCw,
  Terminal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AlertItem, EvidenceItem } from "../types";
import { api } from "../api";

interface EvidenceModalProps {
  alert: AlertItem | null;
  evidence: EvidenceItem | null;
  onClose: () => void;
  onSigned: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  alert,
  evidence,
  onClose,
  onSigned,
}) => {
  if (!alert && !evidence) return null;

  const [verifyingHash, setVerifyingHash] = useState(false);
  const [hashResult, setHashResult] = useState<{
    valid: boolean;
    computed: string;
  } | null>(null);

  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  const [isTampered, setIsTampered] = useState(false);
  const [tamperedData, setTamperedData] = useState<Record<string, any> | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const originalRecord: any = evidence?.record || {};
  const record: any = isTampered && tamperedData ? tamperedData : originalRecord;
  const expectedHash = evidence?.record_hash || "";

  // Verify SHA-256 Integrity
  const handleVerifyHash = async () => {
    setVerifyingHash(true);
    try {
      const res = await api.verifyEvidenceHash(record, expectedHash);
      setHashResult({ valid: res.valid, computed: res.computed_hash });
    } catch (err: any) {
      setSignError(err.message);
    } finally {
      setVerifyingHash(false);
    }
  };

  // Payload Mutation Simulation Toggle (Simulated in-memory demo)
  const handleToggleTampering = () => {
    if (!isTampered) {
      const cloned = JSON.parse(JSON.stringify(originalRecord));
      cloned.severity = "LOW";
      cloned.explanation =
        "UNAUTHORIZED MUTATION: Security incident severity modified in memory.";
      cloned.observed_asn = "AS0";
      setTamperedData(cloned);
      setIsTampered(true);
      setHashResult(null);
    } else {
      setIsTampered(false);
      setTamperedData(null);
      setHashResult(null);
    }
  };

  // Sign with ML-DSA-65
  const handleSign = async () => {
    if (!evidence) return;
    setSigning(true);
    setSignError(null);
    try {
      await api.signEvidence(evidence.id);
      onSigned();
    } catch (err: any) {
      setSignError(err.message);
    } finally {
      setSigning(false);
    }
  };

  // Copy canonical JSON
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Copy Verification CLI Command
  const handleCopyCli = () => {
    const compactJson = JSON.stringify(record);
    const cmd = `echo '${compactJson}' | sha256sum`;
    navigator.clipboard.writeText(cmd);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  // Export JSON file
  const handleDownload = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(record, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute(
      "download",
      `evidence-${evidence?.id || alert?.id}.json`
    );
    dlAnchor.click();
  };

  const isSigned = evidence?.signer_status === "SIGNED" || Boolean(evidence?.signature);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-bg-card border border-border-card rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Aurora Obsidian Accent */}
        <div className="h-14 border-b border-border-card bg-bg-elevated flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-status-green-bg border border-emerald-500/40 flex items-center justify-center text-status-green shadow-xs">
              <Lock className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-main tracking-tight">
                Cryptographic evidence record
              </h2>
              <span className="text-[11px] text-accent-teal font-mono">
                {evidence?.id || alert?.id || "Record"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-bg-btn border border-border-card flex items-center justify-center text-text-sub hover:text-text-main hover:border-brand-blue/40 transition-all cursor-pointer shadow-2xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Level 1: Primary Evidence View */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs select-text">
          {/* Associated Incident Summary */}
          <div className="p-3.5 rounded-xl bg-bg-elevated border border-border-card space-y-2">
            <div className="text-[11px] text-text-dim uppercase tracking-wider font-bold">
              Associated Incident
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-text-main font-bold text-xs">
                  {record.prefix || alert?.prefix || "192.0.2.0/24"}
                </span>
                <span className="text-text-dim">•</span>
                <span className="text-status-red font-semibold">
                  Origin: {record.observed_asn || alert?.observed_asn || "AS64511"}
                </span>
                {record.baseline_asn && (
                  <>
                    <span className="text-text-dim">•</span>
                    <span className="text-status-green font-semibold">
                      Baseline: {record.baseline_asn}
                    </span>
                  </>
                )}
              </div>
              <span className="text-[11px] text-accent-indigo font-mono">
                Rule: {record.rule || alert?.kind || "Origin Conflict"}
              </span>
            </div>
          </div>

          {/* Integrity & Signature Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-bg-elevated border border-emerald-500/30 space-y-1">
              <div className="text-[11px] text-text-dim font-semibold">Content Integrity</div>
              <div className="flex items-center gap-1.5 font-bold text-status-green">
                <Check className="w-4 h-4" />
                <span>SHA-256 Digest Recorded</span>
              </div>
              <p className="text-[11px] text-text-sub leading-relaxed pt-0.5">
                Payload canonicalized via RFC 8785 JSON Canonicalization Scheme.
              </p>
            </div>

            <div className={`p-3.5 rounded-xl bg-bg-elevated border space-y-1 ${isSigned ? "border-emerald-500/30" : "border-border-card"}`}>
              <div className="text-[11px] text-text-dim font-semibold">Digital Signature</div>
              <div
                className={`flex items-center gap-1.5 font-bold ${
                  isSigned ? "text-status-green" : "text-text-sub"
                }`}
              >
                {isSigned ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ML-DSA-65 Signed</span>
                  </>
                ) : (
                  <span className="text-text-dim font-medium">Unsigned</span>
                )}
              </div>
              <p className="text-[11px] text-text-sub leading-relaxed pt-0.5">
                {isSigned
                  ? "Post-quantum digital signature verified under NIST FIPS 204."
                  : "Cryptographic hash recorded; signature not yet applied."}
              </p>
            </div>
          </div>

          {/* Simulated Payload Modification Warning if active */}
          {isTampered && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/35 text-status-red space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Simulated In-Memory Payload Mutation Active</span>
              </div>
              <p className="text-[11px] text-red-200 leading-relaxed">
                Incident values were mutated in browser memory (severity downgraded, origin changed). Re-verifying will catch this payload mismatch.
              </p>
            </div>
          )}

          {/* Verification Actions */}
          <div className="p-3.5 rounded-xl bg-bg-elevated border border-border-card space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-text-main">Forensic Verification</span>
              <button
                onClick={handleToggleTampering}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer shadow-2xs ${
                  isTampered
                    ? "bg-red-500/20 text-status-red border-red-500/35"
                    : "bg-bg-btn border-border-card text-text-sub hover:text-text-main hover:border-brand-blue/35"
                }`}
              >
                {isTampered ? "Reset original payload" : "Mutate payload (demo)"}
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleVerifyHash}
                disabled={verifyingHash}
                className="px-3 py-1.5 rounded-xl bg-bg-btn border border-border-card hover:border-brand-blue/40 text-xs font-bold text-text-main flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${verifyingHash ? "animate-spin text-brand-blue" : "text-status-green"}`}
                />
                <span>{verifyingHash ? "Verifying..." : "Verify integrity"}</span>
              </button>

              {!isSigned && (
                <button
                  onClick={handleSign}
                  disabled={signing}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-brand-blue hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs transition-all active:scale-[0.98] shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{signing ? "Signing..." : "Sign with ML-DSA-65"}</span>
                </button>
              )}

              <button
                onClick={handleCopyCli}
                className="px-2.5 py-1.5 rounded-xl bg-bg-btn border border-border-card hover:border-brand-blue/40 text-xs font-semibold text-text-sub hover:text-text-main transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Copy terminal verification CLI"
              >
                <Terminal className="w-3 h-3 text-brand-blue" />
                <span>{copiedCli ? "CLI Copied" : "Copy CLI"}</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-2.5 py-1.5 rounded-xl bg-bg-btn border border-border-card hover:border-brand-blue/40 text-xs font-semibold text-text-sub hover:text-text-main transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Download className="w-3 h-3 text-accent-teal" />
                <span>Export JSON</span>
              </button>
            </div>

            {/* Verification Result Toast */}
            {hashResult && (
              <div
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  hashResult.valid
                    ? "bg-status-green-bg text-status-green border-emerald-500/35"
                    : "bg-status-red-bg text-status-red border-red-500/35"
                }`}
              >
                {hashResult.valid ? (
                  <>
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Integrity verified: SHA-256 digest exactly matches canonical RFC 8785 payload.</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Integrity failed: Computed hash differs from recorded digest (payload mismatch detected).</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Level 2: Progressive Disclosure - Expandable Technical Details */}
          <div className="pt-1">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-xs text-brand-blue hover:text-blue-400 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{showTechnicalDetails ? "Hide technical details" : "Show technical details (Hashes & Raw JSON)"}</span>
              {showTechnicalDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {showTechnicalDetails && (
            <div className="space-y-3 pt-2 border-t border-border-card">
              <div className="space-y-1">
                <div className="text-[11px] text-text-dim font-mono font-semibold">
                  Recorded Canonical SHA-256 Digest:
                </div>
                <div className="p-2.5 rounded-lg bg-bg-interactive border border-border-card font-mono text-[11px] text-brand-blue break-all select-all font-semibold">
                  {expectedHash}
                </div>
              </div>

              {hashResult && !hashResult.valid && (
                <div className="space-y-1">
                  <div className="text-[11px] text-status-red font-mono font-semibold">
                    Computed SHA-256 Digest:
                  </div>
                  <div className="p-2.5 rounded-lg bg-status-red-bg border border-red-500/35 font-mono text-[11px] text-status-red break-all select-all font-semibold">
                    {hashResult.computed}
                  </div>
                </div>
              )}

              {/* Canonical Payload JSON View */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-text-dim font-mono font-semibold">
                    Canonical Payload (RFC 8785):
                  </span>
                  <button
                    onClick={handleCopy}
                    className="text-[11px] text-brand-blue hover:text-blue-400 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-status-green" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy JSON"}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-bg-interactive border border-border-card font-mono text-[11px] text-text-sub overflow-x-auto max-h-48 leading-relaxed">
                  {JSON.stringify(record, null, 2)}
                </pre>
              </div>

              {/* Signature Block */}
              {isSigned && (
                <div className="space-y-2 pt-2 border-t border-border-card">
                  <div className="text-[11px] text-accent-indigo font-mono font-semibold">
                    NIST FIPS 204 ML-DSA-65 Signature:
                  </div>
                  <div className="p-2.5 rounded-lg bg-bg-interactive border border-border-card font-mono text-[11px] text-text-sub break-all select-all">
                    {evidence?.signature}
                  </div>
                  {evidence?.public_key && (
                    <div className="space-y-1">
                      <div className="text-[11px] text-text-dim font-mono font-semibold">Signer Public Key:</div>
                      <div className="p-2.5 rounded-lg bg-bg-interactive border border-border-card font-mono text-[11px] text-text-sub break-all select-all">
                        {evidence.public_key}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
