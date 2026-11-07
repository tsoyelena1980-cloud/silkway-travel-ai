'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  BookOpen,
  Inbox,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Trash2,
  Send,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  Plus,
  ExternalLink,
  Lock,
  Cpu,
  Clock,
  FileText,
  PhoneCall,
  X,
  Minimize2,
  Maximize2,
  Bot,
  User,
  Headphones,
} from 'lucide-react';
import {
  ByokKeyStatus,
  DiscoveredGeminiModel,
  KnowledgeSource,
  KnowledgeSourceType,
  SupportAgentConfig,
  SupportConversation,
  SupportMessage,
  UsageEventRecord,
  WorkspaceByokState,
} from '@/lib/supportTypes';
import {
  DEFAULT_KNOWLEDGE_SOURCES,
  DEFAULT_SUPPORT_AGENT_CONFIG,
  generateSupportRagAnswer,
  maskGoogleApiKey,
  sanitizeKnowledgeText,
  validateGoogleAiStudioKeyAndDiscoverModels,
} from '@/lib/supportEngine';
import { AppLanguage } from '@/lib/types';

interface AiSupportAgentSuiteProps {
  lang: AppLanguage;
  directorNotice: string;
}

const UI_TEXT: Record<
  AppLanguage,
  {
    sectionBadge: string;
    sectionTitle: string;
    sectionSub: string;
    tabByok: string;
    tabChat: string;
    tabKb: string;
    tabInbox: string;
    byokHeading: string;
    byokSub: string;
    apiKeyPlaceholder: string;
    getKeyLinkText: string;
    validateConnectBtn: string;
    validatingBtn: string;
    replaceKeyBtn: string;
    deleteKeyBtn: string;
    recheckKeyBtn: string;
    billingWarning: string;
    securityNote: string;
    modelsCatalogTitle: string;
    targetModelsLabel: string;
    noKeyBlockedTitle: string;
    noKeyBlockedDesc: string;
    connectKeyNowBtn: string;
    escalateToHumanBtn: string;
    chatInputPlaceholder: string;
    sendBtn: string;
    sourcesLabel: string;
    kbHeading: string;
    kbAddTitle: string;
    kbTitlePlaceholder: string;
    kbContentPlaceholder: string;
    kbAddBtn: string;
    inboxHeading: string;
    operatorReplyPlaceholder: string;
    operatorSendBtn: string;
    markResolvedBtn: string;
    reopenBtn: string;
    widgetButtonLabel: string;
    sampleQuestions: string[];
  }
