export interface CryptoStatus {
  available: boolean;
  algorithm: string;
  mechanism: string;
  provider: string;
  status: string;
  message: string;
}

export interface OverviewStats {
  tracked_routes: number;
  total_observations: number;
  total_alerts: number;
  active_alerts: number;
  latest_observation_time: string | null;
  crypto_status: CryptoStatus;
  database: string;
  data_mode?: string;
  mode_label?: string;
}

export interface RouteBaseline {
  prefix: string;
  origin_asn: string;
  first_seen: string;
  last_seen: string;
  observation_count: number;
  updated_at: string;
}

export interface AlertItem {
  id: string;
  created_at: string;
  severity: "HIGH" | "MEDIUM" | "LOW" | "INFO";
  kind: "ORIGIN_CHANGE" | "SUBPREFIX_ANOMALY";
  prefix: string;
  observed_asn: string;
  baseline_asn: string | null;
  parent_prefix: string | null;
  title: string;
  explanation: string;
  evidence_id: string;
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  collector: string;
  scenario: string | null;
}

export interface EvidenceRecord {
  schema_version: string;
  alert_id: string;
  timestamp: string;
  rule: string;
  severity: string;
  prefix: string;
  observed_asn: string;
  baseline_asn: string | null;
  parent_prefix: string | null;
  collector: string;
  scenario: string | null;
  explanation: string;
  context: Record<string, any>;
}

export interface EvidenceItem {
  id: string;
  alert_id: string;
  schema_version: string;
  canonical_json: string;
  record_hash: string;
  algorithm: string;
  signature: string | null;
  public_key: string | null;
  signer_status: "UNSIGNED" | "SIGNED" | "PROVIDER_UNAVAILABLE";
  created_at: string;
  record: EvidenceRecord;
}

export interface RPKIResult {
  prefix: string;
  origin_asn: string;
  status: "VALID" | "INVALID" | "UNKNOWN" | "UNAVAILABLE";
  raw_status?: string;
  lookup_time: string;
  provider: string;
  details: string;
  validating_roas: Array<{
    origin: string;
    prefix: string;
    max_length: number;
    validity: string;
  }>;
}

export interface ScenarioRunResult {
  scenario: string;
  description: string;
  alerts_generated: number;
  expected_alerts: number;
  result?: any;
}
