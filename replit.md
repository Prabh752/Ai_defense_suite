# NIDS_PRO — AI-Powered Intrusion Detection System

## Overview
A full-stack, cybersecurity-themed Network Intrusion Detection System dashboard with real-time WebSocket push, Zustand global state, Framer Motion animations, ReactFlow network topology, TanStack Virtual scroll, and an AI analyst powered by OpenAI (via Replit AI Integrations).

## Architecture

### Frontend (`client/src/`)
- **Framework**: React + TypeScript + Vite
- **Routing**: `wouter` with Framer Motion `AnimatePresence` page transitions
- **State/Data**: TanStack Query v5 (HTTP) + Zustand global store + WebSocket real-time push
- **Styling**: Tailwind CSS + ShadCN UI (dark cyberpunk theme, JetBrains Mono font)
- **Charts**: Recharts
- **Animations**: Framer Motion (page transitions, card stagger, metric bars)
- **Virtual Scroll**: TanStack Virtual (Live Traffic log — handles 500+ rows efficiently)
- **Network Graph**: ReactFlow (`@xyflow/react`) — Network Topology page
- **Toast Notifications**: `sonner` (WebSocket threat alerts, training status)

### Backend (`server/`)
- **Framework**: Express.js (TypeScript via `tsx`)
- **WebSocket**: `ws` library — WS server at `/ws` path, broadcasts `traffic_event`, `system_stats`, `alert`, `model_status`, `simulation_complete`
- **Database**: PostgreSQL via Drizzle ORM
- **AI**: OpenAI `gpt-5.1` via Replit AI Integrations (no API key required)

### Shared (`shared/`)
- `schema.ts` — Drizzle ORM table definitions + Zod types
- `routes.ts` — API contract / route paths

## Pages & Features

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Live stats, WS alerts panel, throughput chart, attack distribution |
| `/traffic` | Live Traffic | WebSocket real-time feed + TanStack Virtual scroll, pause/filter |
| `/topology` | Network Topology | ReactFlow graph of attack sources → target server |
| `/simulation` | Attack Sim | Trigger simulated DDoS / Port Scan / Brute Force attacks |
| `/models` | ML Models | RF, Autoencoder, LSTM — WS training status + Framer Motion cards |
| `/system` | System Health | CPU, memory, throughput — live via WebSocket, animated bars |
| `/ai-advisor` | AI Advisor | Streaming OpenAI security analysis of live data |

## WebSocket Events (server → client)
- `traffic_event` — new packet log (added to Zustand live feed)
- `system_stats` — CPU/memory/throughput snapshot (every 5s)
- `alert` — anomaly detected (toast notification + sidebar badge)
- `model_status` — training started/completed
- `simulation_complete` — attack simulation ended

## Zustand Store (`client/src/store/index.ts`)
- `wsStatus` — WebSocket connection status (connecting/connected/disconnected/error)
- `liveTraffic` — last 500 real-time traffic logs
- `statsHistory` — last 60 system stat snapshots
- `alerts` — last 50 security alerts + `unreadCount`
- `modelStatuses` — live training status overrides

## AI Auto-Suggestion Feature
- **Backend**: `POST /api/ai/suggestions` — SSE streaming with full system context
- **Frontend**: `client/src/pages/AISuggestions.tsx` — streaming markdown, 6 quick prompts, history
- **AI Provider**: OpenAI `gpt-5.1` via `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY`

## Database Tables
- `traffic_logs` — Simulated/live network packets
- `system_stats` — CPU/memory/throughput snapshots (updated every 5s)
- `ml_models` — ML model metadata (RF, Autoencoder, LSTM)
- `users` — Auth placeholder

## Background Processes
- **Traffic simulator**: Runs during `simulation` API calls, inserts 1 packet/second + WS broadcast
- **System stats simulator**: Runs on startup, inserts a snapshot every 5s + WS broadcast

## Python ML Engine (`python_src/`)
- `random_forest.py` — sklearn RF classification
- `autoencoder.py` — PyTorch autoencoder
- `lstm.py` — PyTorch LSTM
