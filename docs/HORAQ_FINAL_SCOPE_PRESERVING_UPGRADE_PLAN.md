# HORA-Q — Final Scope-Preserving Engineering Upgrade Plan

**Project:** HORA-Q — Explainable BGP Origin and Subprefix Anomaly Monitor  
**Hackathon:** AIORI-3 · Track 2 — Cyber Security · PS-005  
**Team:** A3-PS005-TC416  
**Repository:** <https://github.com/aiori-hackathon/A3-PS005-TC416>  
**Document status:** Implementation specification and acceptance checklist  
**Prepared:** 4 November 2026

---

## 0. Executive decision

This is an **implementation-quality upgrade to the existing HORA-Q proposal**, not a replacement proposal and not a new project.

The submitted HORA-Q problem, core architecture, deterministic detection approach, seven-stage workflow, and principal claims remain unchanged. The upgrade strengthens the accuracy of the existing pipeline, improves the quality of evidence, and makes the evaluation more reproducible.

### The non-negotiable scope contract

- [ ] Preserve the submitted problem: detection of suspicious BGP origin-AS changes and more-specific subprefix announcements.
- [ ] Preserve deterministic, rule-based detection. **Do not add an ML, deep-learning, LLM, or AI scoring detector.**
- [ ] Preserve the existing candidate-baseline protection and the ordinary promotion policy of at least **2 distinct peers and 3 observations**. Improve the correctness of how distinct peers are identified; do not silently change the thresholds.
- [ ] Preserve append-only baseline transition history and peer-aware withdrawal recovery.
- [ ] Preserve explanation, evidence provenance, RPKI context, RFC 8785 canonical JSON, SHA-256, ML-DSA-65, and independent verification.
- [ ] Preserve read-only monitoring. Do not add BGP route injection, automatic route changes, or automatic blocking.
- [ ] Preserve the proposal's seven stages. Improvements below belong inside those existing stages.
- [ ] Do not rewrite, replace, or quietly amend the submitted proposal PDF, problem statement, project identity, or central architecture.
- [ ] Do not conceal material implementation changes. Keep a concise engineering changelog and describe what was actually implemented during evaluation.
- [ ] Keep live BGP collection optional. Default regression and evaluator tests must run with synthetic fixtures and historical replay, without depending on a live network feed.

**Final engineering objective:** make HORA-Q more trustworthy about *what it observed, where it observed it, how independently it was corroborated, how long it persisted, and exactly which observations support its signed evidence*.

---

## 1. What the research indicates

The research below is used as engineering context, not as a substitute for the submitted proposal. Community posts are anecdotal practitioner discussion; technical documentation and published measurement work carry more weight for implementation decisions.

### 1.1 Public practitioner discussions

| Source | Discussion or finding | HORA-Q implication |
|---|---|---|
| Reddit, r/networkautomation — RouteCause project discussion (7 September 2026) | A public project author describes deterministic BGP incident analysis over historical MRT data, with exact update records used as evidence. This is one project author's account, not a consensus survey. | Preserve deterministic analysis; make source records and replay parameters directly traceable from the incident dossier. |
| Reddit, r/networking — BGP route-change monitoring discussion (April 2023) | Operators discuss router logs, BGP Monitoring Protocol (BMP), route history, external visibility and tools such as BGPalerter. | Explain the limits of public collector visibility and retain the observation source for every event. |
| Reddit, r/networking — upstream-AS/session visibility discussion (23 August 2026) | A user distinguishes prefix withdrawals from loss of an upstream BGP session. | Keep route withdrawal, collector transport failure, and peer/session visibility loss as distinct event types. |
| Reddit, r/networking — transit monitoring discussion (19–20 August 2026) | Operators discuss monitoring traffic and routing behaviour per upstream provider rather than treating all providers as one view. | Preserve collector and peer identity separately; avoid overclaiming that a small number of observations represent the global Internet. |
| LinkedIn — RAVEN BGP Routing Security Monitor announcement by Ritesh Mukherjee (2026) | Describes a separate tool correlating router BMP data with RPKI/RTR and ASPA path validation, with operational dashboards and metrics. | Treat this as an example of the broader ecosystem's operational needs. Do **not** expand HORA-Q into BMP/ASPA path validation; that would be a separate scope. |
| LinkedIn — ASPA and route-leak post by David Roy (2026) | Discusses ASPA as a mechanism for AS_PATH/provider-authorization validation. | Be explicit that HORA-Q's RPKI origin context does not validate the complete AS_PATH. ASPA remains out of scope for this proposal-preserving upgrade. |

### 1.2 Technical sources

1. **RIPE RIS Live Manual:** `require` is an optional filter that only includes messages containing a specified key. The manual separately documents `announcements` and `withdrawals`, and shows that an UPDATE can contain announcements, withdrawals, or both. This directly informs the collector correction in Section 3.  
   <https://ris-live.ripe.net/manual/>
2. **APNIC, “Ephemeral leaks and automated BGP route leak detection” (25 May 2026):** discusses short-lived routing anomalies during convergence and the risk of treating every transient event as a sustained operational incident.  
   <https://blog.apnic.net/2026/05/25/ephemeral-leaks-and-automated-bgp-route-leak-detection/>
3. **APNIC, “Noisy routers: Investigating the make-up of route collector data” (16 April 2026):** reports analysis of more than 80 billion RouteViews updates and concentration of repeated announcements among a small fraction of peers, sessions and prefixes. Repeated updates should not be mistaken for independent corroboration.  
   <https://blog.apnic.net/2026/04/16/noisy-routers-investigating-the-make-up-of-route-collector-data/>
4. **BGPalerter configuration documentation:** documents minimum-peer thresholds, a temporary aggregation/fade-off period to accommodate propagation, and a separate visibility monitor. This is a useful operational reference, not a specification HORA-Q must copy.  
   <https://github.com/nttgin/BGPalerter/blob/main/docs/configuration.md>
5. **BGPalerter example configuration:** illustrates peer-threshold and visibility-monitor configuration.  
   <https://github.com/nttgin/BGPalerter/blob/main/config.yml.example>

### 1.3 Research limitations

- Public Reddit threads are useful for identifying operational pain points, but commenters' identities and professional credentials are not necessarily independently verified.
- Public LinkedIn posts are attributable to their authors, but a post is not automatically a peer-reviewed technical source.
- No private, invite-only, credentialed, or Tor-only forum access is claimed in this document. The research uses publicly accessible material only.
- No recommendation in this plan depends on an unverified claim from a private forum.

