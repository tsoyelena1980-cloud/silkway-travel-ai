import crypto from 'crypto';
import {
  DiscoveredGeminiModel,
  KnowledgeSource,
  SupportAgentConfig,
  SupportConversation,
  UsageEventRecord,
  WorkspaceByokState,
} from './supportTypes';
import {
  DEFAULT_KNOWLEDGE_SOURCES,
  DEFAULT_SUPPORT_AGENT_CONFIG,
  maskGoogleApiKey,
} from './supportEngine';

/**
 * Серверное хранилище секретов (KMS / AES-256-GCM эмуляция at-rest шифрования)
 * Согласно FR-KEY-03 и AC-02, AC-06, AC-10, AC-11:
 * - Ключ шифруется алгоритмом AES-256-GCM с уникальным IV и AuthTag.
 * - Привязывается строго к `workspace_id` (AAD = workspace_id для защиты от подмены tenant).
 * - Полный ключ никогда не покидает сервер после сохранения.
 */

const KMS_MASTER_KEY = crypto
  .createHash('sha256')
  .update(process.env.KMS_MASTER_SECRET || 'silkway-travel-ai-kms-master-secret-2026-byok')
  .digest();

interface EncryptedRecord {
  ivHex: string;
  authTagHex: string;
  cipherTextHex: string;
}

interface TenantVaultEntry {
  workspace_id: string;
  encryptedKey: EncryptedRecord | null;
  state: WorkspaceByokState;
  agentConfig: SupportAgentConfig;
  knowledgeSources: KnowledgeSource[];
  conversations: SupportConversation[];
  usageEvents: UsageEventRecord[];
}

const globalVault = globalThis as unknown as {
  __silkwayByokVault?: Map<string, TenantVaultEntry>;
};

function getVaultMap(): Map<string, TenantVaultEntry> {
  if (!globalVault.__silkwayByokVault) {
    globalVault.__silkwayByokVault = new Map<string, TenantVaultEntry>();
  }
  return globalVault.__silkwayByokVault;
}

export function encryptApiKeyAtRest(plainApiKey: string, workspaceId: string): EncryptedRecord {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KMS_MASTER_KEY, iv);
  cipher.setAAD(Buffer.from(workspaceId, 'utf8'));
  const encrypted = Buffer.concat([cipher.update(plainApiKey, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ivHex: iv.toString('hex'),
    authTagHex: authTag.toString('hex'),
    cipherTextHex: encrypted.toString('hex'),
  };
}

export function decryptApiKeyForWorkspace(
  record: EncryptedRecord,
  requestingWorkspaceId: string
): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    KMS_MASTER_KEY,
    Buffer.from(record.ivHex, 'hex')
  );
  // Строгая изоляция tenant (AC-06): если чужой workspace попытается расшифровать секрет, GCM выбросит ошибку
  decipher.setAAD(Buffer.from(requestingWorkspaceId, 'utf8'));
  decipher.setAuthTag(Buffer.from(record.authTagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(record.cipherTextHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function getOrCreateTenantEntry(workspaceId: string): TenantVaultEntry {
  const map = getVaultMap();
  const safeId = workspaceId.trim() || 'ws-silkway-main';
  let entry = map.get(safeId);
  if (!entry) {
    entry = {
      workspace_id: safeId,
      encryptedKey: null,
      state: {
        workspace_id: safeId,
        provider: 'google_ai_studio',
        status: 'not_connected',
        masked_key: null,
        validated_at: null,
        selected_model_id: null,
        target_models_status: {
          gemini_3_5_found: false,
          gemini_3_6_found: false,
          gemini_3_8_found: false,
          message:
            'Подключите личный API-ключ Google AI Studio, чтобы загрузить каталог доступных моделей Gemini.',
        },
        available_models: [],
      },
      agentConfig: {
        ...DEFAULT_SUPPORT_AGENT_CONFIG,
        workspace_id: safeId,
      },
      knowledgeSources: DEFAULT_KNOWLEDGE_SOURCES.map((s) => ({
        ...s,
        workspace_id: safeId,
      })),
      conversations: [],
      usageEvents: [],
    };
    map.set(safeId, entry);
  }
  return entry;
}

export function saveValidatedKeyToVault(params: {
  workspaceId: string;
  rawApiKey: string;
  models: DiscoveredGeminiModel[];
  selectedModelId: string | null;
  targetModelsStatus: {
    gemini_3_5_found: boolean;
    gemini_3_6_found: boolean;
    gemini_3_8_found: boolean;
    message: string;
  };
}): WorkspaceByokState {
  const entry = getOrCreateTenantEntry(params.workspaceId);
  entry.encryptedKey = encryptApiKeyAtRest(params.rawApiKey.trim(), entry.workspace_id);
  entry.state = {
    workspace_id: entry.workspace_id,
    provider: 'google_ai_studio',
    status: 'active',
    masked_key: maskGoogleApiKey(params.rawApiKey),
    validated_at: new Date().toISOString(),
    selected_model_id: params.selectedModelId,
    target_models_status: params.targetModelsStatus,
    available_models: params.models,
  };
  entry.agentConfig.model_id = params.selectedModelId;
  return entry.state;
}

export function removeKeyFromVault(workspaceId: string): WorkspaceByokState {
  const entry = getOrCreateTenantEntry(workspaceId);
  entry.encryptedKey = null;
  entry.state = {
    workspace_id: entry.workspace_id,
    provider: 'google_ai_studio',
    status: 'not_connected',
    masked_key: null,
    validated_at: null,
    selected_model_id: null,
    target_models_status: {
      gemini_3_5_found: false,
      gemini_3_6_found: false,
      gemini_3_8_found: false,
      message: 'Ключ удалён. Генерация AI-ответов заблокирована до подключения нового ключа (AC-10).',
    },
    available_models: [],
  };
  entry.agentConfig.model_id = null;
  return entry.state;
}

export function getDecryptedKeyForBackendCall(workspaceId: string): string | null {
  const entry = getOrCreateTenantEntry(workspaceId);
  if (!entry.encryptedKey || entry.state.status !== 'active') {
    return null;
  }
  return decryptApiKeyForWorkspace(entry.encryptedKey, entry.workspace_id);
}
