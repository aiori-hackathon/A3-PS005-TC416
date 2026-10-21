# HORA Q — Requirements and Acceptance Criteria

> Purpose: Functional and non-functional requirements.

## Scope and intent

This document explains the requirements and acceptance criteria area for HORA Q, the Explainable BGP Origin and Subprefix Anomaly Monitor.
The project is associated with AIORI-3, Track 2 Cyber Security, problem PS-005, team A3-PS005-TC416.
Treat this document as engineering guidance that must be checked against the actual source and runtime environment.
Do not present a planned capability as implemented or a described test as passed unless evidence exists.

## Ingestion

Accept a prefix and origin ASN with optional timestamp, collector, scenario label, and metadata.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Validation

Normalize CIDR prefixes and ASNs; reject malformed values before detector processing.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## History

Persist every accepted observation and retain source provenance.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Baseline

The first observation seeds a baseline. A change does not silently overwrite the original baseline.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Origin detector

Flag a different origin ASN for a known prefix and include both baseline and observed ASNs.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Subprefix detector

Flag a strict child prefix of a previously tracked parent of the same address family.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Explainability

Each alert has a stable identifier, kind, severity, title, explanation, and structured evidence.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## RPKI context

Return provider status when available and an explicit unavailable state when the request fails.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Collector

Live collection is opt-in and validates provider messages before processing.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Evidence integrity

Create deterministic evidence records and verify SHA-256 hashes against expected digests.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Cryptography

Report ML-DSA availability and never silently substitute a different algorithm.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Dashboard

Show overview, alerts, routes, evidence, loading states, and API errors.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Testing

Automated tests cover validation, detector rules, evidence integrity, and failure paths.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Acceptance

Backend starts, frontend builds, scenarios work, and actual test results are recorded.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Practical review checklist

## Maintenance

Keep this document aligned with code, tests, dependencies, and deployment instructions.
When the system changes, review this document together with the related acceptance tests.
Record unresolved assumptions and avoid claims that exceed the verified implementation.