---

## 2. Repository baseline and verified code observations

The implementation paths below were checked against the repository's default-branch source during preparation of this plan. Before coding, the implementation agent must re-fetch the latest `main` and record its exact commit SHA; this document is not a substitute for checking whether the repository has changed since preparation.

### 2.1 Files directly relevant to the upgrade

| Repository path | Existing responsibility | Upgrade relevance |
|---|---|---|
| `backend/horaq/collector.py` | RIS Live subscription, parsing, connection loop, withdrawal handling and collector telemetry | Withdrawal subscription completeness, source identifiers, collector health |
| `backend/horaq/detection.py` | Origin-change and subprefix detection, candidate promotion, evidence construction and withdrawal recovery | Peer identity, corroboration correctness, incident lifecycle and provenance |
| `backend/horaq/replay.py` | Historical MRT fixture replay and replay outcome checks | Deterministic timestamp handling and reproducibility |
| `backend/horaq/evidence.py` | RFC 8785 canonicalization, SHA-256 digest and evidence record creation | Provenance manifest and schema evolution |
| `backend/horaq/rpki.py` | Current RIPEstat origin-validation lookup | Clear current-vs-historical time semantics |
| `backend/horaq/database.py` | SQLite persistence and baseline history | Additive migrations and incident-observation relationships |
| `verify_evidence.py` | Standalone evidence verifier | Backward-compatible verification of existing and upgraded evidence records |
| `backend/tests/` | Backend regression suite | Deterministic test coverage for every change |
| `frontend/src/` | React/TypeScript operator console | Visibility, incident timeline and provenance presentation |
| `audit/PROPOSAL_REQUIREMENTS_MATRIX.md` | Proposal-to-code-to-UI traceability | Keep existing proposal requirements traceable; update status only after proof |
| `audit/ARCHITECTURE_AS_BUILT.md` | As-built system description | Update only after implementation is real and verified |

### 2.2 Specific findings from the code inspected

#### Finding F-01 — RIS Live subscription filters out withdrawal-only UPDATEs

The collector currently sends a subscription equivalent to:

```python
{
    "type": "ris_subscribe",
    "data": {
        "type": "UPDATE",
        "require": "announcements",
    },
}
```

The RIS Live manual defines `require` as a filter for messages containing a specified key. A withdrawal-only UPDATE does not contain an `announcements` key, so this filter prevents the collector from receiving the withdrawal-only message. This conflicts with the parser's existing support for withdrawal-only messages.

**Required correction:** subscribe to UPDATE messages without the `require: announcements` filter, then let the existing parser classify announcement-only, withdrawal-only, and mixed updates. Do not subscribe to unrelated BGP message types unless a separately approved test demonstrates a need.

#### Finding F-02 — current peer counting can overstate independent corroboration

The detection code currently builds a peer key using the collector and peer ASN, while a separate SQL query counts distinct `COALESCE(peer_as, collector)` values. The code also adds one to prior peer/source counts for the current observation without first checking whether that current observation represents a genuinely new peer/session or collector.

Consequences:

- A repeated observation from the same peer can be treated as additional corroboration in confidence calculations.
- A peer ASN is not a unique peer session identifier.
- A collector vantage point and a peer ASN describe different things and must not be merged into one counter.
- Missing peer identity must not be fabricated from a generic fallback and then counted as a distinct peer.

**Required correction:** calculate the current event's peer-session identity and collector identity explicitly, union them with prior identities, and count only genuinely distinct values.

#### Finding F-03 — historical replay supplies current time when a record timestamp is absent

The replay code currently has a fallback equivalent to:

```python
rec_ts = rec.get("timestamp", int(time.time()))
```

A missing timestamp in an archival record can therefore become the time at which the replay is executed. This makes the record's historical chronology depend on runtime time and weakens reproducibility.

**Required correction:** missing or invalid archival timestamps must produce an explicit incomplete/invalid-input result. Never substitute the current clock for a historical event timestamp.

#### Finding F-04 — evidence records do not yet bind the complete supporting observation provenance

The existing evidence payload includes the alert, timestamp, rule, severity, prefix, observed ASN, baseline ASN, parent prefix, collector, scenario, explanation and context. The detection flow also stores observation information such as peer ASN and peer IP in the observations table.

The forensic upgrade should link the evidence to the precise observation IDs and source metadata that support the alert. The current evidence builder is called before the current observation ID is available in the inspected flow, so the implementation must carefully order or restructure the transaction to avoid creating a provenance reference that cannot be resolved.

#### Finding F-05 — RPKI lookup is current-time context, not historical proof

The current RIPEstat integration records a lookup time and returns explicit `VALID`, `INVALID`, `UNKNOWN`, or `UNAVAILABLE` states. That is useful for a current lookup. It must not be presented as the RPKI state that existed at the time of an old replayed BGP event unless HORA-Q has an actually time-matched historical ROA snapshot.

### 2.3 Baseline verification checklist before any edit

- [ ] Fetch latest `main` and record exact commit SHA in the implementation report.
- [ ] Confirm the paths listed in Section 2.1 still exist; adapt only if files have moved.
- [ ] Run the complete backend test suite and capture the actual count and output.
- [ ] Run the frontend production build/type-check and capture output.
- [ ] Run the existing evaluator lifecycle script.
- [ ] Run the existing sample evidence verification commands, including tamper tests.
- [ ] Save the baseline results before editing. Do not repeat old test counts from documentation as if they were current results.
- [ ] Confirm the submitted proposal document and proposal-defining architecture files are unchanged.

---

## 3. Final upgrade work packages

The work packages are ordered by correctness risk and dependency. Complete and verify each package before beginning the next. All code changes should be additive or narrowly corrective; do not perform a broad rewrite.

# WP-01 — Complete RIS Live UPDATE ingestion

**Priority:** P0 · **Proposal alignment:** existing ingestion, provenance and withdrawal recovery stages  
**Primary file:** `backend/horaq/collector.py`

### Objective

Ensure HORA-Q receives and correctly handles UPDATE messages containing announcements, withdrawals, or both.

### Exact implementation requirements

