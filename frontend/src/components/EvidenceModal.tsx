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
  const [tamperedData, setTamperedData] = useState<Record<string, any> | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  const originalRecord = evidence?.record || {};
  const record =
    isTampered && tamperedData ? tamperedData : originalRecord;
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
        "TAMPERED RECORD: Unauthorized downgrade of security incident severity.";
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

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-bg-card border border-border-card rounded-xl shadow-2xl overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="h-14 border-b border-border-sub bg-bg-header flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-brand-blue">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-main">
                Cryptographic Evidence Record
              </h3>
              <p className="text-[11px] text-text-dim font-mono">
                Evidence ID: {evidence?.id || "Pending"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-bg-nav-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Tamper Warning Banner */}
          {isTampered && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 space-y-1 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>SIMULATED PAYLOAD TAMPERING ACTIVE</span>
              </div>
              <p className="text-[11px] text-red-400/90 leading-relaxed pl-6">
                Fields altered in memory: <code className="bg-red-950/40 px-1 py-0.5 rounded">severity: "HIGH" → "LOW"</code> and <code className="bg-red-950/40 px-1 py-0.5 rounded">observed_asn: "AS0"</code>. Click "Verify Content Integrity" below to verify cryptographic detection!
              </p>
            </div>
          )}

          {/* Section 1: SHA-256 Integrity Verification */}
          <div className="card-panel p-4 space-y-3 bg-bg-app">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-blue tracking-wide uppercase">
                SHA-256 Canonical Digest (RFC 8785)
              </span>
              <button
                onClick={handleToggleTampering}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  isTampered
                    ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                    : "bg-bg-btn border-border-card text-text-sub hover:text-text-main hover:bg-bg-nav-hover"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-status-amber" />
                <span>{isTampered ? "Reset Untampered Record" : "Simulate Tampering"}</span>
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-text-dim block font-mono">
                Expected Digest (Vault Stored Hash):
              </span>
              <div className="p-2 rounded bg-bg-input border border-border-card font-mono text-[11px] text-emerald-400 break-all select-all">
                {expectedHash || "Computing canonical digest..."}
              </div>
            </div>

            {/* If tampered, show side-by-side diff */}
            {isTampered && (
              <div className="space-y-1 pt-1 animate-fadeIn">
                <span className="text-[11px] text-red-400 block font-mono">
                  Computed Digest (From Corrupted In-Memory Payload):
                </span>
                <div className="p-2 rounded bg-red-950/20 border border-red-500/40 font-mono text-[11px] text-red-400 break-all select-all">
                  {hashResult ? hashResult.computed : "Click 'Verify Content Integrity' to re-hash"}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleVerifyHash}
                disabled={verifyingHash}
                className="px-4 py-2 rounded-lg bg-brand-blue text-slate-950 hover:bg-sky-400 text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {verifyingHash ? "Recalculating Digest..." : "Verify Content Integrity"}
                </span>
              </button>

              {hashResult && (
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                    hashResult.valid
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {hashResult.valid ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>INTEGRITY VERIFIED (Valid RFC 8785 SHA-256)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>TAMPER DETECTED: Computed Digest Mismatch!</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Post-Quantum Digital Signature */}
          <div className="card-panel p-4 space-y-3 bg-bg-app">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-text-main">
                <Cpu className="w-4 h-4 text-brand-blue" />
                <span>Post-Quantum Signature (NIST FIPS 204 ML-DSA-65)</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  evidence?.signature
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {evidence?.signature ? "SIGNED (Post-Quantum)" : "UNSIGNED"}
              </span>
            </div>

            {evidence?.signature ? (
              <div className="space-y-2 text-[11px] font-mono">
                <div className="space-y-1">
                  <span className="text-text-dim block">Public Key (Base64)</span>
                  <div className="p-2 rounded bg-bg-input border border-border-card text-text-sub break-all select-all max-h-16 overflow-y-auto">
                    {evidence.public_key}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-text-dim block">Quantum-Resistant Signature (Base64)</span>
                  <div className="p-2 rounded bg-bg-input border border-border-card text-purple-400 break-all select-all max-h-16 overflow-y-auto">
                    {evidence.signature}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-text-dim text-[11px]">
                  Sign record with ML-DSA-65 post-quantum private key
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

            {signError && (
              <div className="text-red-400 text-[11px]">{signError}</div>
            )}
          </div>

          {/* Section 3: Canonical Evidence JSON Payload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-text-sub font-semibold">
              <span>Canonical Evidence JSON (RFC 8785 Deterministic Encoding)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2 py-1 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-[11px] text-text-sub hover:text-text-main flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-2 py-1 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-[11px] text-text-sub hover:text-text-main flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <pre className="p-3 rounded-lg bg-bg-input border border-border-card font-mono text-[11px] text-text-sub overflow-x-auto max-h-56 leading-relaxed">
              {JSON.stringify(record, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="h-12 border-t border-border-sub bg-bg-header flex items-center justify-between px-6 shrink-0">
          <span className="text-[11px] text-text-dim">
            Deterministic serialization: RFC 8785 • Hashing: SHA-256 • Cryptography: ML-DSA-65
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
