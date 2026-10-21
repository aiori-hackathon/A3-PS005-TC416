import React, { useState } from "react";
import { RouteBaseline } from "../types";
import { Search, Globe, Route } from "lucide-react";

interface RoutesTableProps {
  routes: RouteBaseline[];
  onCheckRPKI: (prefix: string, asn: string) => void;
}

export const RoutesTable: React.FC<RoutesTableProps> = ({ routes, onCheckRPKI }) => {
  const [search, setSearch] = useState("");

  const filteredRoutes = routes.filter((r) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return r.prefix.toLowerCase().includes(s) || r.origin_asn.toLowerCase().includes(s);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header & Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
            Tracked Baselines & Route Inventory ({filteredRoutes.length})
          </h2>
          <p style={{ color: "var(--text-sub)", fontSize: "0.82rem" }}>
            Active baseline routes maintained in persistence. New route announcements are compared against these entries.
          </p>
        </div>

        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search
            size={14}
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }}
          />
          <input
            type="text"
            className="form-input mono-text"
            style={{ paddingLeft: "2rem", fontSize: "0.8rem", height: "34px" }}
            placeholder="Search prefix or AS number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredRoutes.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "3.5rem 1.5rem",
            color: "var(--text-sub)",
          }}
        >
          <Route size={40} color="var(--brand-cyan)" style={{ margin: "0 auto 1rem", opacity: 0.7 }} />
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>No Tracked Baselines Found</p>
          <p style={{ fontSize: "0.82rem", marginTop: "0.35rem", color: "var(--text-dim)" }}>
            Seed baseline routes by running synthetic scenarios or submitting manual route observations.
          </p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>CIDR NETWORK PREFIX</th>
                <th>BASELINE REFERENCE ORIGIN</th>
                <th>OBSERVATION COUNT</th>
                <th>FIRST SEEN (UTC)</th>
                <th>LAST SEEN (UTC)</th>
                <th style={{ textAlign: "right" }}>RPKI VALIDATION</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.map((route) => (
                <tr key={route.prefix}>
                  <td className="mono-text" style={{ fontWeight: 700, color: "var(--brand-blue)" }}>
                    {route.prefix}
                  </td>
                  <td>
                    <span
                      className="mono-text"
                      style={{
                        background: "var(--badge-green-bg)",
                        color: "var(--badge-green-text)",
                        border: "1px solid var(--badge-green-border)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontWeight: 700,
                      }}
                    >
                      {route.origin_asn}
                    </span>
                  </td>
                  <td className="mono-text" style={{ color: "#cbd5e1" }}>
                    <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{route.observation_count}</span> announcements
                  </td>
                  <td className="mono-text" style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    {route.first_seen.replace("T", " ").replace("Z", "")}
                  </td>
                  <td className="mono-text" style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    {route.last_seen.replace("T", " ").replace("Z", "")}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                      onClick={() => onCheckRPKI(route.prefix, route.origin_asn)}
                    >
                      <Globe size={13} color="var(--brand-cyan)" />
                      Verify RPKI
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
