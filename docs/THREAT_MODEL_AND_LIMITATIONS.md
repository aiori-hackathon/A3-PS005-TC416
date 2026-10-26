# HORA-Q — Threat Model, Boundaries & Limitations

**Project**: HORA-Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  

---

## 1. Threat Model & Security Posture

HORA-Q is designed to monitor and notarize autonomous system behavior at the global Internet routing layer. The threat model addresses four primary adversary classes:

### Threat 1: BGP Origin Hijacking
- **Attack Vector**: An adversary advertises an IP prefix owned by another organization from their own Autonomous System Number (ASN), diverting traffic intended for the victim.
- **HORA-Q Defense**: Evaluates incoming announcements against established `PROMOTED` baselines. When an origin mismatch occurs ($A_{\text{new}} \neq A_{\text{base}}$), the engine immediately fires an `ORIGIN_CHANGE` alert with severity `HIGH`, generates tamper-evident evidence, and **preserves the legitimate baseline unpoisoned**.

### Threat 2: BGP Subprefix Hijacking (LPM Exploitation)
- **Attack Vector**: An adversary announces a more-specific subnet (e.g. `/25` inside a victim's `/24`, or `/48` inside a `/32`). Because BGP routers forward traffic according to **Longest Prefix Match (LPM)**, traffic to that subnet flows exclusively to the attacker regardless of parent path lengths or parent RPKI validation.
- **HORA-Q Defense**: Performs subnet containment checks against all active baselines. When a child prefix is announced with a non-matching origin, a `SUBPREFIX_ANOMALY` alert fires immediately. The child prefix is quarantined as an incident and strictly blocked from baseline promotion.

### Threat 3: Baseline Poisoning & Route Flapping
- **Attack Vector**: An attacker announces a forged route once or rapidly flaps a route from a single upstream peer, hoping the monitor will automatically accept the rogue announcement as the new trusted baseline.
- **HORA-Q Defense**: Unpromoted routes enter as `CANDIDATE`. Autonomous promotion requires corroboration from at least **two distinct peer ASNs/collectors** (`peer_count >= 2`) across at least **three updates** (`observation_count >= 3`). Single-peer flapping updates remain quarantined.

### Threat 4: Evidence Forgery & Historical Tampering
- **Attack Vector**: A compromised insider or adversary alters an audit log or evidence JSON (e.g. changing an ASN or timestamps) to conceal routing incidents or fabricate false accusations.
- **HORA-Q Defense**: Evidence records are serialized deterministically via **RFC 8785 JSON Canonicalization Scheme (JCS)**, bound by **SHA-256** digests, and signed with **NIST FIPS 204 ML-DSA-65** post-quantum lattice keys. Any mutation of even a single byte flips the SHA-256 digest and breaks the mathematical signature, causing instant rejection by both the browser and independent CLI verifier.

---

## 2. Scientific Boundaries & Known Limitations

In keeping with rigorous scientific standards, HORA-Q explicitly documents its architectural boundaries:

### Boundary 1: BGP Path Leaks without Origin Changes (RFC 7908)
- **Definition**: An AS path leak occurs when a multihomed transit provider forwards prefixes learned from one upstream provider to another (a "valley-free" routing violation), routing traffic through unintended networks.
- **Boundary**: If a route leak preserves the original origin ASN and original prefix length, it does **not** create an origin conflict or subprefix containment anomaly. Path-only valley leaks without origin changes require AS-Path topology inference (e.g., Gao-Rexford relationship heuristics or ASPA), which is explicitly outside HORA-Q's origin/subprefix detection scope.

### Boundary 2: Cryptographic Truth vs. Telemetry Truth
- **Scientific Clarification**: Digital signatures (ML-DSA-65) and hash digests (SHA-256) authenticate **payload integrity** (the evidence was not altered after observation) and **signer identity** (the observation was recorded by HORA-Q's authority key).
- **Limitation**: Cryptographic notarization does **not** prove that the external BGP router that originated the telemetry message announced truthful information. A signed evidence record is mathematical proof of *what was observed and when*, not a guarantee that the remote BGP speaker was benevolent.

### Boundary 3: Historical Baseline Completeness
- **Data Availability**: Evaluating historical incidents from archives (such as the 2011 Indosat incident) requires pre-incident baseline RIB snapshots (`bview` files). When public archives lack complete pre-incident RIB dumps for specific collectors, baseline reconstruction cannot be verified with 100% certainty. HORA-Q classifies such scenarios honestly as **incomplete historical data evaluations** rather than fabricating synthetic snapshots.

### Boundary 4: Asynchronous Collector Propagation Latency
- **Delay Characteristics**: BGP route updates propagate across Internet collectors (e.g., RIPE RIS rrc00, rrc01, Route Views) with asynchronous propagation delays ranging from milliseconds to tens of seconds. An incident observed at one collector may take several seconds to appear at another.
