import React, { useState } from "react";
import { Radio, AlertTriangle, CheckCircle2, Send, Plus } from "lucide-react";
import { api } from "../api";
import { useHoraqStore } from "../stores/useHoraqStore";

export const InjectRouteView: React.FC = () => {
  const { fetchAllData, showNotification } = useHoraqStore();

  const [prefix, setPrefix] = useState("");
  const [originAsn, setOriginAsn] = useState("");
  const [collector, setCollector] = useState("rrc00");
  const [scenario, setScenario] = useState("manual_test");
  const [loading, setLoading] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefix || !originAsn) return;

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
        `Route injected: ${res.alerts_count > 0 ? `${res.alerts_count} anomaly triggered!` : "Clean observation."}`,
        res.alerts_count > 0 ? "error" : "success"
      );
      await fetchAllData();
    } catch (err: any) {
      showNotification(err.message || "Failed to inject route", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-text-main tracking-tight">
            Manual Route Announcement Ingest
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-brand-blue border border-sky-500/20">
            Real-Time Engine Test
          </span>
        </div>
        <p className="text-xs text-text-sub mt-0.5">
          Simulate live BGP UPDATE messages to test real-time detection, origin conflict enforcement, and canonical evidence logging.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="card-panel p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-sub">
              Prefix (IPv4 / IPv6 CIDR)
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. 1.1.1.0/24 or 8.8.8.128/25"
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-card text-xs text-text-main font-mono focus:border-brand-blue outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-sub">
              Origin ASN
            </label>
            <input
              type="text"
              value={originAsn}
              onChange={(e) => setOriginAsn(e.target.value)}
              placeholder="e.g. AS99999 or 13335"
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-card text-xs text-text-main font-mono focus:border-brand-blue outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-sub">
              Collector Vantage Point
            </label>
            <input
              type="text"
              value={collector}
              onChange={(e) => setCollector(e.target.value)}
              placeholder="e.g. rrc00, rrc01"
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-card text-xs text-text-main font-mono focus:border-brand-blue outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-sub">
              Scenario / Test Tag
            </label>
            <input
              type="text"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="e.g. manual_test"
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-card text-xs text-text-main font-mono focus:border-brand-blue outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !prefix || !originAsn}
            className="px-4 py-2 rounded-lg bg-brand-blue text-slate-950 hover:bg-sky-400 text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? "Processing..." : "Ingest Announcement"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPrefix("1.1.1.0/24");
              setOriginAsn("AS99999");
              setCollector("rrc00");
              setScenario("simulated_hijack");
            }}
            className="px-3 py-2 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-medium text-text-sub hover:text-text-main transition-colors"
          >
            Load Rogue Origin Preset
          </button>
        </div>
      </form>

      {/* Outcome Banner */}
      {lastOutcome && (
        <div
          className={`card-panel p-5 space-y-3 ${
            lastOutcome.alerts_count > 0 ? "border-red-500/40" : "border-emerald-500/40"
          }`}
        >
          <div className="flex items-center gap-2">
            {lastOutcome.alerts_count > 0 ? (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
            <h3 className="text-sm font-bold text-text-main">
              {lastOutcome.alerts_count > 0
                ? `ANOMALY TRIGGERED: ${lastOutcome.alerts_count} incident(s) generated`
                : "Observation processed cleanly — No anomaly detected"}
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono text-text-sub">
            <div>Prefix: {lastOutcome.prefix}</div>
            <div>Origin ASN: {lastOutcome.origin_asn}</div>
            <div>Obs ID: #{lastOutcome.observation_id}</div>
            <div>Status: {lastOutcome.status}</div>
          </div>
        </div>
      )}
    </div>
  );
};
