import React, { useState } from "react";
import {
  Send,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Radio,
  Info,
  ShieldAlert,
  FileText,
  AlertCircle,
} from "lucide-react";
import { api } from "../api";
import { useHoraqStore } from "../stores/useHoraqStore";

export const InjectRouteView: React.FC = () => {
  const {
    overview,
    alerts,
    evidence,
    fetchAllData,
    showNotification,
    setActiveTab,
    setSelectedAlert,
    setSelectedEvidence,
  } = useHoraqStore();

  const [prefix, setPrefix] = useState("");
  const [originAsn, setOriginAsn] = useState("");
  const [collector, setCollector] = useState("rrc00");
  const [scenario, setScenario] = useState("manual_test");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [lastOutcome, setLastOutcome] = useState<any>(null);

  const presets = [
    {
      label: "Origin Conflict Test (RFC 5737)",
      prefix: "192.0.2.0/24",
      asn: "AS64511",
      scenario: "origin_conflict_test",
    },
    {
      label: "Subprefix Hijack Test (RFC 5737)",
      prefix: "192.0.2.128/25",
      asn: "AS64500",
      scenario: "subprefix_hijack_test",
    },
    {
      label: "Normal Conforming Announcement",
      prefix: "192.0.2.0/24",
      asn: "AS64496",
      scenario: "normal_route_test",
    },
  ];

  const validateInputs = (): boolean => {
    setValidationError(null);
    const p = prefix.trim();
    const a = originAsn.trim();

    // CIDR validation
    const ipv4CidrRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}\/([0-9]|[1-2][0-9]|3[0-2])$/;
    const ipv6CidrRegex = /^([0-9a-fA-F:]+)\/([0-9]|[1-9][0-9]|1[0-2][0-8])$/;
    if (!ipv4CidrRegex.test(p) && !ipv6CidrRegex.test(p)) {
      setValidationError("Invalid prefix format. Must be valid CIDR (e.g. 192.0.2.0/24 or 2001:db8::/32).");
      return false;
    }

    // ASN validation
    const asnClean = a.replace(/^AS/i, "");
    const asnNum = parseInt(asnClean, 10);
    if (isNaN(asnNum) || asnNum <= 0 || asnNum > 4294967295) {
      setValidationError("Invalid ASN format. Must be positive integer or AS-prefixed number (e.g. 64496 or AS64496).");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    setSubmissionError(null);
    setLastOutcome(null);
    try {
      const res = await api.submitObservation({
        prefix: prefix.trim(),
        origin_asn: originAsn.trim(),
        collector: collector.trim(),
        scenario: scenario.trim() || undefined,
      });

      setLastOutcome(res);
      showNotification(
        `Observation processed: ${
          res.alerts_count > 0 ? `${res.alerts_count} anomaly alert(s) generated` : "Observation matches baseline policy"
        }`,
        res.alerts_count > 0 ? "error" : "success"
      );
      await fetchAllData();
    } catch (err: any) {
      setSubmissionError(err.message || "Failed to submit observation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1360px] w-full space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="pb-4 border-b border-divider">
        <h1 className="text-2xl sm:text-[28px] font-semibold text-text-main tracking-tight">
          Test Route Announcement
        </h1>
        <p className="text-sm text-text-sub mt-1">
          Submit an isolated BGP route observation to evaluate anomaly detection, explainability, and evidence generation.
        </p>
      </div>

      {/* Synthetic Isolation Disclosure Notice */}
      <div className="p-3.5 rounded-lg bg-bg-interactive border border-divider flex items-start gap-3 text-xs leading-relaxed text-text-sub">
        <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-text-main">Controlled Synthetic Testbed Disclosure (RFC 5737 / RFC 3849):</span>
          <p>
            Observations submitted through this form are evaluated strictly within your local HORA-Q detection engine and stored in the local SQLite audit ledger. Test announcements are NEVER broadcast to the global Internet or upstream transit peers.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="card-panel p-6 space-y-5">
        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-dim">Test Presets:</span>
          {presets.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setPrefix(item.prefix);
                setOriginAsn(item.asn);
                setScenario(item.scenario);
                setValidationError(null);
                setSubmissionError(null);
              }}
              className="px-2.5 py-1 rounded bg-bg-interactive hover:bg-bg-selected text-xs text-text-sub hover:text-brand-blue border border-divider transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Primary Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-sub">
              IP Prefix (CIDR format) <span className="text-status-critical">* Required</span>
            </label>
            <input
              type="text"
              required
              value={prefix}
              onChange={(e) => {
                setPrefix(e.target.value);
                setValidationError(null);
              }}
              placeholder="e.g. 192.0.2.0/24 or 2001:db8::/32"
              className="w-full px-3 py-2 rounded-md bg-bg-interactive border border-divider focus:border-brand-blue focus:bg-bg-card outline-none text-sm font-mono text-text-main transition-all"
            />
            <span className="text-[11px] text-text-dim block">Must be valid IPv4 or IPv6 CIDR prefix</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-sub">
              Origin Autonomous System Number <span className="text-status-critical">* Required</span>
            </label>
            <input
              type="text"
              required
              value={originAsn}
              onChange={(e) => {
                setOriginAsn(e.target.value);
                setValidationError(null);
              }}
              placeholder="e.g. AS64511 or 64511"
              className="w-full px-3 py-2 rounded-md bg-bg-interactive border border-divider focus:border-brand-blue focus:bg-bg-card outline-none text-sm font-mono text-text-main transition-all"
            />
            <span className="text-[11px] text-text-dim block">1-32 bit ASN integer or AS-prefixed string</span>
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-3 rounded-md bg-status-critical-bg border border-red-300 dark:border-red-900/40 text-status-critical text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Collapsible Advanced Parameters */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-medium text-brand-blue flex items-center gap-1 cursor-pointer hover:underline"
          >
            <span>{showAdvanced ? "Hide Advanced Provenance Fields" : "Show Advanced Provenance Fields (Optional)"}</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-divider">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-sub">
                  Collector Vantage Point (Optional)
                </label>
                <input
                  type="text"
                  value={collector}
                  onChange={(e) => setCollector(e.target.value)}
                  placeholder="e.g. rrc00"
                  className="w-full px-3 py-2 rounded-md bg-bg-interactive border border-divider focus:border-brand-blue focus:bg-bg-card outline-none text-sm font-mono text-text-main transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-sub">
                  Scenario Identifier Tag (Optional)
                </label>
                <input
                  type="text"
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="e.g. manual_test"
                  className="w-full px-3 py-2 rounded-md bg-bg-interactive border border-divider focus:border-brand-blue focus:bg-bg-card outline-none text-sm font-mono text-text-main transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submission Error Banner */}
        {submissionError && (
          <div className="p-3.5 rounded-md bg-status-critical-bg border border-red-300 dark:border-red-900/60 text-status-critical text-xs space-y-1">
            <div className="font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Observation Rejected by Backend:</span>
            </div>
            <p className="pl-6 leading-relaxed">{submissionError}</p>
            {overview?.demo_mode && (
              <p className="pl-6 text-[11px] text-text-dim pt-1">
                Tip: In Public Demo Mode, arbitrary custom prefix ingestion is restricted. Evaluators can test full detection using the presets above or through the Scenarios view.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={loading || !prefix.trim() || !originAsn.trim()}
            className="px-5 py-2.5 rounded-md bg-brand-blue hover:bg-blue-700 text-white font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Processing Test Observation..." : "Submit Test Observation"}</span>
          </button>
        </div>
      </form>

      {/* Outcome Feedback Panel */}
      {lastOutcome && (
        <div className="card-panel p-5 space-y-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-divider">
            <div className="flex items-center gap-2.5">
              {lastOutcome.alerts_count > 0 ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-status-critical-bg text-status-critical flex items-center justify-center border border-red-300 dark:border-red-900 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-main">
                      Routing Anomaly Detected ({lastOutcome.alerts_count} Alert Generated)
                    </h3>
                    <p className="text-xs text-text-sub mt-0.5">
                      Pipeline classified observation as anomalous against tracked route baselines.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-badge-green-bg text-status-green flex items-center justify-center border border-green-300 dark:border-green-900 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-main">
                      Observation Accepted & Consistent with Baseline
                    </h3>
                    <p className="text-xs text-text-sub mt-0.5">
                      Observation matches reference origin policy. No anomaly alerts generated.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {lastOutcome.alerts_count > 0 && lastOutcome.alerts && lastOutcome.alerts.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      const alertObj = lastOutcome.alerts[0];
                      setSelectedAlert(alertObj);
                      setActiveTab("alerts");
                    }}
                    className="px-3 py-1.5 rounded-md bg-brand-blue hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Inspect Alert</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {lastOutcome.alerts[0].evidence && (
                    <button
                      onClick={() => {
                        const evObj = lastOutcome.alerts[0].evidence;
                        setSelectedEvidence(evObj);
                      }}
                      className="px-3 py-1.5 rounded-md bg-bg-btn border border-border-card hover:bg-bg-interactive text-text-main text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-blue" />
                      <span>View Evidence</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Outcome Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
            <div className="p-2.5 rounded bg-bg-interactive border border-divider space-y-0.5">
              <span className="text-[10px] text-text-dim uppercase font-semibold">Prefix Tested</span>
              <div className="font-bold text-text-main">{lastOutcome.prefix}</div>
            </div>
            <div className="p-2.5 rounded bg-bg-interactive border border-divider space-y-0.5">
              <span className="text-[10px] text-text-dim uppercase font-semibold">Observed Origin</span>
              <div className="font-bold text-text-main">{lastOutcome.origin_asn}</div>
            </div>
            <div className="p-2.5 rounded bg-bg-interactive border border-divider space-y-0.5">
              <span className="text-[10px] text-text-dim uppercase font-semibold">Pipeline Decision</span>
              <div className={`font-bold ${lastOutcome.alerts_count > 0 ? "text-status-critical" : "text-status-green"}`}>
                {lastOutcome.status || "ACCEPTED"}
              </div>
            </div>
            <div className="p-2.5 rounded bg-bg-interactive border border-divider space-y-0.5">
              <span className="text-[10px] text-text-dim uppercase font-semibold">Cryptographic Digest</span>
              <div className="font-bold text-brand-blue truncate" title={lastOutcome.alerts?.[0]?.evidence?.hash || "None"}>
                {lastOutcome.alerts?.[0]?.evidence?.hash
                  ? `${lastOutcome.alerts[0].evidence.hash.substring(0, 10)}...`
                  : "None (Clean)"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
