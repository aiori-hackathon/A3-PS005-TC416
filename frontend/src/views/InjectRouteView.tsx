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
} from "lucide-react";
import { api } from "../api";
import { useHoraqStore } from "../stores/useHoraqStore";

export const InjectRouteView: React.FC = () => {
  const { fetchAllData, showNotification, setActiveTab } = useHoraqStore();

  const [prefix, setPrefix] = useState("");
  const [originAsn, setOriginAsn] = useState("");
  const [collector, setCollector] = useState("rrc00");
  const [scenario, setScenario] = useState("manual_test");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<any>(null);

  const presets = [
    {
      label: "Origin Conflict Test",
      prefix: "192.0.2.0/24",
      asn: "AS64511",
      scenario: "origin_conflict_test",
    },
    {
      label: "Subprefix Hijack Test",
      prefix: "192.0.2.128/25",
      asn: "AS64500",
      scenario: "subprefix_hijack_test",
    },
    {
      label: "Normal Route Update",
      prefix: "192.0.2.0/24",
      asn: "AS64496",
      scenario: "normal_route_test",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefix.trim() || !originAsn.trim()) return;

    setLoading(true);
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
        `Test observation processed: ${
          res.alerts_count > 0 ? `${res.alerts_count} anomaly flagged` : "Consistent with baseline"
        }`,
        res.alerts_count > 0 ? "error" : "success"
      );
      await fetchAllData();
    } catch (err: any) {
      showNotification(err.message || "Failed to submit observation", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1360px] w-full space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-4 border-b border-divider">
        <h1 className="text-2xl sm:text-[28px] font-semibold text-text-main tracking-tight">
          Test Route Announcement
        </h1>
        <p className="text-sm text-text-sub mt-1">
          Submits an application test observation to evaluate detection and does not alter real internet routing.
        </p>
      </div>

      {/* Notice Banner */}
      <div className="p-3.5 rounded-lg bg-bg-interactive border border-divider flex items-center gap-2.5 text-xs text-text-sub">
        <Info className="w-4 h-4 text-brand-blue shrink-0" />
        <span>
          Observations submitted here are ingested by the internal detection pipeline, matched against route baselines, and recorded in the cryptographic audit ledger.
        </span>
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
              IP Prefix (CIDR format) *
            </label>
            <input
              type="text"
              required
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. 192.0.2.0/24"
              className="w-full px-3 py-2 rounded-md bg-bg-interactive border border-divider focus:border-brand-blue focus:bg-bg-card outline-none text-sm font-mono text-text-main transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-sub">
              Origin Autonomous System Number *
            </label>
            <input
              type="text"
              required
              value={originAsn}
              onChange={(e) => setOriginAsn(e.target.value)}
              placeholder="e.g. AS64511"
              className="w-full px-3 py-2 rounded-md bg-bg-interactive border border-divider focus:border-brand-blue focus:bg-bg-card outline-none text-sm font-mono text-text-main transition-all"
            />
          </div>
        </div>

        {/* Collapsible Advanced Parameters */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-medium text-brand-blue flex items-center gap-1 cursor-pointer hover:underline"
          >
            <span>{showAdvanced ? "Hide Advanced Parameters" : "Show Advanced Parameters"}</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-divider">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-sub">
                  Collector Vantage Point
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
                  Scenario Tag
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

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={loading || !prefix.trim() || !originAsn.trim()}
            className="px-5 py-2 rounded-md bg-brand-blue hover:bg-blue-700 text-white font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Processing Test Observation..." : "Submit Test Observation"}</span>
          </button>
        </div>
      </form>

      {/* Outcome Feedback */}
      {lastOutcome && (
        <div className="card-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-main flex items-center gap-2">
              {lastOutcome.alerts_count > 0 ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-status-critical" />
                  <span>Pipeline Anomaly Flagged ({lastOutcome.alerts_count})</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-status-green" />
                  <span>Observation Conforms to Baseline</span>
                </>
              )}
            </h3>

            {lastOutcome.alerts_count > 0 && (
              <button
                onClick={() => setActiveTab("alerts")}
                className="text-xs text-brand-blue hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>Inspect in Alerts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
            <div className="p-2.5 rounded bg-bg-interactive border border-divider">
              <span className="text-[10px] text-text-dim uppercase">Prefix</span>
              <div className="font-bold text-text-main">{lastOutcome.prefix}</div>
            </div>
            <div className="p-2.5 rounded bg-bg-interactive border border-divider">
              <span className="text-[10px] text-text-dim uppercase">Origin ASN</span>
              <div className="font-bold text-text-main">{lastOutcome.origin_asn}</div>
            </div>
            <div className="p-2.5 rounded bg-bg-interactive border border-divider">
              <span className="text-[10px] text-text-dim uppercase">Alerts Flagged</span>
              <div className={`font-bold ${lastOutcome.alerts_count > 0 ? "text-status-critical" : "text-status-green"}`}>
                {lastOutcome.alerts_count}
              </div>
            </div>
            <div className="p-2.5 rounded bg-bg-interactive border border-divider">
              <span className="text-[10px] text-text-dim uppercase">Digest Generated</span>
              <div className="font-bold text-brand-blue truncate" title={lastOutcome.record_hash}>
                {lastOutcome.record_hash ? `${lastOutcome.record_hash.substring(0, 10)}...` : "None"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
