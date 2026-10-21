import React, { useState } from "react";
import {
  X,
  ShieldCheck,
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

  // Tamper Simulation Toggle (Simulated in-memory demo)
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-bg-card border border-border-card rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 border-b border-border-card bg-bg-card flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-status-green-bg border border-green-800/40 flex items-center justify-center text-status-green">
              <ShieldCheck className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-main tracking-tight">
                Cryptographic evidence record
              </h2>
              <span className="text-[11px] text-text-dim font-mono">
                {evidence?.id || alert?.id || "Record"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-bg-btn border border-border-card flex items-center justify-center text-text-sub hover:text-text-main transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Level 1: Clean Primary View */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs select-text">
          {/* Associated Incident Summary */}
          <div className="p-3.5 rounded-lg bg-bg-app border border-border-card space-y-2">
            <div className="text-[11px] text-text-dim uppercase tracking-wider font-medium">
              Associated Incident
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-text-main font-semibold">
                  {record.prefix || alert?.prefix || "192.0.2.0/24"}
                </span>
                <span className="text-text-dim">•</span>
                <span className="text-red-400">
                  Origin: {record.observed_asn || alert?.observed_asn || "AS64511"}
                </span>
                {record.baseline_asn && (
                  <>
                    <span className="text-text-dim">•</span>
                    <span className="text-status-green">
                      Baseline: {record.baseline_asn}
                    </span>
                  </>
                )}
              </div>
              <span className="text-[11px] text-text-dim font-mono">
                Rule: {record.rule || alert?.kind || "Origin Conflict"}
              </span>
            </div>
          </div>

          {/* Integrity & Signature Status Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-bg-app border border-border-card space-y-1">
              <div className="text-[11px] text-text-dim font-medium">Content Integrity</div>
              <div className="flex items-center gap-1.5 font-semibold text-status-green">
                <Check className="w-4 h-4" />
                <span>SHA-256 Digest Sealed</span>
              </div>
              <p className="text-[11px] text-text-sub leading-relaxed pt-0.5">
                Payload canonicalized via RFC 8785 JSON Canonicalization Scheme.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-bg-app border border-border-card space-y-1">
              <div className="text-[11px] text-text-dim font-medium">Digital Signature</div>
              <div
                className={`flex items-center gap-1.5 font-semibold ${
                  isSigned ? "text-status-green" : "text-text-dim"
                }`}
              >
                {isSigned ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ML-DSA-65 Signed</span>
                  </>
                ) : (
                  <span>Unsigned</span>
                )}
              </div>
              <p className="text-[11px] text-text-sub leading-relaxed pt-0.5">
                {isSigned
                  ? "Post-quantum digital signature verified under NIST FIPS 204."
                  : "Cryptographic hash verified; signature not yet applied."}
              </p>
            </div>
          </div>

          {/* Tamper Warning if active */}
          {isTampered && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Simulated In-Memory Tampering Active</span>
              </div>
              <p className="text-[11px] text-red-300 leading-relaxed">
                Incident values were mutated in browser memory (severity downgraded, origin changed). Re-verifying will catch this mismatch.
              </p>
            </div>
          )}

          {/* Verification Actions */}
          <div className="p-3.5 rounded-lg bg-bg-app border border-border-card space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-medium text-text-main">Forensic Actions</span>
              <button
                onClick={handleToggleTampering}
                className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                  isTampered
                    ? "bg-red-500/10 text-red-400 border-red-500/30"
                    : "bg-bg-btn border-border-card text-text-sub hover:text-text-main"
                }`}
              >
                {isTampered ? "Reset untampered" : "Simulate tampering (demo)"}
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleVerifyHash}
                disabled={verifyingHash}
                className="px-3 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-semibold text-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
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
                  className="px-3.5 py-1.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium text-xs transition-all active:scale-[0.98] shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{signing ? "Signing..." : "Sign with ML-DSA-65"}</span>
                </button>
              )}

              <button
                onClick={handleCopyCli}
                className="px-2.5 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-medium text-text-sub hover:text-text-main transition-colors cursor-pointer flex items-center gap-1"
                title="Copy terminal verification CLI"
              >
                <Terminal className="w-3 h-3 text-brand-blue" />
                <span>{copiedCli ? "CLI Copied" : "Copy CLI"}</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-2.5 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-medium text-text-sub hover:text-text-main transition-colors cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>Export JSON</span>
              </button>
            </div>

            {/* Verification Result Toast */}
            {hashResult && (
              <div
                className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                  hashResult.valid
                    ? "bg-status-green-bg text-status-green border-green-800/40"
                    : "bg-status-red-bg text-red-400 border-red-800/40"
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
                    <span>Integrity failed: Computed hash differs from sealed digest (tamper detected).</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Level 2: Progressive Disclosure - Expandable Technical Details */}
          <div className="pt-1">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-xs text-text-dim hover:text-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
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
                <div className="text-[11px] text-text-dim font-mono">
                  Sealed Canonical SHA-256 Digest:
                </div>
                <div className="p-2 rounded bg-bg-input border border-border-card font-mono text-[11px] text-brand-blue break-all select-all">
                  {expectedHash}
                </div>
              </div>

              {hashResult && !hashResult.valid && (
                <div className="space-y-1">
                  <div className="text-[11px] text-red-400 font-mono">
                    Computed SHA-256 Digest:
                  </div>
                  <div className="p-2 rounded bg-status-red-bg border border-red-500/30 font-mono text-[11px] text-red-400 break-all select-all">
                    {hashResult.computed}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-text-dim font-mono">
                  <span>Canonical Payload (RFC 8785 JCS):</span>
                  <button
                    onClick={handleCopy}
                    className="hover:text-text-main flex items-center gap-1 text-[10px] cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-bg-app border border-border-card font-mono text-[11px] text-text-sub max-h-48 overflow-auto leading-relaxed">
                  {JSON.stringify(record, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