- [ ] Remove the `require: announcements` restriction from the UPDATE subscription.
- [ ] Keep the subscription type restricted to `UPDATE` for this work package.
- [ ] Add an explicit `build_ris_subscription()` helper, or equivalent pure function, so subscription construction can be tested without opening a WebSocket.
- [ ] Confirm that the subscription includes no key-presence filter that excludes withdrawal-only UPDATEs.
- [ ] Continue using the existing parser to distinguish announcement, withdrawal and mixed-message content.
- [ ] Ensure withdrawals are processed even when the message has no `path` and no `announcements` field.
- [ ] Ensure a mixed UPDATE processes both its withdrawals and announcements; one side must not cause the other side to be discarded.
- [ ] Preserve the peer IP, peer ASN, collector host, message timestamp and RIS message ID when present.
- [ ] Preserve the existing AS_SET handling policy; do not silently convert ambiguous multi-origin AS_SET data into a single origin.
- [ ] Preserve the current explicit error/skipped-message telemetry for malformed or unsupported messages.
- [ ] Do not interpret a collector disconnect as a route withdrawal.

### Required tests

- [ ] Subscription payload is an UPDATE subscription without `require: announcements`.
- [ ] Announcement-only UPDATE is accepted and processed.
- [ ] Withdrawal-only UPDATE is accepted and processed despite missing announcement/path fields.
- [ ] Mixed UPDATE processes every withdrawal and every valid announcement.
- [ ] Empty or malformed UPDATE is skipped with a reason and does not corrupt route state.
- [ ] Missing peer ASN does not falsely resolve every active peer's alert.
- [ ] Multi-peer withdrawal recovery remains partial until every relevant known announcing peer has withdrawn.
- [ ] Existing live-collector parser and recovery tests continue to pass.

### Acceptance criteria

- A fixture representing a withdrawal-only RIS Live UPDATE reaches `process_withdrawal()`.
- The subscription no longer filters out that fixture before parsing.
- No active incident is resolved merely because the WebSocket disconnects or a peer identity is missing.
- No test requires sending real BGP announcements or changing public routing infrastructure.

---

# WP-02 — Correct peer-session identity and corroboration

**Priority:** P0 · **Proposal alignment:** multi-peer candidate promotion, evidence correlation and cautious baseline trust  
**Primary files:** `backend/horaq/detection.py`, `backend/horaq/database.py`, normalization/collector code as required

### Objective

Make the existing peer-diversity and confidence logic count actual independent observations rather than repeated updates, ASN labels, or collector fallbacks.

### Identity model — keep these dimensions separate

1. **Peer session:** a specific peer connection as seen by a specific collector. Preferred stable identity: `(collector_host, peer_ip)`.
2. **Peer ASN:** the autonomous system associated with the peer. Store and count separately; it is not a substitute for a peer-session identity.
3. **Collector vantage point:** the RIS route collector or other observation source. Store and count separately.
4. **Observation:** one source update record. Repeated updates from the same peer are multiple observations but are not multiple peer sessions.

### Exact implementation requirements

- [ ] Add one normalized helper for peer-session identity. Do not rebuild identity strings differently in multiple modules.
- [ ] Use a stable key derived from collector identity and normalized peer IP when both are available.
- [ ] Preserve peer ASN as a separate field.
- [ ] Preserve collector identity as a separate field.
- [ ] If peer IP is missing, mark session identity as unknown. Do not create `collector:peer` or another generic placeholder and count it as an independent session.
- [ ] Decide and document whether an explicitly identified synthetic test peer may use a fixture-provided stable session ID. It must be explicit test data, not a production fallback.
- [ ] Replace the current peer-corroboration query/`+1` calculation with a set-based calculation that includes the current observation only if its identity is genuinely new.
- [ ] Count distinct peer sessions, distinct peer ASNs, distinct collector vantage points, and total observations separately.
- [ ] Keep the candidate-promotion policy at `>= 2` distinct peer sessions AND `>= 3` observations, unless the submitted proposal itself specifies a different exact identity definition. Do not change the numeric thresholds in this upgrade.
- [ ] Repeated announcements from one peer session must increase observation count but must not increase distinct peer-session count.
- [ ] Two peer IPs on the same collector may be two distinct peer sessions, but still one collector vantage point.
- [ ] The same peer ASN seen through two different collector sessions should count as two peer sessions only if the peer IP/collector tuple differs; peer-ASN diversity remains one.
- [ ] A missing peer identity must not count toward the two-peer promotion threshold.
- [ ] Remove or qualify text such as “widespread global propagation” when only a small number of collector/peer observations support it. Prefer exact language such as “observed by two distinct peer sessions across one collector vantage point.”
- [ ] Include the individual identity counts in the explanation/evidence context.

### Database and migration requirements

- [ ] Inspect the actual SQLite schema and migration mechanism before changing it.
- [ ] Implement idempotent, additive migrations. A second migration run must not fail or duplicate columns/indexes.
- [ ] Preserve existing baseline history and all existing observations.
- [ ] Do not delete or reset the evaluator database as a migration shortcut.
- [ ] Define how legacy `distinct_peers` values are interpreted. Do not pretend old `(collector, peer_as)` values are peer-IP session identifiers.
- [ ] If legacy peer identities cannot be reconstructed, mark the legacy identity quality as unknown/legacy rather than silently upgrading their meaning.
- [ ] Add indexes for any new session/collector lookup fields where justified by the actual query plan.
- [ ] Document rollback/backup expectations for the migration.

### Required tests

- [ ] Three updates from the same peer session produce 3 observations and 1 distinct peer session.
- [ ] Two peer IPs from the same collector produce 2 sessions and 1 collector vantage point.
- [ ] Two collectors seeing the same prefix are counted as 2 collector vantage points.
- [ ] Same peer ASN seen from different peer IPs is not misreported as distinct peer-ASN diversity.
- [ ] Missing peer IP does not count as a new peer session.
- [ ] Missing peer ASN does not create a fabricated ASN identity.
- [ ] Candidate does not promote with 3 observations from only 1 session.
- [ ] Candidate promotes only when both existing conditions are satisfied: at least 2 identified peer sessions and at least 3 observations.
- [ ] Duplicate/replayed observations do not artificially increase session diversity.
- [ ] Confidence text matches the underlying counts and does not overclaim global visibility.
- [ ] All existing baseline poisoning protections and authorized-seed behavior remain unchanged.

### Acceptance criteria

- A repeated update from one session can never satisfy the peer-diversity condition by itself.
- The database, API and UI expose different peer-session, peer-ASN and collector counts without conflating them.
- Existing promotion thresholds and baseline safety invariants are unchanged.

---

# WP-03 — Make archival replay deterministic and time-honest

**Priority:** P0 · **Proposal alignment:** historical replay and reproducible evaluation  
**Primary file:** `backend/horaq/replay.py`

