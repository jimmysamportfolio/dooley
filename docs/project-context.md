# Dooley - Visual Autonomous Browser Agent

Dooley turns observation into action. Instead of writing brittle Selenium scripts or hunting for CSS selectors, you simply show Dooley a video of a task. Dooley watches the footage, understands the user's intent, and acts as a visual autonomous agent to replicate the workflow on a live browser.

## How It Works

1. **Watch**: Record a quick video (30s-60s, e.g., "Logging into AWS and downloading a report")
2. **Plan**: Dooley's AI analyzes the video to generate a step-by-step Execution Plan
3. **Act**: Dooley navigates the live web page using Computer Vision

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Server (Ubuntu VM + Docker)                                │
│  ┌────────────────┐     ┌──────────────────────────────┐    │
│  │   FastAPI      │────▶│  Playwright Browser (Headed) │    │
│  │   (SSE Stream) │     │  Running in Xvfb + noVNC     │    │
│  └────────────────┘     └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
         │ SSE Logs                    │ noVNC WebSocket
         ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│  User's Browser (Frontend)                                  │
│  ┌──────────────────┐  ┌─────────────────────────────────┐  │
│  │  Video Player    │  │  noVNC Canvas (live browser)   │  │
│  │  (uploaded demo) │  │  Real-time automation view     │  │
│  └──────────────────┘  └─────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Terminal Log (SSE-powered real-time execution logs) │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Execution Pipeline

### Phase 1: Observation (The Eyes)
- **Input**: Raw video footage (screen recording, 30s-60s)
- **Engine**: Gemini 1.5 Pro (2M Context Window)
- **Output**: Structured `ActionPlan` JSON

### Phase 2: Execution (The Hands)
- **Engine**: Playwright (headed mode) + Gemini 1.5 Flash
- **Display**: noVNC streams the live browser to the user
- **Strategy**: Hybrid execution for speed + accuracy:
  - **Fast-Path**: Text matching via Playwright locators (~50ms)
  - **Vision-Path (Set-of-Mark)**: Screenshot + numeric badge injection, ask Gemini Flash "Which number is the Sign In button?" (~99% accuracy)

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js (App Router) | "Command Center" dashboard |
| Styling | Tailwind CSS + Framer Motion | Sci-Fi/Mission Control aesthetic |
| Backend | FastAPI (Python) | Async API + SSE streaming |
| Browser Control | Playwright (headed) | Visible browser automation |
| Live View | noVNC + Xvfb | Stream browser to user's frontend |
| Intelligence | Gemini 1.5 Pro & Flash | Video analysis + visual grounding |
| State | Zustand (React) / Pydantic (Python) | Type-safe data management |

---

## Folder Structure

```
/dooley
├── /frontend (Next.js) ─────────────────── DO NOT EDIT
│   ├── /components
│   │   ├── VideoUploader.tsx
│   │   ├── ActionPlan.tsx
│   │   ├── TerminalLog.tsx
│   │   └── BrowserView.tsx         # noVNC embed
│   └── /app
│
├── /backend (FastAPI)
│   ├── main.py                     # FastAPI app entry
│   ├── /api
│   │   ├── routes.py               # /analyze, /execute endpoints
│   │   └── sse.py                  # SSE streaming utilities
│   ├── /cortex
│   │   ├── schemas.py              # Pydantic models (ActionStep, ExecutionPlan)
│   │   ├── vision_parser.py        # Video → Gemini 1.5 Pro → ActionPlan
│   │   ├── navigator.py            # ActionPlan → Playwright execution
│   │   └── som_injector.js         # Set-of-Mark JS injection script
│   └── /temp                       # Video/screenshot storage
│
├── /docker
│   ├── Dockerfile.backend          # FastAPI + Playwright + Xvfb
│   └── docker-compose.yml          # Orchestration with noVNC
│
├── /docs
│   └── project-context.md          # This file
│
├── .env                            # GEMINI_API_KEY
└── .agent/rules                    # Agent configuration
```

---

## Key Features

### 1. Editable "Flight Plan" (Human-in-the-Loop)
Before execution, users review and edit the AI-generated steps:
- AI says: `TYPE "password123"`
- User override: `TYPE "{env.SECRET_PASSWORD}"`

### 2. Set-of-Mark (SoM) Navigation
Dooley injects visible numeric badges into the DOM before screenshots:
- Prompt: "Click the button labeled '42'"
- Result: 100% click accuracy, resolution-independent

### 3. Real-Time Streaming
- **SSE Logs**: Terminal shows live execution logs
- **noVNC View**: Watch the browser being controlled in real-time

### 4. Hybrid Fast-Path
Caches successful selectors. Only invokes Vision AI when UI changes.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Upload video → returns ActionPlan |
| POST | `/api/execute` | Execute ActionPlan → SSE stream |
| GET | `/api/execute/{id}/stream` | SSE connection for logs |

---

## UI Design (The "Vibe")

**Theme**: Cyberpunk Mission Control

| Element | Value |
|---------|-------|
| Background | Slate-950 |
| Actions | Neon Cyan |
| Warnings | Amber |
| Success | Emerald |
| UI Font | Inter |
| Code Font | JetBrains Mono |

**Experience Flow**:
1. **Upload**: Scanning animation overlays video
2. **Review**: Steps appear as editable code blocks
3. **Run**: Terminal logs stream while noVNC shows live browser
