import React, { useState, useEffect } from "react";
import {
  X,
  SearchCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { RPKIResult } from "../types";
import { api } from "../api";

interface RPKIModalProps {
  prefix: string;
  asn: string;
  onClose: () => void;
}

export const RPKIModal: React.FC<RPKIModalProps> = ({
  prefix,
  asn,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<RPKIResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRPKI = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.validateRPKI(prefix, asn);
        if (isMounted) setResult(res);
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRPKI();
    return () => {
      isMounted = false;
    };
  }, [prefix, asn]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VALID":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: CheckCircle2,
          text: "VALID (Cryptographically Authorized ROA)",
        };
      case "INVALID":
        return {
          bg: "bg-red-500/10 text-red-400 border-red-500/20",
          icon: XCircle,
          text: "INVALID (Origin ASN or Max Length Mismatch)",
        };
      case "UNKNOWN":
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          icon: HelpCircle,
          text: "UNKNOWN (No Covering ROA in Trust Anchors)",
        };
      default:
        return {
          bg: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
          icon: AlertCircle,
          text: "UNAVAILABLE (RPKI Provider Unreachable)",
        };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl flex flex-col bg-bg-card border border-border-card rounded-xl shadow-2xl overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 border-b border-border-sub bg-bg-header flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-brand-blue">
              <SearchCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-main">
                RPKI Route Origin Validation
              </h3>
              <p className="text-[11px] text-text-dim font-mono">
                {prefix} via {asn}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-bg-nav-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-text-sub">
              <RotateCw className="w-6 h-6 animate-spin text-brand-blue" />
              <span>Querying RIPEstat REST API...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {(() => {
                  const badge = getStatusBadge(result.status);
                  const Icon = badge.icon;
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{badge.text}</span>
                    </span>
                  );
                })()}
                <span className="text-[11px] text-text-dim font-mono">
                  {result.provider}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-bg-app border border-border-card">
                  <span className="text-text-dim block text-[11px]">Prefix</span>
                  <span className="font-mono font-bold text-text-main mt-0.5 block">
                    {result.prefix}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-bg-app border border-border-card">
                  <span className="text-text-dim block text-[11px]">Origin ASN</span>
                  <span className="font-mono font-bold text-brand-blue mt-0.5 block">
                    {result.origin_asn}
                  </span>
                </div>
              </div>

              {result.validating_roas.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-semibold text-text-main">
                    Validating ROA Payloads ({result.validating_roas.length})
                  </span>
                  <div className="rounded-lg border border-border-card overflow-hidden">
                    <div className="grid grid-cols-12 text-[11px] font-medium text-text-dim px-3 py-2 bg-bg-app border-b border-border-card">
                      <span className="col-span-5">ROA ASN</span>
                      <span className="col-span-4">Prefix / Max</span>
                      <span className="col-span-3 text-right">Validity</span>
                    </div>
                    <div className="divide-y divide-border-item font-mono text-xs">
                      {result.validating_roas.map((roa, i) => (
                        <div key={i} className="grid grid-cols-12 px-3 py-2 items-center">
                          <span className="col-span-5 text-brand-blue font-bold">
                            {roa.origin}
                          </span>
                          <span className="col-span-4 text-text-main">
                            {roa.prefix}/{roa.max_length}
                          </span>
                          <span className="col-span-3 text-right text-emerald-400 font-semibold">
                            {roa.validity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-bg-app border border-border-card text-text-sub text-[11px]">
                  No covering ROAs found in RIPE NCC, ARIN, APNIC, LACNIC, or AFRINIC trust anchors for this prefix.
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-border-sub bg-bg-header flex items-center justify-end px-6 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-semibold text-text-main transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
