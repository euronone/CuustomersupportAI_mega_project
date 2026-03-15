# CLAUDE.md — Euron AI Customer Support Copilot (MVP)

## Project Identity

**Product Name:** Euron
**Type:** AI-powered customer support SaaS platform
**MVP Status:** All core features implemented and tested (58 backend tests passing, 16 frontend routes building)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (web) | Next.js 16+, TypeScript (strict), Tailwind CSS 4, Lucide React icons |
| Backend | Python 3.11+, FastAPI 0.115+, Pydantic v2 |
| Database | Supabase (PostgreSQL + pgvector) |
| Cache/Queue | Redis (graceful degradation — app works without it) |
| AI | Euron EURI API (OpenAI-compatible, base_url: https://api.euron.one/api/v1/euri) |
| Auth | JWT (access + refresh tokens), bcrypt passwords, RBAC (admin/agent/customer) |
| Deployment | Docker (standalone Next.js build), AWS (ECS Fargate, ALB, S3) |

---

## Implementation Status

### Completed (MVP Phase 1)

| Feature | Backend | Frontend | Tests |
|---------|---------|----------|-------|
| Auth & RBAC | 5 endpoints (login, signup, refresh, me, roles) | Login + signup pages with role selector | 13 tests |
| AI Chatbot (RAG) | REST + WebSocket chat, RAG pipeline | Chat page with WS, citations, agent escalation | 4 tests |
| Knowledge Base | 6 endpoints (CRUD docs, collections, URL ingest) | Upload modal, URL ingest, doc table, delete | 9 tests |
| Smart Ticketing | 6 endpoints (CRUD, messages, auto-assign) | Ticket list, detail, create modal, status actions | 9 tests |
| Agent Copilot | 3 endpoints (suggest reply, summarize, KB retrieval) | Copilot buttons on ticket detail + agent pages | 6 tests |
| Admin Panel | 4 endpoints (agents CRUD, AI config) | Agents table, settings page, edit modals | 11 tests |
| Analytics | 1 endpoint (dashboard metrics) | Admin dashboard + analytics page with stat cards | 4 tests |
| Agent UI | N/A (uses existing endpoints) | Dashboard, inbox, tickets pages | N/A |
| Health Check | 1 endpoint | N/A | 2 tests |

**Total: 30 API endpoints, 16 frontend routes, 58 backend tests**

### Not Yet Implemented (Post-MVP)

- S3 file storage for documents (currently stores metadata only)
- Async ingestion queue via Redis/SQS (worker exists, called synchronously)
- Real-time streaming responses via WebSocket (infrastructure ready)
- API key management endpoints (UI placeholder exists)
- Advanced analytics (charts are placeholders)
- Voice/video, WhatsApp, SMS, Slack, Teams channels
- Native mobile app, CRM integrations, sentiment analysis
- Automation workflows, dark mode, multi-language

---

## Architecture Overview

```
Clients: Admin (web) + Agent (web) + Customer (web)
              |
         ALB / API Gateway
              |
    +---------+---------+
    |                   |
Next.js App        FastAPI Backend
(16 routes)        (REST + WebSocket)
    |                   |
    |          Services Layer
    |          (Chat, Tickets, RAG,
    |           Copilot, KB, Auth,
    |           Analytics)
    |                   |
    |          Repositories
    |          (tenant-scoped queries)
    |                   |
    +----> Supabase (PostgreSQL + pgvector)
                        |
              Redis (cache, graceful degradation)
                        |
              EURI API (completions, embeddings)
```

### Three interfaces, one app
- **Admin routes** (`/admin/*`): Dashboard, KB management, agent management, analytics, AI settings
- **Agent routes** (`/agent/*`): Dashboard, inbox, assigned tickets with copilot
- **Customer routes** (`/`): Chat, tickets, help center
- Role-based access via `useUser()` hook (frontend) and `require_role()` dependency (backend)

---

## Project Structure

### Backend (`/backend`)

```
backend/
  app/
    main.py                    # FastAPI app entry, CORS, exception handler, router registration
    core/
      config.py                # Settings via pydantic-settings (env vars)
      security.py              # bcrypt hashing, JWT create/decode, get_current_user, require_role()
      middleware.py             # RequestContextMiddleware (X-Request-ID, timing logs)
      exceptions.py            # AppException hierarchy (404, 401, 403, 422, 502)
    routes/
      auth.py                  # POST login/signup/refresh, GET me
      chat.py                  # POST completions, GET history, WS /ws/chat/{id}
      tickets.py               # GET/POST/PATCH tickets, GET/POST messages
      conversations.py         # CRUD conversations + messages
      knowledge.py             # CRUD documents/collections, POST ingest-url
      copilot.py               # POST suggest-reply/summarize/retrieve-kb
      admin.py                 # GET/PATCH agents, GET/PATCH config/ai
      analytics.py             # GET dashboard metrics
      health.py                # GET health check
    services/
      chat_service.py          # handle_message (store + RAG + respond + store)
      ticket_service.py        # CRUD + auto-assign to least-loaded agent
      conversation_service.py  # CRUD conversations
      knowledge_service.py     # CRUD documents/collections
      copilot_service.py       # suggest_reply, summarize, retrieve_kb_snippets
      rag_service.py           # retrieve_context (embed + pgvector), generate_answer
      analytics_service.py     # Aggregate metrics (ticket counts, resolution time, CSAT)
    repositories/
      user_repo.py             # get_by_id, get_by_email, create, update
      ticket_repo.py           # CRUD + count_by_status, count_resolved_today, get_avg_resolution_time
      conversation_repo.py     # CRUD + count_active
      message_repo.py          # list_by_conversation, create
      knowledge_repo.py        # KnowledgeDocumentRepo, KnowledgeChunkRepo (pgvector search), KnowledgeCollectionRepo
      agent_repo.py            # CRUD + get_available (ordered by active_tickets)
    schemas/
      auth.py                  # LoginRequest, SignupRequest, TokenResponse, UserResponse
      chat.py                  # ChatCompletionRequest, ChatMessageResponse, Citation
      common.py                # ApiResponse[T], PaginatedResponse[T], ErrorResponse
      tickets.py               # CreateTicketRequest, UpdateTicketRequest, TicketResponse, TicketMessageRequest
      knowledge.py             # KnowledgeDocumentResponse, CollectionResponse, IngestUrlRequest
      copilot.py               # SuggestReplyRequest/Response, SummarizeRequest/Response, KBRetrieveRequest/Response
      admin.py                 # AgentResponse, UpdateAgentRequest, AIConfigResponse, UpdateAIConfigRequest
      analytics.py             # DashboardMetrics
    integrations/
      openai_client.py         # AsyncOpenAI wrapper (EURI-compatible): chat_completion, generate_embedding, chat_completion_stream
      supabase_client.py       # Singleton Supabase client (service role + anon)
      redis_client.py          # Async Redis with graceful degradation: cache_get/set/delete
    workers/
      ingestion_worker.py      # parse_pdf, chunk_text, ingest_document (embed + store in pgvector)
    tests/
      __init__.py
      conftest.py              # Mock Supabase/Redis/OpenAI, test client, JWT fixtures
      test_auth.py             # 13 tests
      test_tickets.py          # 9 tests
      test_chat.py             # 4 tests
      test_knowledge.py        # 9 tests
      test_copilot.py          # 6 tests
      test_admin.py            # 11 tests
      test_analytics.py        # 4 tests
      test_health.py           # 2 tests
  requirements.txt
  Dockerfile
```

### Frontend (`/frontend`)

```
frontend/
  app/
    layout.tsx                 # Root layout (Inter font, global styles)
    page.tsx                   # Landing — redirects by role (admin/agent/customer)
    login/page.tsx             # Email/password login with role-based redirect
    signup/page.tsx            # Registration with role selector (customer/agent/admin)
    chat/page.tsx              # AI chat: WebSocket + REST fallback, citations, agent escalation
    tickets/page.tsx           # Ticket list with status filter, create modal
    tickets/[id]/page.tsx      # Ticket detail: messages, reply, copilot, status actions
    help/page.tsx              # Help center with KB collections and search
    admin/
      dashboard/page.tsx       # Stats cards, recent tickets, quick stats (API-connected)
      knowledge/page.tsx       # Document table, upload modal, URL ingest, delete
      agents/page.tsx          # Agent table, status filter, edit modal
      analytics/page.tsx       # 6 stat cards, chart placeholders, time range filter
      settings/page.tsx        # AI config form, general settings, API keys display
    agent/
      dashboard/page.tsx       # Agent stats, assigned tickets, escalation alerts
      inbox/page.tsx           # Two-column chat inbox with reply + AI suggest
      tickets/page.tsx         # Assigned tickets with copilot side panel
  components/
    ui/                        # 10 primitives: Button, Card, Input, Textarea, Select, Badge, Avatar, Modal, Spinner, EmptyState
    layout/                    # AppShell, Sidebar (role-based nav, collapsible), Header
    chat/                      # ChatWindow, MessageBubble, ChatInput
    tickets/                   # TicketList (filter tabs), TicketCard (linked)
    admin/                     # StatCard (icon, value, trend)
  hooks/
    useAuth.ts                 # Auth state: validate token via GET /auth/me, logout
    useUser.ts                 # Session + role guard: redirects unauthorized users
    useTickets.ts              # Fetch tickets with status filter, pagination, refetch
    useWebSocket.ts            # WebSocket connection: auto-reconnect, JWT auth, JSON parsing
  lib/
    api.ts                     # ApiClient class: get/post/patch/delete/upload with auto JWT headers
    constants.ts               # API_BASE_URL, APP_NAME, label maps (status, priority, agent, document)
    utils.ts                   # cn(), formatDate(), formatRelativeTime(), truncate(), getInitials()
  services/
    auth.ts                    # login, signup, getMe, refresh
    chat.ts                    # getHistory, sendMessage, getWebSocketUrl
    tickets.ts                 # list, get, create, update, getMessages, addMessage
    knowledge.ts               # listDocuments, uploadDocument, deleteDocument, ingestUrl, listCollections, createCollection
    copilot.ts                 # suggestReply, summarize, retrieveKB
    analytics.ts               # getDashboardMetrics
    admin.ts                   # listAgents, updateAgent, getAIConfig, updateAIConfig
  types/
    index.ts                   # All TypeScript types: User, Agent, Ticket, Message, Conversation, KnowledgeDocument, etc.
  tailwind.config.ts           # Euron design tokens (brand, surface, bg, border, status colors)
  next.config.ts               # output: "standalone"
  tsconfig.json                # strict: true, paths: @/ alias
  package.json                 # next 16.1.6, react 19.2.4, lucide-react, tailwindcss 4
```

---

## Database Schema (MVP subset)

Core tables:

| Table | Purpose |
|-------|---------|
| `tenants` | Multi-tenant org isolation |
| `users` | Admin, agent, customer identity |
| `agents` | Support agent profiles, status, skills, active_tickets |
| `customers` | End customer records |
| `conversations` | Unified chat threads |
| `messages` | Individual messages (customer/agent/AI) |
| `tickets` | Support tickets with status, priority, SLA |
| `knowledge_documents` | Source docs for RAG (soft-delete via deleted_at) |
| `knowledge_chunks` | Chunked text + pgvector embeddings |
| `knowledge_collections` | Document groupings |
| `api_keys` | Developer API key management |
| `audit_logs` | Action trail for compliance |

**Conventions:**
- UUID `id` primary keys on all tables
- `created_at`, `updated_at` (timestamptz) on all tables
- `tenant_id` on all tenant-scoped tables
- RLS policies enforce tenant isolation
- Enums: `channel_enum`, `sender_type_enum`, `ticket_status_enum`, `priority_enum`, `document_status_enum`, `user_role_enum`

---

## API Endpoints

**Base:** `/api/v1`

### Auth (4 endpoints)
- `POST /auth/login` — Email/password login, returns JWT tokens + user
- `POST /auth/signup` — Register new user (creates tenant + role-specific records)
- `POST /auth/refresh` — Refresh JWT using refresh token
- `GET /auth/me` — Get current authenticated user

### Chat (3 endpoints)
- `POST /chat/completions` — Sync chat with RAG (stores messages, generates AI response)
- `GET /chat/conversations/{id}/history` — Paginated message history
- `WebSocket /ws/chat/{conversation_id}` — Live chat with JWT auth via query param

### Tickets (6 endpoints)
- `GET /tickets` — List (filterable by status, paginated with offset)
- `GET /tickets/{id}` — Detail
- `POST /tickets` — Create (auto-assigns to least-loaded available agent)
- `PATCH /tickets/{id}` — Update status/priority/assignee (auto-sets closed_at)
- `GET /tickets/{id}/messages` — List messages for ticket
- `POST /tickets/{id}/messages` — Add message

### Conversations (5 endpoints)
- `GET /conversations` — List (filterable by status, customer_id)
- `GET /conversations/{id}` — Detail
- `POST /conversations` — Create
- `PATCH /conversations/{id}` — Update
- `GET /conversations/{id}/messages` — List messages

### Knowledge Base (6 endpoints)
- `GET /knowledge/documents` — List documents (excludes soft-deleted)
- `POST /knowledge/documents` — Upload (multipart form, admin/agent only)
- `DELETE /knowledge/documents/{id}` — Soft delete + remove chunks (admin only)
- `POST /knowledge/ingest-url` — Ingest from URL (admin/agent only)
- `GET /knowledge/collections` — List collections
- `POST /knowledge/collections` — Create collection (admin only)

### Copilot (3 endpoints)
- `POST /copilot/suggest-reply` — AI suggested reply (uses conversation history + KB context)
- `POST /copilot/summarize` — Ticket/conversation summary with key points
- `POST /copilot/retrieve-kb` — KB snippet retrieval via RAG

### Admin (4 endpoints)
- `GET /admin/agents` — List agents (admin only)
- `PATCH /admin/agents/{id}` — Update agent status/skills (admin only)
- `GET /admin/config/ai` — Read AI config (admin only)
- `PATCH /admin/config/ai` — Update AI config in-memory (admin only)

### Analytics (1 endpoint)
- `GET /analytics/dashboard` — Aggregated metrics: total/open tickets, resolved_today, avg_resolution_time, CSAT, AI resolution rate, active conversations (admin only)

### Health (1 endpoint)
- `GET /health` — Returns `{"status": "ok"}`, no auth required

---

## Design System — "Euron" (Strict)

All UI must follow this system. No deviations.

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#0A66C2` | Buttons, links, active states, brand accent |
| `primary-hover` | `#004182` | Hover/active on primary elements |
| `bg` | `#F3F6F8` | Page background |
| `surface` | `#FFFFFF` | Cards, panels, modals |
| `border` | `#E5E7EB` | Card borders, dividers, input borders |
| `text-primary` | `#111827` | Headings, body text |
| `text-muted` | `#6B7280` | Secondary text, captions, placeholders |
| `success` | `#057642` | Success states only |
| `warning` | `#B45309` | Warning states only |
| `error` | `#B91C1C` | Error states only |
| `input-border` | `#D1D5DB` | Default input borders |

Blue is the dominant color. All other colors used sparingly and functionally.

### Typography

- **Font:** Inter (import from Google Fonts, weights 400/500/600/700)
- **Headings:** weight 600-700
- **Body:** weight 400-500
- **No decorative or fancy fonts**

| Element | Size | Weight |
|---------|------|--------|
| Page title | 28-32px | 700 |
| Section header | 20-24px | 600 |
| Card title | 16-18px | 600 |
| Body text | 14-16px | 400 |
| Caption / meta | 12px | 400 |

### Components

- **Buttons:** Pill-shaped (`rounded-pill`), variants: primary (blue), secondary (border), tertiary (text), danger (red)
- **Cards:** `bg-surface border border-border rounded-lg`, no shadows
- **Inputs:** 44px height, `border-input-border`, focus: `border-brand ring-1 ring-brand/20`
- **Badges:** Variants: default (gray), success, warning, error, brand (blue)
- **Icons:** Lucide React, outline/stroke style, neutral by default
- **Motion:** 100-150ms ease transitions, no bounce/flashy animations
- **No emojis** in product UI

### Tailwind Config Tokens

```js
colors: {
  brand: { DEFAULT: '#0A66C2', hover: '#004182' },
  surface: '#FFFFFF',
  bg: '#F3F6F8',
  border: '#E5E7EB',
  'input-border': '#D1D5DB',
  'text-primary': '#111827',
  'text-muted': '#6B7280',
  success: '#057642',
  warning: '#B45309',
  error: '#B91C1C',
}
```

---

## Coding Conventions

### Backend (Python/FastAPI)

- **Architecture:** Routes > Services > Repositories (clean layered)
- Routes are thin — validation + dependency injection only
- Business logic lives in services
- All DB access through repositories (Supabase PostgREST client)
- Pydantic v2 for all request/response schemas
- Async I/O for all external calls (EURI API, Redis)
- Consistent error response: `{"code": "...", "message": "...", "details": ...}`
- Pagination via offset (`limit`, `offset` params)
- Environment variables for all config (never hardcode secrets)
- Structured logging with `request_id` via middleware
- All repositories enforce `tenant_id` scoping

### Frontend (Next.js/TypeScript)

- App Router (Next.js 16+) with `"use client"` on all pages
- Small, reusable components — separate presentation from logic
- TypeScript strict mode
- Handle loading, error, and empty states on every data-fetching page
- WebSocket for live chat via custom `useWebSocket` hook
- Role-based routing via `useUser(requiredRole?)` hook
- Shared design system components in `components/ui/`
- API calls through centralized `lib/api.ts` client (auto JWT injection)
- Services in `services/` mirror backend route groups
- No external UI libraries — custom component system

### Testing

- pytest + pytest-asyncio for backend
- Mock all external services (Supabase, EURI/OpenAI, Redis) in tests
- `conftest.py` provides mock Supabase with fluent query builder, JWT fixtures for all 3 roles
- Test both success and error/edge cases
- Test RBAC: verify admin-only endpoints reject agent/customer tokens
- Run: `cd backend && python -m pytest app/tests/ -v`

### General

- No secrets in code, Docker layers, or client bundles
- Validate all user input server-side
- RBAC enforced at API layer via `require_role()` dependency
- All schema changes via Supabase migrations
- RLS enabled on tenant-scoped tables
- `.gitignore` covers: `node_modules/`, `.env`, `.env.local`, `__pycache__/`, `*.pyc`, `.next/`, `.pytest_cache/`

---

## Key Flows

### 1. Customer starts a chat
```
User opens /chat
  -> useUser("customer") validates session
  -> WebSocket connects to /ws/chat/{conversation_id}?token=<jwt>
  -> User sends message
  -> Backend: chat_service.handle_message()
    -> Stores user message via message_repo
    -> rag_service.retrieve_context(): embed query -> pgvector search -> top-K chunks
    -> rag_service.generate_answer(): system prompt + KB context + history -> EURI LLM
    -> Stores AI response with citation metadata
  -> Response sent back via WebSocket (or REST fallback)
  -> After 3 AI attempts, "Talk to Agent" button appears for escalation
```

### 2. Ticket creation + auto-assignment
```
Customer creates ticket via POST /tickets
  -> ticket_service.create_ticket()
    -> agent_repo.get_available(): finds agents with status="available", ordered by active_tickets ASC
    -> Assigns to least-loaded agent (round-robin)
    -> Returns ticket with assigned_agent_id
  -> Agent sees ticket in /agent/dashboard and /agent/tickets
```

### 3. Knowledge base ingestion
```
Admin uploads PDF via POST /knowledge/documents (multipart)
  -> Creates document record with status="pending"
  -> ingestion_worker.ingest_document():
    -> parse_pdf(): extract text via pypdf
    -> chunk_text(): split into overlapping chunks (configurable size/overlap)
    -> For each chunk: generate_embedding() via EURI API
    -> knowledge_chunk_repo.create_many(): batch insert with pgvector embeddings
    -> Update document status: "processing" -> "ready" (or "failed")
```

### 4. Agent uses copilot
```
Agent views ticket at /tickets/{id} or /agent/tickets
  -> Clicks "Suggest Reply"
  -> POST /copilot/suggest-reply with ticket_id
  -> copilot_service.suggest_reply():
    -> Fetches last 10 conversation messages
    -> rag_service.retrieve_context(): top 3 KB chunks
    -> EURI LLM generates professional reply
  -> Response populates reply textarea for agent to review/edit/send
```

---

## Environment Variables

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Euron EURI API (OpenAI-compatible)
EURI_API_KEY=
EURI_BASE_URL=https://api.euron.one/api/v1/euri

# Redis
REDIS_URL=

# AWS S3
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=

# App
APP_ENV=development
API_BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=

# Frontend (prefixed for Next.js client exposure)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## Development Workflow

1. **Start backend:** `cd backend && uvicorn app.main:app --reload --port 8000`
2. **Start frontend:** `cd frontend && npm run dev`
3. **Start Redis:** `docker run -p 6379:6379 redis:alpine` (optional — app works without it)
4. **Run migrations:** Via Supabase CLI (`supabase db push`)
5. **Run backend tests:** `cd backend && python -m pytest app/tests/ -v`
6. **Build frontend:** `cd frontend && npm run build`

---

## References

- PRD: `docs/PRD.md`
- Architecture: `docs/ARCHITECTURE.md`
- API Spec: `docs/API_SPEC.md`
- DB Schema: `docs/DB_SCHEMA.md`
- Deployment: `docs/DEPLOYMENT.md`
- Cursor Rules: `.cursor/rules/*.mdc`

---

## Prompt Persistence Rule

**Every prompt in this project must be saved** to `prompts/prompt-history.md`.

- Append each user prompt at the beginning of the response, before any edits or code generation
- Format: ISO 8601 timestamp + exact prompt text
- Never skip saving, never save secrets/tokens, never delete existing entries — only append
- This applies to ALL sessions and ALL tools (Cursor, Claude Code, etc.)

```markdown
### YYYY-MM-DD (UTC)
[Timestamp: YYYY-MM-DDTHH:MM:SSZ]
[Prompt:]
<exact user prompt here>

---
```

---

## Rules Checklist

- [x] Think architect-first; maintain consistency across layers
- [x] Routes are thin; logic in services; DB in repositories
- [x] All three interfaces (admin web, agent web, customer web) share one API
- [x] Supabase migrations for schema changes; RLS on tenant tables
- [x] Redis for cache/queues only; not source of truth (graceful degradation)
- [x] RAG: separate ingestion from generation; cite sources; chunk metadata
- [x] Tickets are first-class entities; auto-assignment to agents
- [x] Agent copilot with clear input/output schemas
- [x] No hardcoded secrets; RBAC everywhere; structured error responses
- [x] Tests for all endpoints, auth flows, and RBAC (58 tests passing)
- [x] Health-checked, structured logs with request_id
- [x] Minimal, production-ready changes; no toy code
