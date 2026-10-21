import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Layers,
  Network,
  Info,
  ExternalLink,
  Zap,
} from "lucide-react";
import { AlertItem } from "../types";

interface BGPTopologyGraphProps {
  alert: AlertItem;
}

export const BGPTopologyGraph: React.FC<BGPTopologyGraphProps> = ({ alert }) => {
  const [viewMode, setViewMode] = useState<"topology" | "cidr">("topology");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const isOriginChange = alert.kind === "ORIGIN_CHANGE";
  const baselineAsn = alert.baseline_asn || "AS64496";
  const rogueAsn = alert.observed_asn || "AS64511";
  const prefix = alert.prefix;

  // Derive subprefix details if applicable
  const isSubprefix = alert.kind === "SUBPREFIX_ANOMALY";
  const parentPrefix = isSubprefix ? alert.parent_prefix || "198.51.100.0/24" : prefix;
  const childPrefix = isSubprefix ? prefix : "";

  return (
    <div className="rounded-xl border border-border-card bg-bg-app overflow-hidden shadow-inner my-2">
      {/* Top Bar / Mode Selector */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-border-card bg-bg-card/70 text-xs">
        <div className="flex items-center gap-2">
          <Network className="w-3.5 h-3.5 text-brand-blue" />
          <span className="font-semibold text-text-main">
            {isOriginChange
              ? "BGP AS-Path Divergence Topology"
              : "Subprefix Longest-Prefix-Match (LPM) Hijack Graph"}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-bg-input border border-border-card text-text-dim">
            LIVE SIMULATION
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("topology")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              viewMode === "topology"
                ? "bg-bg-nav-active text-text-main font-semibold shadow-xs"
                : "text-text-sub hover:text-text-main"
            }`}
          >
            <Network className="w-3 h-3" />
            <span>AS Topology</span>
          </button>
          {isSubprefix && (
            <button
              onClick={() => setViewMode("cidr")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                viewMode === "cidr"
                  ? "bg-bg-nav-active text-text-main font-semibold shadow-xs"
                  : "text-text-sub hover:text-text-main"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>CIDR Containment</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Diagram Area */}
      {viewMode === "topology" ? (
        <div className="p-4 relative select-none">
          {/* SVG Topology Visualizer */}
          <div className="w-full h-56 flex items-center justify-center">
            <svg
              className="w-full h-full max-w-2xl"
              viewBox="0 0 700 220"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Glow Filter for Attack Vector */}
                <filter id="red-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="blue-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="normalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="attackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>

              {/* Background ambient grid lines */}
              <line x1="40" y1="110" x2="660" y2="110" stroke="var(--border-sub)" strokeDasharray="4 4" strokeWidth="1" />

              {/* PATH 1: Upstream -> Authorized Origin (Legitimate Path) */}
              <path
                d="M 170 110 C 260 110, 320 50, 430 50"
                stroke="url(#normalGrad)"
                strokeWidth="2.5"
                fill="none"
                filter="url(#blue-glow)"
              />
              <circle cx="300" cy="80" r="3" fill="#38bdf8">
                <animate
                  attributeName="cx"
                  values="170;430"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cy"
                  values="110;50"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* PATH 2: Upstream -> Rogue Origin (Attack Vector) */}
              <path
                d="M 170 110 C 260 110, 320 170, 430 170"
                stroke="url(#attackGrad)"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                fill="none"
                filter="url(#red-glow)"
              />
              {/* Pulsing Attack Dot */}
              <circle cx="300" cy="140" r="3.5" fill="#ef4444">
                <animate
                  attributeName="cx"
                  values="170;430"
                  dur="1.3s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cy"
                  values="110;170"
                  dur="1.3s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* NODE 1: Upstream Transit (Tier-1 ISP) */}
              <g
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode("transit")}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle cx="110" cy="110" r="38" fill="var(--bg-card)" stroke="var(--border-card)" strokeWidth="2" />
                <circle cx="110" cy="110" r="28" fill="var(--bg-input)" />
                <text x="110" y="105" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="700">
                  AS174
                </text>
                <text x="110" y="120" textAnchor="middle" fill="var(--text-dim)" fontSize="8" fontWeight="500">
                  Tier-1 Upstream
                </text>
                <text x="110" y="132" textAnchor="middle" fill="var(--brand-blue)" fontSize="7" fontWeight="600">
                  Global Transit
                </text>
              </g>

              {/* DIVERGENCE SPLIT BADGE */}
              <g transform="translate(250, 96)">
                <rect width="64" height="24" rx="12" fill="var(--bg-card)" stroke="var(--border-card)" strokeWidth="1" />
                <text x="32" y="15" textAnchor="middle" fill="var(--text-dim)" fontSize="9" fontWeight="600">
                  SPLIT BGP
                </text>
              </g>

              {/* NODE 2: Authorized Origin (Baseline) */}
              <g
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode("legit")}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle cx="480" cy="50" r="38" fill="var(--bg-card)" stroke="#10b981" strokeWidth="2" />
                <circle cx="480" cy="50" r="28" fill="rgba(16, 185, 129, 0.08)" />
                <text x="480" y="46" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="700">
                  {baselineAsn}
                </text>
                <text x="480" y="60" textAnchor="middle" fill="var(--text-sub)" fontSize="8" fontWeight="500">
                  Legitimate Origin
                </text>
                <text x="480" y="72" textAnchor="middle" fill="#059669" fontSize="7" fontWeight="700">
                  ROA VALID
                </text>
              </g>

              {/* Authorized Prefix Tag */}
              <g transform="translate(540, 38)">
                <rect width="130" height="24" rx="6" fill="var(--bg-card)" stroke="#10b981" strokeWidth="1" />
                <text x="65" y="16" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontFamily="monospace" fontWeight="600">
                  {parentPrefix}
                </text>
              </g>

              {/* NODE 3: Rogue Hijacker AS */}
              <g
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode("rogue")}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle cx="480" cy="170" r="38" fill="var(--bg-card)" stroke="#ef4444" strokeWidth="2" />
                <circle cx="480" cy="170" r="28" fill="rgba(239, 68, 68, 0.1)" />
                <text x="480" y="166" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="700">
                  {rogueAsn}
                </text>
                <text x="480" y="180" textAnchor="middle" fill="var(--text-sub)" fontSize="8" fontWeight="500">
                  Unauthorized Origin
                </text>
                <text x="480" y="192" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="700">
                  ATTACK VECTOR
                </text>
              </g>

              {/* Rogue Announced Prefix Tag */}
              <g transform="translate(540, 158)">
                <rect width="130" height="24" rx="6" fill="#2a1316" stroke="#ef4444" strokeWidth="1" />
                <text x="65" y="16" textAnchor="middle" fill="#f87171" fontSize="10" fontFamily="monospace" fontWeight="700">
                  {isSubprefix ? childPrefix : prefix}
                </text>
              </g>
            </svg>
          </div>

          {/* Interactive Node Info Box */}
          <div className="mt-2 pt-2 border-t border-border-card/60 flex items-center justify-between text-xs text-text-sub">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Legitimate: <strong className="text-text-main">{baselineAsn}</strong> (ROA Authorized)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>Rogue Hijacker: <strong className="text-red-400">{rogueAsn}</strong> ({isOriginChange ? "Origin Conflict" : "More-Specific Subnet Drain"})</span>
            </div>
          </div>
        </div>
      ) : (
        /* CIDR Containment Map */
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-main flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-blue" />
                <span>Supernet Scope: <strong className="font-mono text-brand-blue">{parentPrefix}</strong></span>
              </span>
              <span className="text-[11px] text-text-dim font-mono">256 IP Addresses (/24)</span>
            </div>

            {/* Visual Containment Bar */}
            <div className="w-full h-10 rounded-lg bg-bg-card border border-border-card p-1 flex items-center gap-1 relative overflow-hidden">
              {/* Hijacked Child Subnet (/28 = 16 IPs = 6.25% of /24) */}
              <div
                className="h-full rounded bg-red-500/20 border border-red-500/60 flex items-center justify-center text-red-400 font-mono text-[10px] font-bold px-2 relative group cursor-pointer transition-all hover:bg-red-500/30"
                style={{ width: "16%" }}
                title={`Subprefix: ${childPrefix} (16 IPs) - Intercepted by ${rogueAsn}`}
              >
                <Zap className="w-3 h-3 text-red-400 mr-1 animate-pulse" />
                <span>{childPrefix}</span>
              </div>

              {/* Remaining Legitimate Address Space */}
              <div
                className="h-full rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-status-green font-mono text-[10px] font-semibold flex-1"
              >
                <span>Authorized Supernet Remainder (240 IPs) — {baselineAsn}</span>
              </div>
            </div>
          </div>

          {/* Longest Prefix Match (LPM) Rule Notice */}
          <div className="p-3 rounded-lg bg-bg-card border border-border-card flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-text-sub space-y-1">
              <span className="font-semibold text-text-main block">
                Longest Prefix Match (RFC 1812) Vulnerability Exploited
              </span>
              <p className="leading-relaxed">
                Global BGP routers must select the most specific route. Because <code className="font-mono text-text-main bg-bg-app px-1 py-0.5 rounded border border-border-card">{childPrefix}</code> (/28) has a longer prefix length than <code className="font-mono text-text-main bg-bg-app px-1 py-0.5 rounded border border-border-card">{parentPrefix}</code> (/24), all traffic for the targeted 16 IP addresses is diverted to rogue <strong className="text-red-400">{rogueAsn}</strong>, completely bypassing the legitimate origin!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
