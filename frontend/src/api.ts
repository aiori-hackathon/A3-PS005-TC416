import {
  AlertItem,
  CryptoStatus,
  EvidenceItem,
  ObservationItem,
  OverviewStats,
  RouteBaseline,
  RPKIResult,
  ScenarioRunResult,
} from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "") + "/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        if (typeof errJson.detail === "object") {
          errorDetail = errJson.detail.message || JSON.stringify(errJson.detail);
        } else {
          errorDetail = errJson.detail;
        }
      }
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  getOverview: () => request<OverviewStats>("/overview"),

  getObservations: (limit = 20, offset = 0, prefix?: string) => {
    const q = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (prefix) q.append("prefix", prefix);
    return request<{ items: ObservationItem[]; total: number; limit: number; offset: number }>(
      `/observations?${q.toString()}`
    );
  },

  getRoutes: (limit = 100, offset = 0, search?: string) => {
    const q = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (search) q.append("search", search);
    return request<{ items: RouteBaseline[]; total: number; limit: number; offset: number }>(
      `/routes?${q.toString()}`
    );
  },

  getAlerts: (limit = 100, offset = 0, status?: string, kind?: string) => {
    const q = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (status) q.append("status", status);
    if (kind) q.append("kind", kind);
    return request<{ items: AlertItem[]; total: number; limit: number; offset: number }>(
      `/alerts?${q.toString()}`
    );
  },

  getAlertDetail: (alertId: string) =>
    request<{ alert: AlertItem; evidence: EvidenceItem | null }>(`/alerts/${alertId}`),

  updateAlertStatus: (alertId: string, status: string) =>
    request<{ id: string; status: string; updated: boolean }>(`/alerts/${alertId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  submitObservation: (data: {
    prefix: string;
    origin_asn: string | number;
    collector?: string;
    scenario?: string;
    metadata?: Record<string, any>;
  }) =>
    request<{
      observation_id: number;
      prefix: string;
      origin_asn: string;
      status: string;
      alerts_count: number;
      alerts: any[];
    }>("/observations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  runScenario: (name: string) => request<ScenarioRunResult>(`/scenarios/${name}`, { method: "POST" }),

  getEvidenceList: (limit = 100, offset = 0) =>
    request<{ items: EvidenceItem[]; total: number }>(`/evidence?limit=${limit}&offset=${offset}`),

  getEvidenceById: (id: string) => request<EvidenceItem>(`/evidence/${id}`),

  signEvidence: (id: string) =>
    request<{
      evidence_id: string;
      algorithm: string;
      signature: string;
      public_key: string;
      signer_status: string;
    }>(`/evidence/${id}/sign`, { method: "POST" }),

  verifyEvidenceHash: (record: Record<string, any>, expectedHash: string) =>
    request<{
      valid: boolean;
      computed_hash: string;
      expected_hash: string;
      algorithm: string;
      integrity_verified: boolean;
    }>("/evidence/verify-hash", {
      method: "POST",
      body: JSON.stringify({ record, expected_hash: expectedHash }),
    }),

  verifyEvidenceSignature: (record: Record<string, any>, signature: string, publicKey: string) =>
    request<{
      valid: boolean;
      algorithm: string;
      signer_authenticated: boolean;
    }>("/evidence/verify", {
      method: "POST",
      body: JSON.stringify({ record, signature, public_key: publicKey }),
    }),

  getCryptoStatus: () => request<CryptoStatus>("/crypto/status"),

  validateRPKI: (prefix: string, asn: string) => {
    const q = new URLSearchParams({ prefix, asn });
    return request<RPKIResult>(`/rpki/validate?${q.toString()}`);
  },

  submitWithdrawal: (data: {
    prefix: string;
    peer_as?: string | number;
    peer_ip?: string;
    collector?: string;
    scenario?: string;
    metadata?: Record<string, any>;
  }) =>
    request<{
      message: string;
      prefix: string;
      resolved_alerts: any[];
      unresolved_alerts: any[];
      recovered_candidate_routes: number;
      result: any;
    }>("/withdrawals", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
