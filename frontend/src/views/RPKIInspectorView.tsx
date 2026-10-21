import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  Search,
  RefreshCw,
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
    { label: "Origin Spoof (Invalid ASN)", prefix: "1.1.1.0/24", asn: "AS99999" },
  ];

  const handleValidate = async (p = prefix, a = asn) => {
    if (!p.trim() || !a.trim()) {
      setError("Please provide both an IP prefix and an Origin ASN.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.validateRPKI(p.trim(), a.trim());
      setResult(data);
    } catch (err: any) {
      setError(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : err.message || "Failed to query RPKI validation provider."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusPresentation = (status: string) => {
    switch (status) {
      case "VALID":
        return {
          title: "Valid ROA Authorization",
          desc: "A covering Route Origin Authorization matches this prefix and origin ASN within the permitted maximum length.",
          badgeClass: "bg-status-green-bg text-status-green border-status-green",
          icon: CheckCircle2,
        };
      case "INVALID":
        return {
          title: "Invalid ROA Match",
          desc: "A covering ROA exists for this prefix, but specifies a different origin ASN or the prefix length exceeds max_length.",
          badgeClass: "bg-status-red-bg text-status-red border-status-red",
          icon: XCircle,
        };
      case "UNKNOWN":
        return {
          title: "Not Found / Not Covered",
          desc: "No covering Route Origin Authorization has been published for this prefix in any Trust Anchor.",
          badgeClass: "bg-status-amber-bg text-status-amber border-status-amber",
          icon: HelpCircle,
        };
      default:
        return {
          title: "Validation Service Unavailable",
          desc: "Could not reach the external RPKI validator or the query timed out.",
          badgeClass: "bg-bg-btn text-text-sub border-border-card",
          icon: AlertCircle,
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="pb-2 border-b border-border-card">
        <h1 className="text-lg font-bold text-text-main tracking-tight">
          RPKI route origin inspector
        </h1>
        <p className="text-xs text-text-sub mt-0.5">
          Validate whether an origin ASN is cryptographically authorized to announce a prefix based on published Route Origin Authorizations (ROAs).
        </p>
      </div>

      {/* Query Form */}
      <div className="card-panel p-5 space-y-4">
        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-text-dim">Test presets:</span>
          {presets.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setPrefix(item.prefix);
                setAsn(item.asn);
                handleValidate(item.prefix, item.asn);
              }}
              className="px-2 py-1 rounded bg-bg-app border border-border-card hover:bg-bg-nav-hover text-[11px] text-text-sub hover:text-text-main transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-main">
              IP Prefix (CIDR)
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. 1.1.1.0/24 or 2001:db8::/32"
              className="w-full px-3 py-2 rounded bg-bg-app border border-border-card text-xs text-text-main font-mono focus:border-brand-blue outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-main">
              Origin Autonomous System Number
            </label>
            <input
              type="text"
              value={asn}
              onChange={(e) => setAsn(e.target.value)}
              placeholder="e.g. AS13335 or 15169"
              className="w-full px-3 py-2 rounded bg-bg-app border border-border-card text-xs text-text-main font-mono focus:border-brand-blue outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded bg-status-red-bg border border-status-red text-status-red text-xs">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-text-dim">
            Provider: RIPEstat Data API (REST) with 5s timeout
          </span>

          <button
            onClick={() => handleValidate()}
            disabled={loading}
            className="px-4 py-2 rounded bg-brand-blue text-slate-950 hover:opacity-90 text-xs font-semibold flex items-center gap-1.5 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Checking ROA..." : "Validate Route Origin"}</span>
          </button>
        </div>
      </div>

      {/* Validation Result Display */}
      {result && (
        <div className="card-panel p-5 space-y-4">
          {(() => {
            const presentation = getStatusPresentation(result.status);
            const Icon = presentation.icon;

            return (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded bg-bg-app border border-border-card shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-text-main">
                          {presentation.title}
                        </h2>
                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase border ${presentation.badgeClass}`}
                        >
                          {result.status}
                        </span>
                      </div>
                      <p className="text-xs text-text-sub mt-1 leading-relaxed">
                        {presentation.desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Technical Parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-2 border-t border-border-card">
                  <div className="p-2 rounded bg-bg-app border border-border-card">
                    <span className="text-[10px] text-text-dim block font-sans">Prefix</span>
                    <span className="text-text-main font-semibold">{result.prefix}</span>
                  </div>
                  <div className="p-2 rounded bg-bg-app border border-border-card">
                    <span className="text-[10px] text-text-dim block font-sans">Origin ASN</span>
                    <span className="text-text-main font-semibold">{result.origin_asn}</span>
                  </div>
                  <div className="p-2 rounded bg-bg-app border border-border-card">
                    <span className="text-[10px] text-text-dim block font-sans">Provider</span>
                    <span className="text-text-sub">{result.provider}</span>
                  </div>
                  <div className="p-2 rounded bg-bg-app border border-border-card">
                    <span className="text-[10px] text-text-dim block font-sans">Lookup time</span>
                    <span className="text-text-sub">{new Date(result.lookup_time).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Validating ROAs if present */}
                {result.validating_roas && result.validating_roas.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-border-item">
                    <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider">
                      Published Covering ROAs ({result.validating_roas.length})
                    </span>
                    <div className="divide-y divide-border-item border border-border-card rounded bg-bg-app overflow-hidden font-mono text-[11px]">
                      {result.validating_roas.map((roa, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between text-text-sub">
                          <span>Prefix: <strong className="text-text-main">{roa.prefix}</strong></span>
                          <span>Authorized Origin: <strong className="text-status-green">{roa.origin}</strong></span>
                          <span>Max Length: /{roa.max_length}</span>
                          <span className="text-text-dim uppercase">{roa.validity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
