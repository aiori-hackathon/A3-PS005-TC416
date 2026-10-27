import React, { useState, useEffect, useRef } from "react";
import {
  Globe,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  RefreshCw,
  ShieldAlert,
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

  const lastQueriedRef = useRef<string>("");

  useEffect(() => {
    if (rpkiTarget) {
      const targetKey = `${rpkiTarget.prefix}@${rpkiTarget.asn}`;
      if (lastQueriedRef.current !== targetKey) {
        lastQueriedRef.current = targetKey;
        setPrefix(rpkiTarget.prefix);
        setAsn(rpkiTarget.asn);
        handleValidate(rpkiTarget.prefix, rpkiTarget.asn);
      }
      setRpkiTarget(null);
    } else if (!result && lastQueriedRef.current === "") {
      lastQueriedRef.current = "1.1.1.0/24@AS13335";
      handleValidate("1.1.1.0/24", "AS13335");
    }
  }, [rpkiTarget]);

  const presets = [
    { label: "Cloudflare (Valid)", prefix: "1.1.1.0/24", asn: "AS13335" },
    { label: "Google DNS (Valid)", prefix: "8.8.8.0/24", asn: "AS15169" },
    { label: "Quad9 (Valid)", prefix: "9.9.9.0/24", asn: "AS19281" },
    { label: "Unauthorized Origin (Invalid)", prefix: "1.1.1.0/24", asn: "AS99999" },
  ];

  const handleValidate = async (p = prefix, a = asn) => {
    const cleanPrefix = p.trim();
    const cleanAsn = a.trim();
    if (!cleanPrefix || !cleanAsn) return;

    setLoading(true);
    setError(null);
    lastQueriedRef.current = `${cleanPrefix}@${cleanAsn}`;

    try {
      const data = await api.validateRPKI(cleanPrefix, cleanAsn);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to query RPKI validation service");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "VALID":
        return {
          type: "VALID",
          colorClass: "bg-badge-green-bg text-status-green border-green-300 dark:border-green-900",
          icon: CheckCircle2,
          headline: "Origin Authorized (VALID)",
          explanation:
            "Cryptographically verified Route Origin Authorization (ROA) matches the announced prefix and origin ASN.",
        };
      case "INVALID":
        return {
          type: "INVALID",
          colorClass: "bg-status-critical-bg text-status-critical border-red-300 dark:border-red-900",
          icon: XCircle,
          headline: "Origin Unauthorized (INVALID)",
          explanation:
            "A covering ROA exists in RIR trust anchors, but does not authorize this origin ASN or the announced prefix length exceeds max length.",
        };
      case "UNKNOWN":
      case "NOT_FOUND":
        return {
          type: "UNKNOWN",
          colorClass: "bg-badge-amber-bg text-status-warning border-amber-300 dark:border-amber-900",
          icon: HelpCircle,
          headline: "No Covering ROA Found (UNKNOWN / NOT_FOUND)",
          explanation:
            "No Route Origin Authorization was found in RIR trust anchors (RIPE NCC, ARIN, APNIC, LACNIC, AFRINIC) covering this prefix. Route is unvalidated.",
        };
      default:
        return {
          type: "UNAVAILABLE",
          colorClass: "bg-bg-interactive text-text-sub border-divider",
          icon: ShieldAlert,
          headline: "RPKI Verification Service Unavailable",
          explanation:
            "The external RPKI validator or RIPEstat API could not be reached or timed out. Telemetry cannot be verified as valid.",
        };
    }
  };

  return (
    <div className="max-w-[1360px] w-full space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-4 border-b border-divider">
        <h1 className="text-2xl sm:text-[28px] font-semibold text-text-main tracking-tight">
          RPKI / ROA Origin Inspector
        </h1>
        <p className="text-sm text-text-sub mt-1">
          Cryptographically validates whether an origin ASN is authorized to announce the specified prefix using RIR trust anchors.
        </p>
      </div>

      {/* Query Form */}
      <div className="card-panel p-6 space-y-4">
        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-dim">Quick Presets:</span>
          {presets.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setPrefix(item.prefix);
                setAsn(item.asn);
                handleValidate(item.prefix, item.asn);
              }}
              className="px-2.5 py-1 rounded bg-bg-interactive hover:bg-bg-selected text-xs text-text-sub hover:text-brand-blue border border-divider transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-sub">
              IP Prefix (IPv4 / IPv6 CIDR)
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-bg-interactive border border-divider focus-within:border-brand-blue focus-within:bg-bg-card transition-all">
              <Globe className="w-4 h-4 text-text-dim shrink-0" />
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. 1.1.1.0/24"
                className="bg-transparent border-none outline-none text-sm font-mono text-text-main w-full"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-sub">
              Origin Autonomous System Number
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-bg-interactive border border-divider focus-within:border-brand-blue focus-within:bg-bg-card transition-all">
              <KeyRound className="w-4 h-4 text-text-dim shrink-0" />
              <input
                type="text"
                value={asn}
                onChange={(e) => setAsn(e.target.value)}
                placeholder="e.g. AS13335"
                className="bg-transparent border-none outline-none text-sm font-mono text-text-main w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            onClick={() => handleValidate()}
            disabled={loading || !prefix.trim() || !asn.trim()}
            className="px-5 py-2 rounded-md bg-brand-blue hover:bg-blue-700 text-white font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{loading ? "Validating via RPKI..." : "Inspect Origin Authorization"}</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-md bg-status-critical-bg border border-red-300 dark:border-red-900 text-status-critical text-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">RPKI Query Failed</div>
              <div className="text-xs mt-0.5">{error}</div>
            </div>
          </div>
          <button
            onClick={() => handleValidate()}
            className="px-3 py-1 rounded bg-bg-card border border-red-300 dark:border-red-900 text-xs font-medium hover:bg-bg-interactive transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="card-panel p-6 space-y-4">
          {(() => {
            const statusInfo = getStatusDisplay(result.status);
            const Icon = statusInfo.icon;
            const roas = result.validating_roas || [];
            const hasRoas = roas.length > 0;
            const isUnavailable = result.status === "UNAVAILABLE";
            const isUnknown = result.status === "UNKNOWN";

            return (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${statusInfo.colorClass} flex items-start justify-between gap-3.5`}>
                  <div className="flex items-start gap-3.5">
                    <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-base font-semibold">{statusInfo.headline}</h3>
                      <p className="text-xs mt-1 leading-relaxed opacity-90">{statusInfo.explanation}</p>
                    </div>
                  </div>
                  {isUnavailable && (
                    <button
                      onClick={() => handleValidate()}
                      className="px-3 py-1 rounded bg-bg-card border border-divider text-xs font-medium hover:bg-bg-interactive transition-colors shrink-0"
                    >
                      Retry Query
                    </button>
                  )}
                </div>

                {/* Query Target Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-2">
                  <div className="p-3 rounded-md bg-bg-interactive border border-divider space-y-1">
                    <span className="text-[11px] text-text-dim uppercase font-semibold">Queried Prefix</span>
                    <div className="text-sm font-bold text-text-main">{result.prefix || prefix}</div>
                  </div>
                  <div className="p-3 rounded-md bg-bg-interactive border border-divider space-y-1">
                    <span className="text-[11px] text-text-dim uppercase font-semibold">Queried Origin</span>
                    <div className="text-sm font-bold text-text-main">{result.origin_asn || asn}</div>
                  </div>
                  <div className="p-3 rounded-md bg-bg-interactive border border-divider space-y-1">
                    <span className="text-[11px] text-text-dim uppercase font-semibold">
                      {isUnavailable ? "Service Status" : isUnknown ? "ROA Coverage" : "Max Length"}
                    </span>
                    <div className="text-sm font-bold text-text-main">
                      {isUnavailable
                        ? "UNREACHABLE"
                        : isUnknown
                        ? "NO ROA"
                        : hasRoas
                        ? `/${roas[0].max_length}`
                        : "None"}
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-bg-interactive border border-divider space-y-1">
                    <span className="text-[11px] text-text-dim uppercase font-semibold">Trust Anchor / Source</span>
                    <div className="text-sm font-bold text-text-main">{result.provider || "RIPE NCC RPKI Validator"}</div>
                  </div>
                </div>

                {/* Validating ROA Details Table */}
                {hasRoas && !isUnavailable && (
                  <div className="pt-2 space-y-2">
                    <div className="text-xs font-semibold text-text-sub">Registered Covering ROAs:</div>
                    <div className="overflow-x-auto rounded border border-divider">
                      <table className="w-full text-left text-xs font-mono border-collapse">
                        <thead>
                          <tr className="bg-bg-interactive border-b border-divider text-[11px] text-text-dim font-bold uppercase">
                            <th className="py-2 px-3">Covering Prefix</th>
                            <th className="py-2 px-3">Authorized ASN</th>
                            <th className="py-2 px-3">Max Prefix Length</th>
                            <th className="py-2 px-3">Validity Check</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-divider bg-bg-card">
                          {roas.map((roa, idx) => (
                            <tr key={idx} className="hover:bg-bg-interactive/40">
                              <td className="py-2 px-3 text-text-main font-semibold">{roa.prefix}</td>
                              <td className="py-2 px-3 text-brand-blue">{roa.origin}</td>
                              <td className="py-2 px-3 text-text-sub">/{roa.max_length}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                    roa.validity === "VALID"
                                      ? "bg-badge-green-bg text-status-green"
                                      : "bg-status-critical-bg text-status-critical"
                                  }`}
                                >
                                  {roa.validity}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
