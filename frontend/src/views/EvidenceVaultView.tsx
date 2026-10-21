import React, { useState } from "react";
import {
  Lock,
  ShieldCheck,
  FileCheck2,
  Cpu,
  Search,
  Sparkles,
  X,
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
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-text-main tracking-tight">
              Cryptographic Evidence Vault
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-brand-blue border border-sky-500/20">
              RFC 8785 + FIPS 204
            </span>
          </div>
          <p className="text-xs text-text-sub mt-0.5">
            Immutable, canonicalized forensic audit trail with SHA-256 digests and ML-DSA-65 post-quantum non-repudiation.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-input border border-border-card text-xs text-text-sub w-64 relative">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card-panel p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center text-brand-blue shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-dim font-medium">Vault Records</div>
            <div className="text-lg font-bold text-text-main">{evidence.length}</div>
          </div>
        </div>

        <div className="card-panel p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-dim font-medium">Canonical RFC 8785</div>
            <div className="text-lg font-bold text-emerald-400">100% Deterministic</div>
          </div>
        </div>

        <div className="card-panel p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-dim font-medium">Quantum Signer</div>
            <div className="text-lg font-bold text-purple-400">
              {cryptoStatus?.algorithm || "ML-DSA-65"}
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="card-panel overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 text-xs text-text-dim font-medium px-4 py-2.5 border-b border-border-card">
          <span className="col-span-3">Evidence ID</span>
          <span className="col-span-2">Alert ID</span>
          <span className="col-span-4">SHA-256 Record Hash</span>
          <span className="col-span-2">Signature</span>
          <span className="col-span-1 text-right">Inspect</span>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border-item">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center space-y-3">
              <p className="text-xs text-text-sub">
                No matching evidence records found in the vault.
              </p>
              <button
                onClick={() => seedDemoDataAction()}
                className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-brand-blue text-xs font-semibold hover:bg-sky-500/20 transition-colors inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Seed Evidence Records</span>
              </button>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-bg-hover-row transition-colors"
              >
                <span className="col-span-3 font-mono text-[11px] text-text-main font-semibold flex items-center gap-1.5 truncate">
                  <FileCheck2 className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                  <span title={item.id}>{item.id}</span>
                </span>
                <span className="col-span-2 font-mono text-[11px] text-text-sub truncate" title={item.alert_id}>
                  {item.alert_id.slice(0, 14)}...
                </span>
                <span className="col-span-4 font-mono text-[11px] text-emerald-400 truncate pr-2" title={item.record_hash}>
                  {item.record_hash}
                </span>
                <span className="col-span-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      item.signature
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-bg-app border border-border-card text-brand-blue"
                    }`}
                  >
                    {item.signature ? "SIGNED (ML-DSA)" : item.algorithm}
                  </span>
                </span>
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => setSelectedEvidence(item)}
                    className="px-2.5 py-1 rounded bg-bg-btn border border-border-card hover:bg-bg-nav-hover text-brand-blue hover:text-text-main text-[11px] font-semibold transition-colors cursor-pointer"
                    title="Inspect RFC 8785 Canonical JSON & Test Tamper Resistance"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
