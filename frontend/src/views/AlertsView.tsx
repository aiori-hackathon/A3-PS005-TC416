import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Check,
  Lock,
  ChevronDown,
  ChevronUp,
  SearchCheck,
  Ban,
  Layers,
  History,
  ShieldCheck,
  RotateCcw,
  Copy,
  Terminal,
  Shield,
  ExternalLink,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";
import { AlertItem } from "../types";
import { groupAlertObservations, GroupedIncident } from "../utils/incidentGrouping";
import { formatCount } from "../utils/format";
import { ForensicIncidentDrawer } from "../components/ForensicIncidentDrawer";
import { PeerWithdrawalMatrix } from "../components/PeerWithdrawalMatrix";

export const AlertsView: React.FC = () => {
  const {
    alerts,
    updateAlertStatus,
    dismissAllAlerts,
    setSelectedAlert,
    setRpkiTarget,
    searchQuery,
    setActiveTab,
    submitWithdrawalAction,
    fetchAllData,
  } = useHoraqStore();

  const [statusFilter, setStatusFilter] = useState<"active" | "acknowledged" | "resolved" | "all">("active");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [forensicAlert, setForensicAlert] = useState<AlertItem | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const modalParam = new URLSearchParams(window.location.search).get("modal");
      if (modalParam === "investigate" && alerts.length > 0) {
        setForensicAlert(alerts[0]);
      }
    }
  }, [alerts]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allIncidents = groupAlertObservations(alerts);
  const activeIncidents = allIncidents.filter((inc) => inc.status === "ACTIVE");
  const acknowledgedIncidents = allIncidents.filter((inc) => inc.status === "ACKNOWLEDGED");
  const resolvedIncidents = allIncidents.filter((inc) => inc.status === "RESOLVED");

  const activeIncidentsCount = activeIncidents.length;
  const acknowledgedCount = acknowledgedIncidents.length;
  const resolvedCount = resolvedIncidents.length;

  const filteredIncidents = allIncidents.filter((inc) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        inc.prefix.toLowerCase().includes(q) ||
        inc.observed_asn.toLowerCase().includes(q) ||
        (inc.baseline_asn && inc.baseline_asn.toLowerCase().includes(q)) ||
        inc.title.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter === "active") return inc.status === "ACTIVE";
    if (statusFilter === "acknowledged") return inc.status === "ACKNOWLEDGED";
    if (statusFilter === "resolved") return inc.status === "RESOLVED";
    return true; // "all"
  });

  const handleAcknowledge = (event: AlertItem) => {
    updateAlertStatus(event.id, "ACKNOWLEDGED");
    setActionNotice(`Incident status updated to ACKNOWLEDGED for ${event.prefix}.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleResolve = (event: AlertItem) => {
    updateAlertStatus(event.id, "RESOLVED");
    setActionNotice(`Incident status updated to RESOLVED for ${event.prefix}.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleWithdrawal = async (inc: GroupedIncident) => {
    const rawPeers = inc.primaryAlert.active_peers || [];
    const peer = rawPeers.length > 0 ? rawPeers[0] : inc.observed_asn;
    try {
      await submitWithdrawalAction({
        prefix: inc.prefix,
        peer_as: peer,
        scenario: "operator-withdrawal",
      });
      setActionNotice(`BGP route withdrawal ingested for ${inc.prefix} (Peer: ${peer}). Anomaly resolved.`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      setActionNotice(`Withdrawal failed: ${err.message}`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleCheckRpki = (event: AlertItem) => {
    setRpkiTarget({ prefix: event.prefix, asn: event.observed_asn });
    setActiveTab("rpki");
  };

  return (
    <div className="max-w-[1360px] w-full space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-divider">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[28px] font-semibold text-text-main tracking-tight">
              Security Alerts & Incidents
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                activeIncidentsCount > 0
                  ? "bg-status-critical-bg text-status-critical border-red-300 dark:border-red-900"
                  : "bg-badge-green-bg text-status-green border-green-300 dark:border-green-900"
              }`}
            >
              {activeIncidentsCount} {activeIncidentsCount === 1 ? "Active Incident" : "Active Incidents"}
            </span>
          </div>
          <p className="text-sm text-text-sub mt-1">
            Grouped routing anomaly incidents, policy conflicts, and origin observations with cryptographic attestations.
          </p>
        </div>

        {activeIncidentsCount > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => dismissAllAlerts()}
              className="px-3.5 py-1.5 rounded-md bg-bg-btn border border-border-card hover:bg-bg-interactive text-text-sub hover:text-text-main text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-status-green" />
              <span>Acknowledge All Active</span>
            </button>
          </div>
        )}
      </div>

      {actionNotice && (
        <div className="bg-badge-green-bg border border-green-300 dark:border-green-900 text-status-green px-4 py-2.5 rounded-md text-xs font-medium flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Segmented Filter Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-md border border-border-card bg-bg-card p-0.5 text-xs">
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "active"
                ? "bg-bg-selected text-status-critical font-semibold"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            Active ({activeIncidentsCount})
          </button>
          <button
            onClick={() => setStatusFilter("acknowledged")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "acknowledged"
                ? "bg-bg-selected text-status-warning font-semibold"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            Acknowledged ({acknowledgedCount})
          </button>
          <button
            onClick={() => setStatusFilter("resolved")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "resolved"
                ? "bg-bg-selected text-status-green font-semibold"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            Resolved ({resolvedCount})
          </button>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "all"
                ? "bg-bg-selected text-brand-blue font-semibold"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            All Incidents ({allIncidents.length})
          </button>
        </div>

        <div className="text-xs text-text-dim">
          {statusFilter === "active" && (
            <span>Showing active routing anomalies requiring operator attention.</span>
          )}
          {statusFilter === "acknowledged" && (
            <span>Showing operator-acknowledged incidents under investigation.</span>
          )}
          {statusFilter === "resolved" && (
            <span>Showing remediated incidents verified via BGP route withdrawal or manual resolution.</span>
          )}
          {statusFilter === "all" && (
            <span>Showing complete immutable audit trail ({formatCount(alerts.length, "observation", "observations")} recorded).</span>
          )}
        </div>
      </div>

      {/* Incident List / Table */}
      {filteredIncidents.length === 0 ? (
        <div className="card-panel p-10 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-status-green mx-auto" />
          <h2 className="text-sm font-semibold text-text-main">
            {statusFilter === "active"
              ? "Zero Active Anomalies"
              : statusFilter === "acknowledged"
              ? "Zero Acknowledged Anomalies"
              : statusFilter === "resolved"
              ? "Zero Resolved Anomalies"
              : "No Anomalies Recorded"}
          </h2>
          <p className="text-xs text-text-sub max-w-sm mx-auto">
            {statusFilter === "active"
              ? resolvedCount > 0
                ? `All detected anomalies have been resolved (${resolvedCount} resolved incident${resolvedCount > 1 ? "s" : ""} available under Resolved / All filter). Monitored prefixes currently conform to baseline policies.`
                : "No active routing conflicts require operator attention. Monitored prefixes conform to baseline policies."
              : statusFilter === "resolved"
              ? "No incidents have been resolved yet. When a route is withdrawn or resolved by an operator, it remains visible here."
              : statusFilter === "acknowledged"
              ? "No incidents are currently in the acknowledged state."
              : "No routing anomalies match your search filter."}
          </p>
        </div>
      ) : (
        <div className="card-panel overflow-hidden divide-y divide-divider">
          {filteredIncidents.map((inc) => {
            const isExpanded = expandedIds.has(inc.id);
            const isHigh = inc.severity === "HIGH";
            const isActive = inc.status === "ACTIVE";
            const isAck = inc.status === "ACKNOWLEDGED";

            return (
              <div key={inc.id} className="transition-colors hover:bg-bg-hover-row">
                {/* Main Incident Row */}
                <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider shrink-0 mt-0.5 ${
                        isHigh
                          ? "bg-status-critical-bg text-status-critical border border-red-200 dark:border-red-900/40"
                          : "bg-badge-amber-bg text-status-warning border border-amber-200 dark:border-amber-900/40"
                      }`}
                    >
                      {inc.severity}
                    </span>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-text-main">
                          {inc.title}
                        </span>
                        <span className="font-mono text-xs font-bold text-text-main px-2 py-0.5 rounded bg-bg-interactive border border-divider">
                          {inc.prefix}
                        </span>
                        {inc.occurrenceCount > 1 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-bg-interactive text-text-sub border border-divider">
                            <Layers className="w-3 h-3 text-brand-blue" />
                            {formatCount(inc.occurrenceCount, "observation")}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-text-sub flex items-center gap-2.5 flex-wrap">
                        <span>
                          Observed Origin: <span className="font-mono text-status-critical font-bold">{inc.observed_asn}</span>
                        </span>
                        {inc.baseline_asn && (
                          <>
                            <span>•</span>
                            <span>
                              Baseline Origin: <span className="font-mono text-text-main font-semibold">{inc.baseline_asn}</span>
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-text-dim font-mono">
                          Last seen: {inc.lastSeen
                            ? new Date(inc.lastSeen).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : "Just now"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                        isActive
                          ? "bg-status-critical-bg text-status-critical border border-red-300 dark:border-red-900"
                          : isAck
                          ? "bg-bg-interactive text-text-sub border border-divider"
                          : "bg-badge-green-bg text-status-green border border-green-300 dark:border-green-900"
                      }`}
                    >
                      {inc.status}
                    </span>

                    {isActive && (
                      <>
                        <button
                          onClick={() => handleWithdrawal(inc)}
                          className="px-3 py-1.5 rounded-md bg-brand-blue/10 border border-brand-blue/30 hover:bg-brand-blue/20 text-xs font-semibold text-brand-blue transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Ingest route withdrawal to demonstrate recovery"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Ingest Withdrawal</span>
                        </button>
                        <button
                          onClick={() => handleAcknowledge(inc.primaryAlert)}
                          className="px-3 py-1.5 rounded-md bg-bg-btn border border-border-card hover:bg-bg-interactive text-xs font-medium text-text-main transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Acknowledge this incident"
                        >
                          <Check className="w-3.5 h-3.5 text-status-green" />
                          <span>Acknowledge</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setForensicAlert(inc.primaryAlert)}
                      className="px-3 py-1.5 rounded-md bg-brand-blue/10 border border-brand-blue/30 hover:bg-brand-blue/20 text-xs font-semibold text-brand-blue transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Open Forensic Incident Investigation Drawer"
                    >
                      <Shield className="w-3.5 h-3.5 text-brand-blue" />
                      <span>Investigate</span>
                    </button>

                    <button
                      onClick={() => setSelectedAlert(inc.primaryAlert)}
                      className="px-3 py-1.5 rounded-md bg-bg-btn border border-border-card hover:bg-bg-interactive text-xs font-medium text-text-main transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Inspect Cryptographic Evidence"
                    >
                      <Lock className="w-3.5 h-3.5 text-brand-blue" />
                      <span>Evidence</span>
                    </button>

                    <button
                      onClick={() => toggleExpand(inc.id)}
                      className="p-1.5 rounded-md text-text-dim hover:text-text-main hover:bg-bg-interactive transition-colors cursor-pointer"
                      title={isExpanded ? "Collapse details" : "Expand details"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Forensic Investigation Workspace */}
                {isExpanded && (
                  <div className="px-5 py-4 bg-bg-app border-t border-divider space-y-4 text-xs">
                    {/* Header: IDs & Provenance */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-divider">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-text-main">
                          Incident ID: <span className="text-brand-blue">{inc.primaryAlert.id}</span>
                        </span>
                        <span className="text-text-dim">•</span>
                        <span className="text-text-dim font-mono">
                          Rule: {inc.primaryAlert.kind}
                        </span>
                        <span className="text-text-dim">•</span>
                        <span className="text-text-dim font-mono">
                          Vantage Point: {inc.primaryAlert.collector || "rrc00"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-bg-interactive text-text-sub border border-divider">
                          {inc.primaryAlert.scenario ? `TESTBED: ${inc.primaryAlert.scenario.toUpperCase()}` : "TELEMETRY"}
                        </span>
                      </div>
                    </div>

                    {/* Baseline Delta: Side-by-Side Comparison */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-text-dim font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Baseline Delta & Routing Impact</span>
                        <span className="text-text-sub font-normal">Deterministic comparison against trusted route baseline</span>
                      </div>
                      <div className="overflow-x-auto rounded-md border border-divider bg-bg-card">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="bg-bg-interactive/60 border-b border-divider text-[10px] text-text-dim uppercase tracking-wider">
                              <th className="py-2 px-3 font-semibold">Routing Parameter</th>
                              <th className="py-2 px-3 font-semibold">Authorized Baseline</th>
                              <th className="py-2 px-3 font-semibold">Observed Rogue State</th>
                              <th className="py-2 px-3 font-semibold">Operational Analysis</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-divider">
                            <tr>
                              <td className="py-2 px-3 font-medium text-text-sub">Origin AS</td>
                              <td className="py-2 px-3 font-bold text-status-green">
                                {inc.baseline_asn || "Not Registered"}
                              </td>
                              <td className="py-2 px-3 font-bold text-status-critical">
                                {inc.observed_asn}
                              </td>
                              <td className="py-2 px-3 text-text-sub font-sans text-[11px]">
                                {inc.baseline_asn && inc.baseline_asn !== inc.observed_asn
                                  ? `Unauthorized autonomous system announcing reachability without delegation.`
                                  : `Route announced by unauthorized entity.`}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-medium text-text-sub">Prefix Scope</td>
                              <td className="py-2 px-3 font-bold text-text-main">
                                {inc.parent_prefix || inc.prefix}
                              </td>
                              <td className="py-2 px-3 font-bold text-amber-500">
                                {inc.prefix}
                              </td>
                              <td className="py-2 px-3 text-text-sub font-sans text-[11px]">
                                {inc.parent_prefix && inc.parent_prefix !== inc.prefix
                                  ? `More-specific announcement triggers Longest Prefix Match (LPM) traffic interception.`
                                  : `Direct prefix conflict against tracked routing policy.`}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Operational Hypotheses Dossier (Proposal Page 2 & 5) */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-text-dim font-bold uppercase tracking-wider">
                        Alternative Operational Hypotheses
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div className="p-2.5 rounded bg-bg-card border border-red-500/30 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-status-critical text-[11px]">Malicious Hijack</span>
                            <span className="text-[10px] font-bold text-red-500 px-1.5 py-0.2 rounded bg-red-500/10">HIGH</span>
                          </div>
                          <p className="text-[11px] text-text-sub leading-snug">
                            Unauthorized origin asserting path without authorization. Primary security risk.
                          </p>
                        </div>
                        <div className="p-2.5 rounded bg-bg-card border border-divider space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-text-main text-[11px]">Route Leak</span>
                            <span className="text-[10px] font-bold text-amber-500 px-1.5 py-0.2 rounded bg-amber-500/10">MED</span>
                          </div>
                          <p className="text-[11px] text-text-sub leading-snug">
                            Accidental propagation of internal or multihomed customer route beyond intended scope.
                          </p>
                        </div>
                        <div className="p-2.5 rounded bg-bg-card border border-divider space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-text-main text-[11px]">Traffic Engineering</span>
                            <span className="text-[10px] font-bold text-blue-500 px-1.5 py-0.2 rounded bg-blue-500/10">EVAL</span>
                          </div>
                          <p className="text-[11px] text-text-sub leading-snug">
                            Deaggregation by legitimate operator for link load-balancing. Baseline preserved until corroborated.
                          </p>
                        </div>
                        <div className="p-2.5 rounded bg-bg-card border border-divider space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-text-main text-[11px]">DDoS Scrubbing</span>
                            <span className="text-[10px] font-bold text-text-dim px-1.5 py-0.2 rounded bg-bg-interactive">INFO</span>
                          </div>
                          <p className="text-[11px] text-text-sub leading-snug">
                            Emergency redirection through cloud mitigation network (e.g. Magic Transit).
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Observing Peer Corroboration & Per-Peer Withdrawal Recovery Matrix */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-text-dim font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Per-Peer Withdrawal Recovery Matrix</span>
                        <span className="text-text-sub font-normal">Tracked peer vantage states</span>
                      </div>
                      <PeerWithdrawalMatrix
                        alert={inc.primaryAlert}
                        onWithdrawalProcessed={fetchAllData}
                      />
                    </div>

                    {/* Cryptographic Assurance & CLI Verifier */}
                    <div className="p-3 rounded-md bg-bg-card border border-divider space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-main">
                          <Terminal className="w-3.5 h-3.5 text-brand-blue" />
                          <span>Independent Evidence Verification (NIST FIPS 204 ML-DSA-65)</span>
                        </div>
                        <span className="text-[10px] font-mono text-text-dim">
                          Audit File: audit/sample_evidence_signed.json
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 p-2 rounded bg-bg-app border border-divider font-mono text-[11px] text-text-sub">
                        <code className="text-brand-blue select-all">python verify_evidence.py audit/sample_evidence_signed.json</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText("python verify_evidence.py audit/sample_evidence_signed.json");
                            setActionNotice("Verification CLI command copied to clipboard!");
                            setTimeout(() => setActionNotice(null), 3000);
                          }}
                          className="px-2 py-1 rounded bg-bg-interactive hover:bg-bg-card text-text-main text-[10px] font-medium flex items-center gap-1 cursor-pointer shrink-0"
                          title="Copy command"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy CLI</span>
                        </button>
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-divider">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCheckRpki(inc.primaryAlert)}
                          className="px-3 py-1.5 rounded-md bg-bg-card border border-border-card hover:bg-bg-interactive text-xs font-medium text-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <SearchCheck className="w-3.5 h-3.5 text-brand-blue" />
                          <span>Check RPKI / ROA</span>
                        </button>
                        <button
                          onClick={() => setSelectedAlert(inc.primaryAlert)}
                          className="px-3 py-1.5 rounded-md bg-bg-card border border-border-card hover:bg-bg-interactive text-xs font-medium text-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5 text-brand-blue" />
                          <span>Inspect Cryptographic Vault</span>
                        </button>
                        <button
                          onClick={() => handleResolve(inc.primaryAlert)}
                          className="px-3 py-1.5 rounded-md bg-bg-card border border-border-card hover:bg-bg-interactive text-xs font-medium text-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
                          <span>Mark Resolved</span>
                        </button>
                        <button
                          onClick={() => handleAcknowledge(inc.primaryAlert)}
                          className="px-3 py-1.5 rounded-md bg-bg-card border border-border-card hover:bg-bg-interactive text-xs font-medium text-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-text-sub" />
                          <span>Acknowledge</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Forensic Incident Investigation Drawer */}
      {forensicAlert && (
        <ForensicIncidentDrawer
          alert={forensicAlert}
          onClose={() => setForensicAlert(null)}
          onStatusUpdate={(id, status) => updateAlertStatus(id, status)}
          onRefresh={fetchAllData}
          onOpenRpki={(prefix, asn) => {
            setRpkiTarget({ prefix, asn });
            setActiveTab("rpki");
          }}
        />
      )}
    </div>
  );
};
