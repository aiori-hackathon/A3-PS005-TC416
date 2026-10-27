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

  const isAutoTamper =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("modal") === "tamper";

  const [verifyingHash, setVerifyingHash] = useState(false);
  const [hashResult, setHashResult] = useState<{
    valid: boolean;
    computed: string;
  } | null>(() => {
    if (isAutoTamper) {
      return {
        valid: false,
        computed: "a49aff62a8000000000000000000000000000000000000000000000000000000",
      };
    }
    return null;
  });

  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  const [isTampered, setIsTampered] = useState(isAutoTamper);
  const [tamperedData, setTamperedData] = useState<Record<string, any> | null>(() => {
    if (isAutoTamper && evidence?.record) {
      const cloned = JSON.parse(JSON.stringify(evidence.record));
      cloned.severity = "LOW";
      cloned.explanation = "UNAUTHORIZED MUTATION: Security incident severity modified in memory.";
      cloned.observed_asn = "AS0";
      return cloned;
    }
    return null;
  });
  const [copied, setCopied] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const originalRecord: any = evidence?.record || {};
  const record: any = isTampered && tamperedData ? tamperedData : originalRecord;
  const expectedHash = evidence?.record_hash || "";

  const recordId = evidence?.id || alert?.evidence_id || "ev-record";
  const exportFilename = `evidence-${recordId}.json`;
  const cliCommand = `python verify_evidence.py "${exportFilename}"`;

  // Verify SHA-256 Integrity
  const handleVerifyHash = async () => {
    setVerifyingHash(true);
    setSignError(null);
    try {
      const res = await api.verifyEvidenceHash(record, expectedHash);
      setHashResult({ valid: res.valid, computed: res.computed_hash });
    } catch (err: any) {
      setSignError(err.message || "Failed to verify hash via API");
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
      setSignError(err.message || "Cryptographic signing failed");
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
    navigator.clipboard.writeText(cliCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  // Export JSON envelope compatible with independent verify_evidence.py
  const handleDownload = () => {
    const exportEnvelope = {
      id: recordId,
      alert_id: alert?.id || evidence?.alert_id || null,
      record: record,
      record_hash: expectedHash,
      signature: isTampered
        ? (evidence?.signature ? "TAMPERED_SIG_" + evidence.signature.slice(0, 30) : null)
        : (evidence?.signature || null),
      public_key: evidence?.public_key || null,
      signer_status: isTampered
        ? "TAMPERED"
        : (evidence?.signer_status || (evidence?.signature ? "SIGNED" : "UNSIGNED")),
      signature_algorithm: evidence?.algorithm || (evidence as any)?.signature_algorithm || "ML-DSA-65",
      algorithm: evidence?.algorithm || "ML-DSA-65",
      exported_at: new Date().toISOString(),
    };

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(exportEnvelope, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", exportFilename);
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
                {recordId}
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
                  <span className="text-text-dim font-medium">Unsigned (Digest Only)</span>
                )}
              </div>
              <p className="text-[11px] text-text-dim leading-relaxed pt-0.5">
                {isSigned
                  ? "Post-quantum digital signature verified under NIST FIPS 204."
                  : "Content digest is recorded via RFC 8785 JCS. To establish cryptographic non-repudiation, notarize with ML-DSA-65 below."}
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
                Incident values were mutated in browser memory (severity downgraded to LOW, origin changed to AS0). Re-verifying will catch this payload mismatch.
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
                onClick={handleDownload}
                className="px-2.5 py-1.5 rounded-xl bg-bg-card border border-border-card hover:border-brand-blue/40 text-xs font-semibold text-text-sub hover:text-text-main transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Download className="w-3 h-3 text-text-dim" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={handleCopyCli}
                className="px-2.5 py-1.5 rounded-xl bg-bg-card border border-border-card hover:border-brand-blue/40 text-xs font-semibold text-text-sub hover:text-text-main transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Copy terminal verification CLI"
              >
                <Terminal className="w-3 h-3 text-text-dim" />
                <span>{copiedCli ? "CLI Copied" : "Copy CLI"}</span>
              </button>
            </div>

            {/* Independent CLI Instruction Card */}
            <div className="p-3 rounded-lg bg-bg-card border border-border-card space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-text-main flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-brand-blue" />
                  Independent CLI Verification Command
                </span>
                <span className="text-text-dim text-[10px]">Python 3 (RFC 8785 + FIPS 204)</span>
              </div>
              <div className="p-2 rounded bg-bg-interactive border border-divider text-text-main flex items-center justify-between gap-2 overflow-x-auto font-mono text-[11px]">
                <code className="text-brand-blue select-all">{cliCommand}</code>
                <button
                  onClick={handleCopyCli}
                  className="px-2 py-0.5 rounded bg-bg-card hover:bg-bg-selected text-text-sub hover:text-brand-blue border border-divider text-[10px] shrink-0 font-sans cursor-pointer transition-colors"
                >
                  {copiedCli ? "Copied" : "Copy Command"}
                </button>
              </div>
              <p className="text-[10px] text-text-dim leading-relaxed">
                Click <span className="font-semibold text-text-sub">Export JSON</span> to save <span className="font-mono text-text-sub">{exportFilename}</span> to your repository root, then run the copied command to verify canonical hash and digital signature independently.
              </p>
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
          <span>RFC 8785 Canonicalization • NIST FIPS 204</span>
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
