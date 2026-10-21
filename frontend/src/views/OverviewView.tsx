import React, { useState } from "react";
import {
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Database,
  Radio,
  FileText,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";
import { AlertItem } from "../types";

export const OverviewView: React.FC = () => {
  const {
    overview,
    alerts,
    routes,
    runScenarioAction,
    setActiveTab,
    setSelectedAlert,
    fetchAllData,
  } = useHoraqStore();

  const [isScanning, setIsScanning] = useState(false);
  const [runningScenario, setRunningScenario] = useState<string | null>(null);

  // Single Source of Truth Metrics directly reconciled with the store & backend
  const trackedPrefixes = overview?.tracked_routes || routes.length;
  const updatesEvaluated = overview?.total_observations || 0;
  const unreviewedAnomalies = alerts.filter((a) => a.status === "ACTIVE").length;
  const reviewedIncidents = alerts.filter((a) => a.status !== "ACTIVE").length;

  // Unreviewed anomalies prioritized for immediate operator action
  const pendingAnomalies = alerts
    .filter((a) => a.status === "ACTIVE")
    .slice(0, 5);

  const handleScanNow = async () => {
    setIsScanning(true);
    try {
      await fetchAllData();
    } finally {
      setIsScanning(false);
    }
  };

  const handleRunScenario = async (name: string) => {
    setRunningScenario(name);
    try {
      await runScenarioAction(name);
    } finally {
      setRunningScenario(null);
    }
  };

  const handleInspectAlert = (alert: AlertItem) => {
    setSelectedAlert(alert);
    setActiveTab("alerts");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Page Header & Explanatory Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-card">
        <div>
          <h1 className="text-lg font-bold text-text-main tracking-tight">
            Routing monitor
          </h1>
          <p className="text-xs text-text-sub mt-0.5">
            Real-time surveillance of BGP routing updates against reference origin baselines and covering prefix containment.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleScanNow}
            disabled={isScanning}
            className="px-3 py-1.5 rounded bg-bg-btn border border-border-card text-xs font-medium text-text-main hover:bg-bg-nav-hover hover:border-text-dim transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh latest telemetry from local database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-blue ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "Syncing..." : "Refresh state"}</span>
          </button>
        </div>
      </div>

      {/* 2. System Status & Single Source of Truth Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Tracked Baselines */}
        <div className="card-panel p-3.5 space-y-1">
          <div className="text-[11px] text-text-dim font-medium uppercase tracking-wider">
            Tracked baselines
          </div>
          <div className="text-xl font-bold text-text-main font-mono">
            {trackedPrefixes}
          </div>
          <div className="text-[11px] text-text-sub">
            Established origin references
          </div>
        </div>

        {/* Metric 2: Updates Evaluated */}
        <div className="card-panel p-3.5 space-y-1">
          <div className="text-[11px] text-text-dim font-medium uppercase tracking-wider">
            Updates evaluated
          </div>
          <div className="text-xl font-bold text-text-main font-mono">
            {updatesEvaluated}
          </div>
          <div className="text-[11px] text-text-sub">
            Normalized BGP announcements
          </div>
        </div>

        {/* Metric 3: Unreviewed Anomalies */}
        <div className="card-panel p-3.5 space-y-1">
          <div className="text-[11px] text-text-dim font-medium uppercase tracking-wider">
            Unreviewed anomalies
          </div>
          <div
            className={`text-xl font-bold font-mono ${
              unreviewedAnomalies > 0 ? "text-status-red" : "text-status-green"
            }`}
          >
            {unreviewedAnomalies}
          </div>
          <div className="text-[11px] text-text-sub">
            {unreviewedAnomalies > 0 ? "Awaiting operator decision" : "All routes within policy"}
          </div>
        </div>

        {/* Metric 4: Reviewed Decisions */}
        <div className="card-panel p-3.5 space-y-1">
          <div className="text-[11px] text-text-dim font-medium uppercase tracking-wider">
            Reviewed decisions
          </div>
          <div className="text-xl font-bold text-text-main font-mono">
            {reviewedIncidents}
          </div>
          <div className="text-[11px] text-text-sub">
            Acknowledged or resolved
          </div>
        </div>
      </div>

      {/* 3. Ingestion & Environment Status Bar */}
      <div className="p-3 rounded bg-bg-card border border-border-card text-xs text-text-sub flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-brand-blue" />
            <span>Feed: <strong className="text-text-main font-medium">Evaluation Replay (Offline)</strong></span>
          </div>
          <span className="text-border-card">•</span>
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-text-dim" />
            <span>Storage: <strong className="text-text-main font-medium">SQLite WAL Mode</strong></span>
          </div>
          <span className="text-border-card">•</span>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-status-green" />
            <span>Digest: <strong className="text-text-main font-medium">RFC 8785 Canonical SHA-256</strong></span>
          </div>
        </div>
        <div className="text-[11px] text-text-dim">
          Zero baseline auto-poisoning enforced
        </div>
      </div>

      {/* 4. Priority Investigation Section: Unreviewed Routing Anomalies */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-main">
              Unreviewed routing anomalies
            </h2>
            {unreviewedAnomalies > 0 && (
              <span className="px-2 py-0.2 rounded text-[11px] font-semibold bg-status-red-bg text-status-red border border-status-red">
                {unreviewedAnomalies} pending
              </span>
            )}
          </div>
          <button
            onClick={() => setActiveTab("alerts")}
            className="text-xs text-brand-blue hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>View full alerts ledger ({alerts.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="card-panel overflow-hidden">
          {pendingAnomalies.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <CheckCircle2 className="w-7 h-7 text-status-green mx-auto" />
              <div className="text-xs font-semibold text-text-main">
                No unreviewed routing anomalies
              </div>
              <p className="text-xs text-text-sub max-w-md mx-auto">
                All observed announcements match established reference baselines. Use the scenario controls below to test detection response.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-item">
              {pendingAnomalies.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 hover:bg-bg-hover-row transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-status-red-bg text-status-red border border-status-red">
                        {alert.severity}
                      </span>
                      <span className="font-semibold text-text-main">
                        {alert.kind === "ORIGIN_CHANGE"
                          ? "Origin ASN Conflict"
                          : "Subprefix Containment Anomaly"}
                      </span>
                      <span className="font-mono text-text-main bg-bg-app px-1.5 py-0.2 rounded border border-border-card">
                        {alert.prefix}
                      </span>
                    </div>

                    <div className="text-text-sub flex items-center gap-3 text-[11px] flex-wrap">
                      <span>
                        Observed: <strong className="font-mono text-status-red">{alert.observed_asn}</strong>
                      </span>
                      {alert.baseline_asn && (
                        <span>
                          Expected: <strong className="font-mono text-status-green">{alert.baseline_asn}</strong>
                        </span>
                      )}
                      <span className="text-text-dim">
                        {alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : "Recent"}
                      </span>
                    </div>

                    <p className="text-[11px] text-text-sub leading-relaxed line-clamp-1">
                      {alert.explanation || alert.title}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => handleInspectAlert(alert)}
                      className="px-3 py-1.5 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover hover:border-text-dim text-xs font-medium text-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Investigate</span>
                      <ArrowRight className="w-3 h-3 text-brand-blue" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Demonstration & Evaluation Lab (Explicitly labeled as Synthetic) */}
      <div className="card-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-text-main flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-blue" />
              <span>Demonstration & Evaluation Lab (Isolated Synthetic Events)</span>
            </div>
            <p className="text-[11px] text-text-sub mt-0.5">
              Inject synthetic BGP announcements into the local engine to verify detection logic and evidence generation. These do not affect external routing.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("scenarios")}
            className="text-[11px] text-brand-blue hover:underline cursor-pointer"
          >
            All 5 scenarios
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Scenario 1 */}
          <button
            onClick={() => handleRunScenario("baseline")}
            disabled={runningScenario !== null}
            className="p-3 rounded bg-bg-app hover:bg-bg-nav-hover border border-border-card text-left transition-colors cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-text-main">
              <span>1. Normal Route</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-status-green-bg text-status-green border border-status-green">
                0 Alerts
              </span>
            </div>
            <p className="text-[11px] text-text-sub mt-1 leading-relaxed">
              Seeds baseline: <code className="font-mono text-text-main">192.0.2.0/24</code> from authorized <code className="font-mono text-text-main">AS64496</code>.
            </p>
          </button>

          {/* Scenario 2 */}
          <button
            onClick={() => handleRunScenario("origin-change")}
            disabled={runningScenario !== null}
            className="p-3 rounded bg-bg-app hover:bg-bg-nav-hover border border-border-card text-left transition-colors cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-text-main">
              <span>2. Origin Conflict</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-status-red-bg text-status-red border border-status-red">
                1 Alert
              </span>
            </div>
            <p className="text-[11px] text-text-sub mt-1 leading-relaxed">
              Rogue <code className="font-mono text-text-main">AS64511</code> claims prefix. Preserves reference baseline.
            </p>
          </button>

          {/* Scenario 3 */}
          <button
            onClick={() => handleRunScenario("subprefix")}
            disabled={runningScenario !== null}
            className="p-3 rounded bg-bg-app hover:bg-bg-nav-hover border border-border-card text-left transition-colors cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-text-main">
              <span>3. Subprefix LPM Hijack</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-status-amber-bg text-status-amber border border-status-amber">
                1 Alert
              </span>
            </div>
            <p className="text-[11px] text-text-sub mt-1 leading-relaxed">
              Carves <code className="font-mono text-text-main">/25</code> subnet under <code className="font-mono text-text-main">/24</code>. Exploits longest-match rule.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
