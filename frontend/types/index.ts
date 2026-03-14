// ============================================
// Euron — Core TypeScript Types
// ============================================

// --- Enums ---

export type UserRole = "admin" | "agent" | "viewer" | "customer";

export type Channel = "chat" | "email" | "whatsapp" | "sms" | "slack" | "teams" | "voice" | "video";

export type SenderType = "customer" | "agent" | "system" | "ai";

export type TicketStatus = "open" | "pending" | "resolved" | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type DocumentStatus = "pending" | "processing" | "ready" | "failed";

export type AgentStatus = "available" | "busy" | "offline";

export type ConversationStatus = "open" | "pending" | "closed";

// --- Core Entities ---

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  display_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  tenant_id: string;
  user_id: string;
  display_name: string;
  status: AgentStatus;
  skills: string[];
  active_tickets: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  external_id?: string;
  email: string;
  phone?: string;
  display_name: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  tenant_id: string;
  customer_id: string;
  channel: Channel;
  status: ConversationStatus;
  assigned_agent_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface Message {
  id: string;
  tenant_id: string;
  conversation_id: string;
  sender_type: SenderType;
  sender_id?: string;
  channel: Channel;
  content: string;
  content_type: "text" | "html";
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Ticket {
  id: string;
  tenant_id: string;
  conversation_id?: string;
  customer_id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_agent_id?: string;
  sla_due_at?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  // Joined fields for display
  customer?: Customer;
  assigned_agent?: Agent;
}

export interface KnowledgeDocument {
  id: string;
  tenant_id: string;
  title: string;
  source_type: "upload" | "url" | "api";
  source_ref?: string;
  status: DocumentStatus;
  version: number;
  chunk_count?: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeCollection {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  document_count: number;
  created_at: string;
}

// --- API Response Types ---

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  next_cursor?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// --- Auth Types ---

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  display_name: string;
  role?: UserRole;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// --- Chat Types ---

export interface ChatMessage {
  id: string;
  content: string;
  sender_type: SenderType;
  created_at: string;
  citations?: Citation[];
  is_streaming?: boolean;
}

export interface Citation {
  document_title: string;
  chunk_content: string;
  relevance_score: number;
}

// --- Analytics Types ---

export interface DashboardMetrics {
  total_tickets: number;
  open_tickets: number;
  resolved_today: number;
  avg_resolution_time_hours: number;
  avg_first_response_minutes: number;
  csat_score: number;
  ai_resolution_rate: number;
  active_conversations: number;
}

// --- Copilot Types ---

export interface SuggestedReply {
  suggested_reply: string;
  confidence: number;
  sources: string[];
}

export interface TicketSummary {
  summary: string;
  key_points: string[];
}

export interface KBSnippet {
  document_title: string;
  content: string;
  relevance_score: number;
}
