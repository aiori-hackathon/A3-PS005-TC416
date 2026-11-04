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
  resolved_alerts?: number;
  acknowledged_alerts?: number;
  unresolved_alerts?: number;
  total_evidence?: number;
  signed_evidence?: number;
  latest_observation_time: string | null;
  latest_collector?: string | null;
  crypto_status: CryptoStatus;
  database: string;
  total_incidents?: number;
  active_incidents?: number;
  data_mode?: string;
  mode_label?: string;
  operating_mode?: "LIVE" | "SYNTHETIC" | "HISTORICAL" | string;
  demo_mode?: boolean;
  evaluation_mode?: string;
  collector_status?: {
    enabled: boolean;
    running: boolean;
    connected: boolean;
    health_state?: "CONNECTED" | "CONNECTED_NO_RECENT_UPDATES" | "DISCONNECTED" | "STALE_OR_UNKNOWN" | string;
    url?: string;
    messages_received?: number;
    messages_parsed?: number;
    messages_skipped?: number;
    withdrawals_received?: number;
    peer_state_events?: number;
    last_message_at?: string | null;
    last_transport_message_at?: string | null;
    last_valid_ris_message_at?: string | null;
    last_parsed_update_at?: string | null;
    last_peer_state_event_at?: string | null;
    last_error?: string | null;
    heartbeat_timeout_sec?: number;
  };
}

export interface IncidentItem {
  id: string;
  correlation_key: string;
  kind: "ORIGIN_CHANGE" | "SUBPREFIX_ANOMALY" | string;
  prefix: string;
  observed_asn: string;
  baseline_asn: string | null;
  parent_prefix: string | null;
  rule_name: string;
  rule_version: string;
  first_seen: string;
  last_seen: string;
  event_count: number;
  recurrence_count: number;
  lifecycle_classification: "TRANSIENT" | "PERSISTENT" | "RECURRENT" | "INSUFFICIENT_VISIBILITY" | string;
  status: "ACTIVE" | "RESOLVED" | string;
  recovery_status: "UNCONFIRMED" | "PARTIAL" | "CONFIRMED" | string;
  associated_peer_sessions: string[];
  source_collectors: string[];
  latest_alert_id: string | null;
  latest_evidence_id: string | null;
  created_at: string;
  updated_at: string;
  alerts?: AlertItem[];
}

export interface ObservationItem {
  id: number;
  prefix: string;
  origin_asn: string;
  collector: string;
  observed_at: string;
  scenario?: string | null;
  peer_as?: string | null;
  peer_ip?: string | null;
  peer_session?: string | null;
  created_at: string;
  baseline_asn?: string | null;
  baseline_status?: string | null;
  alert_id?: string | null;
  alert_kind?: string | null;
  alert_status?: string | null;
  alert_severity?: string | null;
  evidence_id?: string | null;
}


export interface RouteBaseline {
  prefix: string;
  origin_asn: string;
  first_seen: string;
  last_seen: string;
  observation_count: number;
  updated_at: string;
  status?: "PROMOTED" | "CANDIDATE" | "WITHDRAWN";
  peer_count?: number;
  distinct_peers?: string[];
  distinct_peer_asns?: string[];
  peer_asn_count?: number;
  distinct_collectors?: string[];
  collector_count?: number;
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
  confidence?: string;
  uncertainty_reason?: string;
  active_peers?: string[];
  withdrawn_peers?: string[];
  recovery_status?: "UNCONFIRMED" | "PARTIAL" | "CONFIRMED";
  incident_id?: string | null;
  lifecycle_classification?: "TRANSIENT" | "PERSISTENT" | "RECURRENT" | string;
  peer_session_count?: number;
  peer_asn_count?: number;
  collector_count?: number;
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
  observation_id?: number | null;
  supporting_observation_ids?: number[];
  rule_version?: string;
  peer_session?: string | null;
  corroboration_summary?: {
    distinct_peer_sessions: number;
    distinct_peer_asns: number;
    distinct_collectors: number;
    session_details: string[];
  };
  uncertainty_gaps?: string[];
  trust_statement?: string;
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
  status: "VALID" | "INVALID" | "UNKNOWN" | "UNAVAILABLE" | "HISTORICAL_RPKI_UNAVAILABLE" | string;
  raw_status?: string;
  context_mode?: "CURRENT_LOOKUP_CONTEXT" | "HISTORICAL_REPLAY" | "HISTORICAL_TIME_MATCHED_SNAPSHOT" | string;
  lookup_time: string | null;
  snapshot_timestamp?: string | null;
  provider: string;
  details: string;
  semantics_note?: string;
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
  alerts_resolved?: number;
  success?: boolean;
  prefix?: string;
  peer_as?: string;
  result?: any;
}

export interface BaselineHistoryItem {
  id: number;
  prefix: string;
  origin_asn: string;
  prior_status: string | null;
  new_status: string;
  transition_type: string;
  reason: string;
  peer_count: number;
  observation_count: number;
  triggering_observation_id: number | null;
  actor: string;
  created_at: string;
}