### Objective

Make replay output depend only on the input archive/fixture and explicit replay configuration, not the machine clock or accidental record ordering.

### Exact implementation requirements

- [ ] Remove the fallback that substitutes `int(time.time())` for a missing archival record timestamp.
- [ ] Validate that every replay event has a valid source timestamp before processing it.
- [ ] Return an explicit `INCOMPLETE_DATA` or `INVALID_INPUT` result when timestamps are missing, malformed, or outside the supported range. Do not silently repair source records.
- [ ] Validate whether records are already in chronological order.
- [ ] Preserve the original record index/sequence from the source fixture.
- [ ] Define deterministic handling for equal timestamps: preserve source order using the original record index as the stable tie-breaker.
- [ ] If a fixture is out of order, either reject it in strict replay mode or run a separately named normalization step that records the reordering. Do not silently sort and then claim the raw input was chronological.
- [ ] Keep announcement and withdrawal records in the same deterministic event order.
- [ ] Make all replay-derived timestamps UTC and explicit about source timestamp versus replay execution timestamp.
- [ ] Ensure replay does not use runtime `datetime.now()` to determine historical event order or event duration. Runtime execution time may be recorded as metadata only.
- [ ] Include dataset file SHA-256, fixture/schema version, replay mode, source archive URL/name, record count and time interval in the replay report.
- [ ] Ensure any external ROA snapshot used for historical validation has a timestamp no later than the event being evaluated. If no matching snapshot is available, report historical RPKI context as unavailable.
- [ ] Keep the current anti-poisoning and peer-withdrawal verification checks.

### Required tests

- [ ] Missing timestamp is rejected as incomplete; current time is never inserted.
- [ ] Malformed timestamp is rejected with a clear reason.
- [ ] Out-of-order input is rejected in strict mode.
- [ ] Stable equal-timestamp ordering is deterministic.
- [ ] Same fixture/configuration yields identical detection outcomes and stable report digest across repeated runs (excluding a clearly separated execution-time field).
- [ ] Archive checksum changes when fixture bytes change.
- [ ] Withdrawal order is preserved and produces the same recovery outcome on repeated replay.
- [ ] Historical RPKI lookup is not substituted with a current RIPEstat result.
- [ ] Existing archival replay fixtures still produce their documented outcomes or are explicitly marked incomplete when their source data is insufficient.

### Acceptance criteria

- No archival event gets a fabricated timestamp.
- The same input and explicit configuration produce the same substantive replay result.
- Reports make incomplete data, source archive, dataset checksum and replay configuration visible.

---

# WP-04 — Bind forensic evidence to source observations

**Priority:** P0 · **Proposal alignment:** evidence provenance, RFC 8785, SHA-256, ML-DSA-65 and independent verification  
**Primary files:** `backend/horaq/evidence.py`, `backend/horaq/detection.py`, `backend/horaq/database.py`, `verify_evidence.py`

### Objective

Make the signed evidence prove the integrity of a structured incident record that explicitly references the observations and source metadata used to reach the detection decision.

### Evidence manifest — required fields

The upgraded evidence schema should include, where available:

- [ ] Evidence schema version.
- [ ] Alert/incident identifier and detection identifier.
- [ ] Detection rule name and explicit rule-version identifier.
- [ ] Event timestamp and timestamp semantics (source observation time, not merely processing time).
- [ ] Normalized prefix, address family and observed origin ASN.
- [ ] Relevant baseline ASN and parent prefix, when applicable.
- [ ] Collector/vantage-point identity.
- [ ] Peer IP and peer ASN, when available.
- [ ] Stable peer-session identifier, when available.
- [ ] Source RIS message identifier, when available.
- [ ] Database observation identifier(s) for the observations supporting this event.
- [ ] SHA-256 digest(s) of the preserved source record or canonical source envelope, where the original source representation is retained.
- [ ] Corroboration summary: distinct peer sessions, peer ASNs, collectors and total observations.
- [ ] Explicit uncertainty/identity gaps, including missing peer metadata.
- [ ] RPKI status, provider and lookup time, with a clear marker indicating whether it is live/current context or time-matched historical context.
- [ ] A statement that a digital signature verifies record integrity and signer authenticity under the configured public-key trust model; it does not prove that the underlying BGP observation is true.

### Exact implementation requirements

- [ ] Design a backward-compatible schema version (for example, a minor version after reviewing current schema-version policy). Do not reinterpret existing version `1.0.0` records.
- [ ] Keep RFC 8785 canonicalization as the one authoritative canonicalization implementation. Do not add a partial home-grown fallback.
- [ ] Keep SHA-256 over the exact canonical bytes.
- [ ] Keep ML-DSA-65 as the configured signing algorithm; do not substitute another algorithm or add an unsigned fallback that is presented as signed.
- [ ] Keep signer states explicit (`SIGNED`, `UNSIGNED`, `PROVIDER_UNAVAILABLE`, or existing equivalent states as actually implemented).
- [ ] Ensure the signature covers the complete canonical evidence manifest, including provenance references and rule version.
- [ ] Preserve public-key and key-trust assumptions in the verifier output. Do not claim that a self-presented public key establishes organizational identity without a trust anchor.
- [ ] Refactor transaction ordering so the current observation is persisted and has a stable observation ID before the evidence manifest is finalized, or use an equivalent transaction-safe method that guarantees the evidence references a real committed observation.
- [ ] Fetch and include the exact supporting observations used for corroboration; do not claim peer evidence that is not present in the database.
- [ ] Preserve raw/source data only as required and avoid storing secrets or unrelated personal data.
- [ ] Add a database foreign-key or explicit integrity check between evidence, incidents/alerts and observations where compatible with the existing schema.
- [ ] Extend the standalone verifier to validate schema version, canonical digest, signature and provenance-reference shape.
- [ ] Preserve verification of existing sample evidence records. Add tests proving old records remain verifiable.
- [ ] A tampered observation reference, timestamp, peer identity, rule version, RPKI context or source digest must invalidate the evidence hash/signature check.

### Required tests

- [ ] New evidence record includes the correct observation ID.
- [ ] Every referenced observation exists and matches the evidence prefix/origin/time semantics.
- [ ] Missing peer metadata is explicitly unknown, not fabricated.
- [ ] Corroboration summary equals independently queried observation/session counts.
- [ ] Changing any signed provenance field causes verification failure.
- [ ] Canonicalization parity holds between backend and standalone verifier.
- [ ] Existing v1.0.0 signed and unsigned samples still verify under their existing semantics.
- [ ] New schema samples verify independently outside the API/UI.
- [ ] Provider unavailable never returns a false `SIGNED` status.
- [ ] Private keys are not committed, included in evidence, or written to logs.

