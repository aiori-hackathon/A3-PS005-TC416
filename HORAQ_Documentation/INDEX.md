# HORA Q Documentation Index

This archive contains 42+ Markdown documents describing how to build, test, operate, and evaluate HORA Q.

## Recommended reading order

- [`00_START_HERE.md`](00_START_HERE.md) — Reading order, scope, and how to use the documentation pack.
- [`01_PROJECT_BRIEF.md`](01_PROJECT_BRIEF.md) — Problem statement, users, objectives, and project boundaries.
- [`02_REQUIREMENTS.md`](02_REQUIREMENTS.md) — Functional and non-functional requirements.
- [`03_ARCHITECTURE.md`](03_ARCHITECTURE.md) — Components, boundaries, data flow, and trade-offs.
- [`04_DATA_FLOW.md`](04_DATA_FLOW.md) — End-to-end event and evidence lifecycle.
- [`05_REPOSITORY_LAYOUT.md`](05_REPOSITORY_LAYOUT.md) — Code ownership, modules, naming, and Git organization.
- [`06_ENVIRONMENT.md`](06_ENVIRONMENT.md) — Runtime versions, install, run, and troubleshoot.
- [`07_BACKEND.md`](07_BACKEND.md) — FastAPI service responsibilities and engineering practices.
- [`08_API_REFERENCE.md`](08_API_REFERENCE.md) — Endpoint intent, payload semantics, errors, and versioning.
- [`09_DATABASE.md`](09_DATABASE.md) — SQLite tables, indexes, transactions, and migrations.
- [`10_OBSERVATION_MODEL.md`](10_OBSERVATION_MODEL.md) — Prefix, ASN, timestamp, provenance, and validation.
- [`11_BGP_FUNDAMENTALS.md`](11_BGP_FUNDAMENTALS.md) — Routing concepts used by the detector.
- [`12_DETECTION_ALGORITHMS.md`](12_DETECTION_ALGORITHMS.md) — Baseline rule, subprefix rule, deduplication, severity.
- [`13_BASELINES.md`](13_BASELINES.md) — Baseline confidence, lifecycle, review, and rollback.
- [`14_SUBPREFIX_DETECTION.md`](14_SUBPREFIX_DETECTION.md) — Subnet semantics, evidence, and false-positive handling.
- [`15_ORIGIN_CHANGE.md`](15_ORIGIN_CHANGE.md) — Origin-change semantics and investigation workflow.
- [`16_RIS_LIVE.md`](16_RIS_LIVE.md) — Subscription, parser, resilience, and validation.
- [`17_RPKI.md`](17_RPKI.md) — Origin-validation status and external API behavior.
- [`18_EVIDENCE.md`](18_EVIDENCE.md) — Canonical JSON, SHA-256, exports, and tamper checks.
- [`19_ML_DSA.md`](19_ML_DSA.md) — Provider requirements, signing, verification, and key lifecycle.
- [`20_FRONTEND.md`](20_FRONTEND.md) — React/TypeScript views, states, accessibility, and build.
- [`21_SCENARIOS.md`](21_SCENARIOS.md) — Reproducible scenarios and expected outcomes.
- [`22_TESTING.md`](22_TESTING.md) — Unit, integration, API, frontend, and acceptance testing.
- [`23_EVALUATION.md`](23_EVALUATION.md) — Metrics, datasets, reproducibility, and honest reporting.
- [`24_THREAT_MODEL.md`](24_THREAT_MODEL.md) — Assets, actors, trust boundaries, and mitigations.
- [`25_PRIVACY_RETENTION.md`](25_PRIVACY_RETENTION.md) — Minimization, access, sharing, and recovery.
- [`26_DEPLOYMENT.md`](26_DEPLOYMENT.md) — Local demo, hosted API, frontend, persistence, and rollback.
- [`27_CONFIGURATION.md`](27_CONFIGURATION.md) — Environment variables and operational settings.
- [`28_OPERATIONS.md`](28_OPERATIONS.md) — Startup, triage, collector, database, and signing incidents.
- [`29_OBSERVABILITY.md`](29_OBSERVABILITY.md) — Health signals, logs, metrics, and failure visibility.
- [`30_CI_RELEASES.md`](30_CI_RELEASES.md) — Automated checks, review, dependencies, and release process.
- [`31_DEMO_GUIDE.md`](31_DEMO_GUIDE.md) — A reproducible walkthrough and common questions.
- [`32_ROADMAP.md`](32_ROADMAP.md) — Known risks and future engineering work.
- [`33_TROUBLESHOOTING.md`](33_TROUBLESHOOTING.md) — Common backend, frontend, integration, and test failures.
- [`34_ACCEPTANCE.md`](34_ACCEPTANCE.md) — Repository, backend, integration, frontend, and evaluation checks.
- [`35_GLOSSARY.md`](35_GLOSSARY.md) — Project and routing terminology.
- [`36_CONTRIBUTION.md`](36_CONTRIBUTION.md) — Branches, commits, review, and team coordination.
- [`37_DESIGN_DECISIONS.md`](37_DESIGN_DECISIONS.md) — Rationale behind major initial choices.
- [`38_STATUS_TEMPLATE.md`](38_STATUS_TEMPLATE.md) — A fillable report for verified implementation status.
- [`39_CHANGELOG.md`](39_CHANGELOG.md) — Release template and change classification.
- [`40_REFERENCES.md`](40_REFERENCES.md) — Standards and official documentation to consult.
- [`41_SUBMISSION.md`](41_SUBMISSION.md) — Repository, demo, source, documentation, and delivery.

## Project identity

Project: HORA Q — Explainable BGP Origin and Subprefix Anomaly Monitor.
Program: AIORI-3.
Track: Track 2 — Cyber Security.
Problem identifier: PS-005.
Team code: A3-PS005-TC416.

## Claim discipline

Documentation is not proof of implementation.
A feature should be called implemented only when the code exists.
A feature should be called tested only when a test has actually run.
A feature should be called deployed only when a deployment is accessible and verified.
An anomaly is a signal, not automatic proof of malicious intent.
A hash is not a digital signature.
RPKI origin validation is not complete AS-path validation.
A single collector does not provide guaranteed global visibility.

## Documentation maintenance

- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
- Update relevant documents when source code, API behavior, dependencies, or operational procedures change.
