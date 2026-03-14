# CLAUDE.md — Euron AI Customer Support Copilot (MVP)

## Project Identity

**Product Name:** Euron
**Type:** AI-powered customer support SaaS platform
**MVP Goal:** Ship a functional web-based support platform with AI chatbot (RAG), smart ticketing, knowledge base, and admin panel — fast, clean, and professional.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (web) | Next.js 14+, TypeScript, Tailwind CSS |
| Backend | Python 3.11+, FastAPI, Pydantic v2 |
| Database | Supabase (PostgreSQL + pgvector) |
| Cache/Queue | Redis |
| AI | Euron EURI API (OpenAI-compatible, base_url: https://api.euron.one/api/v1/euri) |
| Auth | Supabase Auth + JWT, RBAC |
| Deployment | Docker, AWS (ECS Fargate, ALB, S3) |

---

## MVP Scope — Features to Build

### INCLUDE in MVP (Phase 1)

1. **Auth & RBAC** — Login/signup, role-based access (admin, agent, customer), JWT tokens via Supabase Auth
2. **AI Chatbot (RAG)** — Web chat widget, knowledge-base-powered responses, streamed AI replies via WebSocket, citation/source attribution
3. **Knowledge Base Management** — Document upload (PDF, text), async ingestion pipeline (parse > chunk > embed > store), collection management via admin
4. **Smart Ticketing** — Auto ticket creation from conversations, status management (open/pending/resolved/closed), priority levels, agent assignment, basic SLA tracking
5. **Agent Copilot** — Suggested replies, KB retrieval for agents, ticket summarization
6. **Admin Panel** — AI config, KB management, agent management, basic system monitoring
7. **User Interface** — Customer-facing chat, ticket history, help center
8. **Basic Analytics Dashboard** — Ticket counts, resolution time, open/closed metrics

### EXCLUDE from MVP (Post-launch)

- Voice AI / Video support / Call recording
- WhatsApp, SMS, Slack, Teams channels (Twilio integration)
- Native mobile app (iOS/Android)
- CRM integrations (Salesforce, HubSpot, Zendesk, Jira)
- Advanced NLP (sentiment analysis, intent detection, urgency classification)
- Continuous learning / model retraining
- Multi-language support / translation
- Automation workflows (auto-close, auto-escalation, SLA breach alerts)
- Real-time call monitoring
- Webhook outbound system
- SDK / Developer APIs
- Dark mode

---

## Architecture Overview

```
Clients: Admin (web) + User UI (web)
              |
         ALB / API Gateway
              |
    +---------+---------+
    |                   |
Next.js App        FastAPI Backend
(Admin + User)     (REST + WebSocket)
    |                   |
    |          Services Layer
    |          (Chat, Tickets, RAG,
    |           Agents, KB, Auth)
    |                   |
    |          Repositories
    |                   |
    +----> Supabase (PostgreSQL + pgvector)
                        |
              Redis (cache, queues)
                        |
              OpenAI API (completions, embeddings)
```

### Two interfaces, one app
- **Admin routes** (`/admin/*`): KB management, agent management, AI config, analytics
- **User routes** (`/`): Chat, tickets, help center, conversation history
- Role-based access via middleware; shared component library

---

## Project Structure

### Backend (`/backend`)

```
backend/
  app/
    main.py                 # FastAPI app entry
    core/
      config.py             # Settings via env vars (pydantic-settings)
      security.py           # Auth, JWT validation, RBAC
      middleware.py          # CORS, logging, tenant context
      exceptions.py         # Centralized error handling
    routes/
      auth.py               # Login, signup, token refresh
      chat.py               # WebSocket chat, completions
      tickets.py            # CRUD, assignment, status
      conversations.py      # Conversation management
      knowledge.py          # Document upload, collections
      copilot.py            # Suggested replies, summarize, KB retrieval
      admin.py              # Agent mgmt, AI config, API keys
      analytics.py          # Dashboard metrics
      health.py             # Health check endpoint
    services/
      chat_service.py       # RAG retrieval + LLM response
      ticket_service.py     # Ticket logic, auto-creation, routing
      conversation_service.py
      knowledge_service.py  # Ingestion pipeline
      copilot_service.py    # Agent assist features
      rag_service.py        # Embedding, retrieval, context assembly
      analytics_service.py
    repositories/
      user_repo.py
      ticket_repo.py
      conversation_repo.py
      message_repo.py
      knowledge_repo.py
      agent_repo.py
    models/                 # SQLAlchemy / Supabase models
    schemas/                # Pydantic request/response schemas
    integrations/
      openai_client.py      # OpenAI API wrapper
      supabase_client.py    # Supabase client init
      redis_client.py       # Redis connection
    workers/
      ingestion_worker.py   # Async doc processing
    tests/
  requirements.txt
  Dockerfile
```

### Frontend (`/frontend`)

```
frontend/
  app/
    layout.tsx              # Root layout
    page.tsx                # Landing / redirect
    (auth)/
      login/page.tsx
      signup/page.tsx
    (user)/
      chat/page.tsx         # Live chat interface
      tickets/page.tsx      # Ticket list
      tickets/[id]/page.tsx # Ticket detail
      help/page.tsx         # Help center / KB articles
    (admin)/
      dashboard/page.tsx    # Analytics overview
      knowledge/page.tsx    # KB document management
      agents/page.tsx       # Agent management
      settings/page.tsx     # AI config, system settings
  components/
    ui/                     # Design system primitives (Button, Card, Input, etc.)
    layout/                 # Sidebar, Header, Footer
    chat/                   # ChatWindow, MessageBubble, ChatInput
    tickets/                # TicketCard, TicketList, TicketDetail
    knowledge/              # DocumentUploader, CollectionList
    admin/                  # AgentTable, ConfigPanel
  hooks/
    useWebSocket.ts         # Chat WebSocket hook
    useAuth.ts              # Auth state
    useTickets.ts           # Ticket data fetching
  lib/
    api.ts                  # API client (fetch wrapper)
    constants.ts
    utils.ts
  services/
    auth.ts
    chat.ts
    tickets.ts
    knowledge.ts
  types/
    index.ts                # Shared TypeScript types
  public/
  tailwind.config.ts
  next.config.ts
  tsconfig.json
  package.json
  Dockerfile
```

---

## Database Schema (MVP subset)

Core tables to implement first:

| Table | Purpose |
|-------|---------|
| `tenants` | Multi-tenant org isolation |
| `users` | Admin, agent, customer identity |
| `agents` | Support agent profiles, status, skills |
| `customers` | End customer records |
| `conversations` | Unified chat threads |
| `messages` | Individual messages (customer/agent/AI) |
| `tickets` | Support tickets with status, priority, SLA |
| `knowledge_documents` | Source docs for RAG |
| `knowledge_chunks` | Chunked text + pgvector embeddings |
| `api_keys` | Developer API key management |
| `audit_logs` | Action trail for compliance |

**Conventions:**
- UUID `id` primary keys on all tables
- `created_at`, `updated_at` (timestamptz) on all tables
- `tenant_id` on all tenant-scoped tables
- RLS policies enforce tenant isolation
- Enums: `channel_enum`, `sender_type_enum`, `ticket_status_enum`, `priority_enum`, `document_status_enum`, `user_role_enum`

---

## API Endpoints (MVP subset)

**Base:** `/api/v1`

### Auth
- `POST /auth/login` — Email/password login
- `POST /auth/signup` — Register new user
- `POST /auth/refresh` — Refresh JWT

### Chat
- `WebSocket /ws/chat/{conversation_id}` — Live chat with streamed AI responses
- `POST /chat/completions` — Sync chat fallback
- `GET /chat/conversations/{id}/history` — Chat history

### Tickets
- `GET /tickets` — List (filterable, paginated)
- `GET /tickets/{id}` — Detail with messages
- `POST /tickets` — Create
- `PATCH /tickets/{id}` — Update status/assignee/priority
- `POST /tickets/{id}/messages` — Add message

### Knowledge Base
- `GET /knowledge/documents` — List documents
- `POST /knowledge/documents` — Upload + trigger ingestion
- `DELETE /knowledge/documents/{id}` — Remove
- `GET /knowledge/collections` — List collections
- `POST /knowledge/collections` — Create collection

### Copilot
- `POST /copilot/suggest-reply` — AI suggested reply
- `POST /copilot/summarize` — Ticket/conversation summary
- `POST /copilot/retrieve-kb` — KB snippet retrieval

### Admin
- `GET /admin/agents` — List agents
- `PATCH /admin/agents/{id}` — Update agent
- `GET /admin/config/ai` — Read AI config
- `PATCH /admin/config/ai` — Update AI config

### Analytics
- `GET /analytics/dashboard` — Aggregated metrics

### Health
- `GET /health` — Service health check

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

- **Font:** Inter (import from Google Fonts)
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

Line height: 1.4-1.6 for all text.

### Layout

- Max content width: 1120-1200px, centered
- Grid-based alignment
- Common patterns: Sidebar + main content, feed-style column
- Generous whitespace

### Cards

```css
background: #FFFFFF;
border: 1px solid #E5E7EB;
border-radius: 8px;
box-shadow: none; /* flat, stable, professional */
```

### Buttons

**Primary:**
```css
background: #0A66C2;
color: #FFFFFF;
border-radius: 999px; /* pill */
font-weight: 600;
```

**Secondary:**
```css
background: transparent;
border: 1px solid #0A66C2;
color: #0A66C2;
border-radius: 999px;
```

**Tertiary:** Text only, muted gray color.

No aggressive CTA colors. No gradients.

### Forms & Inputs

- Height: 40-44px
- Border: 1px solid #D1D5DB
- Focus: border #0A66C2 + subtle blue glow (`ring-1 ring-blue-500/20`)
- Labels above inputs
- Placeholder text in muted gray

### Icons

- Outline/stroke-based only (use Lucide React or Heroicons outline)
- Neutral color by default
- Blue only on hover or active

### Motion

- Hover transitions: 100-150ms ease
- No bounce, no flashy animations
- Subtle and professional only

### Content Rules

- Text-first design
- Clear visual hierarchy
- Professional tone
- No emojis in product UI

### Tailwind Config Tokens

```js
// tailwind.config.ts — extend theme
colors: {
  brand: {
    DEFAULT: '#0A66C2',
    hover: '#004182',
  },
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
- All DB access through repositories
- Pydantic v2 for all request/response schemas
- Async I/O for all external calls (OpenAI, Supabase, Redis)
- Consistent error response: `{"code": "...", "message": "...", "details": ...}`
- Pagination via cursor-based (`next_cursor`) or offset
- Environment variables for all config (never hardcode secrets)
- Structured JSON logging with `request_id`, `conversation_id`, `user_id`

### Frontend (Next.js/TypeScript)

- App Router (Next.js 14+)
- Small, reusable components — separate presentation from logic
- TypeScript strict mode
- Handle loading, error, and empty states on every data-fetching page
- WebSocket for live chat via custom `useWebSocket` hook
- Role-based routing middleware (admin vs user)
- Shared design system components in `components/ui/`
- API calls through centralized `lib/api.ts` client

### General

- No secrets in code, Docker layers, or client bundles
- Validate all user input server-side
- RBAC enforced at API layer
- All schema changes via Supabase migrations
- RLS enabled on tenant-scoped tables
- Tests for all service methods and auth flows
- Mock external services (OpenAI, Supabase) in tests

---

## Key Flows (MVP)

### 1. Customer starts a chat
```
User opens chat widget
  -> WebSocket connects to /ws/chat/{conversation_id}
  -> User sends message
  -> Backend: conversation_service creates/updates conversation + message
  -> rag_service retrieves relevant KB chunks
  -> OpenAI chat completion with context
  -> Streamed response back via WebSocket
  -> Message stored in DB
```

### 2. Ticket creation from chat
```
Conversation reaches threshold or customer requests help
  -> ticket_service auto-creates ticket
  -> Sets priority (default or basic NLP)
  -> Assigns to available agent (round-robin or skill match)
  -> Agent sees ticket in dashboard
```

### 3. Knowledge base ingestion
```
Admin uploads PDF via /knowledge/documents
  -> File stored in S3
  -> Async worker: parse PDF -> chunk text -> generate embeddings (OpenAI)
  -> Store chunks + vectors in knowledge_chunks (pgvector)
  -> Document status: pending -> processing -> ready
```

### 4. Agent uses copilot
```
Agent views ticket
  -> Clicks "Suggest Reply"
  -> POST /copilot/suggest-reply with ticket context
  -> RAG retrieval + LLM generates suggested response
  -> Agent reviews, edits, sends
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
```

---

## Development Workflow

1. **Start backend:** `cd backend && uvicorn app.main:app --reload --port 8000`
2. **Start frontend:** `cd frontend && npm run dev`
3. **Start Redis:** `docker run -p 6379:6379 redis:alpine`
4. **Run migrations:** Via Supabase CLI (`supabase db push`)
5. **Run tests:** `cd backend && pytest` / `cd frontend && npm test`

---

## Build Order (Recommended)

### Phase 1 — Foundation
1. Project scaffolding (backend + frontend)
2. Supabase setup + migrations (core tables)
3. Auth (login/signup/JWT/RBAC)
4. Health check endpoint
5. Basic layout shell (sidebar, header, routing)

### Phase 2 — Core Features
6. Knowledge base CRUD + upload
7. Ingestion pipeline (parse > chunk > embed > store)
8. RAG retrieval service
9. Chat WebSocket + AI responses
10. Conversation + message persistence

### Phase 3 — Ticketing & Copilot
11. Ticket CRUD + status management
12. Auto ticket creation from conversations
13. Agent assignment (basic round-robin)
14. Copilot: suggest reply, summarize, KB retrieval
15. Agent dashboard view

### Phase 4 — Polish
16. Basic analytics dashboard
17. Admin: AI config, agent management
18. Error handling, loading states, empty states
19. Basic tests for services and auth
20. Docker setup + deployment config

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

## Rules Checklist (from .cursor/rules)

- [ ] Think architect-first; maintain consistency across layers
- [ ] Routes are thin; logic in services; DB in repositories
- [ ] All three interfaces (admin web, user web, mobile) share one API — MVP: web only
- [ ] Supabase migrations for all schema changes; RLS on tenant tables
- [ ] Redis for cache/queues only; not source of truth
- [ ] RAG: separate ingestion from generation; cite sources; chunk metadata
- [ ] Tickets are first-class entities; support async processing
- [ ] Agent tools have clear input/output schemas and failure behavior
- [ ] No hardcoded secrets; PII masking; audit logs; RBAC everywhere
- [ ] Tests for services, auth flows, and RAG logic
- [ ] Containerized, stateless, health-checked, structured logs
- [ ] Minimal, production-ready changes; no toy code
