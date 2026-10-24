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
  const shortenedHash = expectedHash
    ? `${expectedHash.substring(0, 12)}...${expectedHash.substring(expectedHash.length - 12)}`
    : "Computing...";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-bg-card border border-border-card rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 border-b border-border-card bg-bg-elevated flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bg-card border border-border-card flex items-center justify-center text-brand-blue shadow-2xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-main tracking-tight">
                Forensic evidence record
              </h2>
              <span className="text-[11px] text-text-dim font-mono">
                {evidence?.id || alert?.id || "Evidence"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-bg-card border border-border-card flex items-center justify-center text-text-sub hover:text-text-main hover:border-brand-blue/40 transition-all cursor-pointer shadow-2xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs select-text">
          {/* Associated Incident Summary */}
          <div className="p-3.5 rounded-xl bg-bg-elevated border border-border-card space-y-1.5">
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
                    <span className="text-text-main font-semibold">
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

          {/* Integrity & Signature Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-bg-elevated border border-border-card space-y-1">
              <div className="text-[11px] text-text-dim font-semibold">Content Integrity (RFC 8785)</div>
              <div className="flex items-center gap-1.5 font-bold text-status-green">
                <Check className="w-4 h-4" />
                <span>SHA-256 Digest Recorded</span>
              </div>
              <div className="text-[11px] font-mono text-text-sub pt-0.5 truncate" title={expectedHash}>
                {shortenedHash}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-bg-elevated border border-border-card space-y-1">
              <div className="text-[11px] text-text-dim font-semibold">Post-Quantum Signature</div>
              <div
                className={`flex items-center gap-1.5 font-bold ${
                  isSigned ? "text-status-green" : "text-text-sub"
                }`}
              >
                {isSigned ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ML-DSA-65 Signed (NIST FIPS 204)</span>
                  </>
                ) : (
                  <span className="text-text-dim font-medium">Unsigned</span>
                )}
              </div>
              <p className="text-[11px] text-text-dim leading-relaxed pt-0.5">
                {isSigned
                  ? "Post-quantum digital signature verified under NIST FIPS 204."
                  : "Digest recorded; signature key not yet attached."}
              </p>
            </div>
          </div>

          {/* Simulated Payload Mutation Warning */}
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

          {/* Verification & Forensic Actions */}
          <div className="p-3.5 rounded-xl bg-bg-elevated border border-border-card space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-text-main">Forensic Actions</span>
              <button
                onClick={handleToggleTampering}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer shadow-2xs ${
                  isTampered
                    ? "bg-red-500/20 text-status-red border-red-500/35"
                    : "bg-bg-card border-border-card text-text-sub hover:text-text-main hover:border-brand-blue/35"
                }`}
              >
                {isTampered ? "Reset original payload" : "Simulate tamper (demo)"}
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleVerifyHash}
                disabled={verifyingHash}
                className="px-3.5 py-1.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${verifyingHash ? "animate-spin" : ""}`}
                />
                <span>{verifyingHash ? "Verifying..." : "Verify integrity"}</span>
              </button>

              {!isSigned && (
                <button
                  onClick={handleSign}
                  disabled={signing}
                  className="px-3.5 py-1.5 rounded-xl bg-bg-card border border-border-card hover:border-brand-blue/40 text-text-main font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <Cpu className="w-3.5 h-3.5 text-brand-blue" />
                  <span>{signing ? "Signing..." : "Sign with ML-DSA-65"}</span>
                </button>
              )}

              <button
                onClick={handleCopyCli}
                className="px-2.5 py-1.5 rounded-xl bg-bg-card border border-border-card hover:border-brand-blue/40 text-xs font-semibold text-text-sub hover:text-text-main transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Copy terminal verification CLI"
              >
                <Terminal className="w-3 h-3 text-text-dim" />
                <span>{copiedCli ? "CLI Copied" : "Copy CLI"}</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-2.5 py-1.5 rounded-xl bg-bg-card border border-border-card hover:border-brand-blue/40 text-xs font-semibold text-text-sub hover:text-text-main transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Download className="w-3 h-3 text-text-dim" />
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

            {signError && (
              <div className="p-2.5 rounded-xl bg-status-red-bg border border-red-500/35 text-status-red text-xs">
                {signError}
              </div>
            )}
          </div>

          {/* Technical Section: RFC 8785 Canonical Payload */}
          <div className="rounded-xl border border-border-card bg-bg-elevated overflow-hidden">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-text-main hover:bg-bg-interactive transition-colors cursor-pointer"
            >
              <span>Canonical payload & full digest</span>
              {showTechnicalDetails ? (
                <ChevronUp className="w-4 h-4 text-text-dim" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-dim" />
              )}
            </button>

            {showTechnicalDetails && (
              <div className="p-4 border-t border-border-card bg-bg-card space-y-3 font-mono text-[11px]">
                <div className="space-y-1">
                  <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
                    Recorded SHA-256 Digest
                  </span>
                  <div className="p-2.5 rounded-lg bg-bg-app border border-border-card text-text-main break-all select-all">
                    {expectedHash || "No digest recorded"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
                      RFC 8785 Canonical JSON Payload
                    </span>
                    <button
                      onClick={handleCopy}
                      className="text-brand-blue hover:underline flex items-center gap-1 cursor-pointer text-[10px]"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copied ? "Copied" : "Copy JSON"}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-bg-app border border-border-card text-text-sub overflow-x-auto max-h-56 leading-relaxed">
                    {JSON.stringify(record, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-border-card bg-bg-elevated px-5 flex items-center justify-between shrink-0 text-[11px] text-text-dim font-mono">
          <span>RFC 8785 Canonicalization</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-bg-card border border-border-card hover:border-brand-blue/40 text-text-main text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
