import { AppLanguage } from './types';

/**
 * Статусы жизненного цикла BYOK-ключа согласно FR-KEY-03
 */
export type ByokKeyStatus =
  | 'not_connected'
  | 'validating'
  | 'active'
  | 'invalid'
  | 'quota_exceeded'
  | 'revoked'
  | 'temporarily_unavailable';

/**
 * Описание реально доступной модели из официального каталога Google Gemini API (FR-MODEL-01)
 */
export interface DiscoveredGeminiModel {
  model_id: string; // например, "gemini-2.5-flash" (без префикса "models/")
  full_name: string; // например, "models/gemini-2.5-flash"
  display_name: string;
  description: string;
  supported_methods: string[];
  input_token_limit?: number;
  output_token_limit?: number;
  is_target_35_36_38: boolean; // true только если в реальном каталоге Google найден официальный 3.5 / 3.6 / 3.8
}

/**
 * Состояние подключения BYOK Google AI Studio для конкретного workspace (FR-KEY-01..03)
 * Полный ключ НИКОГДА не передается в ответах API и не хранится в открытом виде.
 */
export interface WorkspaceByokState {
  workspace_id: string;
  provider: 'google_ai_studio';
  status: ByokKeyStatus;
  masked_key: string | null;
  validated_at: string | null;
  selected_model_id: string | null;
  target_models_status: {
    gemini_3_5_found: boolean;
    gemini_3_6_found: boolean;
    gemini_3_8_found: boolean;
    message: string;
  };
  available_models: DiscoveredGeminiModel[];
  error_code?: number;
  error_message?: string;
}

/**
 * Конструктор AI-агента поддержки (FR-AGENT)
 */
export interface SupportAgentConfig {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  language: AppLanguage;
  tone: 'professional' | 'friendly' | 'concise';
  model_id: string | null;
  system_instructions: string;
  greeting: Record<AppLanguage, string>;
  working_hours: string;
  strict_rag_only: boolean;
  version: number;
  updated_at: string;
}

/**
 * Источник базы знаний (FR-KB)
 */
export type KnowledgeSourceType = 'faq' | 'text' | 'url' | 'pdf_excerpt';

export interface KnowledgeSource {
  id: string;
  workspace_id: string;
  title: string;
  type: KnowledgeSourceType;
  uri_or_ref: string;
  content: string;
  chunks_count: number;
  status: 'indexed' | 'indexing' | 'error';
  version: number;
  updated_at: string;
}

export interface KnowledgeChunk {
  id: string;
  source_id: string;
  source_title: string;
  workspace_id: string;
  content: string;
  keywords: string[];
}

export interface RagCitation {
  source_id: string;
  source_title: string;
  snippet: string;
  score: number;
}

/**
 * Статусы диалога согласно FR-CHAT
 */
export type ConversationStatus =
  | 'open'
  | 'ai_handling'
  | 'waiting_for_agent'
  | 'human_handling'
  | 'resolved';

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'ai_agent' | 'human_operator' | 'system';
  sender_name: string;
  content: string;
  citations?: RagCitation[];
  model_used?: string;
  latency_ms?: number;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  low_confidence?: boolean;
  feedback?: 'up' | 'down';
  created_at: string;
}

export interface SupportConversation {
  id: string;
  workspace_id: string;
  customer_name: string;
  customer_contact?: string;
  status: ConversationStatus;
  assignee_name?: string;
  escalation_reason?: string;
  messages: SupportMessage[];
  created_at: string;
  updated_at: string;
}

export interface UsageEventRecord {
  id: string;
  workspace_id: string;
  model_id: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  has_citations: boolean;
  outcome: 'success' | 'escalated' | 'quota_exceeded' | 'error';
  created_at: string;
}

export interface SupportAnalyticsOverview {
  total_conversations: number;
  resolved_without_human_percent: number;
  p95_latency_ms: number;
  avg_latency_ms: number;
  rag_citation_rate_percent: number;
  escalated_count: number;
  total_tokens_used: number;
  key_validation_success_rate: number;
}
