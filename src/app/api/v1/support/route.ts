import { NextRequest, NextResponse } from 'next/server';
import {
  getDecryptedKeyForBackendCall,
  getOrCreateTenantEntry,
  removeKeyFromVault,
  saveValidatedKeyToVault,
} from '@/lib/byokServerVault';
import {
  generateSupportRagAnswer,
  sanitizeKnowledgeText,
  validateGoogleAiStudioKeyAndDiscoverModels,
} from '@/lib/supportEngine';
import { KnowledgeSourceType } from '@/lib/supportTypes';
import { AppLanguage } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspace_id') || 'ws-silkway-main';
  const entry = getOrCreateTenantEntry(workspaceId);

  return NextResponse.json({
    ok: true,
    byok: entry.state,
    agentConfig: entry.agentConfig,
    knowledgeSources: entry.knowledgeSources,
    conversations: entry.conversations,
    usageEvents: entry.usageEvents.slice(-50),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as string;
    const workspaceId = (body.workspace_id as string) || 'ws-silkway-main';
    const entry = getOrCreateTenantEntry(workspaceId);

    // 1. Подключение и проверка личного ключа Google AI Studio (FR-KEY-01..03, AC-02..05)
    if (action === 'connect_key' || action === 'validate_key') {
      const rawApiKey = String(body.api_key || '').trim();
      const validation = await validateGoogleAiStudioKeyAndDiscoverModels(rawApiKey);

      if (validation.status !== 'active') {
        entry.state = {
          ...entry.state,
          status: validation.status,
          error_code: validation.error_code,
          error_message: validation.error_message,
          target_models_status: validation.target_models_status,
        };
        return NextResponse.json(
          {
            ok: false,
            byok: entry.state,
            error: validation.error_message,
          },
          { status: validation.error_code || 400 }
        );
      }

      const savedState = saveValidatedKeyToVault({
        workspaceId,
        rawApiKey,
        models: validation.models,
        selectedModelId: validation.recommended_model_id,
        targetModelsStatus: validation.target_models_status,
      });

      return NextResponse.json({
        ok: true,
        byok: savedState,
        agentConfig: entry.agentConfig,
      });
    }

    // 2. Удаление и отключение ключа (FR-KEY-03, AC-10)
    if (action === 'delete_key') {
      const clearedState = removeKeyFromVault(workspaceId);
      return NextResponse.json({
        ok: true,
        byok: clearedState,
        agentConfig: entry.agentConfig,
      });
    }

    // 3. Явный выбор модели из реального каталога (FR-MODEL-01, AC-04, AC-05, AC-12)
    if (action === 'select_model') {
      const requestedModelId = String(body.model_id || '').trim();
      const existsInCatalog = entry.state.available_models.some(
        (m) => m.model_id === requestedModelId
      );

      if (!existsInCatalog) {
        return NextResponse.json(
          {
            ok: false,
            error: `Модель "${requestedModelId}" отсутствует в подтвержденном каталоге вашего ключа Google AI Studio (AC-04, AC-05).`,
          },
          { status: 400 }
        );
      }

      entry.state.selected_model_id = requestedModelId;
      entry.agentConfig.model_id = requestedModelId;
      entry.agentConfig.version += 1;
      entry.agentConfig.updated_at = new Date().toISOString();

      return NextResponse.json({
        ok: true,
        byok: entry.state,
        agentConfig: entry.agentConfig,
      });
    }

    // 4. Обновление настроек AI-агента (FR-AGENT)
    if (action === 'update_agent') {
      if (typeof body.name === 'string' && body.name.trim()) {
        entry.agentConfig.name = body.name.trim().slice(0, 80);
      }
      if (typeof body.system_instructions === 'string') {
        entry.agentConfig.system_instructions = sanitizeKnowledgeText(
          body.system_instructions,
          1500
        );
      }
      if (body.tone === 'professional' || body.tone === 'friendly' || body.tone === 'concise') {
        entry.agentConfig.tone = body.tone;
      }
      if (typeof body.strict_rag_only === 'boolean') {
        entry.agentConfig.strict_rag_only = body.strict_rag_only;
      }
      entry.agentConfig.version += 1;
      entry.agentConfig.updated_at = new Date().toISOString();

      return NextResponse.json({
        ok: true,
        agentConfig: entry.agentConfig,
      });
    }

    // 5. Добавление источника в базу знаний (FR-KB)
    if (action === 'add_knowledge') {
      const title = sanitizeKnowledgeText(String(body.title || ''), 140);
      const content = sanitizeKnowledgeText(String(body.content || ''), 4000);
      const type: KnowledgeSourceType =
        body.type === 'url' || body.type === 'pdf_excerpt' || body.type === 'text'
          ? body.type
          : 'faq';

      if (!title || !content) {
        return NextResponse.json(
          { ok: false, error: 'Заголовок и текст источника обязательны.' },
          { status: 400 }
        );
      }

      const newSource = {
        id: `KB-0${entry.knowledgeSources.length + 1}-${Date.now().toString().slice(-3)}`,
        workspace_id: workspaceId,
        title,
        type,
        uri_or_ref: String(body.uri_or_ref || `silkway://kb/custom-${Date.now()}`).slice(0, 200),
        content,
        chunks_count: Math.max(1, Math.ceil(content.length / 300)),
        status: 'indexed' as const,
        version: 1,
        updated_at: new Date().toISOString(),
      };

      entry.knowledgeSources.unshift(newSource);
      return NextResponse.json({
        ok: true,
        knowledgeSources: entry.knowledgeSources,
      });
    }

    // 6. Удаление источника из базы знаний (FR-KB)
    if (action === 'delete_knowledge') {
      const sourceId = String(body.source_id || '');
      entry.knowledgeSources = entry.knowledgeSources.filter((s) => s.id !== sourceId);
      return NextResponse.json({
        ok: true,
        knowledgeSources: entry.knowledgeSources,
      });
    }

    // 7. Отправка сообщения в чат поддержки и автономная генерация RAG-ответа (без перевода на менеджера)
    if (action === 'chat') {
      const decryptedKey = getDecryptedKeyForBackendCall(workspaceId);
      const selectedModelId = entry.state.selected_model_id || '';

      const userMessage = String(body.message || '').trim();
      const lang: AppLanguage =
        body.language === 'en' || body.language === 'uz' ? body.language : 'ru';
      const outputStyle =
        body.output_style === 'manager_facing' || body.output_style === 'owner_facing'
          ? body.output_style
          : 'client_facing';

      const result = await generateSupportRagAnswer({
        apiKey: entry.state.status === 'active' && decryptedKey ? decryptedKey : '',
        modelId: selectedModelId,
        userMessage,
        language: lang,
        agentConfig: entry.agentConfig,
        knowledgeSources: entry.knowledgeSources,
        outputStyle,
      });

      entry.usageEvents.push({
        id: `evt-${Date.now()}`,
        workspace_id: workspaceId,
        model_id: result.modelUsed,
        prompt_tokens: result.tokenUsage.prompt_tokens,
        completion_tokens: result.tokenUsage.completion_tokens,
        total_tokens: result.tokenUsage.total_tokens,
        latency_ms: result.latencyMs,
        has_citations: result.citations.length > 0,
        outcome: 'success',
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        ok: true,
        result,
      });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
