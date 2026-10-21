# HORA Q — HTTP API Reference

> Purpose: Endpoint intent, payload semantics, errors, and versioning.

## Scope and intent

This document explains the http api reference area for HORA Q, the Explainable BGP Origin and Subprefix Anomaly Monitor.
The project is associated with AIORI-3, Track 2 Cyber Security, problem PS-005, team A3-PS005-TC416.
Treat this document as engineering guidance that must be checked against the actual source and runtime environment.
Do not present a planned capability as implemented or a described test as passed unless evidence exists.

## Base path

The API is served beneath /api/v1. JSON is used for normal requests and responses.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Health

GET /health confirms the process responds, but does not prove the collector or crypto provider works.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Overview

GET /overview returns counts for routes, observations, alerts, and latest observation time.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Routes

GET /routes returns the stored baseline view, not a complete global BGP table.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Alerts

GET /alerts returns detector findings, explanation, evidence, and status.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Observations

POST /observations accepts prefix and origin ASN plus optional collector, timestamp, scenario, and raw metadata.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Scenarios

POST /scenarios/{name} runs baseline, origin-change, subprefix, or legitimate-change synthetic sequences.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Evidence

GET /evidence lists evidence records and integrity metadata.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Signing

POST /evidence/{id}/sign requests ML-DSA signing and should fail clearly if the provider is unavailable.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Verification

POST /evidence/verify checks a supplied signature and public key against a record.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Hash check

POST /evidence/verify-hash recomputes SHA-256; this is integrity checking, not signer authentication.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Crypto status

GET /crypto/status reports local provider availability.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## RPKI

RPKI lookup returns provider context or unavailable; test prefix path encoding in the deployed stack.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Versioning

Keep response fields stable and document breaking changes.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Practical review checklist

## Maintenance

Keep this document aligned with code, tests, dependencies, and deployment instructions.
When the system changes, review this document together with the related acceptance tests.
Record unresolved assumptions and avoid claims that exceed the verified implementation.
