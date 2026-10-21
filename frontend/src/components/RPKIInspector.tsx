import React, { useState } from "react";
import { Globe, Search, ShieldCheck, AlertTriangle, CheckCircle2, HelpCircle, Loader2 } from "lucide-react";
import { RPKIResult } from "../types";
import { api } from "../api";

export const RPKIInspector: React.FC = () => {
  const [prefix, setPrefix] = useState("1.1.1.0/24");
  const [asn, setAsn] = useState("AS13335");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RPKIResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prefix.trim() || !asn.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.validateRPKI(prefix.trim(), asn.trim());
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sampleTargets = [
    { label: "Cloudflare DNS (Valid)", p: "1.1.1.0/24", a: "AS13335" },
    { label: "Google Public DNS (Valid)", p: "8.8.8.0/24", a: "AS15169" },
    { label: "Quad9 DNS (Valid)", p: "9.9.9.0/24", a: "AS19281" },
    { label: "Documentation Net (Unknown)", p: "192.0.2.0/24", a: "AS64496" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
          Live RPKI Origin Validation Inspector (RIPEstat)
        </h2>
        <p style={{ color: "var(--text-sub)", fontSize: "0.82rem" }}>
          Validate whether an Autonomous System is cryptographically authorized to announce a route prefix according to global RPKI trust anchors.
        </p>
      </div>

      <div className="card">
        {/* Sample Target Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: 700 }}>SAMPLE TARGETS:</span>
          {sampleTargets.map((item, idx) => (
            <button
              key={idx}
              className="btn btn-secondary"
              style={{ fontSize: "0.72rem", padding: "3px 9px", borderRadius: "var(--radius-full)" }}
              onClick={() => {
                setPrefix(item.p);
                setAsn(item.a);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Query Form */}
        <form onSubmit={handleValidate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: "0.35rem" }}>
              CIDR Network Prefix
            </label>
            <input
              type="text"
              className="form-input mono-text"
              placeholder="e.g. 1.1.1.0/24"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: "0.35rem" }}>
              Origin ASN
            </label>
            <input
              type="text"
              className="form-input mono-text"
              placeholder="e.g. AS13335"
              value={asn}
              onChange={(e) => setAsn(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ height: "36px", padding: "0 1.25rem" }}
            disabled={loading}
          >
            {loading ? <Loader2 size={15} className="spin" /> : <Globe size={15} />}
            Query RPKI
          </button>
        </form>
      </div>

      {/* Result Display */}
      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <Loader2 size={32} className="spin" color="var(--brand-cyan)" style={{ margin: "0 auto 1rem" }} />
          <p style={{ fontWeight: 700 }}>Querying RIPEstat REST endpoint...</p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
            Evaluating Route Origin Authorizations (ROAs)
          </p>
        </div>
      ) : error ? (
        <div
          className="card"
          style={{
            background: "var(--badge-red-bg)",
            borderColor: "var(--badge-red-border)",
            color: "var(--badge-red-text)",
          }}
        >
          <p style={{ fontWeight: 700 }}>Error querying RIPEstat: {error}</p>
        </div>
      ) : result ? (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase" }}>
                RPKI Validation Result
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem" }}>
                <span
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 900,
                    fontFamily: "var(--font-mono)",
                    color:
                      result.status === "VALID"
                        ? "var(--badge-green-text)"
                        : result.status === "INVALID"
                        ? "var(--badge-red-text)"
                        : "var(--badge-idle-text)",
                  }}
                >
                  {result.status}
                </span>
                <span className="mono-text" style={{ fontSize: "0.85rem", color: "var(--text-sub)" }}>
                  for {result.prefix} originating from {result.origin_asn}
                </span>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span className="mono-text" style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                Lookup Timestamp: {result.lookup_time.replace("T", " ").replace("Z", "")}
              </span>
            </div>
          </div>

          <p style={{ fontSize: "0.85rem", color: "var(--text-sub)", lineHeight: "1.5" }}>
            {result.details}
          </p>

          {/* Validating ROAs Table */}
          <div>
            <h4 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.6rem" }}>
              Matching Route Origin Authorizations (ROAs): {result.validating_roas.length}
            </h4>
            {result.validating_roas.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontStyle: "italic" }}>
                No ROA covers this prefix in the global RPKI database. Status is UNKNOWN (not invalid, simply uncertified).
              </p>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ROA PREFIX</th>
                      <th>AUTHORIZED ORIGIN ASN</th>
                      <th>MAX LENGTH</th>
                      <th>ROA VALIDITY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.validating_roas.map((roa, i) => (
                      <tr key={i}>
                        <td className="mono-text" style={{ color: "var(--brand-cyan)", fontWeight: 700 }}>{roa.prefix}</td>
                        <td className="mono-text" style={{ color: "var(--badge-green-text)", fontWeight: 700 }}>AS{roa.origin}</td>
                        <td className="mono-text">/{roa.max_length}</td>
                        <td>
                          <span className={`badge badge-${roa.validity.toLowerCase()}`}>
                            {roa.validity}
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
      ) : null}
    </div>
  );
};
