---
name: ai-support-agent
description: Multi-tenant SaaS AI Support Agent skill with strict Google AI Studio BYOK (Bring Your Own Key) integration, dynamic Gemini model discovery (including target series 3.5/3.6/3.8 verification), grounded RAG knowledge base with citations, prompt-injection defense, RBAC workspace isolation, embeddable web widget, operator inbox, and SLO/KPI telemetry. Use when building, auditing, or operating customer support AI agents based on AI_Support_Agent_PRD.md.
---

# AI Support Agent (BYOK Gemini & Grounded RAG Platform)

This skill implements the complete product, security, and architectural requirements from **PRD — AI Support Agent v1.0** (`references/AI_Support_Agent_PRD.md`).

## 1. Core Principles (BYOK & Security First)

1. **Bring Your Own Key (BYOK — `FR-KEY-01..03`, `AC-01..03`, `AC-10..11`)**:
   - Each workspace connects its own personal **Google AI Studio API Key** (`https://aistudio.google.com/apikey`).
   - Authentication uses the official Google Gen AI SDK (`@google/genai`) or official REST header `x-goog-api-key`. Never use deprecated `@google/generative-ai`.
   - Never expose the full API key in responses, `localStorage`, URLs, logs, or client bundles. Only return a masked value (e.g., `AIzaSy...9x7Q`) and connection status (`not_connected`, `validating`, `active`, `invalid`, `quota_exceeded`, `revoked`, `temporarily_unavailable`).
   - Encrypt keys at rest (`AES-256-GCM` / KMS) and isolate them strictly by `workspace_id` (`AC-06`).
   - Support key validation, re-validation, replacement, and deletion (`AC-10`).

2. **Dynamic Gemini Model Discovery (`FR-MODEL-01..02`, `AC-04..05`, `AC-12`)**:
   - Query the live Gemini catalog (`GET /v1beta/models`) using the workspace's validated key.
   - Filter for models supporting `generateContent`.
   - **Critical Rule (`AC-05`)**: Target product versions (`Gemini 3.5`, `Gemini 3.6`, `Gemini 3.8`) are checked dynamically against the official catalog. Never fabricate or hardcode non-existent model IDs (`gemini-3.5-*`, `gemini-3.6-*`, `gemini-3.8-*`). If unavailable in Google AI Studio, clearly explain this in the UI and offer verified available models only with explicit user selection (`AC-12`).
   - Never silently swap the user's selected model.

3. **Grounded RAG & Prompt-Injection Defense (`FR-KB`, `FR-CHAT`, `AC-07..08`)**:
   - Index knowledge sources (`faq`, `text`, `pdf_excerpt`, `url`) with metadata (`workspace_id`, `version`, `updated_at`, `chunks_count`).
   - Sanitize all external/uploaded text against prompt injection (`ignore previous instructions`, `system prompt:`, `<script>`, etc.) before indexing or prompting.
   - Always cite verified RAG sources (`[KB-01]`, `[KB-02]`) in answers (`≥ 90%` citation rate target).
   - Never invent facts, prices, or policies (`AC-08`).

4. **Workspace RBAC, Widget, Inbox & SLO Telemetry (`FR-AGENT`, `FR-WIDGET`, `FR-INBOX`, `FR-ANALYTICS`)**:
   - **Roles**: Workspace Owner, Administrator, Operator, End Customer.
   - **KPI Targets**:
     - First AI response latency (p95): `≤ 10s`
     - Autonomous resolution rate: `≥ 40%` (up to `100%` in autonomous concierge mode)
     - Key validation accuracy: `≥ 99%`
     - Monthly availability SLO: `99.5%`
     - RAG source citation rate: `≥ 90%`

## 2. Reference Files
- Full PRD specification: [references/AI_Support_Agent_PRD.md](references/AI_Support_Agent_PRD.md)
