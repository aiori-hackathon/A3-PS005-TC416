# HORA Q — Evidence Records and Integrity

> Purpose: Canonical JSON, SHA-256, exports, and tamper checks.

## Scope and intent

This document explains the evidence records and integrity area for HORA Q, the Explainable BGP Origin and Subprefix Anomaly Monitor.
The project is associated with AIORI-3, Track 2 Cyber Security, problem PS-005, team A3-PS005-TC416.
Treat this document as engineering guidance that must be checked against the actual source and runtime environment.
Do not present a planned capability as implemented or a described test as passed unless evidence exists.

## Purpose

Package the facts that explain why an alert exists.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Fields

Include schema version, alert id, prefix, ASNs, timestamp, collector, rule, explanation, and context.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Canonicalization

Use a deterministic serialization rule such as UTF-8 JSON with sorted keys and compact separators.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Versioning

Change the evidence schema version when serialization or field semantics change.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Hash

Compute SHA-256 over the canonical bytes and store the expected digest.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Meaning

Matching hashes indicate content matches the expected digest; they do not prove identity.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Threat

An attacker who replaces both record and untrusted hash can recompute the digest.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Signature

A digital signature can establish a relationship to a key, but key trust remains a separate question.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Lifecycle

Create record, canonicalize, hash, store, export, verify, and optionally sign.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Failure

Missing records, malformed values, and hash mismatches must be visible.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Export

Include schema, canonicalization rule, digest, signature metadata, and no private key material.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Practical review checklist

## Maintenance

Keep this document aligned with code, tests, dependencies, and deployment instructions.
When the system changes, review this document together with the related acceptance tests.
Record unresolved assumptions and avoid claims that exceed the verified implementation.