### Acceptance criteria

- An evaluator can move from an alert to the exact source observations that support it.
- The independent verifier detects modification of the alert facts or provenance manifest.
- Cryptographic verification is not misrepresented as proof of BGP truth.

---

# WP-05 — Add time-aware incident correlation without discarding evidence

**Priority:** P1 · **Proposal alignment:** explainability, investigation, route history and evaluation  
**Primary files:** `backend/horaq/detection.py`, `backend/horaq/database.py`, API schemas/routes, `frontend/src/`

### Objective

Reduce duplicate incident noise while preserving every observation and every evidence record. Distinguish brief observations from persistent or recurring behaviour without changing the underlying detection rules.

### Incident identity

Use a stable incident-correlation key derived from the facts that define the same logical detection, such as:

- Detection kind (`ORIGIN_CHANGE` or `SUBPREFIX_ANOMALY`).
- Normalized observed prefix.
- Observed origin ASN.
- Baseline origin ASN.
- Parent prefix, where applicable.
- Relevant detection-rule version.

Do not merge events merely because they share an ASN or collector. Document the exact key and test its boundaries.

### Exact implementation requirements

- [ ] Keep every raw observation append-only.
- [ ] Keep every detection event/evidence record traceable; do not overwrite a previous evidence payload when the incident receives a new observation.
- [ ] Add an additive incident grouping layer or equivalent explicit relationship between a logical incident and its individual alert/evidence events.
- [ ] Record first-seen time, last-seen time, event count, recurrence count, associated peer sessions and source collectors.
- [ ] Derive incident persistence from source observation times, not the time a worker happened to process the event.
- [ ] Define a documented configurable correlation window. Its initial default must be explicit and tested; it must not alter the existing baseline promotion threshold.
- [ ] Distinguish `TRANSIENT`, `PERSISTENT`, `RECURRENT`, and `INSUFFICIENT_VISIBILITY` as descriptive lifecycle classifications, not as proof of malicious intent.
- [ ] Preserve existing incident states and recovery invariants. If new display classifications are added, do not silently replace the existing `ACTIVE`/`RESOLVED` semantics.
- [ ] A new observation after resolution must create a recurrence or new incident according to the documented correlation-window rule; it must not rewrite the old incident's evidence.
- [ ] Explain the number of updates and duration that support the classification.
- [ ] Do not automatically suppress a transient event from the evidence ledger. Keep it searchable and auditable.

### Required tests

- [ ] Repeated observations of the same conflict within the correlation window link to one logical incident but remain individually preserved.
- [ ] A different observed ASN creates a different incident identity.
- [ ] An origin conflict and a subprefix anomaly are not merged.
- [ ] Events outside the configured correlation window are handled according to the documented recurrence rule.
- [ ] Event duration is computed from source timestamps.
- [ ] Replay of the same data produces identical incident grouping.
- [ ] Resolution does not delete the evidence or observation history.
- [ ] A later recurrence never alters the previous signed evidence record.

### Acceptance criteria

- The operator sees one coherent investigation timeline instead of an unbounded list of duplicate cards.
- Every underlying observation and signed evidence record remains individually inspectable.
- The UI never equates persistence with malicious intent.

---

# WP-06 — Add visibility and collector-health awareness

**Priority:** P1 · **Proposal alignment:** truthful telemetry, provenance and peer-aware recovery  
**Primary files:** `backend/horaq/collector.py`, telemetry API, frontend overview/diagnostics

### Objective

Make it impossible for the dashboard to confuse “no update was received” with “the route was withdrawn.”

### Distinct states that must not be conflated

- `CONNECTED`: the collector transport is connected and its health checks are functioning.
- `DISCONNECTED`: the collector transport is known to be disconnected.
- `CONNECTED_NO_RECENT_UPDATES`: the transport remains healthy, but no new BGP UPDATE has recently arrived.
- `STALE_OR_UNKNOWN`: the application cannot establish current collector health.
- `ROUTE_WITHDRAWN_FROM_PEER`: an explicit withdrawal was received from a particular known peer for the prefix.
- `PARTIAL_VISIBILITY_LOSS`: a source/peer view has changed, but remaining views still observe the route.

These are monitoring states, not threat verdicts.

### Exact implementation requirements

- [ ] Track transport connection state separately from BGP UPDATE arrival time.
- [ ] Track last transport message/heartbeat time separately from last UPDATE time.
- [ ] Track last valid RIS message time, last parsed UPDATE time and last collector error separately.
- [ ] Where supported, process RIS peer-state messages explicitly and retain their source peer/collector identity. Do not infer peer-state changes from a quiet UPDATE stream.
- [ ] Define heartbeat timeout values as configuration, with tests for boundary conditions.
- [ ] A quiet but healthy UPDATE stream must not be treated as collector failure.
- [ ] A collector disconnect must not be passed into `process_withdrawal()`.
- [ ] Lack of a recent route observation must not resolve an alert or prove global route withdrawal.
- [ ] Only explicit withdrawals from identified announcing peers may advance the existing peer-recovery state machine.
- [ ] Distinguish a route withdrawal from a peer session down event and from a collector transport outage.
- [ ] Expose reconnect count, message count, skipped count, last error and last valid update time in diagnostics.
- [ ] Avoid showing a single collector's view as “global Internet visibility.”

### Required tests

- [ ] Active WebSocket with no BGP updates reports connected/no-recent-updates, not route withdrawn.
- [ ] WebSocket disconnect reports collector disconnected, not route withdrawn.
- [ ] Explicit peer withdrawal updates only that peer's recovery state.
- [ ] A withdrawal from an unknown peer does not confirm all peers recovered.
- [ ] A peer-state down notification is represented separately from route withdrawal.
- [ ] Reconnection restores transport health without mutating route history.
- [ ] Skipped malformed messages affect telemetry but do not create false route incidents.

### Acceptance criteria

- No code path converts collector silence or transport loss into a route withdrawal.
- The dashboard distinguishes source-health state from route state.

---

# WP-07 — Make RPKI context time-correct and semantically precise

**Priority:** P1 · **Proposal alignment:** RPKI contextual correlation and explainable uncertainty  
**Primary file:** `backend/horaq/rpki.py`; replay/evidence/UI as needed

### Objective

