import React, { useState } from "react";
import {
  Lock,
  ShieldCheck,
  FileCheck2,
  Cpu,
  Search,
  Sparkles,
  X,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { useHoraqStore } from "../stores/useHoraqStore";
import { EvidenceItem } from "../types";

export const EvidenceVaultView: React.FC = () => {
  const { evidence, cryptoStatus, setSelectedEvidence, searchQuery, setSearchQuery, seedDemoDataAction } = useHoraqStore();
  const [localSearch, setLocalSearch] = useState("");

  const activeFilter = localSearch || searchQuery;

  const filtered = evidence.filter((item) => {
    if (!activeFilter) return true;
    const term = activeFilter.toLowerCase();
    return (
      item.id.toLowerCase().includes(term) ||
      item.alert_id.toLowerCase().includes(term) ||
      item.record_hash.toLowerCase().includes(term) ||
      (item.record.prefix && item.record.prefix.toLowerCase().includes(term))
    );
  });

  const signedCount = evidence.filter(
    (e) => e.signer_status === "SIGNED" || Boolean(e.signature)
  ).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-text-main tracking-tight">
              Cryptographic Evidence Vault
            </h2>
            <span className="badge badge-idle font-mono text-[11px]">
              RFC 8785 + FIPS 204
            </span>
          </div>
          <p className="text-xs text-text-sub mt-0.5">
            Immutable, canonicalized forensic audit trail with SHA-256 digests and ML-DSA-65 post-quantum non-repudiation.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-input border border-border-card text-xs text-text-sub w-64 relative">
          <Search className="w-3.5 h-3.5 text-text-sub shrink-0" />
          <input
            type="text"
            placeholder="Search hash, ID, prefix..."
            value={activeFilter}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              setSearchQuery(e.target.value);
            }}
            className="bg-transparent border-none outline-none text-xs text-text-main w-full placeholder:text-text-dim pr-4"
          />
          {activeFilter && (
            <button
              onClick={() => {
                setLocalSearch("");
                setSearchQuery("");
              }}
              className="absolute right-2 text-text-dim hover:text-text-main"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="card-panel p-4 flex items-center gap-3.5 card-accent-blue">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-brand-blue shrink-0">
            <Lock className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] text-text-dim font-semibold uppercase tracking-wider">Vault Records</div>
            <div className="text-xl font-bold text-text-main tracking-tight">{evidence.length} Immutable Blocks</div>
          </div>
        </div>

        <div className="card-panel p-4 flex items-center gap-3.5 card-accent-green">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] text-text-dim font-semibold uppercase tracking-wider">Canonical RFC 8785</div>
            <div className="text-xl font-bold text-status-green tracking-tight">100% Deterministic</div>
          </div>
        </div>

        <div className="card-panel p-4 flex items-center gap-3.5 card-accent-blue">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Cpu className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] text-text-dim font-semibold uppercase tracking-wider">Post-Quantum Signatures</div>
            <div className="text-xl font-bold text-purple-400 tracking-tight">
              {signedCount} / {evidence.length} Signed
            </div>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="card-panel overflow-hidden border-border-card">
        <div className="px-5 py-3 border-b border-border-card flex items-center justify-between bg-bg-app">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-brand-blue" />
            <span className="text-xs font-bold text-text-main">
              Canonical Evidence Ledger ({filtered.length})
            </span>
          </div>
          <span className="text-[11px] text-text-dim font-mono">
            Algorithm: {cryptoStatus?.algorithm || "ML-DSA-65"} + SHA-256
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-brand-blue flex items-center justify-center mx-auto border border-sky-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-main">
                No evidence records found
              </div>
              <p className="text-xs text-text-sub mt-1 max-w-sm mx-auto">
                Evidence packets are automatically minted and canonicalized whenever a BGP anomaly is detected.
              </p>
            </div>
            <button
              onClick={() => seedDemoDataAction()}
              className="btn btn-primary text-xs mt-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seed Benchmark Incidents</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-app border-b border-border-card text-text-dim text-[11px] uppercase tracking-wider select-none">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Evidence ID</th>
                  <th className="py-2.5 px-4 font-semibold">Target Prefix</th>
                  <th className="py-2.5 px-4 font-semibold">Observed ASN</th>
                  <th className="py-2.5 px-4 font-semibold">SHA-256 Digest</th>
                  <th className="py-2.5 px-4 font-semibold">Signature</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-card font-mono text-[11px]">
                {filtered.map((item) => {
                  const isSigned =
                    item.signer_status === "SIGNED" || Boolean(item.signature);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-bg-hover-row transition-colors group cursor-pointer"
                      onClick={() => setSelectedEvidence(item)}
                    >
                      <td className="py-3 px-4 text-text-main font-semibold">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Lock className="w-3 h-3 text-brand-blue" />
                          <span>{item.id.substring(0, 8)}...</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-brand-blue font-semibold">
                        {item.record.prefix || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-text-sub">
                        {item.record.observed_asn || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-emerald-400 break-all max-w-xs truncate" title={item.record_hash}>
                        {item.record_hash.substring(0, 16)}...
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`badge text-[10px] py-0 px-2 ${
                            isSigned ? "badge-success" : "badge-amber"
                          }`}
                        >
                          {isSigned ? "PQ-SIGNED" : "UNSIGNED"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvidence(item);
                          }}
                          className="btn btn-secondary text-xs px-2.5 py-1"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3 text-brand-blue ml-1" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
