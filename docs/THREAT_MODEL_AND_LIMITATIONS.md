# HORA-Q — Threat Model, Invariants & Limitations

**Project**: HORA-Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  
**Standard**: Google SOC Threat Modeling & Security Architecture Standard  

---

## 1. System Threat Model & Security Posture

HORA-Q operates at the boundary between raw Internet inter-domain routing telemetry (BGP) and security operations (SOC). The Border Gateway Protocol (RFC 4271) was fundamentally designed without built-in source authentication, cryptographic verification, or integrity guarantees. Consequently, autonomous systems exchange routing reachability assertions based entirely on bilateral trust.

To provide defensible, forensic-grade anomaly detection without destabilizing critical infrastructure, HORA-Q implements a **zero-trust, multi-corroborated, non-destructive threat model**:

```
+---------------------------------------------------------------------------------------------------------+
|                                    HORA-Q Threat Defense Matrix                                         |
|                                                                                                         |
|   Adversary Vector         Attack Impact              HORA-Q Defense Invariant        Verification      |
|   ------------------       -------------------        ------------------------        ------------      |
|   Origin AS Hijack         Global Traffic Blackhole   Candidate Baseline Quarantine   Deterministic     |
|   (Exact Prefix Match)     or Man-in-the-Middle       (Zero Baseline Poisoning)       Proof Invariant   |
|                                                                                                         |
|   Subprefix Hijack         Complete Traffic           LPM Subnet Containment Engine   Deterministic     |
|   (Longest Prefix Match)   Interception (Bypasses ROA) (Immediate Quarantine)         Proof Invariant   |
|                                                                                                         |
|   Single-Peer Flapping /   Baseline Contamination /  Multi-Session Peer Diversity    Corroboration     |
|   Sybil Upstream Poison    False Authority Seeding    (Collector:PeerAS:PeerIP)       Threshold Proof   |
|                                                                                                         |
|   Audit Record Mutation /  Historical Repudiation /   RFC 8785 JCS + SHA-256 +        NIST FIPS 204     |
|   Insider Tampering        Tampered Telemetry         ML-DSA-65 Post-Quantum Key      Lattice Verifier  |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Core Security Invariants

HORA-Q enforces four mathematical and operational invariants across its entire execution lifecycle:

### Invariant 1: Candidate Baseline Quarantine (Anti-Poisoning Barrier)
$$\forall \text{ observation } o \text{ where } \text{origin}(o) \neq \text{origin}(\text{baseline}(p)): \quad \text{status}(o) = \text{CANDIDATE}$$
- **Threat Mitigated**: Baseline Poisoning via Rogue Announcements.
- **Enforcement**: In standard monitoring mode, unpromoted route announcements enter the system strictly with `status = CANDIDATE`. A rogue announcement can **never** overwrite, mutate, or evict an active `PROMOTED` baseline. Even if an adversary announces thousands of updates with high frequency, the baseline remains immutably anchored until explicit multi-peer administrative criteria are satisfied.

### Invariant 2: Multi-Session Peer Diversity
$$\text{Corroboration}(p) = \left| \{ (c, a, i) \mid \text{collector}=c, \text{peer\_asn}=a, \text{peer\_ip}=i \} \right| \ge 2$$
- **Threat Mitigated**: Single-Peer Upstream Spoofing & Route Flapping.
- **Enforcement**: Peer sessions are tracked using 3-tuple identities ($C:AS:IP$). Multiple announcements arriving across the same BGP peering session (same collector, same peer ASN, same IP) increment observation counters but **do not increment corroboration count**. A baseline promotion or confirmed incident requires corroboration across distinct physical sessions.

### Invariant 3: Time-Honest Archival Replay
$$\forall r \in \text{ReplayStream}: \quad \text{timestamp}(r) = t_{\text{MRT}}, \quad \text{ClockMode} = \text{TIME\_HONEST}$$
- **Threat Mitigated**: Telemetry Clock Synthesis & Post-Hoc RPKI Anachronisms.
- **Enforcement**: Archival MRT replays strictly ingest recorded BGP timestamp metadata without synthesizing current system wall-clock timestamps. Furthermore, historical replays explicitly disable real-time RPKI checks or mark them as `HISTORICAL_RPKI_UNAVAILABLE` to prevent historical incidents from being evaluated against modern ROA repositories.

### Invariant 4: Post-Quantum Evidence Non-Repudiation
$$\text{Verify}_{\text{ML-DSA-65}}(\text{pk}, \, \text{SHA-256}(\text{JCS}(E)), \, \sigma) = \text{VALID}$$
- **Threat Mitigated**: Long-Term Evidence Forgery and Quantum Decryption Threats.
- **Enforcement**: Every generated alert is serialized into canonical JSON using RFC 8785 (JCS), hashed via SHA-256, and signed using NIST FIPS 204 ML-DSA-65 lattice-based digital signatures. Any unauthorized mutation of evidence attributes (e.g. altering observed ASN, timestamps, or prefixes) invalidates the signature and causes instant rejection by both the frontend and CLI verifiers.

---

## 3. Threat Analysis & Adversary Vectors

### 3.1 BGP Origin Hijacking (Exact Prefix Match)
- **Mechanism**: An unauthorized Autonomous System ($AS_{\text{attacker}}$) announces an IP prefix ($P$) belonging to a legitimate organization ($AS_{\text{victim}}$). Upstream networks select paths based on AS-Path length, routing policy, and peering economics.
- **HORA-Q Countermeasure**:
  1. HORA-Q indexes all promoted prefixes in memory and SQLite.
  2. Incoming announcement for $P$ from $AS_{\text{attacker}}$ triggers an immediate origin comparison ($AS_{\text{attacker}} \neq AS_{\text{victim}}$).
  3. An `ORIGIN_CHANGE` alert of `HIGH` severity is generated in $< 1\text{ ms}$.
  4. The rogue prefix is quarantined as `CANDIDATE` and never poisons the legitimate baseline.
  5. The alert is correlated into an Incident entity and signed via ML-DSA-65.

### 3.2 BGP Subprefix Hijacking (Longest Prefix Match Interception)
- **Mechanism**: An adversary announces a more-specific subnet (e.g. `192.0.2.128/25`) inside a victim's broader prefix (`192.0.2.0/24`). Because standard IP forwarding enforces **Longest Prefix Match (LPM)**, all routers worldwide route traffic for that `/25` to the attacker, regardless of whether the victim's `/24` has a shorter AS path or valid RPKI ROA.
- **HORA-Q Countermeasure**:
  1. HORA-Q maintains parent-child subnet containment logic across IPv4 (`/0`–`/32`) and IPv6 (`/0`–`/128`).
  2. When `192.0.2.128/25` is announced by $AS_{\text{attacker}}$, HORA-Q identifies `192.0.2.0/24` as its active parent baseline.
  3. Because $AS_{\text{attacker}} \neq AS_{\text{victim}}$, a `SUBPREFIX_ANOMALY` alert of `CRITICAL` severity is fired.
  4. The explanation explicitly details the LPM forwarding impact to provide immediate operational clarity to SOC analysts.

### 3.3 Sybil Attacks & Route Flapping
- **Mechanism**: An attacker rapidly flaps announcements and withdrawals from a single upstream BGP peer to manipulate baseline detection algorithms that rely purely on update count.
- **HORA-Q Countermeasure**:
  1. Updates arriving from the same peer session ($C:AS:IP$) are deduplicated against the corroboration set.
  2. Flapping does not increment distinct peer counts.
  3. Routes remain quarantined until corroborated by independent vantage points.

### 3.4 Evidence Forgery & Audit Log Tampering
- **Mechanism**: A malicious actor (external or malicious insider) tampers with database records or exported logs to erase evidence of routing manipulation.
- **HORA-Q Countermeasure**:
  1. RFC 8785 canonical serialization eliminates whitespace and formatting ambiguities.
  2. SHA-256 cryptographically commits to the exact byte sequence of the record.
  3. NIST FIPS 204 ML-DSA-65 asymmetric lattice signatures guarantee tamper evidence.
  4. The standalone CLI verifier (`verify_evidence.py`) operates with zero network or database dependencies, allowing neutral third-party verification.

---

## 4. Deliberate Scope Boundaries & Non-Goals

To maintain high reliability, mathematical provability, and operational safety, HORA-Q explicitly defines what it **does not do**:

### Boundary 1: Passive Monitoring Boundary (Zero Active Route Manipulation)
- **Non-Goal**: HORA-Q will **never** automatically inject counter-advertisements, issue automated BGP de-aggregations, or tear down BGP peering sessions via router CLI/BIRD/FRR scripts.
- **Rationale**: Automated counter-routing during BGP anomalies carries extreme systemic risk. A false positive or misconfigured automated counter-measure could propagate routing instability globally (e.g. triggering route flaps, routing loops, or secondary blackholes). HORA-Q is strictly an **out-of-band monitoring and cryptographic notarization authority**. Mitigation remains the operational responsibility of authorized human network engineers.

### Boundary 2: Purely Deterministic Detection (Zero Black-Box Machine Learning)
- **Non-Goal**: HORA-Q does **not** employ neural networks, deep learning, or statistical threshold heuristics to detect routing anomalies.
- **Rationale**: Machine learning detectors suffer from non-deterministic behavior, explainability gaps, and susceptibility to adversarial evasion (e.g. perturbation attacks). In a SOC environment, an alert must provide mathematical proof: *Who announced what, against which baseline, via which peers, at what exact timestamp.* HORA-Q's deterministic state machines achieve **100% recall with 0% baseline contamination** without unpredictable false-positive rates.

### Boundary 3: RFC 7908 Path Leaks Without Origin/Subprefix Changes
- **Non-Goal**: Detecting BGP "valley-free" path leaks that preserve the original origin ASN and original prefix length (e.g. multihomed transit provider leaking upstream routes to another upstream).
- **Rationale**: Detecting path-only leaks requires real-time global AS-relationship inference (Gao-Rexford heuristics) or widespread Autonomous System Provider Authorization (ASPA, RFC 9234) deployment. HORA-Q's scope is strictly focused on **Origin AS Conflicts** and **Subprefix LPM Anomalies**.

### Boundary 4: Cryptographic Truth vs. Telemetry Truth
- **Scientific Clarification**: An ML-DSA-65 signature on an evidence record proves beyond cryptographic doubt that HORA-Q observed the exact BGP payload at the specified timestamp from the specified collector. It does **not** prove that the remote BGP peer announced truthful information to the collector. BGP telemetry authenticity is bounded by the integrity of the collector infrastructure (RIPE NCC, Route Views).
