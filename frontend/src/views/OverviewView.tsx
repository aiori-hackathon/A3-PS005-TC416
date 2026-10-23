import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Globe,
  Radio,
  Sparkles,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";

export const OverviewView: React.FC = () => {
  const {
    overview,
    alerts,
    routes,
    setActiveTab,
    setSelectedAlert,
  } = useHoraqStore();

  const activeAlerts = alerts.filter((a) => a.status === "ACTIVE");
  const topAlert = activeAlerts[0] || null;

  const prefixesTracked = overview?.tracked_routes || routes.length || 0;
  const updatesEvaluated = (overview?.total_observations || 0) + alerts.length;
  const connectedPeers = "3 Tier-1";

  // Recent 5 alerts for activity
  const recentActivity = alerts.slice(0, 5);

  const getAlertHeadline = (alert: typeof topAlert) => {
    if (!alert) return "No active routing anomalies";
    if (alert.kind === "ORIGIN_CHANGE") {
      return "Origin conflict requires review";
    }
    if (alert.kind === "SUBPREFIX_ANOMALY") {
      return "Subprefix anomaly requires review";
    }
    return alert.title || "Routing anomaly requires review";
  };

  const getAlertDescription = (alert: typeof topAlert) => {
    if (!alert) return "All monitored prefixes match established routing baselines.";
    if (alert.kind === "ORIGIN_CHANGE") {
      return `Prefix ${alert.prefix} was observed with origin ${alert.observed_asn}, while the stored baseline is ${alert.baseline_asn || "unknown"}.`;
    }
    if (alert.kind === "SUBPREFIX_ANOMALY") {
      return `More-specific prefix ${alert.prefix} announced by ${alert.observed_asn} overlaps baseline route ${alert.parent_prefix || "parent prefix"}.`;
    }
    return alert.explanation || alert.title;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-card">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">
            Routing overview
          </h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1 max-w-xl leading-relaxed">
            HORA-Q monitors BGP announcements for origin conflicts and unexpected more-specific routes.
          </p>
        </div>

        {/* Apple-style Feed Status Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-card border border-border-card text-xs text-text-sub shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-status-green animate-pulse" />
            <span className="font-medium text-text-main">Monitoring active</span>
            <span className="text-text-dim">•</span>
            <span className="text-text-dim text-[11px]">Evaluation Replay</span>
          </div>
        </div>
      </div>

      {/* Primary Alert Callout (Apple Card / Google Surface) */}
      {topAlert ? (
        <div className="p-5 sm:p-6 rounded-2xl bg-red-500/[0.08] border border-red-500/20 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/25">
                  <AlertTriangle className="w-3 h-3" />
                  {topAlert.severity || "HIGH"}
                </span>
                <span className="text-xs text-text-dim font-mono">
                  {topAlert.created_at
                    ? new Date(topAlert.created_at).toLocaleTimeString()
                    : "Recent observation"}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
                {getAlertHeadline(topAlert)}
              </h2>

              <p className="text-xs sm:text-sm text-text-sub max-w-2xl leading-relaxed font-mono">
                {getAlertDescription(topAlert)}
              </p>

              {activeAlerts.length > 1 && (
                <p className="text-xs text-text-dim pt-1 font-medium">
                  + {activeAlerts.length - 1} other active anomaly requiring review
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0 pt-1 sm:pt-0">
              <button
                onClick={() => {
                  setSelectedAlert(topAlert);
                  setActiveTab("alerts");
                }}
                className="px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium text-xs transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>Review alert</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 sm:p-6 rounded-2xl bg-status-green-bg/20 border border-green-500/20 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-status-green-bg border border-green-500/30 text-status-green flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-semibold text-text-main">
              No active routing anomalies
            </h2>
            <p className="text-xs text-text-sub leading-relaxed">
              All monitored prefixes match established routing baselines. Zero uncoordinated origin conflicts detected.
            </p>
          </div>
        </div>
      )}

      {/* Four Clean Metric Widgets (Apple Widget / Google Metric Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="card-panel p-4 space-y-1">
          <div className="text-xs font-medium text-text-sub">Active anomalies</div>
          <div
            className={`text-2xl sm:text-3xl font-bold tracking-tight ${
              activeAlerts.length > 0 ? "text-[#ff453a]" : "text-text-main"
            }`}
          >
            {activeAlerts.length}
          </div>
        </div>

        <div className="card-panel p-4 space-y-1">
          <div className="text-xs font-medium text-text-sub">Prefixes tracked</div>
          <div className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">
            {prefixesTracked}
          </div>
        </div>

        <div className="card-panel p-4 space-y-1">
          <div className="text-xs font-medium text-text-sub">BGP updates evaluated</div>
          <div className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">
            {updatesEvaluated}
          </div>
        </div>

        <div className="card-panel p-4 space-y-1">
          <div className="text-xs font-medium text-text-sub">Connected peers</div>
          <div className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">
            {connectedPeers}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-main">Recent activity</h2>
          {recentActivity.length > 0 && (
            <button
              onClick={() => setActiveTab("alerts")}
              className="text-xs text-brand-blue hover:underline transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>View all alerts</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="card-panel overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden sm:grid grid-cols-12 text-[11px] text-text-dim font-semibold uppercase tracking-wider px-4 py-3 border-b border-border-card">
            <span className="col-span-2">Time</span>
            <span className="col-span-3">Prefix</span>
            <span className="col-span-2">Observed Origin</span>
            <span className="col-span-3">Explanation</span>
            <span className="col-span-2 text-right">Status</span>
          </div>

          <div className="hidden sm:block divide-y divide-border-item">
            {recentActivity.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-text-sub">
                No recent security incidents recorded — continuous baseline monitoring active.
              </div>
            ) : (
              recentActivity.map((evt) => {
                const isBlock = evt.severity === "HIGH" || evt.status === "ACTIVE";
                const isReview = evt.status === "ACKNOWLEDGED";
                const timeStr = evt.created_at
                  ? new Date(evt.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "Just now";

                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setSelectedAlert(evt);
                      setActiveTab("alerts");
                    }}
                    className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-bg-hover-row transition-colors duration-150 cursor-pointer"
                  >
                    <span className="col-span-2 text-text-sub font-mono text-[11px]">
                      {timeStr}
                    </span>
                    <span className="col-span-3 font-mono text-[11px] font-semibold text-text-main">
                      {evt.prefix}
                    </span>
                    <span className="col-span-2 font-mono text-[11px] font-medium text-brand-blue">
                      {evt.observed_asn}
                    </span>
                    <span
                      className="col-span-3 text-text-sub text-xs truncate pr-2"
                      title={evt.explanation || evt.title}
                    >
                      {evt.explanation || evt.title}
                    </span>
                    <div className="col-span-2 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                          isBlock
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : isReview
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-status-green-bg text-status-green border border-green-500/20"
                        }`}
                      >
                        {evt.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Mobile Stacked Card View */}
          <div className="sm:hidden divide-y divide-border-item">
            {recentActivity.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-text-sub">
                No recent security incidents recorded — continuous baseline monitoring active.
              </div>
            ) : (
              recentActivity.map((evt) => {
                const isBlock = evt.severity === "HIGH" || evt.status === "ACTIVE";
                const isReview = evt.status === "ACKNOWLEDGED";
                const timeStr = evt.created_at
                  ? new Date(evt.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Just now";

                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setSelectedAlert(evt);
                      setActiveTab("alerts");
                    }}
                    className="p-3.5 space-y-1.5 hover:bg-bg-hover-row transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-text-main">
                        {evt.prefix}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          isBlock
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : isReview
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-status-green-bg text-status-green border border-green-500/20"
                        }`}
                      >
                        {evt.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-text-dim font-mono">
                      <span>Origin: {evt.observed_asn}</span>
                      <span>•</span>
                      <span>{timeStr}</span>
                    </div>
                    <p className="text-xs text-text-sub leading-relaxed line-clamp-2">
                      {evt.explanation || evt.title}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Demonstration Shortcut */}
      <div className="card-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-brand-blue shrink-0" />
          <span className="text-text-sub">
            Testing detection capabilities? Run the automated test suite in{" "}
            <span className="font-medium text-text-main">Scenarios</span>.
          </span>
        </div>
        <button
          onClick={() => setActiveTab("scenarios")}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-medium text-text-main transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>Explore scenarios</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