Ensure RPKI results support the investigation without being presented as a complete BGP security verdict or as historical truth when they are current lookups.

### Exact implementation requirements

- [ ] Keep the existing explicit status states: `VALID`, `INVALID`, `UNKNOWN`, and `UNAVAILABLE` (or the existing canonical equivalent).
- [ ] Display provider and lookup timestamp with every live/current RPKI result.
- [ ] Label current RIPEstat results as current lookup context, not the route event's historical RPKI state.
- [ ] For historical replay, use only a time-matched ROA snapshot with timestamp at or before the event, with documented selection rules.
- [ ] If there is no appropriate historical ROA snapshot, report `HISTORICAL_RPKI_UNAVAILABLE` or an equivalent explicit state. Do not substitute a present-day lookup.
- [ ] Explain that RPKI origin validation evaluates whether the origin ASN is authorized for the prefix/maxLength context; it does not validate the complete AS_PATH or prove benign intent.
- [ ] Keep RPKI as contextual evidence. Do not automatically label every `VALID` route safe or every `UNKNOWN` route malicious.
- [ ] Preserve timeout, provider error and unavailable distinctions.
- [ ] Include the RPKI context and its timestamp semantics in the evidence manifest.

### Required tests

- [ ] `VALID`, `INVALID`, `UNKNOWN` and `UNAVAILABLE` states remain distinct.
- [ ] Timeout and non-200 provider responses are not mislabeled as `UNKNOWN` if the provider result was not obtained.
- [ ] Historical event without a time-matched snapshot is reported as historically unavailable.
- [ ] Snapshot newer than the event is rejected for that event.
- [ ] Evidence and UI label current versus historical context explicitly.
- [ ] Explanations do not claim that RPKI validates the full AS_PATH.

### Acceptance criteria

- Evaluators can see what was validated, by which provider, and at what time.
- No current RPKI result is misrepresented as a historical validation result.

---

# WP-08 — Improve evaluator reproducibility and benchmark honesty

**Priority:** P1 · **Proposal alignment:** reference detector comparison, reproducible scenarios and evaluation  
**Primary files:** benchmark/replay scripts, `audit/`, test suite, evaluator documentation

### Objective

Make every reported result reproducible from versioned inputs and make the limits of synthetic and public collector data explicit.

### Exact implementation requirements

- [ ] Keep the existing reference detector comparison and proposal metrics; do not replace the benchmark with a new ML benchmark.
- [ ] Record the exact source fixture/dataset SHA-256, scenario version, detector/rule version and replay configuration for every run.
- [ ] Separate synthetic, historical replay and live observations in all reports and UI labels.
- [ ] Report detection precision, recall, F1 and false positives only where labelled ground truth supports the calculation.
- [ ] Continue reporting baseline contamination, false withholding/promotion delay and evidence completeness where those metrics are implemented and correctly defined.
- [ ] Add peer-session diversity accuracy and repeated-update corroboration checks.
- [ ] Add time-to-first-observation and time-to-corroboration metrics where timestamps and multiple views support them.
- [ ] Report replay determinism (same fixture/configuration yields the same substantive output).
- [ ] Report cryptographic signing and verification latency separately from detection latency.
- [ ] Record sample sizes and explain synthetic-data limitations next to metrics.
- [ ] Never describe synthetic results as real-world Internet accuracy.
- [ ] Never claim complete Internet visibility from RIPE RIS or a small set of collectors.
- [ ] Preserve raw evaluation output so a reviewer can reproduce the chart/table.

### Required tests

- [ ] Benchmark fixtures have version and checksum metadata.
- [ ] Repeated deterministic benchmark runs give identical substantive metrics.
- [ ] Metric denominators and label matching rules are tested.
- [ ] No metric is generated when required ground truth is absent; result is explicitly unavailable.
- [ ] Synthetic/historical/live labels cannot be confused in API or UI.
- [ ] New peer/replay/visibility regression scenarios appear in the evaluator scenario list.

### Acceptance criteria

- Every headline metric links to an input dataset, configuration and reproducible command.
- The report clearly separates synthetic, historical and live evidence.

---

# WP-09 — Integrate the upgrades into the operator console

**Priority:** P1 · **Proposal alignment:** existing React/TypeScript operations console  
**Primary files:** existing views/components under `frontend/src/`; API schemas only as required

### Objective

Expose the improved evidence and lifecycle details in the existing HORA-Q interface without redesigning the application or introducing a new product area.

### Required UI elements

- [ ] Incident timeline: first seen, last seen, observation count, recurrence and current lifecycle classification.
- [ ] Corroboration panel: distinct peer sessions, distinct peer ASNs, collector vantage points and unidentifiable observations.
- [ ] Evidence provenance panel: source message ID, observation IDs, source timestamps, peer/collector metadata and record hashes.
- [ ] Collector diagnostics: transport state, heartbeat/last message, last UPDATE, reconnect count, skipped messages and last error.
- [ ] Recovery panel: active peers, withdrawn peers and remaining peers, with explicit unknown-identity state.
- [ ] RPKI panel: status, provider, lookup time and current-versus-historical label.
- [ ] Replay panel: source archive, fixture checksum, source time range, replay configuration and completeness status.
- [ ] Keep the existing origin-AS and subprefix alert explanations prominent.
- [ ] Use restrained status labels and explanatory text; do not make a medium-confidence anomaly look like a confirmed attack.
- [ ] Keep synthetic/live/historical data badges explicit.
- [ ] Ensure the UI shows “unknown” or “insufficient evidence” when facts are absent; do not fill gaps with guessed values.
- [ ] Ensure new endpoints/components have loading, empty, unavailable and error states.
- [ ] Keep keyboard navigation, responsive layout and readable contrast.

### Required tests

- [ ] UI shows separate counts for sessions, ASNs and collectors.
- [ ] UI does not show “global propagation” based on a small vantage set.
- [ ] Collector disconnection does not show a route-withdrawn badge.
- [ ] Missing peer identity displays unknown rather than a fabricated peer.
- [ ] RPKI historical/current context is labeled accurately.
- [ ] Existing evaluator walkthrough still runs end-to-end.
- [ ] Frontend typecheck and production build pass.

### Acceptance criteria

- An evaluator can move from alert → observations → provenance → signature verification without relying on undocumented manual database inspection.
- The UI communicates uncertainty and data-source limits clearly.

---

## 4. Recommended execution order and release gates

Do not implement every work package in one large unreviewable change. Use small commits/PRs and run the full regression suite after each package.