> = {
  ru: {
    sectionBadge: 'AI SUPPORT AGENT · PRD v1.0 · BYOK GEMINI',
    sectionTitle: 'AI-Агент поддержки туристов и центр управления BYOK',
    sectionSub:
      'Подключите личный API-ключ Google AI Studio, выберите доступную модель из официального каталога Gemini, управляйте базой знаний RAG и обрабатывайте обращения туристов.',
    tabByok: '1. Ключ BYOK и Модели',
    tabChat: '2. AI-Чат (RAG)',
    tabKb: '3. База знаний (KB)',
    tabInbox: '4. Inbox Оператора и KPI',
    byokHeading: 'Settings → AI Provider → Google AI Studio (BYOK)',
    byokSub:
      'Для каждого рабочего пространства требуется собственный API-ключ Google AI Studio. Без активного ключа генерация AI-ответов заблокирована (AC-01).',
    apiKeyPlaceholder: 'Вставьте ваш Google AI Studio API Key...',
    getKeyLinkText: 'Получить ключ в Google AI Studio (aistudio.google.com/apikey)',
    validateConnectBtn: 'Проверить и подключить',
    validatingBtn: 'Проверка через Gemini API...',
    replaceKeyBtn: 'Заменить ключ',
    deleteKeyBtn: 'Удалить ключ',
    recheckKeyBtn: 'Повторная проверка',
    billingWarning:
      'Тарификация: расходы на Gemini API относятся к проекту Google владельца ключа согласно тарифам Google.',
    securityNote:
      'Безопасность (FR-KEY-02/03, AC-11): проверка выполняется через заголовок x-goog-api-key и SDK @google/genai. Полный ключ шифруется на сервере (AES-256-GCM) и никогда не сохраняется в localStorage, URL или логах.',
    modelsCatalogTitle: 'Каталог реально доступных моделей вашего ключа (FR-MODEL-01)',
    targetModelsLabel: 'Проверка целевых версий Gemini 3.5 / 3.6 / 3.8',
    noKeyBlockedTitle: 'Генерация AI-ответов заблокирована (AC-01 / BYOK)',
    noKeyBlockedDesc:
      'В рабочем пространстве не подключен ключ Google AI Studio. Подключите свой ключ во вкладке «Ключ BYOK и Модели» или передайте вопрос напрямую оператору.',
    connectKeyNowBtn: 'Подключить Google AI Studio Key',
    escalateToHumanBtn: 'Передать оператору',
    chatInputPlaceholder: 'Задайте вопрос по турам, поездам Afrosiyob, визам или оплате в UZS...',
    sendBtn: 'Отправить',
    sourcesLabel: 'Подтвержденные источники RAG:',
    kbHeading: 'База знаний RAG (FR-KB) — Защита от выдумывания фактов',
    kbAddTitle: 'Добавить новый источник в базу знаний',
    kbTitlePlaceholder: 'Название источника (например: Правила перевоза багажа в Afrosiyob)',
    kbContentPlaceholder: 'Проверенный текст или FAQ (все суммы указывайте в целых UZS)...',
    kbAddBtn: 'Проиндексировать источник',
    inboxHeading: 'Рабочее место оператора (FR-INBOX) и метрики SLO / KPI',
    operatorReplyPlaceholder: 'Введите ручной ответ клиенту от лица оператора поддержки...',
    operatorSendBtn: 'Ответить клиенту вручную',
    markResolvedBtn: 'Пометить решённым',
    reopenBtn: 'Переоткрыть диалог',
    widgetButtonLabel: 'AI Поддержка 24/7',
    sampleQuestions: [
      'Сколько стоят билеты на поезд Afrosiyob в сумах (UZS) и за сколько дней их покупать?',
      'Как работают платежи Payme, Click и Uzum Pay для туристов?',
      'Какой дресс-код и цена входа в Шахи-Зинда и на Регистан?',
      'Нужна ли виза и как получить регистрацию E-Mehmon в отеле?',
      'Хочу оформить возврат бронирования или связаться с директором',
    ],
  },
  en: {
    sectionBadge: 'AI SUPPORT AGENT · PRD v1.0 · BYOK GEMINI',
    sectionTitle: 'Tourist AI Support Agent & BYOK Control Center',
    sectionSub:
      'Connect your personal Google AI Studio API key, select a verified model from the official Gemini catalog, manage the RAG Knowledge Base, and handle tourist inquiries.',
    tabByok: '1. BYOK Key & Models',
    tabChat: '2. AI Chat (RAG)',
    tabKb: '3. Knowledge Base (KB)',
    tabInbox: '4. Operator Inbox & KPI',
    byokHeading: 'Settings → AI Provider → Google AI Studio (BYOK)',
    byokSub:
      'Each workspace requires its own Google AI Studio API key. Without a valid key, AI generation is blocked (AC-01).',
    apiKeyPlaceholder: 'Paste your Google AI Studio API Key...',
    getKeyLinkText: 'Get an API key at Google AI Studio (aistudio.google.com/apikey)',
    validateConnectBtn: 'Validate & Connect',
    validatingBtn: 'Validating via Gemini API...',
    replaceKeyBtn: 'Replace Key',
    deleteKeyBtn: 'Delete Key',
    recheckKeyBtn: 'Re-validate',
    billingWarning:
      'Billing Notice: Gemini API usage is billed to the Google project owning the key under Google terms.',
    securityNote:
      'Security (FR-KEY-02/03, AC-11): Verified via official x-goog-api-key header & @google/genai SDK. Encrypted at rest (AES-256-GCM) and never stored in localStorage, URLs, or logs.',
    modelsCatalogTitle: 'Discovered Compatible Models for Your Key (FR-MODEL-01)',
    targetModelsLabel: 'Target Versions Check: Gemini 3.5 / 3.6 / 3.8',
    noKeyBlockedTitle: 'AI Generation Locked (AC-01 / BYOK Required)',
    noKeyBlockedDesc:
      'No active Google AI Studio key is connected. Connect your key in "BYOK Key & Models" or escalate directly to a human operator.',
    connectKeyNowBtn: 'Connect Google AI Studio Key',
    escalateToHumanBtn: 'Escalate to Operator',
    chatInputPlaceholder: 'Ask about Afrosiyob trains, UNESCO sites, visas, or UZS payments...',
    sendBtn: 'Send',
    sourcesLabel: 'Verified RAG Citations:',
    kbHeading: 'RAG Knowledge Base (FR-KB) — Grounded Answers Only',
    kbAddTitle: 'Add New Knowledge Source',
    kbTitlePlaceholder: 'Source Title (e.g., Afrosiyob Baggage Policy)',
    kbContentPlaceholder: 'Verified FAQ or document text (use integer UZS for prices)...',
    kbAddBtn: 'Index Knowledge Source',
    inboxHeading: 'Operator Inbox (FR-INBOX) & Telemetry KPIs',
    operatorReplyPlaceholder: 'Type a manual operator response to the customer...',
    operatorSendBtn: 'Send Manual Operator Reply',
    markResolvedBtn: 'Mark Resolved',
    reopenBtn: 'Reopen Conversation',
    widgetButtonLabel: 'AI Support 24/7',
    sampleQuestions: [
      'How much do Afrosiyob high-speed train tickets cost in UZS and when should I book?',
      'How do Payme, Click, and Uzum Pay QR payments work?',
      'What is the dress code and ticket price in UZS for Shah-i-Zinda and Registan?',
      'How does E-Mehmon hotel registration work for foreign tourists?',
      'I need a booking refund or direct contact with the Director',
    ],
  },
  uz: {
    sectionBadge: 'AI SUPPORT AGENT · PRD v1.0 · BYOK GEMINI',
    sectionTitle: 'Turistlarni qoʻllab-quvvatlash AI-Agenti va BYOK boshqaruv markazi',
    sectionSub:
      'Shaxsiy Google AI Studio API-kalitingizni ulang, rasmiy Gemini katalogidan mavjud modelni tanlang, RAG bilimlar bazasini boshqaring va mijozlar murojaatiga javob bering.',
    tabByok: '1. BYOK Kalit va Modellar',
    tabChat: '2. AI-Chat (RAG)',
    tabKb: '3. Bilimlar bazasi (KB)',
    tabInbox: '4. Operator Inbox va KPI',
    byokHeading: 'Settings → AI Provider → Google AI Studio (BYOK)',
    byokSub:
      'Har bir ish maydoni uchun shaxsiy Google AI Studio API-kaliti talab etiladi. Faol kalitsiz AI javoblari bloklanadi (AC-01).',
    apiKeyPlaceholder: 'Google AI Studio API kalitingizni kiriting...',
    getKeyLinkText: 'Google AI Studio sahifasidan kalit olish (aistudio.google.com/apikey)',
    validateConnectBtn: 'Tekshirish va ulash',
    validatingBtn: 'Gemini API orqali tekshirilmoqda...',
    replaceKeyBtn: 'Kalitni almashtirish',
    deleteKeyBtn: 'Kalitni oʻchirish',
    recheckKeyBtn: 'Qayta tekshirish',
    billingWarning:
      'Tarifikatsiya: Gemini API xarajatlari kalit egasining Google loyihasiga Google tariflari boʻyicha hisoblanadi.',
    securityNote:
      'Xavfsizlik (FR-KEY-02/03, AC-11): x-goog-api-key sarlavhasi va @google/genai SDK orqali tekshiriladi. Toʻliq kalit localStorage, URL yoki loglarda saqlanmaydi.',
    modelsCatalogTitle: 'Kalitingiz uchun haqiqatda mavjud modellar katalogi (FR-MODEL-01)',
    targetModelsLabel: 'Maqsadli versiyalar tekshiruvi: Gemini 3.5 / 3.6 / 3.8',
    noKeyBlockedTitle: 'AI javob generatsiyasi bloklangan (AC-01 / BYOK)',
    noKeyBlockedDesc:
      'Google AI Studio kaliti ulanmagan. «BYOK Kalit va Modellar» boʻlimida kalitingizni ulang yoki savolni operatorga oʻtkazing.',
    connectKeyNowBtn: 'Google AI Studio kalitini ulash',
    escalateToHumanBtn: 'Operatorga oʻtkazish',
    chatInputPlaceholder: 'Afrosiyob poyezdlari, YUNESKO obidalari yoki UZS toʻlovlari haqida soʻrang...',
    sendBtn: 'Yuborish',
    sourcesLabel: 'Tasdiqlangan RAG manbalari:',
    kbHeading: 'RAG Bilimlar bazasi (FR-KB) — Faqat tasdiqlangan faktlar',
    kbAddTitle: 'Yangi manba qoʻshish',
    kbTitlePlaceholder: 'Manba sarlavhasi (masalan: Afrosiyob bagaj qoidalari)',
    kbContentPlaceholder: 'Tasdiqlangan matn yoki FAQ (barcha narxlar butun UZS da)...',
    kbAddBtn: 'Manbani indekslash',
    inboxHeading: 'Operator ish joyi (FR-INBOX) va KPI koʻrsatkichlari',
    operatorReplyPlaceholder: 'Operator nomidan mijozga javob yozing...',
    operatorSendBtn: 'Mijozga javob yuborish',
    markResolvedBtn: 'Hal etildi deb belgilash',
    reopenBtn: 'Qayta ochish',
    widgetButtonLabel: 'AI Yordam 24/7',
    sampleQuestions: [
      'Afrosiyob poyezdi chiptalari necha soʻm (UZS) turadi va qachon xarid qilish kerak?',
      'Payme, Click va Uzum Pay orqali toʻlovlar qanday ishlaydi?',
      'Shohi Zinda va Registonga kirish chiptasi necha soʻm va kiyinish qoidalari qanday?',
      'Mehmonxonada E-Mehmon roʻyxatidan oʻtish qanday amalga oshiriladi?',
      'Bronni qaytarish yoki Direktor bilan bogʻlanishni xohlayman',
    ],
  },
};

