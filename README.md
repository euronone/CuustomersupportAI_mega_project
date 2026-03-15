# Euron — AI-Powered Customer Support Platform

Euron is a full-stack, AI-powered customer support SaaS platform that combines a RAG-based chatbot, smart ticketing, knowledge base management, agent copilot, and an admin panel into a single professional application.

Built with **Next.js 16**, **FastAPI**, **Supabase (PostgreSQL + pgvector)**, and the **EURI AI API** (OpenAI-compatible).

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Frontend Routes](#frontend-routes)
- [Testing](#testing)
- [Design System](#design-system)
- [Database Schema](#database-schema)
- [Key Flows](#key-flows)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### 1. Authentication & Role-Based Access Control

- Email/password signup and login with **bcrypt** password hashing
- **JWT tokens** — access tokens (60 min) + refresh tokens (7 days)
- Three roles with distinct permissions:
  - **Customer** — chat with AI, create/view tickets, browse help center
  - **Agent** — manage assigned tickets, use AI copilot, handle escalations
  - **Admin** — manage agents, configure AI, upload knowledge base, view analytics
- Role-based frontend routing via `useUser()` hook
- Role-based API protection via `require_role()` FastAPI dependency
- Multi-tenant isolation with `tenant_id` on all queries

### 2. AI Chatbot with RAG (Retrieval-Augmented Generation)

- Real-time chat via **WebSocket** with automatic reconnection
- REST API fallback when WebSocket is unavailable
- Full RAG pipeline:
  1. User message is embedded via EURI Embedding API
  2. pgvector similarity search finds top-K relevant knowledge base chunks
  3. Context assembled with source citations
  4. System prompt + KB context + conversation history sent to EURI LLM
  5. AI response returned with citation metadata
- Source attribution — each AI response shows which KB documents were referenced
- Automatic escalation to human agent after 3 AI attempts
- Typing indicator and auto-scroll
- Conversation history persistence

### 3. Knowledge Base Management

- **Document upload** — PDF, TXT, MD files via multipart form upload
- **URL ingestion** — ingest content from external URLs
- **Ingestion pipeline** (async worker):
  1. Parse PDF text (pypdf)
  2. Chunk text into overlapping segments (configurable chunk size and overlap)
  3. Generate embedding vectors via EURI Embedding API
  4. Store chunks + vectors in `knowledge_chunks` table (pgvector)
  5. Status tracking: `pending` → `processing` → `ready` / `failed`
- **Collection management** — organize documents into named collections
- **Admin UI** — document table with status badges, chunk counts, version tracking, delete capability
- Soft-delete support (documents are marked as deleted, chunks are hard-deleted)

### 4. Smart Ticketing System

- **Create tickets** with subject, description, and priority (low/medium/high/urgent)
- **Auto-assignment** — new tickets are automatically assigned to the available agent with the fewest active tickets (round-robin load balancing)
- **Status management** — open → pending → resolved → closed, with automatic `closed_at` timestamp
- **Message threads** — customers and agents can exchange messages on each ticket
- **AI summaries** — tickets can display AI-generated summaries
- **SLA tracking** — `sla_due_at` field for deadline visibility
- **Filterable lists** — filter by status with tab-based UI
- **Ticket detail view** — two-column layout with conversation, status actions, customer/agent info

### 5. Agent Copilot

- **Suggest Reply** — generates professional agent responses using:
  - Last 10 conversation messages for context
  - Top 3 KB chunks via RAG retrieval
  - EURI LLM generates tailored reply
  - Response populates the reply textarea for review/edit before sending
- **Summarize** — generates ticket/conversation summaries with key bullet points from up to 30 messages
- **KB Retrieval** — direct knowledge base search returning relevant snippets with relevance scores
- Available on ticket detail page and agent tickets page with slide-out copilot panel

### 6. Admin Panel

- **Agent Management** — view all agents in a table with:
  - Status filter (available/busy/offline)
  - Edit modal to update status, skills (comma-separated), max concurrent tickets
  - Active ticket count per agent
- **AI Configuration** — configure the AI model:
  - Model selection (gpt-4o-mini, gpt-4o, gpt-4-turbo, gpt-3.5-turbo)
  - Temperature slider (0.0–2.0)
  - Max tokens input (256–8192)
  - System prompt textarea
  - In-memory storage for MVP (persists per server lifecycle)
- **Knowledge Base** — full document management (see section 3)
- **Settings** — general settings display, API keys section, security status indicators

### 7. Analytics Dashboard

- **Admin dashboard** with 4 stat cards:
  - Open Tickets (with total count)
  - Active Conversations
  - Average Resolution Time (hours)
  - AI Resolution Rate (percentage)
- **Recent tickets** list with priority indicators and status badges
- **Quick stats** sidebar with CSAT score
- **Extended analytics page** with:
  - 6 stat cards (total tickets, open, resolved today, avg resolution, CSAT, AI rate)
  - Chart placeholders for weekly ticket trends and status distribution
  - Time range filter (7 days / 30 days / 90 days)
- Metrics computed from real data:
  - `resolved_today` — tickets resolved with today's date
  - `avg_resolution_time` — mean hours between creation and resolution
  - `csat_score` — placeholder (4.2/5.0 for MVP)
  - `ai_resolution_rate` — placeholder (35% for MVP)

### 8. Agent Interface

- **Agent Dashboard** — personal stats, assigned tickets, quick actions, escalation alerts
- **Agent Inbox** — two-column chat interface:
  - Left panel: conversation list with customer names, message previews, unread counts, escalation indicators
  - Right panel: active conversation with message thread, reply box, AI suggest button
- **Agent Tickets** — assigned ticket list with status filter tabs and copilot side panel

### 9. Customer Interface

- **Chat** — main support channel with AI assistant (see section 2)
- **Tickets** — view all tickets, create new tickets, view ticket details with message threads
- **Help Center** — browseable knowledge base collections (Getting Started, Account & Billing, Troubleshooting) with search and popular articles

### 10. Infrastructure

- **Health check** endpoint (`GET /health`) — returns `{"status": "ok"}`
- **Request middleware** — generates unique `X-Request-ID` per request, logs timing in ms
- **Centralized error handling** — structured JSON responses: `{"code", "message", "details"}`
- **Redis** — graceful degradation (application continues working if Redis is unavailable)
- **CORS** — configurable per environment (permissive in development)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Clients                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │  Admin   │  │  Agent   │  │     Customer          │   │
│  │  /admin  │  │  /agent  │  │  /chat /tickets /help │   │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘   │
└───────┼──────────────┼──────────────────┼────────────────┘
        │              │                  │
        └──────────────┼──────────────────┘
                       │
              ┌────────▼────────┐
              │   Next.js App   │
              │   (16 routes)   │
              │   Port 3000     │
              └────────┬────────┘
                       │ HTTP / WebSocket
              ┌────────▼────────┐
              │  FastAPI Backend │
              │  (30 endpoints) │
              │   Port 8000     │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
  ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
  │  Supabase │  │  Redis  │  │ EURI API  │
  │ PostgreSQL│  │ (cache) │  │ (LLM +    │
  │ + pgvector│  │         │  │ embeddings│
  └───────────┘  └─────────┘  └───────────┘
```

### Backend Layered Architecture

```
Routes (thin controllers)
  ↓ dependency injection (auth, role checks)
Services (business logic)
  ↓ orchestration, validation
Repositories (data access)
  ↓ Supabase PostgREST client
Database (PostgreSQL + pgvector)
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (App Router) | 16.1.6 |
| | React | 19.2.4 |
| | TypeScript (strict mode) | 5.9.3 |
| | Tailwind CSS | 4.2.1 |
| | Lucide React (icons) | 0.577.0 |
| **Backend** | Python | 3.11+ |
| | FastAPI | 0.115+ |
| | Pydantic v2 | 2.10+ |
| | python-jose (JWT) | 3.3+ |
| | passlib[bcrypt] | 1.7+ |
| **Database** | Supabase (PostgreSQL + pgvector) | Latest |
| **Cache** | Redis | 5.2+ |
| **AI** | EURI API (OpenAI-compatible) | OpenAI SDK 1.60+ |
| **PDF Parsing** | pypdf | 5.0+ |
| **Testing** | pytest + pytest-asyncio | Latest |

---

## Project Structure

```
euron/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI entry point
│   │   ├── core/                       # Config, security, middleware, exceptions
│   │   ├── routes/                     # 9 route modules (auth, chat, tickets, etc.)
│   │   ├── services/                   # 7 service modules (business logic)
│   │   ├── repositories/              # 6 repository modules (data access)
│   │   ├── schemas/                    # 8 Pydantic schema modules
│   │   ├── integrations/              # Supabase, OpenAI/EURI, Redis clients
│   │   ├── workers/                    # Document ingestion pipeline
│   │   └── tests/                      # 58 tests across 8 test files
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/                            # 16 Next.js pages
│   │   ├── login/ & signup/            # Auth pages
│   │   ├── chat/                       # AI chatbot
│   │   ├── tickets/ & tickets/[id]/    # Ticket list & detail
│   │   ├── help/                       # Help center
│   │   ├── admin/                      # Dashboard, knowledge, agents, analytics, settings
│   │   └── agent/                      # Dashboard, inbox, tickets
│   ├── components/                     # UI primitives + domain components
│   ├── hooks/                          # useAuth, useUser, useTickets, useWebSocket
│   ├── services/                       # 7 API service clients
│   ├── lib/                            # API client, constants, utilities
│   ├── types/                          # TypeScript type definitions
│   ├── tailwind.config.ts
│   ├── package.json
│   └── Dockerfile
├── docs/                               # PRD, Architecture, API Spec, DB Schema, Deployment
├── prompts/                            # Prompt history log
├── .cursor/rules/                      # Cursor IDE rules
├── CLAUDE.md                           # Project instructions for AI assistants
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Supabase** account with a project (PostgreSQL + pgvector extension enabled)
- **Redis** (optional — app works without it)
- **EURI API key** (or any OpenAI-compatible API)

### 1. Clone the Repository

```bash
git clone git@github.com:euronone/CuustomersupportAI_mega_project.git
cd CuustomersupportAI_mega_project
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (see Environment Variables section)
cp .env.example .env  # Edit with your actual values

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. API docs at `http://localhost:8000/api/docs`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
echo "NEXT_PUBLIC_WS_URL=ws://localhost:8000" >> .env.local

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### 4. Redis (Optional)

```bash
docker run -p 6379:6379 redis:alpine
```

### 5. Database Setup

Run Supabase migrations to create the required tables:

```bash
supabase db push
```

Or create tables manually using the schema defined in `docs/DB_SCHEMA.md`.

Make sure to enable the `pgvector` extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# EURI API (OpenAI-compatible)
EURI_API_KEY=your-euri-api-key
EURI_BASE_URL=https://api.euron.one/api/v1/euri
EURI_MODEL=gpt-4o-mini
EURI_EMBEDDING_MODEL=text-embedding-3-small

# Redis (optional)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-min-32-chars

# AWS S3 (for document storage — optional for MVP)
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=

# App
APP_ENV=development
FRONTEND_URL=http://localhost:3000
```

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## API Reference

Base URL: `http://localhost:8000/api/v1`

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/signup` | No | Register a new user (customer/agent/admin) |
| `POST` | `/auth/login` | No | Login, returns JWT tokens + user |
| `POST` | `/auth/refresh` | No | Refresh access token using refresh token |
| `GET` | `/auth/me` | JWT | Get current authenticated user |

### Chat

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/chat/completions` | JWT | Send message, get AI response with RAG |
| `GET` | `/chat/conversations/{id}/history` | JWT | Get conversation message history |
| `WS` | `/ws/chat/{conversation_id}?token=<jwt>` | JWT | Real-time chat via WebSocket |

### Tickets

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/tickets` | JWT | List tickets (filterable by status, paginated) |
| `GET` | `/tickets/{id}` | JWT | Get ticket details |
| `POST` | `/tickets` | JWT | Create ticket (auto-assigns to agent) |
| `PATCH` | `/tickets/{id}` | JWT | Update status, priority, or assignee |
| `GET` | `/tickets/{id}/messages` | JWT | List messages for a ticket |
| `POST` | `/tickets/{id}/messages` | JWT | Add a message to a ticket |

### Conversations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/conversations` | JWT | List conversations |
| `GET` | `/conversations/{id}` | JWT | Get conversation details |
| `POST` | `/conversations` | JWT | Create a new conversation |
| `PATCH` | `/conversations/{id}` | JWT | Update conversation |
| `GET` | `/conversations/{id}/messages` | JWT | List conversation messages |

### Knowledge Base

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/knowledge/documents` | JWT | List documents |
| `POST` | `/knowledge/documents` | Admin/Agent | Upload document (multipart form) |
| `DELETE` | `/knowledge/documents/{id}` | Admin | Soft-delete document + remove chunks |
| `POST` | `/knowledge/ingest-url` | Admin/Agent | Ingest content from URL |
| `GET` | `/knowledge/collections` | JWT | List collections |
| `POST` | `/knowledge/collections` | Admin | Create a collection |

### Copilot

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/copilot/suggest-reply` | JWT | Generate AI-suggested agent reply |
| `POST` | `/copilot/summarize` | JWT | Summarize conversation with key points |
| `POST` | `/copilot/retrieve-kb` | JWT | Search knowledge base for relevant snippets |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/admin/agents` | Admin | List all agents |
| `PATCH` | `/admin/agents/{id}` | Admin | Update agent status/skills |
| `GET` | `/admin/config/ai` | Admin | Get AI model configuration |
| `PATCH` | `/admin/config/ai` | Admin | Update AI model configuration |

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/analytics/dashboard` | Admin | Get dashboard metrics |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | None | Service health check |

---

## Frontend Routes

| Route | Role | Description |
|-------|------|-------------|
| `/login` | Public | Email/password login with role-based redirect |
| `/signup` | Public | Registration with role selection (customer/agent/admin) |
| `/` | Any | Landing page — redirects based on user role |
| `/chat` | Customer | AI chatbot with WebSocket, citations, agent escalation |
| `/tickets` | Customer | Ticket list with status filters, create ticket modal |
| `/tickets/[id]` | Any | Ticket detail with messages, reply, copilot, status actions |
| `/help` | Any | Help center with KB collections and article search |
| `/agent/dashboard` | Agent | Personal stats, assigned tickets, escalation alerts |
| `/agent/inbox` | Agent | Two-column chat inbox with AI suggest |
| `/agent/tickets` | Agent | Assigned tickets with copilot side panel |
| `/admin/dashboard` | Admin | Analytics stat cards, recent tickets, quick stats |
| `/admin/knowledge` | Admin | Document management — upload, ingest URL, delete |
| `/admin/agents` | Admin | Agent table with status filter, edit modal |
| `/admin/analytics` | Admin | Extended analytics with chart placeholders |
| `/admin/settings` | Admin | AI config, general settings, API keys display |

---

## Testing

### Backend Tests

The backend has **58 tests** covering all endpoints, business logic, and RBAC:

```bash
cd backend
python -m pytest app/tests/ -v
```

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `test_auth.py` | 13 | Signup (3 roles), login (success/failure), refresh, get me, unauthorized |
| `test_admin.py` | 11 | Agent CRUD, AI config CRUD, RBAC enforcement (3 roles) |
| `test_tickets.py` | 9 | Create, list, get, update, messages, not-found errors |
| `test_knowledge.py` | 9 | Document list/upload/delete, collections, RBAC (admin/agent/customer) |
| `test_copilot.py` | 6 | Suggest reply, summarize, KB retrieval (with/without data) |
| `test_analytics.py` | 4 | Dashboard metrics (success, empty, role restrictions) |
| `test_chat.py` | 4 | Chat completion, conversation history, unauthorized |
| `test_health.py` | 2 | Health endpoint, no-auth access |

**Test infrastructure:**
- All external services are mocked (Supabase, EURI/OpenAI, Redis) — no real API calls
- `conftest.py` provides a mock Supabase with fluent query builder that simulates PostgREST
- Pre-built JWT tokens for admin, agent, and customer roles
- Tests run in ~2.5 seconds

### Frontend Build Verification

```bash
cd frontend
npm run build
```

Verifies TypeScript compilation and static generation of all 16 routes.

---

## Design System

Euron uses a custom design system implemented via Tailwind CSS. All components follow these rules strictly.

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Brand | `#0A66C2` | Primary buttons, links, active states |
| Brand Hover | `#004182` | Hover state on primary elements |
| Background | `#F3F6F8` | Page background |
| Surface | `#FFFFFF` | Cards, panels, modals |
| Border | `#E5E7EB` | Card borders, dividers |
| Text Primary | `#111827` | Headings, body text |
| Text Muted | `#6B7280` | Secondary text, captions |
| Success | `#057642` | Success states |
| Warning | `#B45309` | Warning states |
| Error | `#B91C1C` | Error states |

### Typography

- **Font:** Inter (Google Fonts, weights 400/500/600/700)
- **Page titles:** 28-32px, weight 700
- **Section headers:** 20-24px, weight 600
- **Card titles:** 16-18px, weight 600
- **Body text:** 14-16px, weight 400
- **Captions:** 12px, weight 400

### Components

- **Buttons** — Pill-shaped (`border-radius: 999px`), 4 variants (primary, secondary, tertiary, danger), 3 sizes (sm/md/lg), loading spinner state
- **Cards** — White background, 1px border, 8px border-radius, no shadows
- **Inputs** — 44px height, focus ring with blue glow
- **Badges** — 5 variants (default, success, warning, error, brand)
- **Modals** — Overlay backdrop, ESC to close, click-outside to close, body scroll lock
- **Icons** — Lucide React, outline/stroke style only
- **Transitions** — 100-150ms ease, no bounce or flashy animations

---

## Database Schema

Core tables (managed via Supabase migrations):

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `tenants` | id, name, created_at | Multi-tenant organization isolation |
| `users` | id, tenant_id, email, display_name, role, password_hash | User identity and auth |
| `agents` | id, tenant_id, user_id, display_name, status, skills[], active_tickets | Agent profiles |
| `customers` | id, tenant_id, email, display_name, external_id, metadata | Customer records |
| `conversations` | id, tenant_id, customer_id, channel, status, assigned_agent_id | Chat threads |
| `messages` | id, tenant_id, conversation_id, sender_type, content, metadata | Individual messages |
| `tickets` | id, tenant_id, customer_id, subject, status, priority, assigned_agent_id, sla_due_at, summary | Support tickets |
| `knowledge_documents` | id, tenant_id, title, source_type, status, version, chunk_count, deleted_at | KB source documents |
| `knowledge_chunks` | id, tenant_id, document_id, content, embedding (vector), metadata | Chunked text + pgvector embeddings |
| `knowledge_collections` | id, tenant_id, name, description, document_count | Document groupings |

**Conventions:**
- UUID primary keys on all tables
- `created_at` / `updated_at` timestamps on all tables
- `tenant_id` on all tenant-scoped tables for multi-tenant isolation
- Row Level Security (RLS) policies enforce tenant boundaries
- pgvector extension for embedding similarity search

---

## Key Flows

### Customer Chat Flow

```
1. Customer opens /chat
2. useUser("customer") validates JWT session
3. WebSocket connects to /ws/chat/{conversation_id}?token=<jwt>
4. Customer sends message
5. Backend stores message, runs RAG pipeline:
   a. Embed query → pgvector similarity search → top-K KB chunks
   b. Assemble: system prompt + KB context + conversation history
   c. EURI LLM generates response
   d. Store AI response with citation metadata
6. Response sent back via WebSocket (or REST fallback)
7. After 3 AI attempts → "Talk to Agent" button appears
8. Agent escalation creates system message + agent connection
```

### Ticket Lifecycle

```
1. Customer creates ticket (subject, priority)
2. System auto-assigns to least-loaded available agent
3. Ticket status: open → pending → resolved → closed
4. Agent uses copilot to suggest replies / summarize
5. Messages exchanged between customer and agent
6. Agent marks ticket as resolved → closed_at timestamp set
```

### Knowledge Base Ingestion

```
1. Admin uploads PDF via /knowledge/documents
2. Document record created with status="pending"
3. Ingestion worker processes:
   a. Parse PDF text (pypdf)
   b. Chunk into overlapping segments
   c. Generate embedding per chunk (EURI API)
   d. Batch insert chunks + vectors into pgvector
4. Document status: pending → processing → ready (or failed)
5. Chunks now available for RAG retrieval in chat and copilot
```

---

## Deployment

### Docker

Both backend and frontend include Dockerfiles. The frontend uses Next.js standalone output mode.

```bash
# Build backend
cd backend
docker build -t euron-api .

# Build frontend
cd frontend
docker build -t euron-web .
```

### Production Architecture

- **AWS ECS Fargate** — containerized backend and frontend services
- **ALB** — Application Load Balancer for routing and SSL termination
- **Supabase** — managed PostgreSQL with pgvector
- **Redis** — ElastiCache or standalone Redis instance
- **S3** — document file storage (post-MVP)

See `docs/DEPLOYMENT.md` for detailed deployment instructions.

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/your-feature`
3. Make changes following the coding conventions in `CLAUDE.md`
4. Ensure backend tests pass: `cd backend && python -m pytest app/tests/ -v`
5. Ensure frontend builds: `cd frontend && npm run build`
6. Commit with descriptive messages
7. Push and open a Pull Request

### Coding Conventions

- **Backend:** Routes > Services > Repositories (clean layered architecture). Routes are thin. Business logic in services. All DB access through repositories.
- **Frontend:** `"use client"` on all pages. Handle loading, error, and empty states on every page. Use existing UI components from `components/ui/`.
- **Testing:** Mock all external services. Test both success and error cases. Test RBAC enforcement.
- **Design:** Follow the Euron design system strictly. No emojis in UI. Professional tone.

---

## License

This project is proprietary software. All rights reserved.

---

Built with [FastAPI](https://fastapi.tiangolo.com/), [Next.js](https://nextjs.org/), [Supabase](https://supabase.com/), and [EURI AI](https://euron.one/).