| Sequence | Work package | Release gate |
|---:|---|---|
| 0 | Baseline capture | Latest main SHA and complete pre-change test/build/evidence results recorded |
| 1 | WP-01 RIS UPDATE ingestion | Withdrawal-only fixture reaches recovery code; all parser/recovery tests pass |
| 2 | WP-02 peer identity/corroboration | Repeated one-peer updates cannot satisfy two-peer promotion; migration passes |
| 3 | WP-03 deterministic replay | Missing timestamps fail explicitly; deterministic replay tests pass |
| 4 | WP-04 evidence provenance | New records independently verify; legacy samples remain valid |
| 5 | WP-05 incident correlation | Duplicate events grouped without loss of source observations/evidence |
| 6 | WP-06 collector visibility | No silence/disconnect path is interpreted as withdrawal |
| 7 | WP-07 time-aware RPKI | Historical and current RPKI context cannot be confused |
| 8 | WP-08 reproducibility | Dataset checksums/configuration and honest metrics are published |
| 9 | WP-09 evaluator UI | Full guided walkthrough and production build pass |

### Per-work-package release checklist

- [ ] Implementation is on a dedicated enhancement branch based on the latest `main`.
- [ ] The change has focused unit tests and relevant integration tests.
- [ ] No proposal-defining behavior or numeric policy threshold was changed without explicit documented approval.
- [ ] No live Internet route injection, route changes or public BGP manipulation was performed.
- [ ] Full backend tests pass.
- [ ] Frontend typecheck/build passes when frontend files changed.
- [ ] Evidence verifier tests pass when evidence/crypto files changed.
- [ ] Evaluator lifecycle script passes.
- [ ] The relevant proposal traceability entry is updated only after evidence exists.
- [ ] The engineering changelog states what changed and what did not change.
- [ ] A reviewer can reproduce the key acceptance test from a documented command.

---

## 5. Final measurable acceptance checklist

The project should not be declared complete merely because the UI looks finished. Each of the following must have an automated test or an independently reproducible evidence artifact.

### Collector correctness

- [ ] Withdrawal-only RIS UPDATE is received and processed.
- [ ] Mixed UPDATE is processed for both announcement and withdrawal content.
- [ ] Collector disconnect does not create a route withdrawal.
- [ ] Malformed input is skipped with a traceable reason.

### Peer and candidate correctness

- [ ] Three observations from one peer session remain one distinct session.
- [ ] Two independently identified peer sessions are counted as two sessions.
- [ ] Peer ASN diversity and collector diversity are reported separately.
- [ ] Unknown peer identity never counts as independent corroboration.
- [ ] Candidate promotion remains `>= 2` identified peer sessions AND `>= 3` observations.
- [ ] Suspicious origin/subprefix observations cannot poison the established baseline.

### Replay integrity

- [ ] Missing/invalid historical timestamps never receive the current time.
- [ ] Replay order is deterministic and auditable.
- [ ] Dataset checksum and replay parameters are included in the report.
- [ ] Identical fixture/configuration produces identical substantive results.

### Evidence integrity

- [ ] Evidence references real source observations.
- [ ] Provenance fields are covered by canonicalization, hash and signature.
- [ ] ML-DSA-65 provider failure is reported honestly.
- [ ] Standalone verifier validates the new evidence format.
- [ ] Existing evidence format remains verifiable.
- [ ] Tampering with any signed provenance field is detected.

### Incident and visibility correctness

- [ ] Duplicate updates are correlated without deleting individual observations.
- [ ] Transient/persistent/recurrent labels are based on source timestamps and documented rules.
- [ ] Quiet stream, lost collector transport and explicit route withdrawal are separate states.
- [ ] Peer withdrawal recovery remains peer-specific.
- [ ] No route is marked globally withdrawn based only on one collector's silence.

### RPKI correctness

- [ ] Current lookups are labelled with provider and lookup time.
- [ ] Historical validation uses only a time-matched snapshot.
- [ ] Missing historical snapshot is marked unavailable.
- [ ] RPKI origin validation is not represented as full AS_PATH validation or proof of benign intent.

### Evaluator readiness

- [ ] All backend tests pass and actual count is reported.
- [ ] Frontend production build/typecheck passes.
- [ ] Independent evidence verification passes.
- [ ] Tamper test fails for the tampered sample, as expected.
- [ ] Guided evaluator walkthrough passes from baseline to anomaly to evidence to recovery.
- [ ] Screenshots show real application state and are not labelled as live if generated from synthetic fixtures.
- [ ] All reported metrics have input fixture/dataset, version, checksum and reproducible command.
- [ ] Known limitations are visible and honestly stated.

---

## 6. Explicit non-goals — do not add these in this upgrade

These items would expand the project beyond its current proposal or create avoidable integration risk. Keep them out of this implementation plan.

- [ ] No machine-learning, deep-learning, LLM or AI-based anomaly classifier.
- [ ] No new general-purpose AS_PATH anomaly or route-leak detector.
- [ ] No ASPA implementation or AS_PATH cryptographic validation.
- [ ] No BMP router integration or operator-router control plane.
- [ ] No autonomous route blocking, route injection, route steering or configuration changes.
- [ ] No new threat-intelligence platform or external reputation-scoring subsystem.
- [ ] No mandatory cloud service, paid API, or new backend dependency required for local evaluation.
- [ ] No replacing SQLite or rewriting the FastAPI/React architecture merely for novelty.
- [ ] No removal of existing baseline protection, append-only history, peer recovery, RPKI context, PQC evidence or CLI verification.
- [ ] No claims of production-grade Internet-wide coverage based only on public route collectors.

A future research project could separately investigate BMP/ASPA or other routing-security mechanisms. They are not required to complete HORA-Q as submitted.

---

## 7. Required implementation-agent instructions

Use the following instructions as the execution contract for any coding agent or developer implementing this plan.

