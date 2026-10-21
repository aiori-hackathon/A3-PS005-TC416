import React, { useState } from "react";
import {
  Send,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Radio,
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-2 border-b border-border-card">
        <h1 className="text-xl sm:text-2xl font-semibold text-text-main tracking-tight">
          Test a route announcement
        </h1>
        <p className="text-xs sm:text-sm text-text-sub mt-1">
          Submits an application test observation to evaluate detection and does not alter real internet routing.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="card-panel p-5 space-y-4">
        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-dim">Test presets:</span>
          {presets.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setPrefix(item.prefix);
                setOriginAsn(item.asn);
                setScenario(item.scenario);
              }}
              className="px-2.5 py-1 rounded-md bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-medium text-text-sub hover:text-text-main transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Primary Inputs: Prefix and Origin ASN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-main">
              Prefix (IPv4 or IPv6 CIDR)
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. 192.0.2.0/24 or 192.0.2.128/25"
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-card text-xs text-text-main font-mono focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/30 outline-none transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-main">
              Origin ASN
            </label>
            <input
              type="text"
              value={originAsn}
              onChange={(e) => setOriginAsn(e.target.value)}
              placeholder="e.g. AS64511 or 64511"
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-card text-xs text-text-main font-mono focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/30 outline-none transition-all"
              required
            />
          </div>
        </div>

        {/* Advanced details toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-text-dim hover:text-text-main flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Advanced parameters</span>
            {showAdvanced ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-bg-app rounded-lg border border-border-card">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-sub">
                Collector vantage point
              </label>
              <input
                type="text"
                value={collector}
                onChange={(e) => setCollector(e.target.value)}
                placeholder="e.g. rrc00"
                className="w-full px-3 py-1.5 rounded-lg bg-bg-input border border-border-card text-xs text-text-main font-mono outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-sub">
                Scenario test tag
              </label>
              <input
                type="text"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="e.g. manual_test"
                className="w-full px-3 py-1.5 rounded-lg bg-bg-input border border-border-card text-xs text-text-main font-mono outline-none"
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={loading || !prefix.trim() || !originAsn.trim()}
            className="px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium text-xs transition-all active:scale-[0.98] shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? "Evaluating..." : "Submit test observation"}</span>
          </button>
        </div>
      </form>

      {/* Outcome Result Card */}
      {lastOutcome && (
        <div className="card-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-main">
              Evaluation Outcome
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                lastOutcome.alerts_count > 0
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-status-green-bg text-status-green border border-green-800/40"
              }`}
            >
              {lastOutcome.alerts_count > 0 ? "Anomaly detected" : "Normal observation"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 rounded-lg bg-bg-app border border-border-card">
              <div className="text-[11px] text-text-dim">Prefix Evaluated</div>
              <div className="font-mono text-text-main font-medium mt-0.5">{prefix}</div>
            </div>
            <div className="p-3 rounded-lg bg-bg-app border border-border-card">
              <div className="text-[11px] text-text-dim">Observed Origin ASN</div>
              <div className="font-mono text-text-main font-medium mt-0.5">{originAsn}</div>
            </div>
            <div className="p-3 rounded-lg bg-bg-app border border-border-card">
              <div className="text-[11px] text-text-dim">Alerts Generated</div>
              <div className="font-mono text-text-main font-medium mt-0.5">{lastOutcome.alerts_count}</div>
            </div>
          </div>

          {lastOutcome.alerts_count > 0 && (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-text-sub">
                A new alert has been recorded and sealed with cryptographic evidence.
              </span>
              <button
                onClick={() => setActiveTab("alerts")}
                className="text-xs text-brand-blue hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Review alert</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
