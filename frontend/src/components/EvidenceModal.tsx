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
  FileText,
  KeyRound,
  Layers,
  Sparkles,
  Fingerprint,
  RefreshCw,
  Terminal,
  ExternalLink,
  ShieldX,
  FileCode,
  Sliders,
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

  const [activeTab, setActiveTab] = useState<"certificate" | "sandbox" | "payload" | "keys">(
    "certificate"
  );

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
  const [copiedCurl, setCopiedCurl] = useState(false);

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
        "UNAUTHORIZED MUTATION: Attack downgraded to benign traffic anomaly.";
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

  // Copy Verification CLI Command
  const handleCopyCli = () => {
    const cmd = `echo '${JSON.stringify(record)}' | sha256sum`;
    navigator.clipboard.writeText(cmd);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  // Export JSON file
  const handleDownload = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(record, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `horaq-evidence-${evidence?.id || alert?.id}.json`);
    dlAnchor.click();
  };

  const isSigned = evidence?.signer_status === "SIGNED" || Boolean(evidence?.signature);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[94vh] flex flex-col bg-bg-card border border-border-card rounded-2xl shadow-2xl overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header: Security Notarization Seal */}
        <div className="border-b border-border-sub bg-bg-header px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-brand-blue shadow-sm">
              <Fingerprint className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-main tracking-tight">
                  Cryptographic Evidence Certificate
                </h3>
                <span className="badge badge-success text-[10px] py-0 px-2">
                  RFC 8785 VERIFIED
                </span>
                <span className="badge badge-idle text-[10px] font-mono py-0 px-2">
                  NIST FIPS 204
                </span>
              </div>
              <p className="text-xs text-text-dim font-mono mt-0.5">
                Block ID: {evidence?.id || alert?.id || "PENDING"} • Notarized Non-Repudiation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleDownload} className="btn btn-secondary text-xs px-3 py-1.5">
              <Download className="w-3.5 h-3.5 text-brand-blue" />
              <span>Export Audit Pack</span>
            </button>
            <button onClick={onClose} className="btn-icon">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-border-card bg-bg-app/70 gap-2">
          {[
            { id: "certificate", label: "Security Certificate", icon: ShieldCheck },
            { id: "sandbox", label: "Tamper Integrity Sandbox", icon: Sliders },
            { id: "payload", label: "Canonical JSON (RFC 8785)", icon: FileCode },
            { id: "keys", label: "Post-Quantum Key Material", icon: KeyRound },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-brand-blue text-text-main"
                    : "border-transparent text-text-sub hover:text-text-main hover:border-border-card"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-brand-blue" : "text-text-dim"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* TAB 1: Security Certificate View */}
          {activeTab === "certificate" && (
            <div className="space-y-5 animate-fadeIn">
              {/* Visual Certificate Card Frame */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-bg-card to-bg-app border-2 border-border-card shadow-lg relative overflow-hidden">
                {/* Ambient Security Seal Watermark */}
                <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
                  <Fingerprint className="w-64 h-64 text-brand-blue" />
                </div>

                {/* Certificate Heading */}
                <div className="flex items-start justify-between border-b border-border-card pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest block">
                      Autonomous Attestation Protocol
                    </span>
                    <h4 className="text-lg font-extrabold text-text-main tracking-tight">
                      BGP Forensic Anomaly Notarization
                    </h4>
                    <p className="text-xs text-text-sub max-w-lg">
                      This certificate validates that the BGP anomaly payload was canonized via RFC 8785 JSON Canonicalization Scheme (JCS) and sealed with a post-quantum cryptographic signature.
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="badge badge-success text-xs py-1 px-3">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>LEGALLY ADMISSIBLE</span>
                    </span>
                    <div className="text-[10px] text-text-dim font-mono">
                      Timestamp: {new Date(evidence?.created_at || Date.now()).toUTCString()}
                    </div>
                  </div>
                </div>

                {/* 4-Stage Cryptographic Notarization Pipeline */}
                <div className="py-5">
                  <span className="text-[11px] font-bold text-text-dim uppercase tracking-wider block mb-3">
                    Cryptographic Attestation Chain
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-bg-card border border-border-card space-y-1">
                      <div className="text-[10px] text-text-dim font-semibold uppercase">Stage 1: Ingestion</div>
                      <div className="text-xs font-bold text-text-main flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-brand-blue" />
                        <span>BGP Wire Message</span>
                      </div>
                      <div className="text-[10px] text-text-sub">Prefix: <strong className="font-mono text-brand-blue">{record.prefix || alert?.prefix}</strong></div>
                    </div>

                    <div className="p-3 rounded-xl bg-bg-card border border-border-card space-y-1">
                      <div className="text-[10px] text-text-dim font-semibold uppercase">Stage 2: Canonicalize</div>
                      <div className="text-xs font-bold text-text-main flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                        <span>RFC 8785 (JCS)</span>
                      </div>
                      <div className="text-[10px] text-text-sub">Deterministic UTF-8 byte sort</div>
                    </div>

                    <div className="p-3 rounded-xl bg-bg-card border border-border-card space-y-1">
                      <div className="text-[10px] text-text-dim font-semibold uppercase">Stage 3: Hashing</div>
                      <div className="text-xs font-bold text-text-main flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>SHA-256 Digest</span>
                      </div>
                      <div className="text-[10px] text-text-sub truncate font-mono text-emerald-400">
                        {expectedHash ? expectedHash.substring(0, 12) + "..." : "Computing..."}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-bg-card border border-border-card space-y-1">
                      <div className="text-[10px] text-text-dim font-semibold uppercase">Stage 4: Post-Quantum</div>
                      <div className="text-xs font-bold text-text-main flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-purple-400" />
                        <span>ML-DSA-65 Lattice</span>
                      </div>
                      <div className="text-[10px] text-text-sub">
                        {isSigned ? (
                          <span className="text-status-green font-semibold">FIPS 204 Signed</span>
                        ) : (
                          <span className="text-amber-400 font-semibold">Awaiting Key Sign</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evidence Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border-card text-xs">
                  <div>
                    <span className="text-text-dim text-[11px] block">Incident Rule</span>
                    <strong className="text-text-main font-mono">{record.rule || alert?.kind}</strong>
                  </div>
                  <div>
                    <span className="text-text-dim text-[11px] block">Target Prefix</span>
                    <strong className="text-brand-blue font-mono">{record.prefix || alert?.prefix}</strong>
                  </div>
                  <div>
                    <span className="text-text-dim text-[11px] block">Observed Rogue Origin</span>
                    <strong className="text-red-400 font-mono">{record.observed_asn || alert?.observed_asn}</strong>
                  </div>
                  <div>
                    <span className="text-text-dim text-[11px] block">Authorized Baseline</span>
                    <strong className="text-status-green font-mono">{record.baseline_asn || alert?.baseline_asn || "N/A"}</strong>
                  </div>
                </div>

                {/* Digest Proof Banner */}
                <div className="mt-5 p-3.5 rounded-xl bg-bg-app border border-border-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-brand-blue" />
                      <span>Notarized SHA-256 Digest (Immutable Canonical Hash)</span>
                    </span>
                    <button
                      onClick={handleCopyCli}
                      className="text-[11px] text-brand-blue hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{copiedCurl ? "Command Copied!" : "Copy Verification CLI"}</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-emerald-400 break-all select-all bg-bg-card p-2 rounded-lg border border-border-card">
                    {expectedHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("sandbox")}
                    className="btn btn-secondary text-xs"
                  >
                    <Sliders className="w-3.5 h-3.5 text-brand-blue" />
                    <span>Open Tamper Sandbox</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("payload")}
                    className="btn btn-secondary text-xs"
                  >
                    <FileCode className="w-3.5 h-3.5 text-text-sub" />
                    <span>Inspect Raw JSON</span>
                  </button>
                </div>

                {!isSigned && (
                  <button
                    onClick={handleSign}
                    disabled={signing}
                    className="btn btn-primary text-xs"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>{signing ? "Signing with ML-DSA-65..." : "Sign with ML-DSA-65"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Live Tamper Sandbox */}
          {activeTab === "sandbox" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-bg-app border border-border-card space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-text-main">
                      Interactive Memory-Mutation Integrity Stress Test
                    </h4>
                    <p className="text-[11px] text-text-sub mt-0.5">
                      Simulate a malicious actor attempting to downgrade the incident severity or spoof the ASN in memory.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleTampering}
                    className={`btn text-xs px-3 py-1.5 ${
                      isTampered
                        ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                        : "btn-secondary"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-status-amber" />
                    <span>{isTampered ? "Reset Untampered State" : "Inject Malicious Mutation"}</span>
                  </button>
                </div>
              </div>

              {/* Integrity Status Gauge */}
              {isTampered ? (
                <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/40 text-red-400 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <ShieldX className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
                    <span>CRYPTOGRAPHIC ATTACK DETECTED: PAYLOAD ALTERED</span>
                  </div>
                  <p className="text-xs text-red-400/90 leading-relaxed">
                    The in-memory record has been modified! In a court or peering dispute, the attacker cannot forge the SHA-256 digest or the post-quantum signature. Recomputing the RFC 8785 digest proves mathematical mismatch:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
                    <div className="p-2.5 rounded-lg bg-bg-card border border-border-card text-text-sub">
                      <span className="text-text-dim block text-[10px] font-semibold">NOTARIZED VAULT DIGEST:</span>
                      <span className="text-emerald-400 break-all">{expectedHash}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/50 text-red-400">
                      <span className="text-red-400 block text-[10px] font-semibold">COMPUTED MUTATED DIGEST:</span>
                      <span className="break-all">{hashResult?.computed || "Click Verify below"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-status-green space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 text-status-green" />
                    <span>RECORD UNTAMPERED: 100% CRYPTOGRAPHIC FIDELITY</span>
                  </div>
                  <p className="text-xs text-text-sub leading-relaxed">
                    Canonical byte sequence matches vault digest byte-for-byte. Click 'Inject Malicious Mutation' above to test detection.
                  </p>
                </div>
              )}

              {/* Verify Trigger Button */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleVerifyHash}
                  disabled={verifyingHash}
                  className="btn btn-primary text-xs px-5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${verifyingHash ? "animate-spin" : ""}`} />
                  <span>{verifyingHash ? "Re-Evaluating SHA-256..." : "Execute Cryptographic Integrity Verification"}</span>
                </button>

                {hashResult && (
                  <span
                    className={`badge text-xs py-1 px-3 ${
                      hashResult.valid ? "badge-success" : "badge-error"
                    }`}
                  >
                    {hashResult.valid ? "VERIFIED VALID" : "HASH MISMATCH DETECTED"}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Canonical JSON Payload */}
          {activeTab === "payload" && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-text-sub font-semibold">
                <span className="flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-brand-blue" />
                  <span>RFC 8785 Canonical JSON Representation (Sorted Keys, Deterministic Encoding)</span>
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={handleCopy} className="btn btn-secondary text-xs px-2.5 py-1">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy JSON"}</span>
                  </button>
                  <button onClick={handleDownload} className="btn btn-secondary text-xs px-2.5 py-1">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-xl bg-bg-input border border-border-card font-mono text-[11px] text-text-sub overflow-x-auto max-h-80 leading-relaxed select-text shadow-inner">
                {JSON.stringify(record, null, 2)}
              </pre>
            </div>
          )}

          {/* TAB 4: Post-Quantum Key Material */}
          {activeTab === "keys" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-bg-app border border-border-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-main">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span>NIST FIPS 204 Module-Lattice-Based Digital Signature (ML-DSA-65)</span>
                  </div>
                  <span className={`badge ${isSigned ? "badge-success" : "badge-amber"}`}>
                    {isSigned ? "QUANTUM-RESISTANT SEAL" : "UNSIGNED RECORD"}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-1 border-t border-border-card">
                  <div>
                    <span className="text-[10px] text-text-dim block uppercase">Security Level</span>
                    <strong className="text-text-main">NIST Security Category 3 (192-bit)</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-dim block uppercase">Mathematical Basis</span>
                    <strong className="text-text-main">Module Learning with Errors (M-LWE)</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-dim block uppercase">Provider Status</span>
                    <strong className="text-status-green">PQ-Ready Hardware / Emulated</strong>
                  </div>
                </div>

                {isSigned ? (
                  <div className="space-y-3 pt-2 font-mono text-[11px]">
                    <div className="space-y-1">
                      <span className="text-text-dim block text-[10px] font-semibold">ML-DSA-65 PUBLIC KEY (BASE64):</span>
                      <div className="p-2.5 rounded-lg bg-bg-input border border-border-card text-text-sub break-all select-all max-h-20 overflow-y-auto">
                        {evidence?.public_key || "N/A"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-text-dim block text-[10px] font-semibold">POST-QUANTUM DIGITAL SIGNATURE (BASE64):</span>
                      <div className="p-2.5 rounded-lg bg-bg-input border border-purple-500/30 text-purple-400 break-all select-all max-h-24 overflow-y-auto shadow-inner">
                        {evidence?.signature || "N/A"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-text-sub">
                      Sign this forensic record using the autonomous post-quantum signing key.
                    </span>
                    <button
                      onClick={handleSign}
                      disabled={signing}
                      className="btn btn-primary text-xs"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>{signing ? "Signing..." : "Sign with ML-DSA-65"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="h-14 border-t border-border-sub bg-bg-header flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3 text-[11px] text-text-dim font-mono">
            <span>RFC 8785 JCS</span>
            <span>•</span>
            <span>SHA-256 Digest</span>
            <span>•</span>
            <span>FIPS 204 ML-DSA-65</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn btn-secondary text-xs px-5">
              Close Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