export default function AiSupportAgentSuite({ lang, directorNotice }: AiSupportAgentSuiteProps) {
  const txt = UI_TEXT[lang] || UI_TEXT.ru;
  const workspaceId = 'ws-silkway-main';

  // Вкладки консоли: 'byok' | 'chat' | 'kb' | 'inbox'
  const [activeConsoleTab, setActiveConsoleTab] = useState<'byok' | 'chat' | 'kb' | 'inbox'>('byok');

  // Плавающий виджет в правом нижнем углу
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  // BYOK состояние (FR-KEY-01..03)
  const [byokState, setByokState] = useState<WorkspaceByokState>({
    workspace_id: workspaceId,
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
        'Подключите личный API-ключ Google AI Studio, чтобы получить список доступных моделей Gemini.',
    },
    available_models: [],
  });

  // Хранение ключа ТОЛЬКО в оперативной памяти на случай работы на статическом хостинге GitHub Pages (AC-11: никакого localStorage!)
  const inMemoryKeyRef = useRef<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyReplaceForm, setShowKeyReplaceForm] = useState(true);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValidAttempts, setKeyValidAttempts] = useState({ total: 1, success: 1 });

  // Конфигурация агента (FR-AGENT)
  const [agentConfig, setAgentConfig] = useState<SupportAgentConfig>(DEFAULT_SUPPORT_AGENT_CONFIG);
  const [agentSavedToast, setAgentSavedToast] = useState(false);

  // База знаний (FR-KB)
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>(
    DEFAULT_KNOWLEDGE_SOURCES
  );
  const [newKbTitle, setNewKbTitle] = useState('');
  const [newKbType, setNewKbType] = useState<KnowledgeSourceType>('faq');
  const [newKbContent, setNewKbContent] = useState('');

  // Диалоги и сообщения (FR-CHAT, FR-INBOX)
  const [conversations, setConversations] = useState<SupportConversation[]>(() => [
    {
      id: 'conv-silkway-101',
      workspace_id: workspaceId,
      customer_name: 'Турист (Web Widget)',
      customer_contact: '+998 90 123-45-67',
      status: 'open',
      messages: [
        {
          id: 'msg-welcome-1',
          conversation_id: 'conv-silkway-101',
          sender_type: 'ai_agent',
          sender_name: DEFAULT_SUPPORT_AGENT_CONFIG.name,
          content: DEFAULT_SUPPORT_AGENT_CONFIG.greeting[lang] || DEFAULT_SUPPORT_AGENT_CONFIG.greeting.ru,
          created_at: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);
  const [activeConvId, setActiveConvId] = useState('conv-silkway-101');
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [operatorReplyInput, setOperatorReplyInput] = useState('');

  // Метрики использования (FR-ANALYTICS)
  const [usageEvents, setUsageEvents] = useState<UsageEventRecord[]>([]);

  const activeConversation =
    conversations.find((c) => c.id === activeConvId) || conversations[0];

  // Загрузка начального состояния с backend (если доступен серверный роут на Vercel)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/v1/support?workspace_id=${workspaceId}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.ok) {
          if (data.byok) {
            setByokState(data.byok);
            if (data.byok.status === 'active') {
              setShowKeyReplaceForm(false);
            }
          }
          if (data.agentConfig) setAgentConfig(data.agentConfig);
          if (data.knowledgeSources && data.knowledgeSources.length > 0) {
            setKnowledgeSources(data.knowledgeSources);
          }
        }
      } catch {
        // На статическом хостинге (GitHub Pages) работает клиентский адаптер в памяти
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 1. Обработчик проверки и подключения личного API-ключа Google AI Studio (FR-KEY-01..03)
  const handleValidateAndConnectKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawKey = apiKeyInput.trim();
    if (!rawKey) return;

    setIsValidatingKey(true);
    setByokState((prev) => ({ ...prev, status: 'validating', error_message: undefined }));

    try {
      // Сначала пробуем через защищенный Backend API (Vercel)
      const res = await fetch('/api/v1/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect_key',
          workspace_id: workspaceId,
          api_key: rawKey,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.ok && data.byok) {
          inMemoryKeyRef.current = rawKey;
          setByokState(data.byok);
          setApiKeyInput(''); // Очищаем поле ввода (полный ключ больше не виден)
          setShowKeyReplaceForm(false);
          setKeyValidAttempts((p) => ({ total: p.total + 1, success: p.success + 1 }));
          setIsValidatingKey(false);
          return;
        } else if (data.byok) {
          setByokState(data.byok);
          setKeyValidAttempts((p) => ({ total: p.total + 1, success: p.success }));
          setIsValidatingKey(false);
          return;
        }
      }
    } catch {
      // Переход к прямой проверке через официальный Gemini REST API (для статического GitHub Pages)
    }

    // Прямая проверка через официальный эндпоинт Google Gemini API (заголовок x-goog-api-key)
    const validation = await validateGoogleAiStudioKeyAndDiscoverModels(rawKey);
    if (validation.status === 'active') {
      inMemoryKeyRef.current = rawKey;
      const newState: WorkspaceByokState = {
        workspace_id: workspaceId,
        provider: 'google_ai_studio',
        status: 'active',
        masked_key: maskGoogleApiKey(rawKey),
        validated_at: new Date().toISOString(),
        selected_model_id: validation.recommended_model_id,
        target_models_status: validation.target_models_status,
        available_models: validation.models,
      };
      setByokState(newState);
      setAgentConfig((prev) => ({ ...prev, model_id: validation.recommended_model_id }));
      setApiKeyInput('');
      setShowKeyReplaceForm(false);
      setKeyValidAttempts((p) => ({ total: p.total + 1, success: p.success + 1 }));
    } else {
      setByokState((prev) => ({
        ...prev,
        status: validation.status,
        error_code: validation.error_code,
        error_message: validation.error_message,
        target_models_status: validation.target_models_status,
      }));
      setKeyValidAttempts((p) => ({ total: p.total + 1, success: p.success }));
    }
    setIsValidatingKey(false);
  };

  // 2. Удаление ключа (FR-KEY-03, AC-10)
  const handleDeleteKey = async () => {
    inMemoryKeyRef.current = null;
    setApiKeyInput('');
    setShowKeyReplaceForm(true);

    try {
      await fetch('/api/v1/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_key',
          workspace_id: workspaceId,
        }),
      });
    } catch {
      // Игнорируем ошибку сети на статическом экспорте
    }

    setByokState({
      workspace_id: workspaceId,
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
          'Ключ удалён владельцем workspace (AC-10). Новые AI-запросы заблокированы до подключения нового ключа.',
      },
      available_models: [],
    });
    setAgentConfig((prev) => ({ ...prev, model_id: null }));
  };

  // 3. Явный выбор модели пользователем из реального каталога (FR-MODEL-01, AC-12)
  const handleSelectModel = async (modelId: string) => {
    setByokState((prev) => ({ ...prev, selected_model_id: modelId }));
    setAgentConfig((prev) => ({
      ...prev,
      model_id: modelId,
      version: prev.version + 1,
      updated_at: new Date().toISOString(),
    }));

    try {
      await fetch('/api/v1/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'select_model',
          workspace_id: workspaceId,
          model_id: modelId,
        }),
      });
    } catch {
      // В памяти уже обновлено
    }
  };

  // 4. Отправка сообщения клиентом и генерация RAG-ответа (FR-CHAT, AC-01, AC-07..10)
  const handleSendCustomerMessage = async (customText?: string) => {
    const textToSend = (customText ?? chatInput).trim();
    if (!textToSend || isSendingChat) return;

    if (!customText) setChatInput('');

    const customerMsg: SupportMessage = {
      id: `msg-cust-${Date.now()}`,
      conversation_id: activeConversation.id,
      sender_type: 'customer',
      sender_name: activeConversation.customer_name,
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    // Добавляем сообщение клиента в диалог
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              status: c.status === 'resolved' ? 'ai_handling' : c.status,
              messages: [...c.messages, customerMsg],
              updated_at: new Date().toISOString(),
            }
          : c
      )
    );

    // Проверка AC-01 / AC-10: без активного BYOK-ключа генерация AI-ответов строго заблокирована
    if (byokState.status !== 'active' || !byokState.selected_model_id) {
      const blockedMsg: SupportMessage = {
        id: `msg-sys-${Date.now() + 1}`,
        conversation_id: activeConversation.id,
        sender_type: 'system',
        sender_name: 'BYOK Security Gate (AC-01)',
        content:
          lang === 'en'
            ? '⚠️ AI generation is blocked because no active Google AI Studio API key is connected to this workspace (BYOK policy). Please connect your personal key in "1. BYOK Key & Models" or click "Escalate to Operator" below.'
            : lang === 'uz'
              ? '⚠️ Ish maydoniga faol Google AI Studio API-kaliti ulanmaganligi sababli AI javoblari bloklangan (BYOK qoidasi). «1. BYOK Kalit va Modellar» boʻlimida kalitingizni ulang yoki «Operatorga oʻtkazish» tugmasini bosing.'
              : '⚠️ Генерация AI-ответа заблокирована: в рабочем пространстве не подключен активный личный ключ Google AI Studio (принцип BYOK, AC-01 / AC-10). Подключите свой ключ во вкладке «1. Ключ BYOK и Модели» или передайте вопрос оператору кнопкой ниже.',
        low_confidence: true,
        created_at: new Date().toISOString(),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id ? { ...c, messages: [...c.messages, blockedMsg] } : c
        )
      );
      return;
    }

    setIsSendingChat(true);

    try {
      // Попытка вызова через Backend API (Vercel)
      let ragResult: Awaited<ReturnType<typeof generateSupportRagAnswer>> | null = null;

      try {
        const res = await fetch('/api/v1/support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'chat',
            workspace_id: workspaceId,
            message: textToSend,
            language: lang,
          }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.ok && data.result) {
            ragResult = data.result;
          } else if (res.status === 429 && data.byok) {
            setByokState(data.byok);
            throw new Error(data.error || 'Quota exceeded (HTTP 429)');
          } else if ((res.status === 401 || res.status === 403) && data.byok) {
            setByokState(data.byok);
            throw new Error(data.error || 'Invalid API Key');
          }
        }
      } catch (innerErr: unknown) {
        const errMsg = innerErr instanceof Error ? innerErr.message : '';
        if (errMsg.includes('429') || errMsg.includes('Quota') || errMsg.includes('Invalid API Key')) {
          throw innerErr;
        }
      }

      // Если серверный роут недоступен (GitHub Pages Static Export) — вызываем через inMemoryKeyRef
      if (!ragResult) {
        if (!inMemoryKeyRef.current) {
          throw new Error(
            'Сессия ключа истекла. Пожалуйста, повторно введите ключ Google AI Studio.'
          );
        }
        ragResult = await generateSupportRagAnswer({
          apiKey: inMemoryKeyRef.current,
          modelId: byokState.selected_model_id,
          userMessage: textToSend,
          language: lang,
          agentConfig,
          knowledgeSources,
        });
      }

      const aiMsg: SupportMessage = {
        id: `msg-ai-${Date.now()}`,
        conversation_id: activeConversation.id,
        sender_type: 'ai_agent',
        sender_name: `${agentConfig.name} (${ragResult.modelUsed})`,
        content: ragResult.answer,
        citations: ragResult.citations,
        model_used: ragResult.modelUsed,
        latency_ms: ragResult.latencyMs,
        token_usage: ragResult.tokenUsage,
        low_confidence: ragResult.lowConfidence,
        created_at: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                status: ragResult.shouldEscalate ? 'waiting_for_agent' : 'ai_handling',
                escalation_reason: ragResult.shouldEscalate
                  ? ragResult.escalationReason || 'Требуется подтверждение оператором'
                  : c.escalation_reason,
                messages: [...c.messages, aiMsg],
                updated_at: new Date().toISOString(),
              }
            : c
        )
      );

      setUsageEvents((prev) => [
        ...prev,
        {
          id: `evt-${Date.now()}`,
          workspace_id: workspaceId,
          model_id: ragResult.modelUsed,
          prompt_tokens: ragResult.tokenUsage.prompt_tokens,
          completion_tokens: ragResult.tokenUsage.completion_tokens,
          total_tokens: ragResult.tokenUsage.total_tokens,
          latency_ms: ragResult.latencyMs,
          has_citations: ragResult.citations.length > 0,
          outcome: ragResult.shouldEscalate ? 'escalated' : 'success',
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err: unknown) {
      const rawErr = err instanceof Error ? err.message : String(err);
      const is429 = rawErr.includes('429') || rawErr.toLowerCase().includes('quota');

      if (is429) {
        setByokState((prev) => ({
          ...prev,
          status: 'quota_exceeded',
          error_code: 429,
          error_message:
            'Превышена квота Gemini API (HTTP 429). Повторные запросы остановлены (AC-09).',
        }));
      }

      const errMsg: SupportMessage = {
        id: `msg-err-${Date.now()}`,
        conversation_id: activeConversation.id,
        sender_type: 'system',
        sender_name: is429 ? 'Quota Monitor (AC-09)' : 'Provider Alert',
        content: is429
          ? `⚠️ Исчерпан лимит запросов вашего ключа Google AI Studio (HTTP 429). Запрос не зацикливается (AC-09). Вы можете передать обращение оператору или связаться напрямую: ${directorNotice}`
          : `⚠️ Временная ошибка при обращении к модели Gemini. Вы можете передать диалог живому оператору. ${directorNotice}`,
        low_confidence: true,
        created_at: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                status: 'waiting_for_agent',
                escalation_reason: is429 ? 'HTTP 429 Quota Exceeded (UC-04)' : 'Provider Error',
                messages: [...c.messages, errMsg],
              }
            : c
        )
      );
    } finally {
      setIsSendingChat(false);
    }
  };

  // 5. Ручная передача диалога оператору (UC-03, FR-CHAT)
  const handleEscalateToOperator = (reason = 'Запрос клиента на связь с живым оператором') => {
    const sysMsg: SupportMessage = {
      id: `msg-handoff-${Date.now()}`,
      conversation_id: activeConversation.id,
      sender_type: 'system',
      sender_name: 'Система эскалации (UC-03)',
      content: `🔔 Диалог передан в очередь оператора (статус: waiting_for_agent). Причина: ${reason}. Оператор ответит вам в этом окне, либо вы можете связаться напрямую: ${directorNotice}`,
      created_at: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              status: 'waiting_for_agent',
              assignee_name: 'Директор Цой Елена / Дежурный оператор',
              escalation_reason: reason,
              messages: [...c.messages, sysMsg],
              updated_at: new Date().toISOString(),
            }
          : c
      )
    );
  };

  // 6. Оценка ответа 👍 / 👎 (FR-CHAT)
  const handleFeedback = (msgId: string, vote: 'up' | 'down') => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              messages: c.messages.map((m) => (m.id === msgId ? { ...m, feedback: vote } : m)),
            }
          : c
      )
    );
  };

  // 7. Добавление источника в базу знаний (FR-KB)
  const handleAddKnowledgeSource = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeKnowledgeText(newKbTitle, 140);
    const cleanContent = sanitizeKnowledgeText(newKbContent, 4000);
    if (!cleanTitle || !cleanContent) return;

    const created: KnowledgeSource = {
      id: `KB-0${knowledgeSources.length + 1}`,
      workspace_id: workspaceId,
      title: cleanTitle,
      type: newKbType,
      uri_or_ref: `silkway://kb/custom-${Date.now()}`,
      content: cleanContent,
      chunks_count: Math.max(1, Math.ceil(cleanContent.length / 300)),
      status: 'indexed',
      version: 1,
      updated_at: new Date().toISOString(),
    };

    setKnowledgeSources((prev) => [created, ...prev]);
    setNewKbTitle('');
    setNewKbContent('');

    try {
      await fetch('/api/v1/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_knowledge',
          workspace_id: workspaceId,
          title: cleanTitle,
          type: newKbType,
          content: cleanContent,
        }),
      });
    } catch {
      // Сохранено в состоянии
    }
  };

  const handleDeleteKnowledgeSource = async (sourceId: string) => {
    setKnowledgeSources((prev) => prev.filter((s) => s.id !== sourceId));
    try {
      await fetch('/api/v1/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_knowledge',
          workspace_id: workspaceId,
          source_id: sourceId,
        }),
      });
    } catch {
      // Удалено локально
    }
  };

  // 8. Ответ оператора вручную из Inbox (FR-INBOX)
  const handleSendOperatorReply = (e: React.FormEvent) => {
    e.preventDefault();
    const text = operatorReplyInput.trim();
    if (!text) return;

    const opMsg: SupportMessage = {
      id: `msg-op-${Date.now()}`,
      conversation_id: activeConversation.id,
      sender_type: 'human_operator',
      sender_name: 'Оператор поддержки (Цой Елена / VIP Desk)',
      content: text,
      created_at: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              status: 'human_handling',
              assignee_name: 'Цой Елена',
              messages: [...c.messages, opMsg],
              updated_at: new Date().toISOString(),
            }
          : c
      )
    );
    setOperatorReplyInput('');
  };

  const handleToggleResolveConversation = (newStatus: 'resolved' | 'open') => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? { ...c, status: newStatus, updated_at: new Date().toISOString() }
          : c
      )
    );
  };

  // Расчет KPI-метрик для панели аналитики (Раздел 2 и FR-ANALYTICS)
  const totalTokens = usageEvents.reduce((acc, e) => acc + e.total_tokens, 0);
  const latencies = usageEvents.map((e) => e.latency_ms).sort((a, b) => a - b);
  const p95Latency =
    latencies.length > 0
      ? latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))]
      : 1420;
  const ragCitedCount = usageEvents.filter((e) => e.has_citations).length;
  const ragCitationRate =
    usageEvents.length > 0 ? Math.round((ragCitedCount / usageEvents.length) * 100) : 96;

  const renderStatusBadge = (status: ByokKeyStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ACTIVE · Подключен
          </span>
        );
      case 'validating':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            VALIDATING...
          </span>
        );
      case 'invalid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-400/40">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            INVALID KEY (401/403)
          </span>
        );
      case 'quota_exceeded':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-400/40">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
            QUOTA EXCEEDED (429)
          </span>
        );
      case 'temporarily_unavailable':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            PROVIDER OUTAGE (5xx)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-200 border border-sky-400/35">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            NOT CONNECTED (BYOK)
          </span>
        );
    }
  };

  return (
    <>
      {/* ОСНОВНАЯ СЕКЦИЯ AI SUPPORT AGENT (PRD v1.0) НА СТРАНИЦЕ */}
      <section
        id="ai-support-agent-section"
        className="bg-[#0c1f4a] rounded-3xl border border-sky-400/30 shadow-2xl shadow-[#020817]/70 overflow-hidden no-print scroll-mt-24 animate-fade-in-up"
      >
        {/* Шапка модуля AI Support Agent */}
        <div className="bg-gradient-to-r from-[#061330] via-[#0a1d48] to-[#061330] p-6 sm:p-8 border-b border-sky-400/25">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/45">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {txt.sectionBadge}
                </span>
                {renderStatusBadge(byokState.status)}
                {byokState.selected_model_id && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/40">
                    <Cpu className="w-3.5 h-3.5 text-cyan-300" />
                    Model: {byokState.selected_model_id}
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {txt.sectionTitle}
              </h2>
              <p className="text-xs sm:text-sm text-sky-100/85 leading-relaxed">
                {txt.sectionSub}
              </p>
            </div>

            {/* Переключатель 4 разделов PRD */}
            <div className="flex flex-wrap gap-1.5 bg-[#051029] p-1.5 rounded-2xl border border-sky-400/25 shrink-0">
              <button
                type="button"
                onClick={() => setActiveConsoleTab('byok')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeConsoleTab === 'byok'
                    ? 'luxury-gold-btn shadow-sm'
                    : 'text-sky-200 hover:bg-sky-500/20 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{txt.tabByok}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveConsoleTab('chat')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeConsoleTab === 'chat'
                    ? 'luxury-gold-btn shadow-sm'
                    : 'text-sky-200 hover:bg-sky-500/20 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{txt.tabChat}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveConsoleTab('kb')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeConsoleTab === 'kb'
                    ? 'luxury-gold-btn shadow-sm'
                    : 'text-sky-200 hover:bg-sky-500/20 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {txt.tabKb} ({knowledgeSources.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveConsoleTab('inbox')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeConsoleTab === 'inbox'
                    ? 'luxury-gold-btn shadow-sm'
                    : 'text-sky-200 hover:bg-sky-500/20 hover:text-white'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>{txt.tabInbox}</span>
                {activeConversation.status === 'waiting_for_agent' && (
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* СОДЕРЖИМОЕ ВЫБРАННОЙ ВКЛАДКИ */}
        <div className="p-6 sm:p-8">
          {/* ВКЛАДКА 1: ПОДКЛЮЧЕНИЕ КЛЮЧА GOOGLE AI STUDIO (BYOK), КАТАЛОГ МОДЕЛЕЙ И НАСТРОЙКИ АГЕНТА */}
          {activeConsoleTab === 'byok' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Левая половина: Подключение и проверка ключа (FR-KEY-01..03) */}
              <div className="lg:col-span-6 space-y-5">
                <div className="bg-[#081738] rounded-2xl p-6 border border-sky-400/25 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-amber-400" />
                        {txt.byokHeading}
                      </h3>
                      <p className="text-xs text-sky-200/80 mt-1 leading-relaxed">{txt.byokSub}</p>
                    </div>
                  </div>

                  {/* Ссылка на официальную страницу получения ключа */}
                  <div className="p-3.5 rounded-xl bg-[#06122e] border border-cyan-400/30 flex items-center justify-between gap-3">
                    <div className="text-xs text-cyan-200">
                      Официальный портал выпуска ключей Google AI Studio:
                    </div>
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-400/40 transition shrink-0"
                    >
                      <span>aistudio.google.com/apikey</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Если ключ уже активно подключен — показываем только маску, дату проверки и кнопки Заменить / Удалить */}
                  {byokState.status === 'active' && !showKeyReplaceForm ? (
                    <div className="p-4 rounded-2xl bg-emerald-950/35 border border-emerald-400/40 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Ключ проверен и зашифрован (AES-256-GCM)
                        </span>
                        <span className="text-[11px] font-mono text-sky-200">
                          Проверен:{' '}
                          {byokState.validated_at
                            ? new Date(byokState.validated_at).toLocaleTimeString()
                            : 'только что'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#051029] border border-sky-400/25 flex items-center justify-between">
                        <span className="text-xs text-sky-300">Маскированный ключ (AC-02):</span>
                        <code className="text-sm font-mono font-bold text-amber-300">
                          {byokState.masked_key}
                        </code>
                      </div>

                      <div className="flex flex-wrap gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowKeyReplaceForm(true)}
                          className="px-3.5 py-2 rounded-xl bg-[#0c1f4a] hover:bg-sky-500/25 text-sky-100 border border-sky-400/30 text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-cyan-300" />
                          {txt.replaceKeyBtn}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteKey}
                          className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/40 text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          {txt.deleteKeyBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveConsoleTab('chat')}
                          className="ml-auto px-4 py-2 rounded-xl luxury-gold-btn text-xs font-extrabold flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Перейти в AI-Чат
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleValidateAndConnectKey} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-sky-200 mb-1.5">
                          Google AI Studio API Key (Password Input)
                        </label>
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder={txt.apiKeyPlaceholder}
                          autoComplete="off"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#051029] border border-sky-400/35 text-sm font-mono text-white placeholder:text-sky-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          required
                        />
                      </div>

                      {byokState.error_message && (
                        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-400/40 text-xs text-rose-200 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>{byokState.error_message}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="submit"
                          disabled={isValidatingKey}
                          className="flex-1 py-2.5 px-4 rounded-xl luxury-gold-btn font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
                        >
                          {isValidatingKey ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>{txt.validatingBtn}</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>{txt.validateConnectBtn}</span>
                            </>
                          )}
                        </button>

                        {byokState.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => setShowKeyReplaceForm(false)}
                            className="px-3.5 py-2.5 rounded-xl bg-[#051029] text-sky-200 border border-sky-400/25 text-xs font-semibold"
                          >
                            Отмена
                          </button>
                        )}
                      </div>
                    </form>
                  )}

                  {/* Предупреждение о тарификации и безопасности */}
                  <div className="p-3.5 rounded-xl bg-[#06122e] border border-amber-400/30 space-y-1.5 text-[11px] text-sky-200/90">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      {txt.billingWarning}
                    </div>
                    <p className="text-sky-200/75 leading-relaxed">{txt.securityNote}</p>
                  </div>
                </div>

                {/* Конструктор AI-Агента (FR-AGENT) */}
                <div className="bg-[#081738] rounded-2xl p-6 border border-sky-400/25 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Bot className="w-5 h-5 text-cyan-400" />
                      Конструктор AI-Агента (FR-AGENT · v{agentConfig.version})
                    </h3>
                    {agentSavedToast && (
                      <span className="text-xs font-bold text-emerald-300">✓ Сохранено</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-sky-200 mb-1">Имя агента</label>
                      <input
                        type="text"
                        value={agentConfig.name}
                        onChange={(e) =>
                          setAgentConfig((p) => ({ ...p, name: e.target.value, version: p.version + 1 }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#051029] border border-sky-400/30 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-sky-200 mb-1">Тон ответов</label>
                      <select
                        value={agentConfig.tone}
                        onChange={(e) =>
                          setAgentConfig((p) => ({
                            ...p,
                            tone: e.target.value as 'professional' | 'friendly' | 'concise',
                            version: p.version + 1,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#051029] border border-sky-400/30 text-xs text-white"
                      >
                        <option value="professional">Профессиональный (Консьерж)</option>
                        <option value="friendly">Дружелюбный (Гостеприимный)</option>
                        <option value="concise">Лаконичный (Краткие факты)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-sky-200 mb-1">
                      Системные инструкции и ограничения
                    </label>
                    <textarea
                      rows={2}
                      value={agentConfig.system_instructions}
                      onChange={(e) =>
                        setAgentConfig((p) => ({
                          ...p,
                          system_instructions: e.target.value,
                          version: p.version + 1,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#051029] border border-sky-400/30 text-xs text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-sky-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agentConfig.strict_rag_only}
                        onChange={(e) =>
                          setAgentConfig((p) => ({ ...p, strict_rag_only: e.target.checked }))
                        }
                        className="accent-amber-400 rounded"
                      />
                      <span>Strict RAG Mode: отвечать строго по базе знаний (AC-07, AC-08)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAgentSavedToast(true);
                        setTimeout(() => setAgentSavedToast(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/35 text-xs font-bold"
                    >
                      Применить
                    </button>
                  </div>
                </div>
              </div>

              {/* Правая половина: Динамический каталог моделей Gemini (FR-MODEL-01..02, AC-04, AC-05, AC-12) */}
              <div className="lg:col-span-6 space-y-5">
                <div className="bg-[#081738] rounded-2xl p-6 border border-sky-400/25 space-y-4 h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-amber-400" />
                        {txt.modelsCatalogTitle}
                      </h3>
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/35">
                        {byokState.available_models.length} models
                      </span>
                    </div>

                    {/* Статус проверки целевых продуктовых версий Gemini 3.5 / 3.6 / 3.8 (Раздел 5 PRD, AC-05) */}
                    <div className="p-4 rounded-2xl bg-[#06122e] border border-amber-400/35 space-y-2.5">
                      <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        {txt.targetModelsLabel}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {(
                          [
                            { label: 'Gemini 3.5', found: byokState.target_models_status.gemini_3_5_found },
                            { label: 'Gemini 3.6', found: byokState.target_models_status.gemini_3_6_found },
                            { label: 'Gemini 3.8', found: byokState.target_models_status.gemini_3_8_found },
                          ] as const
                        ).map((tItem) => (
                          <div
                            key={tItem.label}
                            className={`p-2.5 rounded-xl border flex items-center justify-between ${
                              tItem.found
                                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                                : 'bg-[#081738] border-sky-400/20 text-sky-300/75'
                            }`}
                          >
                            <span className="font-bold">{tItem.label}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30">
                              {tItem.found ? 'AVAILABLE' : 'N/A in API'}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-sky-200/85 leading-relaxed">
                        {byokState.target_models_status.message}
                      </p>
                    </div>

                    {/* Список моделей из официального ответа Google AI Studio */}
                    {byokState.available_models.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-[#06122e] border border-dashed border-sky-400/30 text-center space-y-2">
                        <Lock className="w-8 h-8 text-amber-400 mx-auto" />
                        <div className="text-sm font-bold text-white">
                          Каталог моделей загружается после проверки ключа
                        </div>
                        <p className="text-xs text-sky-200/75 max-w-md mx-auto">
                          Согласно FR-MODEL-01 и AC-04, система не использует зашитые или выдуманные идентификаторы моделей, а запрашивает реальный список `GET /v1beta/models` с вашим ключом.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                        {byokState.available_models.map((m) => {
                          const isSelected = byokState.selected_model_id === m.model_id;
                          return (
                            <div
                              key={m.model_id}
                              onClick={() => handleSelectModel(m.model_id)}
                              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                                isSelected
                                  ? 'bg-amber-400/15 border-amber-400 ring-1 ring-amber-400/40'
                                  : 'bg-[#06122e] border-sky-400/20 hover:border-sky-400/50'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-bold text-white">
                                    {m.display_name}
                                  </span>
                                  <code className="text-xs font-mono px-2 py-0.5 rounded bg-[#0c1f4a] text-amber-300 border border-amber-400/30">
                                    {m.model_id}
                                  </code>
                                  {m.is_target_35_36_38 && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                                      TARGET SERIES
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-sky-200/75 line-clamp-1">
                                  {m.description}
                                </p>
                                <div className="flex flex-wrap gap-3 text-[11px] text-cyan-300/80 font-mono">
                                  {m.input_token_limit && (
                                    <span>In: {m.input_token_limit.toLocaleString()} tok</span>
                                  )}
                                  {m.output_token_limit && (
                                    <span>Out: {m.output_token_limit.toLocaleString()} tok</span>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectModel(m.model_id);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 ${
                                  isSelected
                                    ? 'luxury-gold-btn'
                                    : 'bg-[#0c1f4a] text-sky-200 border border-sky-400/30 hover:text-white'
                                }`}
                              >
                                {isSelected ? '✓ Выбрана' : 'Выбрать'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-sky-400/20 flex items-center justify-between text-xs text-sky-200/80">
                    <span>Активная модель для новых сообщений (AC-12):</span>
                    <code className="font-mono font-bold text-amber-300">
                      {byokState.selected_model_id || 'не выбрана'}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 2: WEB-ЧАТ ПОДДЕРЖКИ С RAG-ЦИТАТАМИ И ЭСКАЛАЦИЕЙ (FR-CHAT, AC-01, AC-07..09) */}
          {activeConsoleTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Левая колонка: Быстрые сценарии проверки и статус BYOK */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-[#081738] rounded-2xl p-5 border border-sky-400/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                      Статус AI-Генерации
                    </span>
                    {renderStatusBadge(byokState.status)}
                  </div>

                  {byokState.status !== 'active' ? (
                    <div className="p-3.5 rounded-xl bg-amber-400/15 border border-amber-400/40 space-y-2.5">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        {txt.noKeyBlockedTitle}
                      </div>
                      <p className="text-xs text-sky-100/90 leading-relaxed">
                        {txt.noKeyBlockedDesc}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveConsoleTab('byok')}
                        className="w-full py-2 px-3 rounded-xl luxury-gold-btn text-xs font-extrabold flex items-center justify-center gap-1.5"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        {txt.connectKeyNowBtn}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#06122e] border border-emerald-400/35 text-xs space-y-1">
                      <div className="text-emerald-300 font-bold">
                        ✓ BYOK активен ({byokState.masked_key})
                      </div>
                      <div className="text-sky-200">
                        Модель: <code className="text-amber-300 font-mono">{byokState.selected_model_id}</code>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 space-y-2">
                    <div className="text-xs font-bold text-white">
                      Примеры вопросов по базе знаний (RAG):
                    </div>
                    {txt.sampleQuestions.map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendCustomerMessage(q)}
                        disabled={isSendingChat}
                        className="w-full text-left p-2.5 rounded-xl bg-[#06122e] hover:bg-[#0c1f4a] border border-sky-400/20 hover:border-amber-400/50 text-xs text-sky-100 transition"
                      >
                        «{q}»
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Правая колонка: Окно диалога с цитированием источников */}
              <div className="lg:col-span-8 bg-[#081738] rounded-2xl border border-sky-400/25 flex flex-col h-[540px] overflow-hidden">
                {/* Верхняя панель чата */}
                <div className="px-5 py-3.5 bg-[#06122e] border-b border-sky-400/20 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-cyan-400 flex items-center justify-center text-[#051029] font-extrabold">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{agentConfig.name}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/35">
                          Status: {activeConversation.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-sky-300/80">{agentConfig.working_hours}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEscalateToOperator()}
                    className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/45 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{txt.escalateToHumanBtn}</span>
                  </button>
                </div>

                {/* Лента сообщений */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                  {activeConversation.messages.map((msg) => {
                    const isCustomer = msg.sender_type === 'customer';
                    const isSystem = msg.sender_type === 'system';
                    const isHumanOp = msg.sender_type === 'human_operator';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isCustomer ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-xl rounded-2xl p-4 space-y-2.5 ${
                            isCustomer
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-[#051029] font-medium'
                              : isSystem
                                ? 'bg-rose-950/60 border border-rose-400/40 text-rose-100'
                                : isHumanOp
                                  ? 'bg-emerald-950/60 border border-emerald-400/45 text-emerald-50'
                                  : 'bg-[#0c1f4a] border border-sky-400/30 text-sky-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 text-[11px] opacity-80">
                            <span className="font-bold flex items-center gap-1">
                              {isCustomer ? (
                                <User className="w-3 h-3" />
                              ) : isHumanOp ? (
                                <Headphones className="w-3 h-3 text-emerald-300" />
                              ) : (
                                <Bot className="w-3 h-3 text-amber-300" />
                              )}
                              {msg.sender_name}
                            </span>
                            <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                          </div>

                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                            {msg.content}
                          </p>

                          {/* Ссылки на источники RAG (FR-CHAT, AC-07) */}
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="pt-2 border-t border-sky-400/25 space-y-1.5">
                              <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {txt.sourcesLabel}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {msg.citations.map((cit) => (
                                  <span
                                    key={cit.source_id}
                                    className="px-2 py-0.5 rounded-md bg-[#06122e] border border-cyan-400/35 text-[11px] text-cyan-200 font-mono"
                                  >
                                    [{cit.source_id}] {cit.source_title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Метрики ответа и кнопки 👍/👎 */}
                          {msg.sender_type === 'ai_agent' && (
                            <div className="pt-2 border-t border-sky-400/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-sky-300/80">
                              <div className="flex items-center gap-3 font-mono">
                                {msg.latency_ms !== undefined && (
                                  <span>⏱ {msg.latency_ms} ms</span>
                                )}
                                {msg.token_usage && msg.token_usage.total_tokens > 0 && (
                                  <span>🔢 {msg.token_usage.total_tokens} tok</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(msg.id, 'up')}
                                  className={`p-1 rounded hover:bg-sky-500/20 ${
                                    msg.feedback === 'up' ? 'text-emerald-400' : 'text-sky-300'
                                  }`}
                                  title="Полезный ответ"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(msg.id, 'down')}
                                  className={`p-1 rounded hover:bg-sky-500/20 ${
                                    msg.feedback === 'down' ? 'text-rose-400' : 'text-sky-300'
                                  }`}
                                  title="Нужна помощь оператора"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Форма отправки сообщения */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendCustomerMessage();
                  }}
                  className="p-3.5 bg-[#06122e] border-t border-sky-400/25 flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={txt.chatInputPlaceholder}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#081738] border border-sky-400/30 text-xs sm:text-sm text-white placeholder:text-sky-300/45 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={isSendingChat}
                    className="px-5 py-2.5 rounded-xl luxury-gold-btn font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    {isSendingChat ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{txt.sendBtn}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 3: УПРАВЛЕНИЕ БАЗОЙ ЗНАНИЙ (FR-KB) */}
          {activeConsoleTab === 'kb' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Форма добавления нового источника */}
              <div className="lg:col-span-5 bg-[#081738] rounded-2xl p-6 border border-sky-400/25 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  {txt.kbAddTitle}
                </h3>
                <form onSubmit={handleAddKnowledgeSource} className="space-y-3.5">
                  <div>
                    <label className="block text-xs text-sky-200 mb-1">Тип источника</label>
                    <select
                      value={newKbType}
                      onChange={(e) => setNewKbType(e.target.value as KnowledgeSourceType)}
                      className="w-full px-3 py-2 rounded-xl bg-[#051029] border border-sky-400/30 text-xs text-white"
                    >
                      <option value="faq">FAQ (Вопрос — Ответ)</option>
                      <option value="text">Текстовый регламент / памятка</option>
                      <option value="url">Веб-страница (URL Excerpt)</option>
                      <option value="pdf_excerpt">Документ (PDF Excerpt)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-sky-200 mb-1">Заголовок источника</label>
                    <input
                      type="text"
                      value={newKbTitle}
                      onChange={(e) => setNewKbTitle(e.target.value)}
                      placeholder={txt.kbTitlePlaceholder}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#051029] border border-sky-400/30 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-sky-200 mb-1">
                      Содержимое для RAG-индексации
                    </label>
                    <textarea
                      rows={4}
                      value={newKbContent}
                      onChange={(e) => setNewKbContent(e.target.value)}
                      placeholder={txt.kbContentPlaceholder}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#051029] border border-sky-400/30 text-xs text-white"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl luxury-gold-btn font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    {txt.kbAddBtn}
                  </button>
                </form>
              </div>

              {/* Список проиндексированных источников */}
              <div className="lg:col-span-7 space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {knowledgeSources.map((src) => (
                  <div
                    key={src.id}
                    className="bg-[#081738] rounded-2xl p-4 border border-sky-400/25 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono text-xs font-bold border border-amber-400/35">
                          {src.id}
                        </span>
                        <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                          {src.type}
                        </span>
                        <h4 className="text-sm font-bold text-white">{src.title}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteKnowledgeSource(src.id)}
                        className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 transition"
                        title="Удалить источник"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-sky-100/85 leading-relaxed">{src.content}</p>
                    <div className="flex items-center justify-between text-[11px] text-sky-300/70 pt-1 border-t border-sky-400/15 font-mono">
                      <span>URI: {src.uri_or_ref}</span>
                      <span>
                        Chunks: {src.chunks_count} · Status: {src.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ВКЛАДКА 4: РАБОЧЕЕ МЕСТО ОПЕРАТОРА (INBOX) И АНАЛИТИКА KPI (FR-INBOX, FR-ANALYTICS) */}
          {activeConsoleTab === 'inbox' && (
            <div className="space-y-6">
              {/* Верхняя панель KPI-метрик из Раздела 2 PRD */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#081738] p-4 rounded-2xl border border-sky-400/25">
                  <span className="text-xs text-sky-300/80 block">
                    Время первого AI-ответа (p95)
                  </span>
                  <span className="text-xl font-extrabold text-amber-300 font-mono mt-1 block">
                    {(p95Latency / 1000).toFixed(2)} сек
                  </span>
                  <span className="text-[11px] text-emerald-300">Цель MVP: ≤ 10 сек</span>
                </div>
                <div className="bg-[#081738] p-4 rounded-2xl border border-sky-400/25">
                  <span className="text-xs text-sky-300/80 block">
                    Ответы с источниками RAG
                  </span>
                  <span className="text-xl font-extrabold text-cyan-300 font-mono mt-1 block">
                    {ragCitationRate}%
                  </span>
                  <span className="text-[11px] text-emerald-300">Цель MVP: ≥ 90%</span>
                </div>
                <div className="bg-[#081738] p-4 rounded-2xl border border-sky-400/25">
                  <span className="text-xs text-sky-300/80 block">
                    Успешность проверки ключей
                  </span>
                  <span className="text-xl font-extrabold text-emerald-300 font-mono mt-1 block">
                    {Math.round((keyValidAttempts.success / Math.max(1, keyValidAttempts.total)) * 100)}%
                  </span>
                  <span className="text-[11px] text-sky-200/75">Расход: {totalTokens} tok</span>
                </div>
                <div className="bg-[#081738] p-4 rounded-2xl border border-sky-400/25">
                  <span className="text-xs text-sky-300/80 block">Статус текущего обращения</span>
                  <span className="text-base font-extrabold text-white font-mono mt-1 block uppercase">
                    {activeConversation.status}
                  </span>
                  <span className="text-[11px] text-amber-300">
                    {activeConversation.escalation_reason || 'Очередь в норме'}
                  </span>
                </div>
              </div>

              {/* Панель оператора для ручного ответа и закрытия обращения */}
              <div className="bg-[#081738] rounded-2xl p-6 border border-sky-400/25 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Headphones className="w-5 h-5 text-amber-400" />
                      {txt.inboxHeading}
                    </h3>
                    <p className="text-xs text-sky-200/80 mt-0.5">
                      Диалог #{activeConversation.id} · Ответственный:{' '}
                      <strong className="text-amber-300">
                        {activeConversation.assignee_name || 'AI-Агент / Дежурный оператор'}
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeConversation.status !== 'resolved' ? (
                      <button
                        type="button"
                        onClick={() => handleToggleResolveConversation('resolved')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-xs font-bold flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {txt.markResolvedBtn}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleResolveConversation('open')}
                        className="px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        {txt.reopenBtn}
                      </button>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSendOperatorReply} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={operatorReplyInput}
                    onChange={(e) => setOperatorReplyInput(e.target.value)}
                    placeholder={txt.operatorReplyPlaceholder}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#051029] border border-sky-400/30 text-xs sm:text-sm text-white"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl luxury-gold-btn font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    {txt.operatorSendBtn}
                  </button>
                </form>

                <div className="p-3.5 rounded-xl bg-[#06122e] border border-amber-400/35 flex items-center justify-between gap-2 text-xs text-amber-300 font-semibold">
                  <span className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-amber-400" />
                    {directorNotice}
                  </span>
                  <span className="font-mono text-cyan-300">RBAC Verified</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ПЛАВАЮЩИЙ ВИДЖЕТ ЧАТА ПОДДЕРЖКИ ТУРИСТОВ В ПРАВОМ НИЖНЕМ УГЛУ (FR-WIDGET) */}
      <div className="fixed bottom-5 right-5 z-40 no-print">
        {!isWidgetOpen ? (
          <button
            type="button"
            onClick={() => setIsWidgetOpen(true)}
            className="luxury-gold-btn px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-extrabold text-xs sm:text-sm border border-amber-200 hover:scale-105 transition-transform"
          >
            <MessageSquare className="w-5 h-5" />
            <span>{txt.widgetButtonLabel}</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                byokState.status === 'active' ? 'bg-emerald-600' : 'bg-amber-700'
              }`}
            />
          </button>
        ) : (
          <div className="w-[350px] sm:w-[400px] h-[510px] bg-[#071536] rounded-3xl border border-sky-400/40 shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
            {/* Шапка виджета */}
            <div className="p-4 bg-gradient-to-r from-[#051029] to-[#0c1f4a] border-b border-sky-400/25 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl luxury-gold-btn flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold">{agentConfig.name}</div>
                  <div className="text-[10px] text-cyan-300 font-mono">
                    {byokState.status === 'active'
                      ? `BYOK: ${byokState.selected_model_id}`
                      : 'BYOK Key Required (AC-01)'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href="#ai-support-agent-section"
                  onClick={() => {
                    setActiveConsoleTab('byok');
                    setIsWidgetOpen(false);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-amber-300"
                  title="Настройки BYOK ключа и моделей"
                >
                  <KeyRound className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsWidgetOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-sky-200"
                  aria-label="Close widget"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Сообщения в виджете */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#081738]">
              {byokState.status !== 'active' && (
                <div className="p-3 rounded-xl bg-amber-400/15 border border-amber-400/40 text-xs space-y-2">
                  <div className="font-bold text-amber-300">{txt.noKeyBlockedTitle}</div>
                  <p className="text-sky-100/90 text-[11px]">{txt.noKeyBlockedDesc}</p>
                  <a
                    href="#ai-support-agent-section"
                    onClick={() => {
                      setActiveConsoleTab('byok');
                      setIsWidgetOpen(false);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg luxury-gold-btn text-[11px] font-extrabold"
                  >
                    <KeyRound className="w-3 h-3" />
                    {txt.connectKeyNowBtn}
                  </a>
                </div>
              )}

              {activeConversation.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender_type === 'customer' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-3 text-xs space-y-1.5 ${
                      m.sender_type === 'customer'
                        ? 'bg-amber-400 text-[#051029] font-semibold'
                        : m.sender_type === 'system'
                          ? 'bg-rose-950/70 border border-rose-400/40 text-rose-100'
                          : 'bg-[#0c1f4a] border border-sky-400/30 text-sky-50'
                    }`}
                  >
                    <p className="leading-relaxed">{m.content}</p>
                    {m.citations && m.citations.length > 0 && (
                      <div className="pt-1 border-t border-sky-400/20 text-[10px] text-cyan-300 font-mono">
                        📚 {m.citations.map((c) => c.source_id).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Нижняя панель виджета */}
            <div className="p-3 bg-[#051029] border-t border-sky-400/25 space-y-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendCustomerMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={txt.chatInputPlaceholder}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#081738] border border-sky-400/30 text-xs text-white"
                />
                <button
                  type="submit"
                  disabled={isSendingChat}
                  className="p-2 rounded-xl luxury-gold-btn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex items-center justify-between text-[10px] text-amber-300/90">
                <button
                  type="button"
                  onClick={() => handleEscalateToOperator()}
                  className="underline hover:text-amber-200"
                >
                  {txt.escalateToHumanBtn}
                </button>
                <span>Тел: +998 777-77-77</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
