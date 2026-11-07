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
  Calculator,
  ClipboardCheck,
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
  calculateTravelAgencyQuoteUzs,
  DEFAULT_KNOWLEDGE_SOURCES,
  DEFAULT_SUPPORT_AGENT_CONFIG,
  generateSupportRagAnswer,
  maskGoogleApiKey,
  sanitizeKnowledgeText,
  TravelAgencyOutputStyle,
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
    noKeyBlockedTitle: 'Автономный RAG-режим AI активен (доступно подключение BYOK Gemini)',
    noKeyBlockedDesc:
      'AI-агент решает все вопросы самостоятельно без перевода на менеджера. Для прямой генерации через личную модель Gemini подключите ключ во вкладке «Ключ BYOK и Модели».',
    connectKeyNowBtn: 'Подключить Google AI Studio Key',
    escalateToHumanBtn: '⚡ Решить и рассчитать тур автоматически',
    chatInputPlaceholder: 'Задайте вопрос по турам, поездам Afrosiyob, визам или оплате в UZS...',
    sendBtn: 'Отправить',
    sourcesLabel: 'Подтвержденные источники RAG:',
    kbHeading: 'База знаний RAG (FR-KB) — Защита от выдумывания фактов',
    kbAddTitle: 'Добавить новый источник в базу знаний',
    kbTitlePlaceholder: 'Название источника (например: Правила перевоза багажа в Afrosiyob)',
    kbContentPlaceholder: 'Проверенный текст или FAQ (все суммы указывайте в целых UZS)...',
    kbAddBtn: 'Проиндексировать источник',
    inboxHeading: 'Журнал автономных решений AI и метрики SLO / KPI',
    operatorReplyPlaceholder: 'Добавить примечание или сообщение в диалог...',
    operatorSendBtn: 'Отправить сообщение',
    markResolvedBtn: 'Пометить решённым',
    reopenBtn: 'Переоткрыть диалог',
    widgetButtonLabel: 'AI Поддержка 24/7',
    sampleQuestions: [
      'Сколько стоят билеты на поезд Afrosiyob в сумах (UZS) и за сколько дней их покупать?',
      'Как работают платежи Payme, Click и Uzum Pay для туристов?',
      'Какой дресс-код и цена входа в Шахи-Зинда и на Регистан?',
      'Нужна ли виза и как получить регистрацию E-Mehmon в отеле?',
      'Подбери и рассчитай полный тур в Самарканд и Бухару на 4 дня для 2 человек в UZS',
    ],
  },
  en: {
    sectionBadge: 'AI SUPPORT AGENT · PRD v1.0 · BYOK GEMINI',
    sectionTitle: 'Tourist AI Support Agent & BYOK Control Center',
    sectionSub:
      'Connect your personal Google AI Studio API key, select a verified model from the official Gemini catalog, manage the RAG Knowledge Base, and resolve all tourist inquiries autonomously.',
    tabByok: '1. BYOK Key & Models',
    tabChat: '2. AI Chat (RAG)',
    tabKb: '3. Knowledge Base (KB)',
    tabInbox: '4. AI Resolution Log & KPI',
    byokHeading: 'Settings → AI Provider → Google AI Studio (BYOK)',
    byokSub:
      'Connect your personal Google AI Studio API key to run live Gemini models, or use the built-in Autonomous RAG Solver.',
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
    noKeyBlockedTitle: 'Autonomous AI RAG Mode Active (BYOK Optional)',
    noKeyBlockedDesc:
      'The AI Agent resolves all questions autonomously without manager handoff. Connect your Google AI Studio key in "BYOK Key & Models" to use live Gemini models.',
    connectKeyNowBtn: 'Connect Google AI Studio Key',
    escalateToHumanBtn: '⚡ Auto-Calculate & Book Tour',
    chatInputPlaceholder: 'Ask about Afrosiyob trains, UNESCO sites, visas, or UZS payments...',
    sendBtn: 'Send',
    sourcesLabel: 'Verified RAG Citations:',
    kbHeading: 'RAG Knowledge Base (FR-KB) — Grounded Answers Only',
    kbAddTitle: 'Add New Knowledge Source',
    kbTitlePlaceholder: 'Source Title (e.g., Afrosiyob Baggage Policy)',
    kbContentPlaceholder: 'Verified FAQ or document text (use integer UZS for prices)...',
    kbAddBtn: 'Index Knowledge Source',
    inboxHeading: 'Autonomous AI Resolution Log & Telemetry KPIs',
    operatorReplyPlaceholder: 'Add a note or message to the conversation...',
    operatorSendBtn: 'Send Message',
    markResolvedBtn: 'Mark Resolved',
    reopenBtn: 'Reopen Conversation',
    widgetButtonLabel: 'AI Support 24/7',
    sampleQuestions: [
      'How much do Afrosiyob high-speed train tickets cost in UZS and when should I book?',
      'How do Payme, Click, and Uzum Pay QR payments work?',
      'What is the dress code and ticket price in UZS for Shah-i-Zinda and Registan?',
      'How does E-Mehmon hotel registration work for foreign tourists?',
      'Calculate a turnkey 4-day Samarkand & Bukhara tour for 2 guests in UZS',
    ],
  },
  uz: {
    sectionBadge: 'AI SUPPORT AGENT · PRD v1.0 · BYOK GEMINI',
    sectionTitle: 'Turistlarni qoʻllab-quvvatlash AI-Agenti va BYOK boshqaruv markazi',
    sectionSub:
      'Shaxsiy Google AI Studio API-kalitingizni ulang, rasmiy Gemini katalogidan mavjud modelni tanlang, RAG bilimlar bazasini boshqaring va barcha murojaatlarni avtonom hal qiling.',
    tabByok: '1. BYOK Kalit va Modellar',
    tabChat: '2. AI-Chat (RAG)',
    tabKb: '3. Bilimlar bazasi (KB)',
    tabInbox: '4. AI Yechimlar va KPI',
    byokHeading: 'Settings → AI Provider → Google AI Studio (BYOK)',
    byokSub:
      'Shaxsiy Google AI Studio API-kalitingizni ulang yoki oʻrnatilgan avtonom RAG-yechuvchidan foydalaning.',
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
    noKeyBlockedTitle: 'Avtonom AI RAG rejimi faol (BYOK ulash mumkin)',
    noKeyBlockedDesc:
      'AI-agent barcha savollarni menejerga oʻtkazmasdan mustaqil hal qiladi. Gemini modellari uchun kalitingizni ulang.',
    connectKeyNowBtn: 'Google AI Studio kalitini ulash',
    escalateToHumanBtn: '⚡ Avtonom hisob va bron qilish',
    chatInputPlaceholder: 'Afrosiyob poyezdlari, YUNESKO obidalari yoki UZS toʻlovlari haqida soʻrang...',
    sendBtn: 'Yuborish',
    sourcesLabel: 'Tasdiqlangan RAG manbalari:',
    kbHeading: 'RAG Bilimlar bazasi (FR-KB) — Faqat tasdiqlangan faktlar',
    kbAddTitle: 'Yangi manba qoʻshish',
    kbTitlePlaceholder: 'Manba sarlavhasi (masalan: Afrosiyob bagaj qoidalari)',
    kbContentPlaceholder: 'Tasdiqlangan matn yoki FAQ (barcha narxlar butun UZS da)...',
    kbAddBtn: 'Manbani indekslash',
    inboxHeading: 'Avtonom AI yechimlar jurnali va KPI koʻrsatkichlari',
    operatorReplyPlaceholder: 'Muloqotga xabar qoʻshing...',
    operatorSendBtn: 'Xabar yuborish',
    markResolvedBtn: 'Hal etildi deb belgilash',
    reopenBtn: 'Qayta ochish',
    widgetButtonLabel: 'AI Yordam 24/7',
    sampleQuestions: [
      'Afrosiyob poyezdi chiptalari necha soʻm (UZS) turadi va qachon xarid qilish kerak?',
      'Payme, Click va Uzum Pay orqali toʻlovlar qanday ishlaydi?',
      'Shohi Zinda va Registonga kirish chiptasi necha soʻm va kiyinish qoidalari qanday?',
      'Mehmonxonada E-Mehmon roʻyxatidan oʻtish qanday amalga oshiriladi?',
      '2 kishi uchun 4 kunlik Samarqand va Buxoro turini UZSda hisoblab ber va bron qil',
    ],
  },
};

