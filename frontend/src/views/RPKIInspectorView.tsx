import React, { useState, useEffect } from "react";
import {
  Globe,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
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
      setRpkiTarget(null);
    }
  }, [rpkiTarget]);

  const presets = [
    { label: "Cloudflare (Valid)", prefix: "1.1.1.0/24", asn: "AS13335" },
    { label: "Google DNS (Valid)", prefix: "8.8.8.0/24", asn: "AS15169" },
    { label: "Quad9 (Valid)", prefix: "9.9.9.0/24", asn: "AS19281" },
    { label: "Unauthorized Origin (Invalid)", prefix: "1.1.1.0/24", asn: "AS99999" },
  ];

  const handleValidate = async (p = prefix, a = asn) => {
    if (!p.trim() || !a.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.validateRPKI(p.trim(), a.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to query RPKI validation service");
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "VALID":
        return {
          colorClass: "bg-status-green-bg text-status-green border-green-800/40",
          icon: CheckCircle2,
          headline: "Origin authorized (Valid)",
          explanation: "Cryptographically verified Route Origin Authorization (ROA) matches the announced prefix and origin ASN.",
        };
      case "INVALID":
        return {
          colorClass: "bg-status-red-bg text-red-400 border-red-800/40",
          icon: XCircle,
          headline: "Origin unauthorized (Invalid)",
          explanation: "A covering ROA exists, but does not authorize this origin ASN or the prefix length exceeds max length.",
        };
      case "UNKNOWN":
      case "NOT_FOUND":
        return {
          colorClass: "bg-status-amber-bg text-status-amber border-amber-800/40",
          icon: HelpCircle,
          headline: "No ROA found (Unknown)",
          explanation: "No covering Route Origin Authorization was found in RIR trust anchors for this prefix.",
        };
      default:
        return {
          colorClass: "bg-bg-btn text-text-sub border-border-card",
          icon: AlertCircle,
          headline: "Validation unavailable",
          explanation: "The RPKI verification service could not be reached or timed out.",
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-2 border-b border-border-card">
        <h1 className="text-xl sm:text-2xl font-semibold text-text-main tracking-tight">
          Check route origin
        </h1>
        <p className="text-xs sm:text-sm text-text-sub mt-1">
          Checks whether an origin ASN is authorized to announce the specified prefix using available RPKI/ROA data.
        </p>
      </div>

      {/* Query Form */}
      <div className="card-panel p-5 space-y-4">
        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-dim">Test presets:</span>
          {presets.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setPrefix(item.prefix);
                setAsn(item.asn);
                handleValidate(item.prefix, item.asn);
              }}
              className="px-2.5 py-1 rounded-md bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-xs font-medium text-text-sub hover:text-text-main transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-main flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-brand-blue" />
              <span>Prefix (IPv4 or IPv6 CIDR)</span>
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. 1.1.1.0/24"
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-card text-xs text-text-main outline-none focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/30 font-mono transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-main flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-brand-blue" />
              <span>Origin ASN</span>
            </label>
            <input
              type="text"
              value={asn}
              onChange={(e) => setAsn(e.target.value)}
              placeholder="e.g. AS13335"
              className="w-full px-3.5 py-2 rounded-xl bg-bg-input border border-border-card text-xs text-text-main outline-none focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/30 font-mono transition-all"
            />
          </div>
        </div>

        <div className="pt-1">
          <button
            onClick={() => handleValidate()}
            disabled={loading || !prefix.trim() || !asn.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-brand-blue hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs transition-all active:scale-[0.98] shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{loading ? "Checking RPKI..." : "Check route origin"}</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="card-panel p-5 space-y-4">
          {(() => {
            const display = getStatusDisplay(result.status);
            const Icon = display.icon;

            return (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg border shrink-0 ${display.colorClass}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-text-main">
                        {display.headline}
                      </h2>
                      <p className="text-xs text-text-sub mt-0.5 leading-relaxed">
                        {display.explanation}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${display.colorClass}`}
                  >
                    {result.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-lg bg-bg-app border border-border-card space-y-1">
                    <div className="text-[11px] text-text-dim">Prefix Checked</div>
                    <div className="font-mono text-text-main font-medium">{result.prefix}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-app border border-border-card space-y-1">
                    <div className="text-[11px] text-text-dim">Origin ASN Checked</div>
                    <div className="font-mono text-text-main font-medium">{result.origin_asn}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-app border border-border-card space-y-1">
                    <div className="text-[11px] text-text-dim">Validation Method</div>
                    <div className="text-text-main">RFC 6811 Cryptographic Trust Anchor</div>
                  </div>
                </div>

                {result.validating_roas && result.validating_roas.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <div className="text-xs font-semibold text-text-main">
                      Covering ROAs in Trust Anchor ({result.validating_roas.length})
                    </div>
                    <div className="divide-y divide-border-item border border-border-card rounded-lg overflow-hidden">
                      {result.validating_roas.map((roa, i) => (
                        <div key={i} className="p-3 bg-bg-app flex items-center justify-between text-xs font-mono">
                          <span className="text-text-main">{roa.prefix}</span>
                          <span className="text-brand-blue">{roa.origin}</span>
                          <span className="text-text-sub">MaxLen: /{roa.max_length}</span>
                          <span className="text-status-green">{roa.validity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
