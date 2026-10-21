import React, { useState } from "react";
import { SendHorizontal, CheckCircle2, AlertTriangle, Info, RefreshCw } from "lucide-react";
import { api } from "../api";
import { useHoraqStore } from "../stores/useHoraqStore";

export const InjectRouteView: React.FC = () => {
  const { fetchAllData, showNotification } = useHoraqStore();

  const [prefix, setPrefix] = useState("");
  const [originAsn, setOriginAsn] = useState("");
  const [collector, setCollector] = useState("rrc00");
  const [scenario, setScenario] = useState("manual_test");
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    { label: "Legitimate Origin (Baseline match)", prefix: "192.0.2.0/24", asn: "64496" },
    { label: "Origin Hijack (Rogue ASN)", prefix: "192.0.2.0/24", asn: "64511" },
    { label: "Subprefix Anomaly (/25 under /24)", prefix: "192.0.2.128/25", asn: "64500" },
    { label: "IPv6 Subprefix (/48 under /32)", prefix: "2001:db8:1::/48", asn: "64505" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefix.trim() || !originAsn.trim()) {
      setError("Please specify both a CIDR prefix and an Origin ASN.");
      return;
    }

    setLoading(true);
    setOutcome(null);
    setError(null);
    try {
      const res = await api.submitObservation({
        prefix: prefix.trim(),
        origin_asn: originAsn.trim(),
        collector: collector.trim(),
        scenario: scenario.trim() || undefined,
      });

      setOutcome(res);
      showNotification(
        `Observation evaluated: ${res.alerts_count > 0 ? `${res.alerts_count} anomaly alert(s) triggered.` : "Route matches baseline."}`,
        res.alerts_count > 0 ? "error" : "success"
      );
      await fetchAllData();
    } catch (err: any) {
      setError(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : err.message || "Failed to process BGP observation."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="pb-2 border-b border-border-card">
        <h1 className="text-lg font-bold text-text-main tracking-tight">
          Manual route test & injection
        </h1>
        <p className="text-xs text-text-sub mt-0.5">
          Inject a single BGP announcement directly into the local normalization and anomaly detection pipeline.
        </p>
      </div>

      {/* Notice on Engine Scope */}
      <div className="p-3 rounded bg-bg-card border border-border-card text-xs text-text-sub flex items-start gap-2.5">
        <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>Testing Scope:</strong> Submitting this form tests how HORA-Q normalizes inputs, detects origin shifts or subprefixes, and produces RFC 8785 evidence records. It operates strictly in the local environment and does not alter external BGP routing tables.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="card-panel p-5 space-y-4">
        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-text-dim">Quick presets:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setPrefix(p.prefix);
                setOriginAsn(p.asn);
              }}
              className="px-2 py-1 rounded bg-bg-app border border-border-card hover:bg-bg-nav-hover text-[11px] text-text-sub hover:text-text-main transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-main">
              Prefix (IPv4 / IPv6 CIDR)
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. 192.0.2.0/24 or 2001:db8::/32"
              className="w-full px-3 py-2 rounded bg-bg-app border border-border-card text-xs text-text-main font-mono focus:border-brand-blue outline-none"
              required
            />
            <span className="text-[10px] text-text-dim block">
              Host bits will be automatically normalized to network boundary.
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-main">
              Origin ASN
            </label>
            <input
              type="text"
              value={originAsn}
              onChange={(e) => setOriginAsn(e.target.value)}
              placeholder="e.g. 64511 or AS64511"
              className="w-full px-3 py-2 rounded bg-bg-app border border-border-card text-xs text-text-main font-mono focus:border-brand-blue outline-none"
              required
            />
            <span className="text-[10px] text-text-dim block">
              Accepts integer or AS-prefixed string.
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-main">
              Collector Vantage Point
            </label>
            <input
              type="text"
              value={collector}
              onChange={(e) => setCollector(e.target.value)}
              placeholder="e.g. rrc00, rrc01, manual-test"
              className="w-full px-3 py-2 rounded bg-bg-app border border-border-card text-xs text-text-main font-mono focus:border-brand-blue outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-main">
              Scenario / Test Tag
            </label>
            <input
              type="text"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="e.g. manual_test, incident_investigation"
              className="w-full px-3 py-2 rounded bg-bg-app border border-border-card text-xs text-text-main font-mono focus:border-brand-blue outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded bg-status-red-bg border border-status-red text-status-red text-xs">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end pt-2 border-t border-border-item">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-brand-blue text-slate-950 hover:opacity-90 text-xs font-semibold flex items-center gap-1.5 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Processing..." : "Evaluate Route Announcement"}</span>
          </button>
        </div>
      </form>

      {/* Outcome Output Card */}
      {outcome && (
        <div className="card-panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {outcome.alerts_count > 0 ? (
                <AlertTriangle className="w-4 h-4 text-status-red" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-status-green" />
              )}
              <h2 className="text-xs font-bold text-text-main">
                {outcome.alerts_count > 0
                  ? `Anomaly Detected (${outcome.alerts_count} Alert Triggered)`
                  : "Normal Route (Observation Matches Baseline)"}
              </h2>
            </div>
            <span className="text-[11px] font-mono text-text-dim">
              Observation ID: #{outcome.observation_id}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-bg-app border border-border-card">
              <span className="text-[10px] text-text-dim block font-sans">Normalized Prefix</span>
              <span className="text-text-main">{outcome.normalized_prefix}</span>
            </div>
            <div className="p-2 rounded bg-bg-app border border-border-card">
              <span className="text-[10px] text-text-dim block font-sans">Normalized ASN</span>
              <span className="text-text-main">AS{outcome.normalized_origin_asn}</span>
            </div>
            <div className="p-2 rounded bg-bg-app border border-border-card">
              <span className="text-[10px] text-text-dim block font-sans">Baseline Status</span>
              <span className="text-text-sub">{outcome.baseline_status || "Evaluated"}</span>
            </div>
            <div className="p-2 rounded bg-bg-app border border-border-card">
              <span className="text-[10px] text-text-dim block font-sans">Evidence Generated</span>
              <span className="text-status-green">{outcome.alerts_count > 0 ? "Yes (RFC 8785)" : "N/A"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