1. Start by inspecting the latest repository state and recording the `main` commit SHA. Do not assume an old file layout or old test count.
2. Read the proposal PDF and the current proposal-to-implementation matrix before editing. The proposal is authoritative for project scope.
3. Work in a dedicated branch. Do not push directly to `main` and do not edit the submitted proposal PDF.
4. Implement only the work package currently approved. Do not add ML or unrelated features.
5. Before a database change, inspect the current schema, migration process, test fixtures and compatibility expectations. Use additive/idempotent migrations.
6. Write regression tests before or alongside the fix. Do not weaken or delete existing tests to make the new tests pass.
7. Keep synthetic and historical evaluation deterministic. Never use the current clock as a substitute for a missing historical timestamp.
8. Preserve original observations and evidence. Correlation may group records, but it must not erase their individual provenance.
9. Do not infer a withdrawal from silence, a collector disconnect, or a missing peer identity.
10. Do not overstate peer corroboration, RPKI status, cryptographic assurance or Internet-wide visibility.
11. Run all relevant tests and the complete regression suite. Report actual command output and test counts, not estimates.
12. Finish with a concise report containing: files changed, behavior changed, proposal scope preserved, migrations, tests added, full test/build results, limitations, and exact commit/PR identifiers.
13. If a requirement cannot be implemented without changing the submitted proposal, stop that item and report the conflict rather than changing the proposal unilaterally.

### Required completion report template

```text
HORA-Q Scope-Preserving Upgrade — Completion Report

Base main SHA:
Enhancement branch:
Final commit SHA / PR:

Work packages completed:
- WP-01:
- WP-02:
- WP-03:
- WP-04:
- WP-05:
- WP-06:
- WP-07:
- WP-08:
- WP-09:

Files changed:
Database migrations and rollback notes:
Proposal scope changes: NONE (or explain any approved exception)

Tests:
- Backend command/result:
- Frontend command/result:
- Evidence verifier command/result:
- Evaluator lifecycle command/result:
- Added regression tests:

Acceptance checklist:
- [ ] All completed items have reproducible evidence.
- [ ] Existing proposal requirements remain intact.
- [ ] No ML detector was introduced.
- [ ] No route injection or automatic route modification was introduced.
- [ ] No old evidence sample was made unverifiable.
- [ ] Known limitations are documented.

Remaining items / blockers:
```

---

## 8. Final definition of done

HORA-Q's final upgrade is complete when:

1. The collector receives and processes withdrawal-only UPDATEs correctly.
2. Peer-session corroboration is based on actual identified sessions and cannot be inflated by repeated observations.
3. Historical replay is deterministic and never fabricates missing source timestamps.
4. Signed evidence links back to exact supporting observations and preserves backward compatibility.
5. Related observations can be grouped into an incident timeline without deleting the underlying forensic record.
6. Collector health, route visibility and explicit route withdrawal are shown as separate states.
7. RPKI evidence is correctly time-labelled and not overstated.
8. The evaluation can be reproduced from versioned fixtures and configuration.
9. The existing evaluator console presents all of this clearly.
10. The original proposal scope, core architecture and no-automatic-routing safety boundary remain intact.

**Final recommendation:** prioritize WP-01 through WP-04 first. Those are the highest-value correctness and forensic upgrades. Implement WP-05 through WP-09 only after the foundation is verified. The objective is not to make HORA-Q bigger; it is to make its existing claims more accurate, defensible and independently reproducible.

---

## 9. References

### Repository sources

- HORA-Q repository: <https://github.com/aiori-hackathon/A3-PS005-TC416>
- Current project README: <https://github.com/aiori-hackathon/A3-PS005-TC416/blob/main/README.md>
- Proposal-to-implementation matrix: <https://github.com/aiori-hackathon/A3-PS005-TC416/blob/main/audit/PROPOSAL_REQUIREMENTS_MATRIX.md>
- Architecture as built: <https://github.com/aiori-hackathon/A3-PS005-TC416/blob/main/audit/ARCHITECTURE_AS_BUILT.md>
- Evaluator demo guide: <https://github.com/aiori-hackathon/A3-PS005-TC416/blob/main/docs/DEMO_GUIDE.md>
- RIS collector: <https://github.com/aiori-hackathon/A3-PS005-TC416/blob/main/backend/horaq/collector.py>
- Detection engine: <https://github.com/aiori-hackathon/A3-PS005-TC416/blob/main/backend/horaq/detection.py>
- Replay engine: <https://github.com/aiori-hackathon/A3-PS005-TC416/blob/main/backend/horaq/replay.py>
- Evidence implementation: <https://github.com/aiori-hackathon/A3-PS005-TC416/blob/main/backend/horaq/evidence.py>
- RPKI integration: <https://github.com/aiori-hackathon/A3-PS005-TC416/blob/main/backend/horaq/rpki.py>

### Standards, technical documentation and published analysis

- RIPE RIS Live Manual: <https://ris-live.ripe.net/manual/>
- APNIC, Ephemeral leaks and automated BGP route leak detection (25 May 2026): <https://blog.apnic.net/2026/05/25/ephemeral-leaks-and-automated-bgp-route-leak-detection/>
- APNIC, Noisy routers: Investigating the make-up of route collector data (16 April 2026): <https://blog.apnic.net/2026/04/16/noisy-routers-investigating-the-make-up-of-route-collector-data/>
- BGPalerter configuration documentation: <https://github.com/nttgin/BGPalerter/blob/main/docs/configuration.md>
- BGPalerter example configuration: <https://github.com/nttgin/BGPalerter/blob/main/config.yml.example>

### Public professional/community discussions (qualitative context)

- Reddit, RouteCause deterministic BGP incident investigator discussion (7 September 2026): <https://www.reddit.com/r/networkautomation/comments/1w9jsxa/routecause_a_bgp_incident_investigator_that/>
- Reddit, BGP route changes and monitoring approaches (April 2023): <https://www.reddit.com/r/networking/comments/12ju02p/>
- Reddit, BGPalerter upstream-AS/session visibility discussion (23 August 2026): <https://www.reddit.com/r/networking/comments/1vw6ms9/bgpalerter_not_getting_alerted_when_upstream_as/>
- Reddit, transit performance monitoring discussion (19–20 August 2026): <https://www.reddit.com/r/networking/comments/1vt37j4/bgp_transit_performance_monitoring/>
- LinkedIn, RAVEN BGP Routing Security Monitor announcement by Ritesh Mukherjee (2026): <https://www.linkedin.com/posts/rmukherjee_raven-activity-7450569751686230017-heoX>
- LinkedIn, Secure BGP with ASPA / route-leak discussion (2026): <https://www.linkedin.com/posts/david-roy-6aa26133_secure-bgp-with-aspa-preventing-and-fixing-activity-7483050878350864384-LmeA>

**Source-use note:** Community discussion informs practical questions and operator experience. Implementation requirements are grounded primarily in HORA-Q's repository, the RIPE RIS Live protocol documentation, and published routing-measurement/monitoring documentation. Private/deep-web content was not accessed and is not represented as a source.
