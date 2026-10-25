# HORA-Q — Production Deployment & Evaluator Demonstration Guide

**Project**: HORA-Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  
**Target Architecture**: Cloudflare Pages (Frontend SPA) + Railway (FastAPI Backend + Persistent Volume)

---

## 🏗️ Architecture Overview

```
                                      ┌────────────────────────────────────────┐
                                      │   Evaluator Web Browser (HTTPS)        │
                                      │   https://horaq-tc416.pages.dev        │
                                      └──────────────────┬─────────────────────┘
                                                         │
                                        HTTPS API Calls  │ (VITE_API_BASE)
                                                         ▼
                                      ┌────────────────────────────────────────┐
                                      │   Railway Container Service (FastAPI)  │
                                      │   https://horaq-backend.up.railway.app │
                                      └──────────────────┬─────────────────────┘
                                                         │
                                    Persistent Volume    │ (/data)
                                                         ▼
                                      ┌────────────────────────────────────────┐
                                      │  Persistent Storage Volume Mount       │
                                      │  • /data/horaq.db (SQLite WAL)         │
                                      │  • /data/horaq_authority_key.json      │
                                      │    (NIST FIPS 204 ML-DSA-65 Authority) │
                                      └────────────────────────────────────────┘
```

---

## 🚀 Part 1: Backend Deployment on Railway

Railway provides a containerized Python environment with persistent volume storage for the SQLite database and post-quantum authority key.

