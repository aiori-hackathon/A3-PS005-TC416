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
  ShieldCheck,
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
          badgeClass: "bg-status-green-bg text-status-green border-green-800/40",
          icon: CheckCircle2,
          text: "VALID (Cryptographically Authorized ROA Matches Origin)",
        };
      case "INVALID":
        return {
          badgeClass: "bg-status-red-bg text-red-400 border-red-800/40",
          icon: XCircle,
          text: "INVALID (Origin ASN Conflict or Exceeded Max Length)",
        };
      case "UNKNOWN":
        return {
          badgeClass: "bg-status-amber-bg text-status-amber border-amber-800/40",
          icon: HelpCircle,
          text: "UNKNOWN (No Covering ROA in Trust Anchors)",
        };
      default:
        return {
          badgeClass: "bg-bg-btn text-text-sub border-border-card",
          icon: AlertCircle,
          text: "UNAVAILABLE (RPKI Provider Offline or Request Timed Out)",
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-text-main tracking-tight">
            RPKI Origin Validator
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-bg-btn text-text-sub border border-border-card">
            RFC 6483 / RFC 6811
          </span>
        </div>
        <p className="text-xs text-text-sub mt-0.5">
          Verify Route Origin Authorizations (ROAs) against Regional Internet Registry cryptographic trust anchors.
        </p>
      </div>

      {/* Quick Presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-text-dim">Benchmark targets:</span>
        {presets.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              setPrefix(item.prefix);
              setAsn(item.asn);
              handleValidate(item.prefix, item.asn);
            }}
            className="px-3 py-1 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover hover:border-text-dim text-xs font-semibold text-text-main transition-colors cursor-pointer"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Query Form */}
      <div className="card-panel p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-brand-blue" />
              <span>Target IP Prefix / CIDR</span>
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. 1.1.1.0/24 or 198.51.100.0/24"
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-card text-xs text-text-main outline-none focus:border-text-dim font-mono transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-brand-blue" />
              <span>Origin ASN</span>
            </label>
            <input
              type="text"
              value={asn}
              onChange={(e) => setAsn(e.target.value)}
              placeholder="e.g. AS13335 or 13335"
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-card text-xs text-text-main outline-none focus:border-text-dim font-mono transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-text-dim">
            Live query via RIPEstat / RouteViews validator endpoint
          </span>
          <button
            onClick={() => handleValidate()}
            disabled={loading || !prefix || !asn}
            className="px-4 py-2 rounded-lg bg-bg-btn border border-border-card hover:bg-bg-nav-hover hover:border-text-dim text-xs font-semibold text-text-main flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <SearchCheck className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-blue" : ""}`} />
            <span>{loading ? "Validating ROA..." : "Validate Origin"}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Validation Result Box */}
      {result && (
        <div className="card-panel p-5 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <span className="text-xs text-text-dim font-medium block">
                Validation Decision
              </span>
              <div className="flex items-center gap-2">
                {(() => {
                  const badge = getStatusBadge(result.status);
                  const Icon = badge.icon;
                  return (
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${badge.badgeClass}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{result.status}</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="text-right text-[11px] text-text-dim font-mono">
              <div>Provider: <strong className="text-text-sub">{result.provider}</strong></div>
              <div>Evaluated: {new Date(result.lookup_time).toLocaleTimeString()}</div>
            </div>
          </div>

          {/* Plain explanation */}
          <div className="p-3.5 rounded-lg bg-bg-app border border-border-card flex items-start gap-2.5">
            <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
            <div className="text-xs text-text-sub space-y-1">
              <span className="font-semibold text-text-main block">
                {getStatusBadge(result.status).text}
              </span>
              <p className="leading-relaxed">{result.details}</p>
            </div>
          </div>

          {/* Validating ROAs Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-main flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-blue" />
                <span>Validating ROA Records ({result.validating_roas.length})</span>
              </span>
              <span className="text-[11px] text-text-dim">
                Signed by Trust Anchor
              </span>
            </div>

            {result.validating_roas.length === 0 ? (
              <div className="p-4 rounded-lg bg-bg-app border border-border-card text-center text-xs text-text-dim">
                No matching ROAs discovered in public RIR repositories.
              </div>
            ) : (
              <div className="border border-border-card rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-bg-app text-text-dim text-[11px] uppercase tracking-wider select-none border-b border-border-card">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Authorized Origin ASN</th>
                      <th className="py-2 px-3 font-semibold">Covering Prefix</th>
                      <th className="py-2 px-3 font-semibold">Max-Length</th>
                      <th className="py-2 px-3 font-semibold">ROA Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-card text-[11px]">
                    {result.validating_roas.map((roa, idx) => (
                      <tr key={idx} className="hover:bg-bg-hover-row transition-colors">
                        <td className="py-2.5 px-3 text-text-main font-semibold">
                          {roa.origin}
                        </td>
                        <td className="py-2.5 px-3 text-brand-blue">{roa.prefix}</td>
                        <td className="py-2.5 px-3 text-text-sub">/{roa.max_length}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              roa.validity === "valid"
                                ? "bg-status-green-bg text-status-green border-green-800/40"
                                : "bg-status-red-bg text-red-400 border-red-800/40"
                            }`}
                          >
                            {roa.validity.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
