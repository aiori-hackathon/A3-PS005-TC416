import React, { useState, useEffect } from "react";
import {
  SearchCheck,
  Globe,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
} from "lucide-react";
import { api } from "../api";
import { RPKIResult } from "../types";
import { useHoraqStore } from "../stores/useHoraqStore";

export const RPKIInspectorView: React.FC = () => {
  const { rpkiTarget, setRpkiTarget } = useHoraqStore();

  const [prefix, setPrefix] = useState("1.1.1.0/24");
  const [asn, setAsn] = useState("AS13335");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RPKIResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rpkiTarget) {
      setPrefix(rpkiTarget.prefix);
      setAsn(rpkiTarget.asn);
      handleValidate(rpkiTarget.prefix, rpkiTarget.asn);
    }
  }, [rpkiTarget]);

  const presets = [
    { label: "Cloudflare (Valid)", prefix: "1.1.1.0/24", asn: "AS13335" },
    { label: "Google DNS (Valid)", prefix: "8.8.8.0/24", asn: "AS15169" },
    { label: "Quad9 (Valid)", prefix: "9.9.9.0/24", asn: "AS19281" },
    { label: "Rogue Spoof (Invalid)", prefix: "1.1.1.0/24", asn: "AS99999" },
  ];

  const handleValidate = async (p = prefix, a = asn) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.validateRPKI(p.trim(), a.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to query RPKI provider");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VALID":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: CheckCircle2,
          text: "VALID (Cryptographically Authorized ROA Matches Origin)",
        };
      case "INVALID":
        return {
          bg: "bg-red-500/10 text-red-400 border-red-500/20",
          icon: XCircle,
          text: "INVALID (Origin ASN Conflict or Exceeded Max Length)",
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
          text: "UNAVAILABLE (RPKI Provider Offline or Request Timed Out)",
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-text-main tracking-tight">
            RPKI Origin Validator
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-brand-blue border border-sky-500/20">
            RIPEstat REST Client
          </span>
        </div>
        <p className="text-xs text-text-sub mt-0.5">
          Verify Route Origin Authorizations (ROAs) against Regional Internet Registry cryptographic trust anchors.
        </p>
      </div>

      {/* Quick Presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-text-dim">Quick Presets:</span>
        {presets.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              setPrefix(item.prefix);
              setAsn(item.asn);
              handleValidate(item.prefix, item.asn);
            }}
            className="px-2.5 py-1 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover hover:border-text-dim text-[11px] font-medium text-text-sub hover:text-text-main transition-colors cursor-pointer"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Input Form Card */}
      <div className="card-panel p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-sub">
              IP Prefix (IPv4 / IPv6 CIDR)
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. 1.1.1.0/24 or 2001:db8::/32"
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-card text-xs text-text-main font-mono focus:border-brand-blue outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-sub">
              Origin Autonomous System (ASN)
            </label>
            <input
              type="text"
              value={asn}
              onChange={(e) => setAsn(e.target.value)}
              placeholder="e.g. AS13335 or 15169"
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-card text-xs text-text-main font-mono focus:border-brand-blue outline-none"
            />
          </div>
        </div>

        <button
          onClick={() => handleValidate()}
          disabled={loading || !prefix || !asn}
          className="px-4 py-2 rounded-lg bg-brand-blue text-slate-950 hover:bg-sky-400 text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <SearchCheck className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Querying RIPEstat..." : "Validate RPKI Status"}</span>
        </button>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="card-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const badge = getStatusBadge(result.status);
                const Icon = badge.icon;
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{badge.text}</span>
                  </span>
                );
              })()}
            </div>
            <span className="text-[11px] text-text-dim font-mono">
              Provider: {result.provider}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-dim block text-[11px]">Validated Prefix</span>
              <span className="font-mono font-bold text-text-main mt-0.5 block">
                {result.prefix}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-dim block text-[11px]">Validated Origin</span>
              <span className="font-mono font-bold text-brand-blue mt-0.5 block">
                {result.origin_asn}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-dim block text-[11px]">Validating ROAs</span>
              <span className="font-mono font-bold text-text-main mt-0.5 block">
                {result.validating_roas.length} records
              </span>
            </div>

            <div className="p-3 rounded-lg bg-bg-app border border-border-card">
              <span className="text-text-dim block text-[11px]">Lookup Timestamp</span>
              <span className="font-mono text-text-sub mt-0.5 block text-[11px]">
                {result.lookup_time
                  ? new Date(result.lookup_time).toLocaleTimeString()
                  : "Just now"}
              </span>
            </div>
          </div>

          {/* Validating ROAs Table */}
          {result.validating_roas.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold text-text-main">
                Validating ROA Cryptographic Payloads
              </h4>
              <div className="rounded-lg border border-border-card overflow-hidden">
                <div className="grid grid-cols-12 text-[11px] font-medium text-text-dim px-3 py-2 bg-bg-app border-b border-border-card">
                  <span className="col-span-4">Authorizing Origin</span>
                  <span className="col-span-4">Authorized Prefix</span>
                  <span className="col-span-2">Max Length</span>
                  <span className="col-span-2 text-right">Validity</span>
                </div>
                <div className="divide-y divide-border-item bg-bg-card font-mono text-xs">
                  {result.validating_roas.map((roa, i) => (
                    <div key={i} className="grid grid-cols-12 px-3 py-2 items-center">
                      <span className="col-span-4 text-brand-blue font-bold">
                        {roa.origin}
                      </span>
                      <span className="col-span-4 text-text-main">
                        {roa.prefix}
                      </span>
                      <span className="col-span-2 text-text-sub">
                        /{roa.max_length}
                      </span>
                      <span className="col-span-2 text-right text-emerald-400 font-semibold">
                        {roa.validity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Educational BGP Guide Card */}
      <div className="card-panel p-4 space-y-2 text-xs text-text-sub">
        <div className="flex items-center gap-2 font-semibold text-text-main">
          <Info className="w-4 h-4 text-brand-blue" />
          <span>Understanding RPKI Origin Validation (RFC 6483 / RFC 6811)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
          <div className="p-2.5 rounded bg-bg-app border border-border-card">
            <span className="font-bold text-emerald-400 block mb-0.5">VALID State</span>
            At least one valid ROA matches the announcing ASN and prefix length is ≤ maxLength. Routers should accept and prioritize.
          </div>
          <div className="p-2.5 rounded bg-bg-app border border-border-card">
            <span className="font-bold text-red-400 block mb-0.5">INVALID State</span>
            One or more ROAs cover this prefix, but either the origin ASN does not match or the prefix is longer than maxLength. Routers should drop.
          </div>
        </div>
      </div>
    </div>
  );
};
