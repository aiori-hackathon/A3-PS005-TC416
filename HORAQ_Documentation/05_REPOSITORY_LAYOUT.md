# HORA Q — Repository Layout

> Purpose: Code ownership, modules, naming, and Git organization.

## Scope and intent

This document explains the repository layout area for HORA Q, the Explainable BGP Origin and Subprefix Anomaly Monitor.
The project is associated with AIORI-3, Track 2 Cyber Security, problem PS-005, team A3-PS005-TC416.
Treat this document as engineering guidance that must be checked against the actual source and runtime environment.
Do not present a planned capability as implemented or a described test as passed unless evidence exists.

## Root

README and .gitignore live at the repository root. Keep generated databases and build outputs out of Git.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Backend

The backend directory contains the FastAPI package, dependency lists, tests, and evaluation scripts.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## main.py

Creates the application and starts optional background collection according to configuration.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## api.py

Declares endpoints and request models; it should not contain the entire detector implementation.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## database.py

Creates tables and centralizes SQLite connections and transaction helpers.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## normalization.py

Validates network prefixes and ASNs without accessing the database.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## detection.py

Implements baseline comparison, alert creation, and list/overview queries.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## collector.py

Parses provider messages and passes normalized observations to the detector.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## rpki.py

Performs bounded external requests and returns explicit unavailable states.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## evidence.py

Defines canonicalization, hashing, evidence creation, and retrieval.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## crypto.py

Implements optional ML-DSA signing and verification.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Frontend

The frontend directory contains Vite configuration and React/TypeScript source.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Workflow

Use focused feature branches, descriptive commits, code review, and tests.

For this area, preserve source provenance and timestamps wherever relevant.
Validate inputs and represent errors explicitly instead of silently inventing a result.
Keep the behavior explainable and add tests for both normal and failure paths.
Update related API examples and documentation when behavior changes.

## Practical review checklist

## Maintenance

Keep this document aligned with code, tests, dependencies, and deployment instructions.
When the system changes, review this document together with the related acceptance tests.
Record unresolved assumptions and avoid claims that exceed the verified implementation.
