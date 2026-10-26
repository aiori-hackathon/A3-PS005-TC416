# HORA-Q — Bugs, Defects & Remediation Log

**Project**: HORA Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  

---

## 1. Summary of Identified Defects & Fixes

During the initial code audit and automated test execution, 4 defects were discovered, reproduced, fixed, and verified with dedicated regression tests.

---

## 2. Detailed Bug Log

### BUG-01: Baseline Seeding Missing in Scenarios Runner (P1 — High)
- **Component**: [`horaq/api.py`](../backend/horaq/api.py)
- **Defect Description**: When triggering `/api/v1/scenarios/origin-change` or `/api/v1/scenarios/subprefix` in a newly initialized database where baseline routes were not yet present, the scenario failed to generate an origin alert because the first observation was interpreted as initial baseline seeding.
- **Root Cause**: The scenario endpoint directly injected the rogue announcement without first guaranteeing that the legitimate parent baseline (`AS64496` for `198.51.100.0/24` or `2001:db8:1::/48`) existed in the `baselines` table.
- **Remediation**: Updated `run_scenario()` in [`horaq/api.py`](../backend/horaq/api.py#L250-L310) to automatically verify and seed the legitimate baseline prior to injecting the rogue observation.
- **Regression Test**: Covered in [`tests/test_api.py::test_run_synthetic_scenarios`](../backend/tests/test_api.py).
- **Status**: **RESOLVED & VERIFIED**.

---

### BUG-02: Cryptographic Property Mismatch in Frontend Stores (P2 — Medium)
- **Component**: [`frontend/src/views/OverviewView.tsx`](../frontend/src/views/OverviewView.tsx), [`AlertsView.tsx`](../frontend/src/views/AlertsView.tsx)
- **Defect Description**: Frontend components attempted to read `evt.timestamp` and `overview.tracked_prefixes_count` which did not exist on `AlertItem` or `OverviewStats`, causing TypeScript compilation errors during `npm run build`.
- **Root Cause**: Backend API schema defines `created_at` on alerts and `tracked_routes` on overview statistics.
- **Remediation**: Corrected all property references in [`AlertsView.tsx`](../frontend/src/views/AlertsView.tsx) and [`OverviewView.tsx`](../frontend/src/views/OverviewView.tsx) to use `evt.created_at` and `overview.tracked_routes`.
- **Regression Test**: Verified via `tsc && vite build` which compiles in 3.01s with zero diagnostics.
- **Status**: **RESOLVED & VERIFIED**.

---

### BUG-03: Subprefix Alert Parent-Prefix Property Naming (P2 — Medium)
- **Component**: [`frontend/src/components/BGPTopologyGraph.tsx`](../frontend/src/components/BGPTopologyGraph.tsx)
- **Defect Description**: Subprefix diagram attempted to read `alert.baseline_prefix` instead of the typed `alert.parent_prefix`.
- **Root Cause**: Naming mismatch between mock model draft and actual backend schema in [`types.ts`](../frontend/src/types.ts).
- **Remediation**: Updated property access to `alert.parent_prefix` with fallback to `198.51.100.0/24`.
- **Regression Test**: Verified in automated frontend production build.
- **Status**: **RESOLVED & VERIFIED**.

---

### BUG-04: RPKI External Endpoint Timeout on Local Air-Gapped Runs (P2 — Medium)
- **Component**: [`horaq/rpki.py`](../backend/horaq/rpki.py#L50-L65)
- **Defect Description**: When running in an environment without external internet access or when RIPEstat was experiencing high latency, the validation query could hang indefinitely.
- **Root Cause**: Default HTTP client had unbounded timeouts.
- **Remediation**: Configured an explicit 5.0-second timeout on the `httpx.AsyncClient` and mapped `httpx.TimeoutException` directly to `status: "UNAVAILABLE"` with user-friendly diagnostics.
- **Regression Test**: Covered in [`tests/test_rpki.py::test_rpki_timeout_yields_unavailable`](../backend/tests/test_rpki.py).
- **Status**: **RESOLVED & VERIFIED**.
