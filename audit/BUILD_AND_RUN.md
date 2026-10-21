# HORA-Q — Build, Setup & Operation Guide

**Project**: HORA Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  

---

## 1. System Requirements & Prerequisites
- **Python**: 3.11+ (Tested and verified on Python 3.13.7)
- **Node.js**: v18+ or v20+ with `npm`
- **Operating System**: Windows 11, Linux (Ubuntu 22.04+), macOS 13+
- **Network**: Internet access required for RIPEstat RPKI validation queries (offline deterministic fixtures available for air-gapped test runs).

---

## 2. Backend Setup & Startup

### A. Environment Initialization
Navigate to `d:\HORA-Q\backend`:
```powershell
cd d:\HORA-Q\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### B. Launching the Backend Server
```powershell
python -m uvicorn horaq.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will start on `http://127.0.0.1:8000`.
- API Health Endpoint: `http://127.0.0.1:8000/api/v1/health`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

---

## 3. Frontend Setup & Startup

### A. Dependency Installation
Navigate to `d:\HORA-Q\frontend`:
```powershell
cd d:\HORA-Q\frontend
npm install
```

### B. Launching the Frontend Development Server
```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```
The desktop web interface will be accessible at `http://127.0.0.1:5173/`.

### C. Creating a Production Bundle
```powershell
npm run build
```
Creates an optimized static bundle in `d:\HORA-Q\frontend\dist` with 0 warnings.

---

## 4. Running the Automated Test Suite

### Backend Pytest Suite
```powershell
cd d:\HORA-Q\backend
.\.venv\Scripts\pytest.exe -v
```
Executes all 36 tests across normalization, detection, evidence canonicalization, and RPKI resolution.

---

## 5. Graceful Shutdown
- In Windows PowerShell: Press `Ctrl + C` in the respective terminal windows.
- Background process kill:
  ```powershell
  Stop-Process -Name "python" -Force
  Stop-Process -Name "node" -Force
  ```
