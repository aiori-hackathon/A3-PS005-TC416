# HORA-Q — Production Containerization & On-Premise Deployment Guide

**Project**: HORA-Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  
**Standard**: Google SOC Enterprise Containerization & Production Standard  

---

## 1. Deployment Topology

HORA-Q is architected as a decoupled, two-tier system consisting of a lightweight FastAPI backend and a client-side React 19 / Vite Single Page Application (SPA).

```
  +---------------------------------------------------------------------------------+
  |                                 Enterprise Host                                 |
  +---------------------------------------------------------------------------------+
            |                                                      |
            | Port 8000 (REST / WebSocket)                         | Port 5173 (Assets)
            v                                                      v
  +-------------------------------------+                +--------------------------+
  |        Backend Container            |                |    Frontend Container    |
  |     (FastAPI / Python 3.13)         |                |  (Nginx Reverse Proxy /  |
  |                                     |                |   React 19 / TypeScript) |
  |  +-------------------------------+  |   JSON / CORS  |                          |
  |  |  FastAPI (Uvicorn Listener)   |<-+----------------| In-Browser FIPS 204      |
  |  +-------------------------------+  |                | Evidence Verification    |
  |  |  Post-Quantum ML-DSA-65 Signer|  |                | & Telemetry Dashboard    |
  |  +-------------------------------+  |                +--------------------------+
  |  |  SQLite 3 (WAL Mode)          |  |
  |  +-------------------------------+  |
  |                 ^                   |
  +-----------------|-------------------+
                    |
      Persistent    | Volume Mount
      Storage       v
  +-------------------------------------+
  |       Local Directory / Storage     |
  |       • /data/horaq.db              |
  |       • /data/horaq_authority_key   |
  +-------------------------------------+
```

---

## 2. Docker / Podman Production Deployment

### 2.1 Backend Containerfile

```dockerfile
# backend/Dockerfile
FROM python:3.13-slim

WORKDIR /app

# Install build dependencies and requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY backend/ ./backend/
COPY verify_evidence.py .

# Mount persistent volume for SQLite DB and Authority Key
VOLUME ["/data"]

ENV HORAQ_DATABASE=/data/horaq.db
ENV HORAQ_SIGNING_KEY=/data/horaq_authority_key.json
ENV PORT=8000

EXPOSE 8000

CMD ["uvicorn", "backend.horaq.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2.2 Frontend Containerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. Docker Compose Orchestration

For unified local or server deployment, run:

```yaml
# compose.yml
version: "3.8"

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - horaq-data:/data
    environment:
      - HORAQ_DATABASE=/data/horaq.db
      - HORAQ_SIGNING_KEY=/data/horaq_authority_key.json
      - HORAQ_DEMO_MODE=true
      - HORAQ_CORS_ORIGINS=http://localhost:5173,http://localhost:80

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  horaq-data:
```

Launch the cluster with:
```bash
docker compose up -d
```

---

## 4. Local Evaluation (No Container Required)

The primary recommended way to evaluate HORA-Q is locally on your development workstation:

```bash
# 1. Run the Backend:
cd backend
pip install -r requirements.txt
uvicorn horaq.main:app --host 127.0.0.1 --port 8000

# 2. Run the Frontend:
cd frontend
npm install
npm run dev

# 3. Open http://localhost:5173 in any modern browser
```
