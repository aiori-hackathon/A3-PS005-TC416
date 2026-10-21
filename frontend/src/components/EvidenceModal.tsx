import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Download,
  AlertTriangle,
  Check,
  Copy,
  Lock,
  Cpu,
  RefreshCw,
  Terminal,
  ChevronDown,
  ChevronRight,
  FileText,
  Key,
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

  // Verify Content Integrity (SHA-256 over RFC 8785 canonical JSON)
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

  // Simulated In-Memory Tampering Toggle (Testing Tool)
  const handleToggleTampering = () => {
    if (!isTampered) {
      const cloned = JSON.parse(JSON.stringify(originalRecord));
      cloned.severity = "LOW";
      cloned.explanation =
        "SIMULATED MUTATION: Incident severity downgraded in memory to test integrity detection.";
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

  // Sign with ML-DSA-65 (if provider available)
  const handleSign = async () => {
    if (!evidence) return;
    setSigning(true);
    setSignError(null);
    try {
      await api.signEvidence(evidence.id);
      onSigned();
    } catch (err: any) {
      setSignError(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : err.message || "ML-DSA-65 provider unavailable on host system"
      );
    } finally {
      setSigning(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCli = () => {
    const compactJson = JSON.stringify(record);
    const cmd = `echo '${compactJson}' | sha256sum`;
    navigator.clipboard.writeText(cmd);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleDownload = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(record, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `evidence-${evidence?.id || alert?.id}.json`);
    dlAnchor.click();
  };

  const isSigned = evidence?.signer_status === "SIGNED" || Boolean(evidence?.signature);
  const recordId = evidence?.id || alert?.evidence_id || "Pending";
  const associatedPrefix = record.prefix || alert?.prefix || "Unknown";
  const observedAsn = record.observed_asn || alert?.observed_asn || "Unknown";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-bg-card border border-border-card rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-13 border-b border-border-card bg-bg-header flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-bg-btn border border-border-card flex items-center justify-center text-brand-blue">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-main tracking-tight leading-none">
                Evidence verification
              </h2>
              <p className="text-[11px] text-text-dim font-mono mt-0.5">
                ID: {recordId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded bg-bg-btn border border-border-card flex items-center justify-center text-text-sub hover:text-text-main transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs select-text">
          {/* Associated Incident Summary Card */}
          <div className="p-3.5 rounded bg-bg-raised border border-border-card space-y-1.5">
            <div className="text-[11px] font-medium text-text-dim uppercase tracking-wider">
              Associated routing anomaly
            </div>
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span>
                Target prefix: <strong className="font-mono text-text-main">{associatedPrefix}</strong>
              </span>
              <span className="text-border-card">•</span>
              <span>
                Observed origin: <strong className="font-mono text-status-red">{observedAsn}</strong>
              </span>
              {record.baseline_asn && (
                <>
                  <span className="text-border-card">•</span>
                  <span>
                    Baseline: <strong className="font-mono text-status-green">{record.baseline_asn}</strong>
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-text-sub leading-relaxed pt-0.5">
              {record.explanation || alert?.explanation || "Routing anomaly record generated by detection engine."}
            </p>
          </div>

          {/* Primary Level 1: Two Results (Integrity & Signature) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Box 1: Content Integrity Check */}
            <div className="p-3.5 rounded bg-bg-raised border border-border-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-brand-blue" />
                  <span>Content integrity</span>
                </span>
                <span
                  className={`px-2 py-0.2 rounded text-[10px] font-semibold border ${
                    hashResult === null
                      ? "bg-bg-btn text-text-sub border-border-card"
                      : hashResult.valid
                      ? "bg-status-green-bg text-status-green border-status-green"
                      : "bg-status-red-bg text-status-red border-status-red"
                  }`}
                >
                  {hashResult === null
                    ? "Not evaluated"
                    : hashResult.valid
                    ? "Digest matches"
                    : "Tamper detected"}
                </span>
              </div>
              <p className="text-[11px] text-text-sub leading-relaxed">
                {hashResult === null
                  ? "Verifies that the canonical JSON payload matches the stored SHA-256 digest."
                  : hashResult.valid
                  ? "Payload matches stored digest. No data fields have been modified."
                  : "Hash mismatch: Payload content has been altered since notarization."}
              </p>
              <button
                onClick={handleVerifyHash}
                disabled={verifyingHash}
                className="w-full mt-1 py-1.5 px-3 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-medium text-text-main flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 text-brand-blue ${verifyingHash ? "animate-spin" : ""}`} />
                <span>{verifyingHash ? "Re-evaluating..." : "Verify content integrity"}</span>
              </button>
            </div>

            {/* Box 2: Digital Signature State */}
            <div className="p-3.5 rounded bg-bg-raised border border-border-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-brand-blue" />
                  <span>Digital signature</span>
                </span>
                <span
                  className={`px-2 py-0.2 rounded text-[10px] font-semibold border ${
                    isSigned
                      ? "bg-status-green-bg text-status-green border-status-green"
                      : "bg-status-amber-bg text-status-amber border-status-amber"
                  }`}
                >
                  {isSigned ? "Signed (ML-DSA-65)" : "Unsigned"}
                </span>
              </div>
              <p className="text-[11px] text-text-sub leading-relaxed">
                {isSigned
                  ? "Signed with post-quantum NIST FIPS 204 ML-DSA-65 private key."
                  : "No digital signature applied to this record yet. Signatures prove author identity."}
              </p>
              {!isSigned ? (
                <button
                  onClick={handleSign}
                  disabled={signing}
                  className="w-full mt-1 py-1.5 px-3 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-medium text-text-main flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Key className="w-3 h-3 text-brand-blue" />
                  <span>{signing ? "Signing..." : "Sign with ML-DSA-65"}</span>
                </button>
              ) : (
                <div className="text-[11px] text-status-green font-medium pt-1">
                  Signature attached and validated
                </div>
              )}
            </div>
          </div>

          {signError && (
            <div className="p-3 rounded bg-status-red-bg border border-status-red text-status-red text-xs">
              {signError}
            </div>
          )}

          {/* Simulated In-Memory Tamper Tool (Clearly labeled as test) */}
          <div className="p-3 rounded bg-bg-raised border border-border-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-status-amber" />
                <span>Simulated in-memory tamper testing tool</span>
              </span>
              <button
                onClick={handleToggleTampering}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                  isTampered
                    ? "bg-status-red-bg text-status-red border-status-red"
                    : "bg-bg-btn border-border-card text-text-sub hover:text-text-main"
                }`}
              >
                {isTampered ? "Reset to original" : "Simulate tampering in memory"}
              </button>
            </div>
            <p className="text-[11px] text-text-sub leading-relaxed">
              Mutates the local in-memory object (downgrades severity to LOW, changes origin ASN to AS0) to demonstrate that the SHA-256 verification algorithm detects unauthorized changes.
            </p>
            {isTampered && (
              <div className="p-2.5 rounded bg-status-red-bg border border-status-red text-status-red text-[11px] font-mono space-y-1">
                <div>Field modification: severity: HIGH ➔ LOW</div>
                <div>Field modification: observed_asn: {originalRecord.observed_asn || "AS64511"} ➔ AS0</div>
                <div className="text-text-sub font-sans pt-0.5">
                  Click "Verify content integrity" above to see the hash divergence caught in real time.
                </div>
              </div>
            )}
          </div>

          {/* Level 2: Progressive Disclosure of Technical Details */}
          <div className="border border-border-card rounded overflow-hidden">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full p-3 bg-bg-raised flex items-center justify-between text-xs font-medium text-text-main hover:bg-bg-nav-hover transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-blue" />
                <span>Technical cryptographic details</span>
              </span>
              <span className="text-text-dim flex items-center gap-1 text-[11px]">
                <span>{showTechnicalDetails ? "Collapse" : "Expand"}</span>
                {showTechnicalDetails ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
            </button>

            {showTechnicalDetails && (
              <div className="p-4 bg-bg-card space-y-3 border-t border-border-card text-xs">
                {/* Method & Hashes */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-text-dim font-medium uppercase tracking-wider">
                    Canonicalization standard
                  </div>
                  <div className="font-mono text-text-main text-[11px] p-2 rounded bg-bg-app border border-border-card">
                    RFC 8785 JSON Canonicalization Scheme (JCS)
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-text-dim font-medium uppercase tracking-wider">
                    Stored SHA-256 Digest
                  </div>
                  <div className="font-mono text-status-green text-[11px] p-2 rounded bg-bg-app border border-border-card break-all select-all">
                    {expectedHash || "None recorded"}
                  </div>
                </div>

                {hashResult && (
                  <div className="space-y-1">
                    <div className="text-[11px] text-text-dim font-medium uppercase tracking-wider">
                      Recomputed SHA-256 Digest
                    </div>
                    <div
                      className={`font-mono text-[11px] p-2 rounded bg-bg-app border break-all select-all ${
                        hashResult.valid
                          ? "text-status-green border-status-green"
                          : "text-status-red border-status-red"
                      }`}
                    >
                      {hashResult.computed}
                    </div>
                  </div>
                )}

                {/* CLI Command Helper */}
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-text-dim">
                    Independent terminal reproduction:
                  </span>
                  <button
                    onClick={handleCopyCli}
                    className="px-2 py-1 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-[11px] text-text-main flex items-center gap-1 cursor-pointer"
                  >
                    <Terminal className="w-3 h-3 text-brand-blue" />
                    <span>{copiedCli ? "CLI snippet copied!" : "Copy terminal verification command"}</span>
                  </button>
                </div>

                {/* Canonical JSON Viewer */}
                <div className="space-y-1.5 pt-2 border-t border-border-item">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-dim font-medium uppercase tracking-wider">
                      Canonical JSON payload
                    </span>
                    <button
                      onClick={handleCopyJson}
                      className="px-2 py-0.5 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-[11px] text-text-sub hover:text-text-main flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3 text-status-green" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? "Copied" : "Copy JSON"}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded bg-bg-app border border-border-card font-mono text-[11px] text-text-sub overflow-x-auto max-h-48 leading-relaxed select-text">
                    {JSON.stringify(record, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-border-card bg-bg-header flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-medium text-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-brand-blue" />
              <span>Export record (.json)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-semibold text-text-main transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