### Step 1: Create Service
1. Log into your [Railway Dashboard](https://railway.com/).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `aiori-hackathon/A3-PS005-TC416`.
4. In the service settings, set **Root Directory** to `backend`.

### Step 2: Configure Persistent Volume
1. In your Railway service settings, navigate to **Volumes** → **Add Volume**.
2. Mount Path: `/data`
3. Volume Size: 1 GB (sufficient for demo databases and forensic evidence logs).

### Step 3: Set Environment Variables
In the **Variables** tab of your Railway service, configure the following:

| Variable | Recommended Value | Description |
| :--- | :--- | :--- |
| `PORT` | `8000` | Port assigned by Railway (auto-handled) |
| `HORAQ_DATABASE` | `/data/horaq.db` | Persistent SQLite database location |
| `HORAQ_SIGNING_KEY` | `/data/horaq_authority_key.json` | Persistent ML-DSA-65 authority keypath |
| `HORAQ_LIVE_COLLECTOR` | `false` | Keeps live RIS collection opt-in for reproducible evaluation |
| `HORAQ_DEMO_MODE` | `true` | Protects against destructive wipes and arbitrary observation injection |
| `HORAQ_CORS_ORIGINS` | `https://your-project.pages.dev,http://localhost:5173` | Allowed frontend origins (exact domain recommended; regex wildcard `*.pages.dev` also supported) |

### Step 4: Verify Start Command
Railway automatically detects `backend/Procfile` and `backend/railway.json`:
```bash
uvicorn horaq.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

### Step 5: Generate Public Domain
1. In the **Settings** tab → **Networking** → **Public Networking**.
2. Click **Generate Domain** (e.g. `https://horaq-backend-production.up.railway.app`).
3. Note this URL for the Cloudflare Pages configuration.

---

## 🌐 Part 2: Frontend Deployment on Cloudflare Pages

Cloudflare Pages provides a globally distributed, free static site hosting platform for the React + Vite frontend.

### Step 1: Create Pages Project
1. Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Compute (Workers) & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Authorize GitHub and select `aiori-hackathon/A3-PS005-TC416`.

### Step 2: Build & Deployment Settings
Configure the build settings exactly as follows:

| Setting | Value |
| :--- | :--- |
| **Project Name** | `horaq-tc416` (or desired name) |
| **Production Branch** | `main` |
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Build Output Directory** | `dist` |

### Step 3: Set Build Environment Variables
In **Environment Variables (Advanced)**:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE` | `https://your-railway-backend.up.railway.app` | Exact HTTPS URL of the Railway backend |

### Step 4: Deploy
Click **Save and Deploy**. Cloudflare Pages will install dependencies, execute `tsc && vite build`, copy SPA rewrite rules (`frontend/public/_redirects`), and publish the dashboard to `https://horaq-tc416.pages.dev`.

---

## 🔍 Part 3: Post-Deployment Health Check & Verification Checklist

Once both services are active, execute this verification sequence to confirm complete operational readiness:

### 1. Backend Health Check
```bash
curl -s https://<your-backend-domain>/health
```
**Expected Response**:
```json
{
  "status": "ok",
  "service": "horaq-backend",
  "team": "A3-PS005-TC416",
  "version": "1.0.0",
  "demo_mode": true,
  "evaluation_mode": "SYNTHETIC_EVALUATION",
  "collector_enabled": false
}
```

### 2. Post-Quantum Authority Key Verification
```bash
curl -s https://<your-backend-domain>/api/v1/crypto/public-key
```
**Expected Response**:
- HTTP 200 with `algorithm: "ML-DSA-65"`.
- `public_key`: Base64-encoded NIST FIPS 204 public key (2,604 chars).
- `key_lifecycle`: `"PERSISTENT_AUTHORITY_KEY"`.

### 3. Collector Status Verification
```bash
curl -s https://<your-backend-domain>/api/v1/collector/status
```
**Expected Response**:
- Truthfully indicates `enabled: false, running: false, connected: false`.

### 4. Interactive Evaluator Demo Walkthrough
1. **Open Dashboard**: Navigate to `https://<your-frontend-domain>.pages.dev`.
2. **Review Overview**: Verify that the top banner reads:
   *"AIORI-3 Evaluation Benchmark: Synthetic Anomaly Scenarios & FIPS 204 Evidence • Public Demo Protection Active"*.
3. **Execute Synthetic Scenarios**:
   - Go to the **Scenarios** tab.
   - Click **Run All Scenarios**.
   - Verify that all 5 scenarios complete with green `PASS` badges (1 origin conflict alert, 1 subprefix alert, 1 tagged migration alert, 1 IPv6 subprefix alert, 0 baseline alerts).
4. **Inspect Cryptographic Evidence**:
   - Go to the **Evidence** tab.
   - Select an alert's evidence record.
   - Click **Verify Hash** → Confirms RFC 8785 canonical JSON integrity match.
   - Click **Verify ML-DSA-65 Signature** → Confirms mathematical validity under NIST FIPS 204.
5. **Demonstrate Tamper Rejection (CLI)**:
   ```bash
   python verify_evidence.py audit/sample_evidence_signed.json --tamper
   ```
   - Confirms immediate rejection (`[FAIL] TAMPER DETECTED`, exit code `1`).
6. **Verify Unsigned Record Rejection (CLI)**:
   ```bash
   python verify_evidence.py audit/sample_evidence_unsigned.json
   ```
   - Confirms unsigned records cannot establish authenticity (`[UNSIGNED]`, exit code `2`).

---

## 🔒 Security Guarantees & Demo Protections

1. **Private Key Protection**:
   - Authority signing private keys are stored exclusively in `/data/horaq_authority_key.json` on the backend volume mount.
   - Private key bytes are NEVER included in API responses, Git commits, or client-side bundles.
2. **Key Storage Durability**:
   - The key path is strictly absolute, preventing key regeneration across container restarts or working directory changes.
   - If storage is unwritable or corrupted, the service fails explicitly rather than claiming false signing readiness.
3. **Public Demo Mode (`HORAQ_DEMO_MODE=true`)**:
   - Arbitrary observation injection is restricted to prevent public telemetry poisoning.
   - Reset actions perform a clean demo reset to reference baselines rather than destructive total wipes.
   - Predefined evaluator scenarios remain fully interactive and executable.
4. **Telemetry Truthfulness**:
   - The UI clearly labels synthetic demonstration replay versus live stream ingestion, ensuring evaluators are never misled about real-world BGP connectivity.
