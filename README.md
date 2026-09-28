# 🛡️ SentinelMind — AI Incident Response Agent with Memory
> **2-Hour Hackathon MVP** | Persistent Agent Memory via **Hindsight** | Ultra-Fast Reasoning via **Groq** (`openai/gpt-oss-120b`)

---

## 💡 The Core Innovation

Most AI incident response agents treat every alert in isolation. When an outage or security incident occurs, the LLM starts from scratch—hallucinating hypotheses or issuing generic advice ("check logs", "restart pod").

**SentinelMind** transforms incident response by giving the agent **persistent institutional memory powered by Hindsight**.
- When an incident is investigated and resolved, its root cause and remediation playbook are retained into Hindsight memory.
- When an analogous alert fires in the future, SentinelMind **recalls the historical match**, cites the past incident ID, identifies the exact root cause, and prescribes the proven remediation in **under 2 seconds**.

---

## 🚀 Live Demo Script for Judges (2-Minute Walkthrough)

### 1. The Novel Incident (Zero-Day Baseline)
1. Open the SentinelMind dashboard at `http://localhost:3000`.
2. Click **⚡ 1. Novel Incident (No Memory)**:
   - Alert: `CryptoKernelCompilation` on `gpu-inference-cluster`.
   - Raw Log: An anomalous nvcc compiler invocation targeting an unauthorized stratum pool.
3. Click **"Run SentinelMind Triage"**:
   - **Result**: Hindsight confirms `0 Historical Matches`.
   - SentinelMind assigns **Medium confidence**, notes that this is an unprecedented failure mode, and outputs generic first-principles diagnostics.

### 2. The Similar Incident (Hindsight Memory Recall)
1. Click **🎯 2. Similar Incident (Recall INC-2024-001)**:
   - Alert: `AuthFailureSpike` on `payment-service`.
   - Raw Log: Redis connection pool exhaustion (9,994 clients) with rejected key v2.
2. Click **"Run SentinelMind Triage"**:
   - **Result**: Hindsight instantly recalls **`INC-2024-001`** (similarity score: 0.92+).
   - SentinelMind assigns **High confidence**, detects that zombie microservices are using the expired v2 secret instead of HashiCorp Vault v3, and outputs the exact surgical remediation playbook (restarting payment-gateway-pool pods, revoking v2, applying 60s TCP keepalive).

### 3. Continuous Learning
- Toggle **"Retain this incident into Hindsight Memory after triage"** to demonstrate that every new incident resolved by your team makes SentinelMind smarter for all future alerts.

---

## 🛠️ Stack & Architecture

- **Persistent Memory**: [Hindsight](https://hindsight.vectorize.io/) via `@vectorize-io/hindsight-client` (retaining incident signatures & semantic recall)
- **Inference Engine**: [Groq](https://groq.com/) using primary model `openai/gpt-oss-120b` with dual-model fallback to `qwen/qwen3-32b`
- **Backend API**: Node.js + Express (REST API with `POST /api/incidents`)
- **Frontend Dashboard**: React + Vite (cybersecurity dark-mode operations dashboard)
- **Containerization**: Multi-stage Docker + Docker Compose

---

## 🏃 Quick Start Guide

### Option A: Running with Docker (Recommended for Demo)

1. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your GROQ_API_KEY and HINDSIGHT_API_KEY
   ```

2. **Launch Containers**:
   ```bash
   docker compose up --build
   # or with docker-compose:
   docker-compose up --build
   ```

3. **Open Dashboard**:
   - Frontend UI: `http://localhost:3000`
   - Backend API: `http://localhost:5000/api/incidents`
   - Health Status: `http://localhost:5000/health`

---

### Option B: Running Locally (Node.js)

1. **Backend**:
   ```bash
   cd backend
   npm install
   npm start
   # Server runs on http://localhost:5000
   ```

2. **Frontend** (in a separate terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   # Dashboard runs on http://localhost:3000
   ```

---

## 📊 Preloaded Seed Incidents in Hindsight

On startup, SentinelMind automatically seeds 5 past incidents with verified root causes & resolutions:
1. `INC-2024-001`: Redis connection exhaustion from expired cached auth tokens (`payment-service`)
2. `INC-2024-002`: Kubernetes IMDS SSRF exploitation via webhook proxy (`webhook-dispatcher`)
3. `INC-2024-003`: GitHub Actions OIDC wildcard IAM privilege escalation (`ci-runner-cluster`)
4. `INC-2024-004`: PostgreSQL connection starvation from unindexed cron query (`auth-db-primary`)
5. `INC-2024-005`: High-entropy DNS tunneling iodine backdoor exfiltration (`staging-bastion-01`)
