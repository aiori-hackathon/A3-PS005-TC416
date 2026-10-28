import React, { useState } from "react";
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Info,
  Check,
} from "lucide-react";
import { api } from "../api";
import { AlertItem } from "../types";

interface PeerWithdrawalMatrixProps {
  alert: AlertItem;
  onWithdrawalProcessed?: () => void;
}

export const PeerWithdrawalMatrix: React.FC<PeerWithdrawalMatrixProps> = ({
  alert,
  onWithdrawalProcessed,
}) => {
  const [withdrawingPeer, setWithdrawingPeer] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Parse peer arrays safely
  const activePeers: string[] = Array.isArray(alert.active_peers)
    ? alert.active_peers
    : typeof alert.active_peers === "string"
    ? (() => {
        try {
          return JSON.parse(alert.active_peers);
        } catch {
          return [alert.observed_asn];
        }
      })()
    : alert.observed_asn
    ? [alert.observed_asn]
    : [];

  const withdrawnPeers: string[] = Array.isArray(alert.withdrawn_peers)
    ? alert.withdrawn_peers
    : typeof alert.withdrawn_peers === "string"
    ? (() => {
        try {
          return JSON.parse(alert.withdrawn_peers);
        } catch {
          return [];
        }
      })()
    : [];

  const recoveryStatus = alert.recovery_status || "UNCONFIRMED";
  const isConfirmed = recoveryStatus === "CONFIRMED";
  const isPartial = recoveryStatus === "PARTIAL";

  const handleWithdrawPeer = async (peer: string) => {
    setWithdrawingPeer(peer);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.submitWithdrawal({
        prefix: alert.prefix,
        peer_as: peer,
        scenario: alert.scenario || "forensic-peer-withdrawal",
      });
      setActionSuccess(
        `Withdrawal processed for peer ${peer}. ${res.resolved_alerts.length} alert(s) resolved.`
      );
      if (onWithdrawalProcessed) {
        onWithdrawalProcessed();
      }
    } catch (err: any) {
      setActionError(`Withdrawal failed: ${err.message}`);
    } finally {
      setWithdrawingPeer(null);
    }
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Recovery Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md bg-bg-card border border-divider">
        <div className="flex items-center gap-2">
          {isConfirmed ? (
            <CheckCircle2 className="w-5 h-5 text-status-green shrink-0" />
          ) : isPartial ? (
            <Clock className="w-5 h-5 text-amber-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-status-critical shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-main">Anomaly Recovery Lifecycle</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isConfirmed
                    ? "bg-badge-green-bg text-status-green border border-green-300 dark:border-green-900"
                    : isPartial
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                    : "bg-status-critical-bg text-status-critical border border-red-300 dark:border-red-900"
                }`}
              >
                {recoveryStatus}
              </span>
            </div>
            <p className="text-[11px] text-text-sub mt-0.5">
              {isConfirmed
                ? "All observing BGP peers have withdrawn the anomalous announcement. Candidate route transitioned to WITHDRAWN and alert resolved."
                : isPartial
                ? "Partial recovery: Some peers have withdrawn, but remaining active peers continue to announce the anomaly. Route stays quarantined."
                : "Active anomaly: No peer withdrawals received yet. Baseline protected; traffic monitoring active."}
            </p>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-badge-green-bg border border-green-300 dark:border-green-900 text-status-green px-3 py-2 rounded text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="bg-status-critical-bg border border-red-300 dark:border-red-900 text-status-critical px-3 py-2 rounded text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Peers Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Active Observing Peers Column */}
        <div className="card-panel p-3.5 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-divider">
            <span className="font-bold text-text-main text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-critical inline-block"></span>
              Active Observing Peers ({activePeers.length})
            </span>
            <span className="text-[10px] text-text-dim">Announcing anomaly</span>
          </div>

          {activePeers.length === 0 ? (
            <div className="py-6 text-center text-text-dim text-xs italic">
              Zero active peers. All observing peers have withdrawn.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {activePeers.map((peer) => (
                <div
                  key={peer}
                  className="flex items-center justify-between font-mono text-xs p-2 rounded bg-bg-interactive/40 border border-divider"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-status-critical">{peer}</span>
                    <span className="text-[10px] text-text-dim">(Active Announcer)</span>
                  </div>

                  {alert.status === "ACTIVE" && (
                    <button
                      onClick={() => handleWithdrawPeer(peer)}
                      disabled={withdrawingPeer === peer}
                      className="px-2.5 py-1 rounded bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                      title={`Send BGP withdrawal from ${peer}`}
                    >
                      <RotateCcw className={`w-3 h-3 ${withdrawingPeer === peer ? "animate-spin" : ""}`} />
                      <span>{withdrawingPeer === peer ? "Withdrawing..." : "Withdraw Peer"}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Withdrawn Peers Column */}
        <div className="card-panel p-3.5 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-divider">
            <span className="font-bold text-text-main text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-green inline-block"></span>
              Withdrawn Peers ({withdrawnPeers.length})
            </span>
            <span className="text-[10px] text-text-dim">Recovery confirmed</span>
          </div>

          {withdrawnPeers.length === 0 ? (
            <div className="py-6 text-center text-text-dim text-xs italic">
              No peer withdrawals received yet.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {withdrawnPeers.map((peer) => (
                <div
                  key={peer}
                  className="flex items-center justify-between font-mono text-xs p-2 rounded bg-badge-green-bg/30 border border-green-300 dark:border-green-900 text-status-green"
                >
                  <span className="font-bold">{peer}</span>
                  <span className="text-[10px] uppercase font-bold text-status-green flex items-center gap-1">
                    <Check className="w-3 h-3" /> Withdrawn
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Explanatory Note on Per-Peer Semantics */}
      <div className="p-2.5 rounded bg-bg-app border border-divider text-[11px] text-text-sub flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-brand-blue shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-text-main">Proposal Page 3/6 Model:</strong> BGP withdrawals are tracked on a per-peer vantage basis. If 1 of 3 observing peers sends a withdrawal, the anomaly state transitions to <code className="text-amber-500 font-bold">PARTIAL</code>. Only when all active peers withdraw does the incident transition to <code className="text-status-green font-bold">CONFIRMED</code> and the alert automatically resolve.
        </p>
      </div>
    </div>
  );
};