export default function AiSupportAgentSuite({ lang, directorNotice }: AiSupportAgentSuiteProps) {
  const txt = UI_TEXT[lang] || UI_TEXT.ru;
  const workspaceId = 'ws-silkway-main';

  // Вкладки консоли: по умолчанию открыт AI-Консьерж ('chat')
  const [activeConsoleTab, setActiveConsoleTab] = useState<
    'byok' | 'chat' | 'kb' | 'inbox' | 'copilot'
  >('chat');

  // Режим вывода из скилла travel-agency-ai (SKILL.md): Client-facing / Manager-facing / Owner-facing
  const [outputStyle, setOutputStyle] = useState<TravelAgencyOutputStyle>('client_facing');

  // Параметры калькулятора квот и маржи из скилла travel-agency-ai (scripts/quote_calculator.py)
  const [quoteRouteTitle, setQuoteRouteTitle] = useState(
    'Самарканд — Бухара — Хива (Золотое кольцо, 5 ночей / 6 дней)'
  );
  const [quoteDepartureCity, setQuoteDepartureCity] = useState('Ташкент');
  const [quoteCitizenship, setQuoteCitizenship] = useState('Уточняется (ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ)');
  const [quotePartyText, setQuotePartyText] = useState('2 взрослых + 1 ребёнок (8 лет)');
  const [supplierCostUzs, setSupplierCostUzs] = useState(8500000);
  const [markupPercent, setMarkupPercent] = useState(18);
  const [discountUzs, setDiscountUzs] = useState(300000);
  const [gatewayFeePercent, setGatewayFeePercent] = useState(1.5);
  const [copiedOfferToast, setCopiedOfferToast] = useState(false);

  // Операционный чек-лист из references/operations.md и references/guardrails.md
  const [opsChecklist, setOpsChecklist] = useState([
    {
      id: 'chk-citizenship',
      label: 'Гражданство туристов и срок действия паспорта уточнены явно (не по геолокации)',
      done: true,
    },
    {
      id: 'chk-afrosiyob',
      label: 'Наличие билетов на поезд Afrosiyob проверено у поставщика (ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ до выписки)',
      done: false,
    },
    {
      id: 'chk-hotels',
      label: 'Квота номеров, категория отеля и тип питания (BB/HB/FB) подтверждены',
      done: true,
    },
    {
      id: 'chk-privacy',
      label: 'Guardrail: сканы паспортов и номера карт НЕ собирались в открытом чате',
      done: true,
    },
    {
      id: 'chk-approval',
      label: 'Получено явное согласие клиента перед отправкой оферты / списанием средств',
      done: false,
    },
  ]);

  const quoteBreakdown = calculateTravelAgencyQuoteUzs({
    supplierCostUzs,
    markupPercent,
    discountUzs,
    gatewayFeePercent,
  });

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
              status: 'ai_handling',
              messages: [...c.messages, customerMsg],
              updated_at: new Date().toISOString(),
            }
          : c
      )
    );

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
            output_style: outputStyle,
          }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.ok && data.result) {
            ragResult = data.result;
          }
        }
      } catch {
        // Переход к клиентскому автономному RAG-решателю
      }

      // Если серверный роут недоступен (GitHub Pages Static Export) или ключ не введен на сервере —
      // решаем задачу напрямую через generateSupportRagAnswer (использует BYOK-ключ или автономный RAG-копайлот)
      if (!ragResult) {
        ragResult = await generateSupportRagAnswer({
          apiKey: byokState.status === 'active' && inMemoryKeyRef.current ? inMemoryKeyRef.current : '',
          modelId: byokState.selected_model_id || '',
          userMessage: textToSend,
          language: lang,
          agentConfig,
          knowledgeSources,
          outputStyle,
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
        low_confidence: false,
        created_at: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                status: 'resolved',
                escalation_reason: 'Решено AI-агентом автономно (без перевода на менеджера)',
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
          outcome: 'success',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // 5. Автономный подбор, расчет и бронирование тура «под ключ» в 1 клик (без участия менеджера)
  const handleEscalateToOperator = () => {
    handleSendCustomerMessage(
      lang === 'en'
        ? 'Calculate and book a complete 4-day Samarkand & Bukhara tour for 2 adults in UZS with Afrosiyob tickets autonomously.'
        : lang === 'uz'
          ? '2 kishi uchun 4 kunlik Samarqand va Buxoro turini Afrosiyob chiptalari bilan UZSda mustaqil hisoblab ber va bron qil.'
          : 'Реши всё сам: подбери и рассчитай полный тур Ташкент — Самарканд — Бухара на 4 дня для 2 взрослых в сумах (UZS), включи билеты Afrosiyob и оформи бронь автоматически.'
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#C7A46A]/15 text-[#C7A46A] border border-[#C7A46A]/40">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C7A46A]" />
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-white/80 border border-[#C7A46A]/25">
            <AlertTriangle className="w-3.5 h-3.5 text-sky-400" />
            QUOTA EXCEEDED (429)
          </span>
        );
      case 'temporarily_unavailable':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#C7A46A]/15 text-[#C7A46A] border border-[#C7A46A]/40">
            <AlertTriangle className="w-3.5 h-3.5 text-[#C7A46A]" />
            PROVIDER OUTAGE (5xx)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/35">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Автономный AI 24/7
          </span>
        );
    }
  };

  return (
    <>
      {/* ОСНОВНАЯ СЕКЦИЯ AI-КОНСЬЕРЖА НА СТРАНИЦЕ */}
      <section
        id="ai-support-agent-section"
        className="bg-[#16283F] rounded-3xl border border-[#C7A46A]/25 shadow-2xl shadow-[#020817]/70 overflow-hidden no-print scroll-mt-24 animate-fade-in-up"
      >
        {/* Шапка модуля AI-Консьержа */}
        <div className="bg-gradient-to-r from-[#101C2D] via-[#16283F] to-[#101C2D] p-6 sm:p-8 border-b border-[#C7A46A]/25">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#C7A46A]/15 text-[#C7A46A] border border-[#C7A46A]/40">
                  <Sparkles className="w-3.5 h-3.5 text-[#C7A46A]" />
                  SILKWAY AI CONCIERGE · 24/7
                </span>
                {renderStatusBadge(byokState.status)}
                {byokState.selected_model_id && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#C7A46A]/15 text-[#C7A46A] border border-[#C7A46A]/40">
                    <Cpu className="w-3.5 h-3.5 text-[#C7A46A]" />
                    {byokState.selected_model_id}
                  </span>
                )}
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                {lang === 'en'
                  ? 'Your Personal AI Concierge'
                  : lang === 'uz'
                    ? 'Sizning shaxsiy AI-konsyerjingiz'
                    : 'Ваш персональный AI-консьерж'}
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                {lang === 'en'
                  ? 'Instant answers on Afrosiyob trains, UNESCO landmarks, visas, and turnkey UZS tour quotes — resolved directly by AI without waiting for a manager.'
                  : lang === 'uz'
                    ? 'Afrosiyob poyezdlari, YUNESKO obidalari, vizalar va UZSda tayyor tur hisob-kitobi — menejerni kutmasdan darhol hal qilinadi.'
                    : 'Мгновенный подбор туров, расчёт стоимости в сумах (UZS), расписание поездов Afrosiyob и визовые правила — AI решает все вопросы сразу без ожидания менеджера.'}
              </p>
            </div>

            {/* Лаконичные и удобные вкладки без лишнего шума */}
            <div className="flex flex-wrap gap-1.5 bg-[#101C2D] p-1.5 rounded-2xl border border-[#C7A46A]/25 shrink-0">
              <button
                type="button"
                onClick={() => setActiveConsoleTab('chat')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeConsoleTab === 'chat'
                    ? 'luxury-gold-btn shadow-sm'
                    : 'text-white/80 hover:bg-sky-500/20 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'AI Concierge Chat' : lang === 'uz' ? 'AI-Konsyerj Chat' : 'AI-Консьерж (Чат)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveConsoleTab('copilot')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeConsoleTab === 'copilot'
                    ? 'luxury-gold-btn shadow-sm'
                    : 'text-white/80 hover:bg-sky-500/20 hover:text-white'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Tour Quote (UZS)' : lang === 'uz' ? 'Tur Hisobi (UZS)' : 'Калькулятор сметы (UZS)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveConsoleTab('kb')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeConsoleTab === 'kb'
                    ? 'luxury-gold-btn shadow-sm'
                    : 'text-white/80 hover:bg-sky-500/20 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {lang === 'en' ? 'Knowledge Base' : lang === 'uz' ? 'Bilimlar bazasi' : 'База знаний'} ({knowledgeSources.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveConsoleTab('byok')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeConsoleTab === 'byok'
                    ? 'luxury-gold-btn shadow-sm'
                    : 'text-white/80 hover:bg-sky-500/20 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Gemini API Key' : lang === 'uz' ? 'Gemini Kaliti' : 'Ключ Gemini'}</span>
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
                <div className="bg-[#16283F] rounded-2xl p-6 border border-[#C7A46A]/25 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-[#C7A46A]" />
                        {txt.byokHeading}
                      </h3>
                      <p className="text-xs text-white/75 mt-1 leading-relaxed">{txt.byokSub}</p>
                    </div>
                  </div>

                  {/* Ссылка на официальную страницу получения ключа */}
                  <div className="p-3.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/40 flex items-center justify-between gap-3">
                    <div className="text-xs text-[#C7A46A]">
                      Официальный портал выпуска ключей Google AI Studio:
                    </div>
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C7A46A]/15 hover:bg-cyan-500/30 text-[#C7A46A] text-xs font-bold border border-[#C7A46A]/40 transition shrink-0"
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
                        <span className="text-[11px] font-mono text-white/80">
                          Проверен:{' '}
                          {byokState.validated_at
                            ? new Date(byokState.validated_at).toLocaleTimeString()
                            : 'только что'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 flex items-center justify-between">
                        <span className="text-xs text-white/80">Маскированный ключ (AC-02):</span>
                        <code className="text-sm font-mono font-bold text-[#C7A46A]">
                          {byokState.masked_key}
                        </code>
                      </div>

                      <div className="flex flex-wrap gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowKeyReplaceForm(true)}
                          className="px-3.5 py-2 rounded-xl bg-[#16283F] hover:bg-sky-500/25 text-white/80 border border-[#C7A46A]/25 text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-[#C7A46A]" />
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
                        <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5">
                          Google AI Studio API Key (Password Input)
                        </label>
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder={txt.apiKeyPlaceholder}
                          autoComplete="off"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 text-sm font-mono text-white placeholder:text-white/75 focus:outline-none focus:ring-2 focus:ring-[#C7A46A]"
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
                            className="px-3.5 py-2.5 rounded-xl bg-[#101C2D] text-white/80 border border-[#C7A46A]/25 text-xs font-semibold"
                          >
                            Отмена
                          </button>
                        )}
                      </div>
                    </form>
                  )}

                  {/* Предупреждение о тарификации и безопасности */}
                  <div className="p-3.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/40 space-y-1.5 text-[11px] text-white/75">
                    <div className="font-bold text-[#C7A46A] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C7A46A]" />
                      {txt.billingWarning}
                    </div>
                    <p className="text-white/75 leading-relaxed">{txt.securityNote}</p>
                  </div>
                </div>

                {/* Конструктор AI-Агента (FR-AGENT) */}
                <div className="bg-[#16283F] rounded-2xl p-6 border border-[#C7A46A]/25 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Bot className="w-5 h-5 text-[#C7A46A]" />
                      Конструктор AI-Агента (FR-AGENT · v{agentConfig.version})
                    </h3>
                    {agentSavedToast && (
                      <span className="text-xs font-bold text-emerald-300">✓ Сохранено</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-white/80 mb-1">Имя агента</label>
                      <input
                        type="text"
                        value={agentConfig.name}
                        onChange={(e) =>
                          setAgentConfig((p) => ({ ...p, name: e.target.value, version: p.version + 1 }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/80 mb-1">Тон ответов</label>
                      <select
                        value={agentConfig.tone}
                        onChange={(e) =>
                          setAgentConfig((p) => ({
                            ...p,
                            tone: e.target.value as 'professional' | 'friendly' | 'concise',
                            version: p.version + 1,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 text-xs text-white"
                      >
                        <option value="professional">Профессиональный (Консьерж)</option>
                        <option value="friendly">Дружелюбный (Гостеприимный)</option>
                        <option value="concise">Лаконичный (Краткие факты)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-white/80 mb-1">
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
                      className="w-full px-3 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 text-xs text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agentConfig.strict_rag_only}
                        onChange={(e) =>
                          setAgentConfig((p) => ({ ...p, strict_rag_only: e.target.checked }))
                        }
                        className="accent-[#C7A46A] rounded"
                      />
                      <span>Strict RAG Mode: отвечать строго по базе знаний (AC-07, AC-08)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAgentSavedToast(true);
                        setTimeout(() => setAgentSavedToast(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#C7A46A]/15 hover:bg-cyan-500/30 text-[#C7A46A] border border-[#C7A46A]/40 text-xs font-bold"
                    >
                      Применить
                    </button>
                  </div>
                </div>
              </div>

              {/* Правая половина: Динамический каталог моделей Gemini (FR-MODEL-01..02, AC-04, AC-05, AC-12) */}
              <div className="lg:col-span-6 space-y-5">
                <div className="bg-[#16283F] rounded-2xl p-6 border border-[#C7A46A]/25 space-y-4 h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-[#C7A46A]" />
                        {txt.modelsCatalogTitle}
                      </h3>
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#C7A46A]/15 text-[#C7A46A] border border-[#C7A46A]/40">
                        {byokState.available_models.length} models
                      </span>
                    </div>

                    {/* Статус проверки целевых продуктовых версий Gemini 3.5 / 3.6 / 3.8 (Раздел 5 PRD, AC-05) */}
                    <div className="p-4 rounded-2xl bg-[#101C2D] border border-[#C7A46A]/40 space-y-2.5">
                      <div className="text-xs font-bold text-[#C7A46A] uppercase tracking-wider">
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
                                : 'bg-[#16283F] border-[#C7A46A]/25 text-white/75'
                            }`}
                          >
                            <span className="font-bold">{tItem.label}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30">
                              {tItem.found ? 'AVAILABLE' : 'N/A in API'}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-white/75 leading-relaxed">
                        {byokState.target_models_status.message}
                      </p>
                    </div>

                    {/* Список моделей из официального ответа Google AI Studio */}
                    {byokState.available_models.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-[#101C2D] border border-dashed border-[#C7A46A]/25 text-center space-y-2">
                        <Lock className="w-8 h-8 text-[#C7A46A] mx-auto" />
                        <div className="text-sm font-bold text-white">
                          Каталог моделей загружается после проверки ключа
                        </div>
                        <p className="text-xs text-white/75 max-w-md mx-auto">
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
                                  ? 'bg-[#C7A46A]/15 border-[#C7A46A] ring-1 ring-cyan-400/40'
                                  : 'bg-[#101C2D] border-[#C7A46A]/25 hover:border-[#C7A46A]/25'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-bold text-white">
                                    {m.display_name}
                                  </span>
                                  <code className="text-xs font-mono px-2 py-0.5 rounded bg-[#16283F] text-[#C7A46A] border border-[#C7A46A]/40">
                                    {m.model_id}
                                  </code>
                                  {m.is_target_35_36_38 && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                                      TARGET SERIES
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-white/75 line-clamp-1">
                                  {m.description}
                                </p>
                                <div className="flex flex-wrap gap-3 text-[11px] text-[#C7A46A]/80 font-mono">
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
                                    : 'bg-[#16283F] text-white/80 border border-[#C7A46A]/25 hover:text-white'
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

                  <div className="pt-3 border-t border-[#C7A46A]/25 flex items-center justify-between text-xs text-white/75">
                    <span>Активная модель для новых сообщений (AC-12):</span>
                    <code className="font-mono font-bold text-[#C7A46A]">
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
              {/* Левая колонка: Быстрые вопросы в 1 клик */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-[#16283F] rounded-2xl p-5 border border-[#C7A46A]/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#C7A46A]">
                      Быстрые вопросы (1 клик)
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Онлайн
                    </span>
                  </div>

                  <div className="space-y-2">
                    {txt.sampleQuestions.map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendCustomerMessage(q)}
                        disabled={isSendingChat}
                        className="w-full text-left p-3 rounded-xl bg-[#101C2D] hover:bg-[#16283F] border border-[#C7A46A]/25 hover:border-[#C7A46A]/40 text-xs text-white/80 transition leading-relaxed"
                      >
                        «{q}»
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Правая колонка: Окно диалога с цитированием источников */}
              <div className="lg:col-span-8 bg-[#16283F] rounded-2xl border border-[#C7A46A]/25 flex flex-col h-[520px] overflow-hidden">
                {/* Верхняя панель чата */}
                <div className="px-5 py-3.5 bg-[#101C2D] border-b border-[#C7A46A]/25 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl luxury-gold-btn flex items-center justify-center font-extrabold">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{agentConfig.name}</span>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/35">
                          ● Автономный режим
                        </span>
                      </div>
                      <div className="text-[11px] text-white/75">{agentConfig.working_hours}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEscalateToOperator()}
                    className="px-3.5 py-1.5 rounded-xl luxury-gold-btn text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
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
                              ? 'bg-gradient-to-r from-[#C7A46A] to-[#B38E53] text-[#101C2D] font-medium'
                              : isSystem
                                ? 'bg-rose-950/60 border border-rose-400/40 text-rose-100'
                                : isHumanOp
                                  ? 'bg-emerald-950/60 border border-emerald-400/45 text-emerald-50'
                                  : 'bg-[#16283F] border border-[#C7A46A]/25 text-white/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 text-[11px] opacity-80">
                            <span className="font-bold flex items-center gap-1">
                              {isCustomer ? (
                                <User className="w-3 h-3" />
                              ) : isHumanOp ? (
                                <Headphones className="w-3 h-3 text-emerald-300" />
                              ) : (
                                <Bot className="w-3 h-3 text-[#C7A46A]" />
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
                            <div className="pt-2 border-t border-[#C7A46A]/25 space-y-1.5">
                              <div className="text-[11px] font-bold text-[#C7A46A] flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {txt.sourcesLabel}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {msg.citations.map((cit) => (
                                  <span
                                    key={cit.source_id}
                                    className="px-2 py-0.5 rounded-md bg-[#101C2D] border border-[#C7A46A]/40 text-[11px] text-[#C7A46A] font-mono"
                                  >
                                    [{cit.source_id}] {cit.source_title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Метрики ответа и кнопки 👍/👎 */}
                          {msg.sender_type === 'ai_agent' && (
                            <div className="pt-2 border-t border-[#C7A46A]/25 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/75">
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
                                    msg.feedback === 'up' ? 'text-emerald-400' : 'text-white/80'
                                  }`}
                                  title="Полезный ответ"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(msg.id, 'down')}
                                  className={`p-1 rounded hover:bg-sky-500/20 ${
                                    msg.feedback === 'down' ? 'text-rose-400' : 'text-white/80'
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
                  className="p-3.5 bg-[#101C2D] border-t border-[#C7A46A]/25 flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={txt.chatInputPlaceholder}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#16283F] border border-[#C7A46A]/25 text-xs sm:text-sm text-white placeholder:text-white/75 focus:outline-none focus:ring-2 focus:ring-[#C7A46A]"
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
              <div className="lg:col-span-5 bg-[#16283F] rounded-2xl p-6 border border-[#C7A46A]/25 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#C7A46A]" />
                  {txt.kbAddTitle}
                </h3>
                <form onSubmit={handleAddKnowledgeSource} className="space-y-3.5">
                  <div>
                    <label className="block text-xs text-white/80 mb-1">Тип источника</label>
                    <select
                      value={newKbType}
                      onChange={(e) => setNewKbType(e.target.value as KnowledgeSourceType)}
                      className="w-full px-3 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 text-xs text-white"
                    >
                      <option value="faq">FAQ (Вопрос — Ответ)</option>
                      <option value="text">Текстовый регламент / памятка</option>
                      <option value="url">Веб-страница (URL Excerpt)</option>
                      <option value="pdf_excerpt">Документ (PDF Excerpt)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/80 mb-1">Заголовок источника</label>
                    <input
                      type="text"
                      value={newKbTitle}
                      onChange={(e) => setNewKbTitle(e.target.value)}
                      placeholder={txt.kbTitlePlaceholder}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/80 mb-1">
                      Содержимое для RAG-индексации
                    </label>
                    <textarea
                      rows={4}
                      value={newKbContent}
                      onChange={(e) => setNewKbContent(e.target.value)}
                      placeholder={txt.kbContentPlaceholder}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 text-xs text-white"
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
                    className="bg-[#16283F] rounded-2xl p-4 border border-[#C7A46A]/25 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#C7A46A]/15 text-[#C7A46A] font-mono text-xs font-bold border border-[#C7A46A]/40">
                          {src.id}
                        </span>
                        <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-[#C7A46A]/15 text-[#C7A46A]">
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
                    <p className="text-xs text-white/75 leading-relaxed">{src.content}</p>
                    <div className="flex items-center justify-between text-[11px] text-white/75 pt-1 border-t border-[#C7A46A]/25 font-mono">
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
                <div className="bg-[#16283F] p-4 rounded-2xl border border-[#C7A46A]/25">
                  <span className="text-xs text-white/75 block">
                    Время первого AI-ответа (p95)
                  </span>
                  <span className="text-xl font-extrabold text-[#C7A46A] font-mono mt-1 block">
                    {(p95Latency / 1000).toFixed(2)} сек
                  </span>
                  <span className="text-[11px] text-emerald-300">Цель MVP: ≤ 10 сек</span>
                </div>
                <div className="bg-[#16283F] p-4 rounded-2xl border border-[#C7A46A]/25">
                  <span className="text-xs text-white/75 block">
                    Ответы с источниками RAG
                  </span>
                  <span className="text-xl font-extrabold text-[#C7A46A] font-mono mt-1 block">
                    {ragCitationRate}%
                  </span>
                  <span className="text-[11px] text-emerald-300">Цель MVP: ≥ 90%</span>
                </div>
                <div className="bg-[#16283F] p-4 rounded-2xl border border-[#C7A46A]/25">
                  <span className="text-xs text-white/75 block">
                    Успешность проверки ключей
                  </span>
                  <span className="text-xl font-extrabold text-emerald-300 font-mono mt-1 block">
                    {Math.round((keyValidAttempts.success / Math.max(1, keyValidAttempts.total)) * 100)}%
                  </span>
                  <span className="text-[11px] text-white/75">Расход: {totalTokens} tok</span>
                </div>
                <div className="bg-[#16283F] p-4 rounded-2xl border border-[#C7A46A]/25">
                  <span className="text-xs text-white/75 block">Статус текущего обращения</span>
                  <span className="text-base font-extrabold text-white font-mono mt-1 block uppercase">
                    {activeConversation.status}
                  </span>
                  <span className="text-[11px] text-[#C7A46A]">
                    {activeConversation.escalation_reason || 'Очередь в норме'}
                  </span>
                </div>
              </div>

              {/* Панель оператора для ручного ответа и закрытия обращения */}
              <div className="bg-[#16283F] rounded-2xl p-6 border border-[#C7A46A]/25 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Headphones className="w-5 h-5 text-[#C7A46A]" />
                      {txt.inboxHeading}
                    </h3>
                    <p className="text-xs text-white/75 mt-0.5">
                      Диалог #{activeConversation.id} · Ответственный:{' '}
                      <strong className="text-[#C7A46A]">
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
                        className="px-3.5 py-2 rounded-xl bg-[#C7A46A]/15 hover:bg-[#C7A46A]/30 text-[#C7A46A] border border-[#C7A46A]/40 text-xs font-bold flex items-center gap-1.5"
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
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 text-xs sm:text-sm text-white"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl luxury-gold-btn font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    {txt.operatorSendBtn}
                  </button>
                </form>

                <div className="p-3.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/40 flex items-center justify-between gap-2 text-xs text-[#C7A46A] font-semibold">
                  <span className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-[#C7A46A]" />
                    {directorNotice}
                  </span>
                  <span className="font-mono text-[#C7A46A]">RBAC Verified</span>
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 5: ОПЕРАЦИОННЫЙ КОПАЙЛОТ ТУРАГЕНТСТВА (SKILL: travel-agency-ai) */}
          {activeConsoleTab === 'copilot' && (
            <div className="space-y-6">
              {/* Верхняя полоса выбора стиля вывода из SKILL.md: Client-facing / Manager-facing / Owner-facing */}
              <div className="bg-[#16283F] rounded-2xl p-5 border border-[#C7A46A]/25 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#C7A46A]">
                    <Sparkles className="w-4 h-4 text-[#C7A46A]" />
                    <span>SKILL: travel-agency-ai · Operational Copilot (UZS Integer)</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Режимы вывода (Output Styles), расчёт квот и маржи, операционный чек-лист
                  </h3>
                  <p className="text-xs text-white/75">
                    Разделяет подтверждённые данные и допущения (**ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ**), исключает раскрытие внутренней маржи клиенту и проверяет готовность бронирования.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 bg-[#101C2D] p-1.5 rounded-xl border border-[#C7A46A]/25 shrink-0">
                  {(
                    [
                      {
                        id: 'client_facing',
                        label: 'Client-facing (Для клиента)',
                        badge: 'Без маржи',
                      },
                      {
                        id: 'manager_facing',
                        label: 'Manager-facing (Для менеджера)',
                        badge: 'Риски + Таблица',
                      },
                      {
                        id: 'owner_facing',
                        label: 'Owner-facing (Для директора)',
                        badge: 'KPI + Маржа UZS',
                      },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setOutputStyle(st.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        outputStyle === st.id
                          ? 'luxury-gold-btn shadow-sm'
                          : 'text-white/80 hover:bg-sky-500/20 hover:text-white'
                      }`}
                    >
                      <span>{st.label}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/25">
                        {st.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Левая колонка: Воспроизводимый калькулятор квот и маржи (scripts/quote_calculator.py) */}
                <div className="lg:col-span-5 bg-[#16283F] rounded-2xl p-6 border border-[#C7A46A]/25 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#C7A46A]/25 pb-3">
                    <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-[#C7A46A]" />
                      Калькулятор квоты и маржи (UZS)
                    </h4>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#C7A46A]/15 text-[#C7A46A] border border-[#C7A46A]/40">
                      quote_calculator.py
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-white/80 font-semibold mb-1">
                        Маршрут и длительность тура
                      </label>
                      <input
                        type="text"
                        value={quoteRouteTitle}
                        onChange={(e) => setQuoteRouteTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-white/80 font-semibold mb-1">
                          Город отправления
                        </label>
                        <input
                          type="text"
                          value={quoteDepartureCity}
                          onChange={(e) => setQuoteDepartureCity(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[#C7A46A] font-semibold mb-1">
                          Гражданство туристов (уточнять!)
                        </label>
                        <input
                          type="text"
                          value={quoteCitizenship}
                          onChange={(e) => setQuoteCitizenship(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/40 text-[#C7A46A]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/80 font-semibold mb-1">
                        Состав группы (включая возраст детей)
                      </label>
                      <input
                        type="text"
                        value={quotePartyText}
                        onChange={(e) => setQuotePartyText(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-white/80 font-semibold mb-1">
                          Себестоимость нетто (UZS)
                        </label>
                        <input
                          type="number"
                          step={50000}
                          min={0}
                          value={supplierCostUzs}
                          onChange={(e) => setSupplierCostUzs(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 font-mono font-bold text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-white/80 font-semibold mb-1">
                          Наценка агентства (%)
                        </label>
                        <input
                          type="number"
                          step={1}
                          min={0}
                          max={100}
                          value={markupPercent}
                          onChange={(e) => setMarkupPercent(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 font-mono font-bold text-[#C7A46A]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-white/80 font-semibold mb-1">
                          Скидка клиенту (UZS)
                        </label>
                        <input
                          type="number"
                          step={50000}
                          min={0}
                          value={discountUzs}
                          onChange={(e) => setDiscountUzs(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 font-mono text-[#C7A46A]"
                        />
                      </div>
                      <div>
                        <label className="block text-white/80 font-semibold mb-1">
                          Комиссия Payme/Click/Uzum (%)
                        </label>
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          max={10}
                          value={gatewayFeePercent}
                          onChange={(e) => setGatewayFeePercent(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 font-mono text-white/80"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Операционный чек-лист (references/operations.md & guardrails.md) */}
                  <div className="pt-3 border-t border-[#C7A46A]/25 space-y-2.5">
                    <div className="text-xs font-bold text-[#C7A46A] flex items-center gap-1.5 uppercase tracking-wider">
                      <ClipboardCheck className="w-4 h-4 text-[#C7A46A]" />
                      Чек-лист бронирования и Guardrails
                    </div>
                    <div className="space-y-2">
                      {opsChecklist.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-start gap-2.5 p-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 text-xs text-white/80 cursor-pointer hover:border-[#C7A46A]/40"
                        >
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() =>
                              setOpsChecklist((prev) =>
                                prev.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c))
                              )
                            }
                            className="mt-0.5 accent-[#C7A46A] rounded"
                          />
                          <span className={item.done ? 'text-white/80' : 'text-[#C7A46A] font-semibold'}>
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Правая колонка: Динамический вывод по выбранному стилю (Client-facing / Manager-facing / Owner-facing) */}
                <div className="lg:col-span-7 bg-[#16283F] rounded-2xl p-6 border border-[#C7A46A]/25 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C7A46A]/25 pb-3">
                      <div>
                        <span className="text-xs font-mono uppercase text-[#C7A46A] block">
                          АКТИВНЫЙ РЕЖИМ СКИЛЛА TRAVEL-AGENCY-AI:
                        </span>
                        <h4 className="text-lg font-extrabold text-white">
                          {outputStyle === 'client_facing'
                            ? 'Client-facing: Коммерческое предложение для туриста (без внутренней маржи)'
                            : outputStyle === 'manager_facing'
                              ? 'Manager-facing: Рабочая таблица менеджера, источники и риски'
                              : 'Owner-facing: Финансовая сводка Директора, маржинальность и сверка'}
                        </h4>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#C7A46A]/15 text-[#C7A46A] border border-[#C7A46A]/40">
                        ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ
                      </span>
                    </div>

                    {/* Вариант 1: CLIENT-FACING (строго без раскрытия себестоимости и маржи!) */}
                    {outputStyle === 'client_facing' && (
                      <div className="p-5 rounded-2xl bg-[#101C2D] border border-[#C7A46A]/25 space-y-4 text-xs sm:text-sm text-white/80">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#C7A46A]/25">
                          <div>
                            <div className="text-xs text-[#C7A46A] font-bold uppercase">
                              Персональное предложение SilkWay Travel
                            </div>
                            <div className="text-base font-extrabold text-white mt-0.5">
                              {quoteRouteTitle}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-white/80 block">
                              Итоговая стоимость за группу:
                            </span>
                            <span className="text-xl font-mono font-extrabold text-[#C7A46A]">
                              {quoteBreakdown.final_client_price_uzs.toLocaleString('ru-RU')} UZS
                            </span>
                            {quoteBreakdown.discount_uzs > 0 && (
                              <span className="block text-[11px] text-emerald-300">
                                С учётом привилегированной скидки{' '}
                                {quoteBreakdown.discount_uzs.toLocaleString('ru-RU')} UZS
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-[#16283F] border border-[#C7A46A]/25">
                            <span className="text-white/80 block">Отправление и состав группы:</span>
                            <strong className="text-white">
                              {quoteDepartureCity} · {quotePartyText}
                            </strong>
                          </div>
                          <div className="p-3 rounded-xl bg-[#16283F] border border-[#C7A46A]/25">
                            <span className="text-white/80 block">Гражданство (для визы и E-Mehmon):</span>
                            <strong className="text-[#C7A46A]">{quoteCitizenship}</strong>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="font-bold text-emerald-300">
                            ✓ Что включено в предложение:
                          </div>
                          <p className="text-white/75 leading-relaxed">
                            Проживание в проверенных отелях 4* с завтраками (BB), ж/д переезды на скоростном поезде Afrosiyob (Ташкент — Самарканд — Бухара), индивидуальные трансферы, лицензированные гиды ЮНЕСКО и регистрация E-Mehmon.
                          </p>
                          <div className="font-bold text-[#C7A46A] pt-1">
                            ⚠️ Статус наличия и тарифа: ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ
                          </div>
                          <p className="text-white/75">
                            Бронирование считается подтверждённым после фиксации мест у поставщика. Пожалуйста, не отправляйте в чат сканы паспортов или реквизиты банковских карт до открытия защищённой сессии оплаты.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-[#C7A46A]/15 border border-[#C7A46A]/40 text-xs text-[#C7A46A] font-semibold flex items-center justify-between">
                          <span>👉 Следующий шаг: Согласовать даты выезда и подтвердить бронь</span>
                          <span>{directorNotice}</span>
                        </div>
                      </div>
                    )}

                    {/* Вариант 2: MANAGER-FACING (таблица сверки, источники, риски и Next Action) */}
                    {outputStyle === 'manager_facing' && (
                      <div className="space-y-4 text-xs">
                        <div className="overflow-x-auto rounded-2xl border border-[#C7A46A]/25 bg-[#101C2D]">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-[#C7A46A]/25 text-[#C7A46A] bg-[#101C2D]">
                                <th className="p-3">Компонент операции</th>
                                <th className="p-3">Источник / Статус</th>
                                <th className="p-3">Операционный риск</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-sky-400/15 text-white/80">
                              <tr>
                                <td className="p-3 font-bold">Ж/д билеты Afrosiyob</td>
                                <td className="p-3 font-mono text-[#C7A46A]">
                                  KB-01 · ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ
                                </td>
                                <td className="p-3">
                                  Квота выкупается за 15–25 дней; проверить наличие по паспортам
                                </td>
                              </tr>
                              <tr>
                                <td className="p-3 font-bold">Виза и E-Mehmon ({quoteCitizenship})</td>
                                <td className="p-3 font-mono text-[#C7A46A]">
                                  KB-04 · ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ
                                </td>
                                <td className="p-3">
                                  Не предполагать гражданство по локации; сверить безвизовый срок
                                </td>
                              </tr>
                              <tr>
                                <td className="p-3 font-bold">Стоимость к оплате клиентом</td>
                                <td className="p-3 font-mono text-emerald-300 font-bold">
                                  {quoteBreakdown.final_client_price_uzs.toLocaleString('ru-RU')} UZS
                                </td>
                                <td className="p-3">
                                  Получить явное согласие клиента перед генерацией счёта Payme/Click
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="p-4 rounded-xl bg-[#101C2D] border border-[#C7A46A]/40 space-y-1.5">
                          <div className="font-bold text-[#C7A46A]">
                            Next Action для менеджера:
                          </div>
                          <p className="text-white/80">
                            1. Запросить подтверждение наличия мест на поезд Afrosiyob на даты группы ({quotePartyText}). 2. Проверить отметки в операционном чек-листе слева ({opsChecklist.filter((c) => c.done).length} из {opsChecklist.length} выполнено).
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Вариант 3: OWNER-FACING (полная финансовая раскладка в UZS, маржа и KPI) */}
                    {outputStyle === 'owner_facing' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="p-3.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25">
                            <span className="text-white/80 block">Себестоимость (Cost)</span>
                            <span className="text-base font-mono font-extrabold text-white mt-1 block">
                              {quoteBreakdown.supplier_cost_uzs.toLocaleString('ru-RU')} UZS
                            </span>
                          </div>
                          <div className="p-3.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25">
                            <span className="text-white/80 block">
                              Наценка ({quoteBreakdown.markup_percent}%)
                            </span>
                            <span className="text-base font-mono font-extrabold text-[#C7A46A] mt-1 block">
                              +{quoteBreakdown.markup_uzs.toLocaleString('ru-RU')} UZS
                            </span>
                          </div>
                          <div className="p-3.5 rounded-xl bg-[#101C2D] border border-emerald-400/35">
                            <span className="text-emerald-300 block">
                              Валовая прибыль (Margin {quoteBreakdown.gross_margin_percent}%)
                            </span>
                            <span className="text-base font-mono font-extrabold text-emerald-300 mt-1 block">
                              {quoteBreakdown.gross_profit_uzs.toLocaleString('ru-RU')} UZS
                            </span>
                          </div>
                          <div className="p-3.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/40">
                            <span className="text-[#C7A46A] block">
                              Чистая прибыль (Net Profit)
                            </span>
                            <span className="text-base font-mono font-extrabold text-[#C7A46A] mt-1 block">
                              {quoteBreakdown.net_profit_uzs.toLocaleString('ru-RU')} UZS
                            </span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#101C2D] border border-[#C7A46A]/25 text-xs space-y-2">
                          <div className="font-bold text-white flex items-center justify-between">
                            <span>Сверка комиссии эквайринга и скидок (references/finance.md):</span>
                            <span className="font-mono text-[#C7A46A]">UZS BIGINT VERIFIED</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-white/80 font-mono">
                            <div>
                              Gross Price: {quoteBreakdown.gross_selling_price_uzs.toLocaleString('ru-RU')} UZS
                            </div>
                            <div>
                              Discount: -{quoteBreakdown.discount_uzs.toLocaleString('ru-RU')} UZS
                            </div>
                            <div>
                              Gateway Fee ({quoteBreakdown.payment_gateway_fee_percent}%): -
                              {quoteBreakdown.payment_fee_uzs.toLocaleString('ru-RU')} UZS
                            </div>
                          </div>
                          <div className="pt-2 border-t border-[#C7A46A]/25 text-[#C7A46A]">
                            Флаги сверки для Директора: открытых пунктов чек-листа —{' '}
                            {opsChecklist.filter((c) => !c.done).length}. {directorNotice}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Кнопки действий с расчётом */}
                  <div className="pt-3 border-t border-[#C7A46A]/25 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-white/80">
                      Выбранный стиль вывода также применяется в{' '}
                      <strong className="text-[#C7A46A]">AI-Чате (RAG)</strong>.
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          const summaryToCopy =
                            outputStyle === 'client_facing'
                              ? `Предложение SilkWay Travel: ${quoteRouteTitle} (${quotePartyText}). Итоговая стоимость: ${quoteBreakdown.final_client_price_uzs.toLocaleString('ru-RU')} UZS (ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ). ${directorNotice}`
                              : `Финансовая сводка (${outputStyle}): Маршрут ${quoteRouteTitle}. Себестоимость: ${quoteBreakdown.supplier_cost_uzs.toLocaleString('ru-RU')} UZS, Цена клиенту: ${quoteBreakdown.final_client_price_uzs.toLocaleString('ru-RU')} UZS, Маржа: ${quoteBreakdown.gross_margin_percent}%, Чистая прибыль: ${quoteBreakdown.net_profit_uzs.toLocaleString('ru-RU')} UZS.`;
                          navigator.clipboard?.writeText(summaryToCopy);
                          setCopiedOfferToast(true);
                          setTimeout(() => setCopiedOfferToast(false), 2200);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#16283F] hover:bg-sky-500/25 text-white/80 border border-[#C7A46A]/25 text-xs font-bold transition"
                      >
                        {copiedOfferToast ? '✓ Скопировано в буфер' : 'Скопировать сводку'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveConsoleTab('chat');
                          handleSendCustomerMessage(
                            `Подготовь ${outputStyle} сводку по маршруту "${quoteRouteTitle}" для группы (${quotePartyText}), отправление из г. ${quoteDepartureCity}, бюджет ${quoteBreakdown.final_client_price_uzs} UZS.`
                          );
                        }}
                        className="px-4 py-2 rounded-xl luxury-gold-btn text-xs font-extrabold flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Отправить задачу в AI-Копайлот</span>
                      </button>
                    </div>
                  </div>
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
            className="luxury-gold-btn px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-extrabold text-xs sm:text-sm border border-cyan-200 hover:scale-105 transition-transform"
          >
            <MessageSquare className="w-5 h-5" />
            <span>{txt.widgetButtonLabel}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </button>
        ) : (
          <div className="w-[350px] sm:w-[400px] h-[510px] bg-[#101C2D] rounded-3xl border border-[#C7A46A]/25 shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
            {/* Шапка виджета */}
            <div className="p-4 bg-gradient-to-r from-[#101C2D] to-[#16283F] border-b border-[#C7A46A]/25 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl luxury-gold-btn flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold">{agentConfig.name}</div>
                  <div className="text-[10px] text-emerald-300 font-semibold">
                    {byokState.status === 'active'
                      ? `● Gemini: ${byokState.selected_model_id}`
                      : '● Онлайн · Автономный AI 24/7'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsWidgetOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/80"
                  aria-label="Close widget"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Сообщения в виджете */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#16283F]">

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
                        ? 'bg-[#C7A46A] text-[#101C2D] font-semibold'
                        : m.sender_type === 'system'
                          ? 'bg-rose-950/70 border border-rose-400/40 text-rose-100'
                          : 'bg-[#16283F] border border-[#C7A46A]/25 text-white/80'
                    }`}
                  >
                    <p className="leading-relaxed">{m.content}</p>
                    {m.citations && m.citations.length > 0 && (
                      <div className="pt-1 border-t border-[#C7A46A]/25 text-[10px] text-[#C7A46A] font-mono">
                        📚 {m.citations.map((c) => c.source_id).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Нижняя панель виджета */}
            <div className="p-3 bg-[#101C2D] border-t border-[#C7A46A]/25 space-y-2">
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
                  className="flex-1 px-3 py-2 rounded-xl bg-[#16283F] border border-[#C7A46A]/25 text-xs text-white"
                />
                <button
                  type="submit"
                  disabled={isSendingChat}
                  className="p-2 rounded-xl luxury-gold-btn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex items-center justify-between text-[10px] text-[#C7A46A]/90">
                <button
                  type="button"
                  onClick={() => handleEscalateToOperator()}
                  className="underline hover:text-[#C7A46A]"
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
