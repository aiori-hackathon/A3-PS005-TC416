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
  ArrowRight,
  ShieldAlert,
  Fingerprint,
  RefreshCw,
  Terminal,
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

  // Tamper Simulation Toggle
  const handleToggleTampering = () => {
    if (!isTampered) {
      const cloned = JSON.parse(JSON.stringify(originalRecord));
      cloned.severity = "LOW";
      cloned.explanation =
        "UNAUTHORIZED MUTATION: Security incident severity downgraded in memory.";
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

  // Copy canonical JSON to clipboard
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-bg-card border border-border-card rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="h-14 border-b border-border-sub bg-bg-header flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bg-btn border border-border-card flex items-center justify-center text-status-green">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-main tracking-tight">
                  Cryptographic Evidence Record
                </h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-status-green-bg text-status-green border border-green-800/40">
                  RFC 8785 JCS
                </span>
              </div>
              <p className="text-[11px] text-text-dim font-mono">
                ID: {evidence?.id || alert?.id || "Pending"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-bg-btn border border-border-card flex items-center justify-center text-text-sub hover:text-text-main transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs select-text">
          {/* Chain of Custody Pipeline */}
          <div className="p-3 rounded-lg bg-bg-app border border-border-card">
            <span className="text-[10px] text-text-dim font-semibold uppercase tracking-wider block mb-2">
              Cryptographic Notarization Pipeline
            </span>
            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
              <div className="p-2 rounded bg-bg-card border border-border-card">
                <div className="text-[10px] text-text-dim">1. Ingest</div>
                <div className="font-semibold text-text-main mt-0.5 truncate">BGP Wire</div>
              </div>
              <div className="p-2 rounded bg-bg-card border border-border-card">
                <div className="text-[10px] text-text-dim">2. Canonicalize</div>
                <div className="font-semibold text-status-green mt-0.5 truncate">RFC 8785</div>
              </div>
              <div className="p-2 rounded bg-bg-card border border-border-card">
                <div className="text-[10px] text-text-dim">3. Digest</div>
                <div className="font-semibold text-brand-blue mt-0.5 truncate">SHA-256</div>
              </div>
              <div className="p-2 rounded bg-bg-card border border-border-card">
                <div className="text-[10px] text-text-dim">4. Sign</div>
                <div className="font-semibold text-purple-400 mt-0.5 truncate">
                  {isSigned ? "ML-DSA-65" : "Unsigned"}
                </div>
              </div>
            </div>
          </div>

          {/* Tamper Warning Banner & Visual Diff */}
          {isTampered && (
            <div className="p-3.5 rounded-lg bg-status-red-bg border border-red-500/30 text-red-400 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Simulated In-Memory Tampering Active</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                A rogue actor attempted to modify incident values in memory. Notice the exact field-level mutations below:
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                <div className="p-2 rounded bg-bg-card border border-border-card text-text-sub">
                  <span className="text-text-dim text-[10px] block">ORIGINAL SEVERITY:</span>
                  <span className="text-status-green">HIGH</span> ➔ <span className="text-red-400 font-bold">LOW</span>
                </div>
                <div className="p-2 rounded bg-bg-card border border-border-card text-text-sub">
                  <span className="text-text-dim text-[10px] block">ORIGINAL ORIGIN ASN:</span>
                  <span className="text-status-green">{originalRecord.observed_asn || "AS64511"}</span> ➔ <span className="text-red-400 font-bold">AS0</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: SHA-256 Integrity Verification */}
          <div className="card-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-brand-blue" />
                <span>SHA-256 Canonical Digest (RFC 8785)</span>
              </span>
              <button
                onClick={handleToggleTampering}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  isTampered
                    ? "bg-red-500/10 text-red-400 border-red-500/30"
                    : "bg-bg-btn border-border-card text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-status-amber" />
                <span>{isTampered ? "Reset untampered" : "Simulate tampering"}</span>
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-text-dim block font-mono">
                Notarized Vault Digest:
              </span>
              <div className="p-2 rounded bg-bg-input border border-border-card font-mono text-[11px] text-status-green break-all select-all">
                {expectedHash || "Computing digest..."}
              </div>
            </div>

            {isTampered && (
              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-red-400 block font-mono">
                  Computed Digest (Mutated Payload):
                </span>
                <div className="p-2 rounded bg-status-red-bg border border-red-500/30 font-mono text-[11px] text-red-400 break-all select-all">
                  {hashResult ? hashResult.computed : "Click 'Verify integrity' to re-calculate"}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleVerifyHash}
                  disabled={verifyingHash}
                  className="px-3 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover hover:border-text-dim text-xs font-semibold text-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${verifyingHash ? "animate-spin text-brand-blue" : "text-status-green"}`} />
                  <span>{verifyingHash ? "Re-evaluating..." : "Verify integrity"}</span>
                </button>

                <button
                  onClick={handleCopyCli}
                  className="px-2.5 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-medium text-text-sub hover:text-text-main transition-colors cursor-pointer flex items-center gap-1"
                  title="Copy verification CLI command"
                >
                  <Terminal className="w-3 h-3 text-brand-blue" />
                  <span>{copiedCli ? "CLI Copied!" : "Verify CLI"}</span>
                </button>
              </div>

              {hashResult && (
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${
                    hashResult.valid
                      ? "bg-status-green-bg text-status-green border-green-800/40"
                      : "bg-status-red-bg text-red-400 border-red-800/40"
                  }`}
                >
                  {hashResult.valid ? "Integrity verified (Valid RFC 8785)" : "Tamper detected: Hash mismatch"}
                </span>
              )}
            </div>
          </div>

          {/* Section 2: Post-Quantum Digital Signature */}
          <div className="card-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-main">
                <Cpu className="w-3.5 h-3.5 text-brand-blue" />
                <span>Post-Quantum Signature (NIST FIPS 204 ML-DSA-65)</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isSigned
                    ? "bg-status-green-bg text-status-green border-green-800/40"
                    : "bg-status-amber-bg text-status-amber border-amber-800/40"
                }`}
              >
                {isSigned ? "Signed (ML-DSA-65)" : "Unsigned"}
              </span>
            </div>

            {isSigned ? (
              <div className="space-y-2 text-[11px] font-mono">
                <div className="space-y-1">
                  <span className="text-text-dim block text-[10px]">Public Key (Base64)</span>
                  <div className="p-2 rounded bg-bg-input border border-border-card text-text-sub break-all select-all max-h-16 overflow-y-auto">
                    {evidence?.public_key}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-text-dim block text-[10px]">Quantum-Resistant Signature (Base64)</span>
                  <div className="p-2 rounded bg-bg-input border border-border-card text-purple-400 break-all select-all max-h-16 overflow-y-auto">
                    {evidence?.signature}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-text-dim text-[11px]">
                  Sign with post-quantum private key
                </span>
                <button
                  onClick={handleSign}
                  disabled={signing}
                  className="px-3 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-semibold text-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-brand-blue" />
                  <span>{signing ? "Signing..." : "Sign with ML-DSA-65"}</span>
                </button>
              </div>
            )}

            {signError && <div className="text-red-400 text-[11px]">{signError}</div>}
          </div>

          {/* Section 3: Canonical Evidence JSON Payload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-text-sub font-semibold">
              <span>Canonical Evidence JSON (RFC 8785)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-[11px] text-text-sub hover:text-text-main flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-status-green" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-2.5 py-1 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-[11px] text-text-sub hover:text-text-main flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <pre className="p-3 rounded-lg bg-bg-input border border-border-card font-mono text-[11px] text-text-sub overflow-x-auto max-h-52 leading-relaxed select-text">
              {JSON.stringify(record, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="h-12 border-t border-border-sub bg-bg-header flex items-center justify-between px-6 shrink-0">
          <span className="text-[11px] text-text-dim">
            RFC 8785 • SHA-256 • ML-DSA-65
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-semibold text-text-main transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
