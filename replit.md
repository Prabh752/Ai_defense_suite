# NIDS_PRO — AI-Powered Intrusion Detection System

## Overview
A full-stack, cybersecurity-themed Network Intrusion Detection System dashboard with an embedded AI analyst powered by OpenAI (via Replit AI Integrations).

## Architecture

### Frontend (`client/src/`)
- **Framework**: React + TypeScript + Vite
- **Routing**: `wouter`
- **State/Data**: TanStack Query v5
- **Styling**: Tailwind CSS + ShadCN UI components (dark cybersecurity theme)
- **Charts**: Recharts

### Backend (`server/`)
- **Framework**: Express.js (TypeScript via `tsx`)
- **Database**: PostgreSQL via Drizzle ORM
- **AI**: OpenAI `gpt-5.1` via Replit AI Integrations (no API key required)

### Shared (`shared/`)
- `schema.ts` — Drizzle ORM table definitions + Zod types
- `routes.ts` — API contract / route paths

## Pages & Features

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Live stats, traffic volume chart, attack distribution |
| `/traffic` | Live Traffic | Real-time packet log table |
| `/simulation` | Attack Sim | Trigger simulated DDoS / Port Scan / Brute Force attacks |
| `/models` | ML Models | RF, Autoencoder, LSTM model cards with training trigger |
| `/system` | System Health | CPU, memory, throughput charts |
| `/ai-advisor` | AI Advisor | **AI auto-suggestion panel** — streaming OpenAI analysis of live data |

## AI Auto-Suggestion Feature
- **Backend**: `POST /api/ai/suggestions` — gathers live traffic stats, recent anomalies, ML model status, and system metrics, then streams an AI security analysis via Server-Sent Events (SSE)
- **Frontend**: `client/src/pages/AISuggestions.tsx` — streaming markdown response, 6 quick-prompt shortcuts, follow-up Q&A, analysis history
- **AI Provider**: OpenAI `gpt-5.1` via `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY`

## Database Tables
- `traffic_logs` — Simulated/live network packets
- `system_stats` — CPU/memory/throughput snapshots (updated every 5s)
- `ml_models` — ML model metadata (RF, Autoencoder, LSTM)
- `users` — Auth placeholder

## Background Processes
- **Traffic simulator**: Runs during `simulation` API calls, inserts 1 packet/second for the specified duration
- **System stats simulator**: Runs on startup, inserts a system snapshot every 5 seconds

## Python ML Engine (`python_src/`)
- `preprocessing/` — Feature extraction utilities
- `training/train_models.py` — Training scripts for RF, Autoencoder, LSTM
- `detection/detection_engine.py` — Inference pipeline

## Running
```
npm run dev
```
Starts Express (backend) + Vite (frontend) on port 5000.

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (auto-configured by Replit)
- `SESSION_SECRET` — Session secret
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Auto-set by Replit AI integration
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Auto-set by Replit AI integration
