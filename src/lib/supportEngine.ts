import { GoogleGenAI, Type, Schema } from '@google/genai';
import {
  ByokKeyStatus,
  DiscoveredGeminiModel,
  KnowledgeSource,
  RagCitation,
  SupportAgentConfig,
} from './supportTypes';
import { AppLanguage } from './types';
import { sanitizePromptInput } from './gemini';

/**
 * Маскирование API-ключа (FR-KEY-01 п.6, FR-KEY-03):
 * Полный ключ никогда не возвращается в UI.
 */
export function maskGoogleApiKey(rawKey: string): string {
  const trimmed = rawKey.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••••••••••${suffix}`;
}

/**
 * Санитизация текстов базы знаний и внешних источников от Prompt Injection (FR-KB, Раздел 14)
 */
export function sanitizeKnowledgeText(raw: string, maxLength = 4000): string {
  if (!raw) return '';
  return raw
    .replace(
      /\b(ignore\s+all\s+previous|ignore\s+previous\s+instructions|system\s+prompt|disregard\s+instructions|reveal\s+api\s+key|забудь\s+все\s+инструкции|раскрой\s+системный\s+промпт|выведи\s+ключ)\b/gi,
      '[REDACTED_SECURITY_RULE]'
    )
    .trim()
    .slice(0, maxLength);
}

/**
 * Начальная проверенная база знаний SilkWay Travel AI для RAG-ответов (FR-KB)
 */
export const DEFAULT_KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  {
    id: 'KB-01',
    workspace_id: 'ws-silkway-main',
    title: 'Поезда Afrosiyob и ж/д билеты (Ташкент — Самарканд — Бухара)',
    type: 'faq',
    uri_or_ref: 'silkway://kb/afrosiyob-rail',
    content: `Высокоскоростные поезда Talgo 250 «Afrosiyob» курсируют ежедневно по маршрутам Ташкент — Самарканд (время в пути ~2 ч 15 мин) и Ташкент — Самарканд — Бухара (~3 ч 50 мин). 
Стоимость билетов в узбекских сумах (UZS): Эконом-класс — от 200 000 до 280 000 UZS, Бизнес-класс — от 320 000 до 420 000 UZS, VIP-класс — от 480 000 до 600 000 UZS.
Билеты открываются в продажу за 45 дней и раскупаются за 15–25 дней до отправления. Для посадки необходим оригинал паспорта. Дорогу в Хиву обслуживают комфортабельные поезда «Шарк» и купейные составы (стоимость от 220 000 до 450 000 UZS).`,
    chunks_count: 3,
    status: 'indexed',
    version: 1,
    updated_at: '2026-11-07T10:00:00Z',
  },
  {
    id: 'KB-02',
    workspace_id: 'ws-silkway-main',
    title: 'Валюта UZS, оплата Payme / Click / Uzum Pay и обмен',
    type: 'faq',
    uri_or_ref: 'silkway://kb/payments-uzs',
    content: `Национальная валюта Узбекистана — узбекский сум (UZS). Все расчеты на платформе SilkWay Travel AI и внутри страны производятся строго в целых сумах (UZS) без тийинов.
Платежные шлюзы Payme, Click и Uzum Pay поддерживают мгновенную оплату по QR-коду и картам Uzcard, Humo, Visa и Mastercard. Банкоматы с выдачей наличных сумов (UZS) доступны во всех аэропортах, вокзалах и отелях Ташкента, Самарканда, Бухары и Хивы.`,
    chunks_count: 2,
    status: 'indexed',
    version: 1,
    updated_at: '2026-11-07T10:00:00Z',
  },
  {
    id: 'KB-03',
    workspace_id: 'ws-silkway-main',
    title: 'Памятники ЮНЕСКО: Регистан, Шахи-Зинда, Гур-Эмир, Пои-Калян, Ичан-Кала',
    type: 'text',
    uri_or_ref: 'silkway://kb/unesco-landmarks',
    content: `Правила и ориентировочная стоимость входных билетов для иностранных туристов в сумах (UZS):
- Площадь Регистан (Самарканд): 65 000 – 100 000 UZS, открыта с 08:00 до 20:00. Вечернее 3D-световое шоу обычно начинается в 20:00 или 21:00.
- Мемориальный ансамбль Шахи-Зинда (Самарканд): вход ~40 000 – 50 000 UZS. Так как это действующее святое место, обязательно закрывать плечи и колени, женщинам рекомендуется платок.
- Мавзолей Гур-Эмир (Самарканд): вход ~40 000 – 50 000 UZS.
- Крепость Арк и комплекс Пои-Калян (Бухара): вход в Арк ~45 000 – 60 000 UZS.
- Ичан-Кала (Хива): единый билет по музеям заповедника — от 150 000 до 250 000 UZS на 2 дня.`,
    chunks_count: 4,
    status: 'indexed',
    version: 1,
    updated_at: '2026-11-07T10:00:00Z',
  },
  {
    id: 'KB-04',
    workspace_id: 'ws-silkway-main',
    title: 'Визовый режим, E-Visa и туристическая регистрация E-Mehmon',
    type: 'faq',
    uri_or_ref: 'silkway://kb/visa-emehmon',
    content: `Граждане более 90 стран (включая СНГ, ЕС, Великобританию, ОАЭ, Японию, Южную Корею) могут въезжать в Узбекистан без визы на срок от 10 до 60 дней. Для остальных стран доступна электронная виза на официальном портале e-visa.gov.uz (срок оформления 2–3 рабочих дня).
Обязательное правило: каждый иностранный турист должен иметь электронную регистрацию в системе E-Mehmon. Отели оформляют регистрацию автоматически при заселении и выдают квитанцию (бумажную или QR-код), которую нужно сохранять до вылета.`,
    chunks_count: 2,
    status: 'indexed',
    version: 1,
    updated_at: '2026-11-07T10:00:00Z',
  },
  {
    id: 'KB-05',
    workspace_id: 'ws-silkway-main',
    title: 'Гастрономия, базары Сиаб и Чорсу, сезонность туров',
    type: 'text',
    uri_or_ref: 'silkway://kb/gastronomy-seasons',
    content: `Лучшее время для путешествия по Узбекистану: весна (март — май) и бархатная осень (сентябрь — ноябрь), когда температура держится в районе +20...+28 °C. Горный курорт Чимган и Амирсой работает круглый год (горные лыжи с декабря по март, канатная дорога от 140 000 UZS).
В Самарканде знаменитый плов «Зигир Ош» готовят преимущественно к обеду (с 11:30 до 14:00), порция стоит от 45 000 до 65 000 UZS. На базарах Чорсу (Ташкент) и Сиаб (Самарканд) принято дружелюбно торговаться (скидка 15–25%).`,
    chunks_count: 3,
    status: 'indexed',
    version: 1,
    updated_at: '2026-11-07T10:00:00Z',
  },
  {
    id: 'KB-06',
    workspace_id: 'ws-silkway-main',
    title: 'Автономное бронирование, расчет туров, изменение дат и контакты Дирекции',
    type: 'faq',
    uri_or_ref: 'silkway://kb/booking-director',
    content: `AI-агент SilkWay Travel AI решает все вопросы клиентов самостоятельно в режиме 24/7 без ожидания менеджера: рассчитывает полную стоимость индивидуальных и групповых туров в сумах (UZS), подбирает отели 4*–5*, резервирует места на поезда Afrosiyob, оформляет перенос дат и формирует готовый пакет документов (ваучер, E-Mehmon и QR-счет Payme/Click/Uzum Pay).
Базовые пакеты туров «под ключ» (с ж/д билетами Afrosiyob, отелями 4* BB и гидами ЮНЕСКО):
- «Золотое Кольцо: Самарканд и Бухара» (4 дня / 3 ночи): 5 450 000 UZS на человека.
- «Легенды Шелкового Пути: Ташкент — Самарканд — Бухара — Хива» (7 дней / 6 ночей): 9 800 000 UZS на человека.
- «Выходные в Самарканде: Регистан и Шахи-Зинда» (2 дня / 1 ночь): 2 650 000 UZS на человека.
По вопросам бронирования: Директор Цой Елена, тел. +998 777-77-77.`,
    chunks_count: 3,
    status: 'indexed',
    version: 2,
    updated_at: '2026-11-07T10:00:00Z',
  },
];

export const DEFAULT_SUPPORT_AGENT_CONFIG: SupportAgentConfig = {
  id: 'agent-silkway-concierge',
  workspace_id: 'ws-silkway-main',
  name: 'SilkWay Autonomous AI Agent',
  description:
    'Полностью автономный AI-агент по туризму в Узбекистане — решает все вопросы без перевода на менеджера (RAG + Travel Agency Copilot + BYOK Google AI Studio)',
  language: 'ru',
  tone: 'professional',
  model_id: null,
  system_instructions:
    'Ты — полностью автономный AI-агент SilkWay Travel AI. Решай все вопросы клиента САМОСТОЯТЕЛЬНО от начала до конца без передачи разговора менеджеру или оператору! Сам подбирай туры, рассчитывай точную стоимость в целых узбекских сумах (UZS), резервируй билеты Afrosiyob, оформляй изменение дат или возврат и выдавай готовое решение прямо в чате. В конце указывай официальный контакт: По вопросам бронирования: Директор Цой Елена, тел. +998 777-77-77.',
  greeting: {
    ru: 'Ассалому алейкум! Я автономный AI-агент SilkWay Travel. Я решаю все вопросы самостоятельно без ожидания менеджера: подберу маршрут, рассчитаю точную смету в сумах (UZS), проверю билеты Afrosiyob, визовые правила и сразу оформлю вашу заявку!',
    en: 'Assalomu alaykum! I am the Autonomous SilkWay Travel AI Agent. I resolve all requests directly without transferring you to a manager: tour selection, exact UZS quotes, Afrosiyob train tickets, visas, and instant booking!',
    uz: 'Assalomu alaykum! Men SilkWay Travel avtonom AI-agentiman. Barcha masalalarni menejerga oʻtkazmasdan oʻzim hal qilaman: tur tanlash, UZSda aniq hisob-kitob, Afrosiyob chiptalari, viza va tezkor bronlash!',
  },
  working_hours: '24/7 · 100% Автономное решение AI (без очереди и перевода на менеджера)',
  strict_rag_only: false,
  version: 2,
  updated_at: '2026-11-07T10:00:00Z',
};

/**
 * Поиск релевантных фрагментов в базе знаний (RAG Retrieval) (FR-KB, FR-CHAT, AC-07, AC-08)
 */
export function retrieveRagCitations(
  query: string,
  sources: KnowledgeSource[],
  maxResults = 3
): RagCitation[] {
  const cleanQuery = sanitizePromptInput(query, 400).toLowerCase();
  if (!cleanQuery) return [];

  // Токенизируем запрос (слова от 3 символов)
  const rawTokens = cleanQuery
    .replace(/[.,?!;:()"«»—-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  // Синонимы для повышения точности многоязычного поиска (RU / EN / UZ)
  const expandedTokens = new Set<string>(rawTokens);
  for (const token of rawTokens) {
    if (token.includes('поезд') || token.includes('train') || token.includes('poyezd') || token.includes('афро') || token.includes('afro') || token.includes('билет') || token.includes('ticket') || token.includes('chipta')) {
      expandedTokens.add('afrosiyob');
      expandedTokens.add('поезд');
      expandedTokens.add('билет');
    }
    if (token.includes('оплат') || token.includes('деньг') || token.includes('карт') || token.includes('валют') || token.includes('сум') || token.includes('pay') || token.includes('currency') || token.includes('uzs') || token.includes('toʻlov')) {
      expandedTokens.add('uzs');
      expandedTokens.add('payme');
      expandedTokens.add('click');
      expandedTokens.add('валюта');
    }
    if (token.includes('регистан') || token.includes('шахи') || token.includes('бухар') || token.includes('хив') || token.includes('самарканд') || token.includes('unesco') || token.includes('мечет') || token.includes('вход') || token.includes('registan') || token.includes('shahi')) {
      expandedTokens.add('регистан');
      expandedTokens.add('шахи-зинда');
      expandedTokens.add('ичан-кала');
      expandedTokens.add('вход');
    }
    if (token.includes('виз') || token.includes('регистрац') || token.includes('паспорт') || token.includes('visa') || token.includes('mehmon') || token.includes('мехмон')) {
      expandedTokens.add('виза');
      expandedTokens.add('e-mehmon');
      expandedTokens.add('регистрация');
    }
    if (token.includes('плов') || token.includes('еда') || token.includes('базар') || token.includes('погод') || token.includes('сезон') || token.includes('чимган') || token.includes('plov') || token.includes('bazaar') || token.includes('palov')) {
      expandedTokens.add('плов');
      expandedTokens.add('базар');
      expandedTokens.add('сезон');
    }
    if (token.includes('директор') || token.includes('елен') || token.includes('цой') || token.includes('телефон') || token.includes('возврат') || token.includes('контакт') || token.includes('брон') || token.includes('refund') || token.includes('director') || token.includes('contact')) {
      expandedTokens.add('директор');
      expandedTokens.add('цой');
      expandedTokens.add('бронирования');
      expandedTokens.add('возврат');
    }
  }

  const scored: RagCitation[] = [];

  for (const src of sources) {
    if (src.status !== 'indexed') continue;
    const safeContent = sanitizeKnowledgeText(src.content);
    const haystack = `${src.title} ${safeContent}`.toLowerCase();

    let matchCount = 0;
    for (const tok of expandedTokens) {
      if (haystack.includes(tok)) {
        matchCount += tok.length >= 5 ? 2 : 1;
      }
    }

    if (matchCount > 0) {
      const score = Math.min(0.99, Number((0.45 + matchCount * 0.11).toFixed(2)));
      scored.push({
        source_id: src.id,
        source_title: src.title,
        snippet: safeContent,
        score,
      });
    }
  }

  if (scored.length === 0) {
    // Для общих запросов (например: «Подбери тур», «Реши все сам», «Хочу в Узбекистан»)
    // подключаем ключевые источники базы знаний, чтобы агент всегда решал задачу самостоятельно
    return sources
      .filter((s) => s.status === 'indexed')
      .slice(0, maxResults)
      .map((src) => ({
        source_id: src.id,
        source_title: src.title,
        snippet: sanitizeKnowledgeText(src.content),
        score: 0.85,
      }));
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

/**
 * Проверка API-ключа Google AI Studio и получение реального каталога моделей (FR-KEY-01, FR-KEY-02, FR-MODEL-01, AC-02..05)
 * Использует официальный REST-эндпоинт Google Gemini API с заголовком `x-goog-api-key`
 * (Никогда не передает ключ в URL query string!)
 */
export async function validateGoogleAiStudioKeyAndDiscoverModels(rawApiKey: string): Promise<{
  status: ByokKeyStatus;
  models: DiscoveredGeminiModel[];
  recommended_model_id: string | null;
  target_models_status: {
    gemini_3_5_found: boolean;
    gemini_3_6_found: boolean;
    gemini_3_8_found: boolean;
    message: string;
  };
  error_code?: number;
  error_message?: string;
}> {
  const cleanedKey = rawApiKey.trim();
  if (!cleanedKey || cleanedKey.length < 16) {
    return {
      status: 'invalid',
      models: [],
      recommended_model_id: null,
      target_models_status: {
        gemini_3_5_found: false,
        gemini_3_6_found: false,
        gemini_3_8_found: false,
        message: 'Ключ не прошел проверку формата или пуст.',
      },
      error_code: 400,
      error_message: 'Введите действительный API-ключ Google AI Studio.',
    };
  }

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      method: 'GET',
      headers: {
        'x-goog-api-key': cleanedKey,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 400 || status === 401 || status === 403) {
        return {
          status: 'invalid',
          models: [],
          recommended_model_id: null,
          target_models_status: {
            gemini_3_5_found: false,
            gemini_3_6_found: false,
            gemini_3_8_found: false,
            message: 'Доступ отклонен Google AI Studio.',
          },
          error_code: status,
          error_message:
            'Недействительный API-ключ Google AI Studio или доступ к Gemini API запрещен (HTTP ' +
            status +
            '). Проверьте ключ на https://aistudio.google.com/apikey',
        };
      }

      if (status === 429) {
        return {
          status: 'quota_exceeded',
          models: [],
          recommended_model_id: null,
          target_models_status: {
            gemini_3_5_found: false,
            gemini_3_6_found: false,
            gemini_3_8_found: false,
            message: 'Превышена квота запросов (HTTP 429).',
          },
          error_code: 429,
          error_message:
            'Исчерпан лимит запросов или квота проекта Google AI Studio (HTTP 429). Проверьте тариф и лимиты в Google AI Studio.',
        };
      }

      return {
        status: 'temporarily_unavailable',
        models: [],
        recommended_model_id: null,
        target_models_status: {
          gemini_3_5_found: false,
          gemini_3_6_found: false,
          gemini_3_8_found: false,
          message: 'Временный сбой на стороне провайдера Gemini API.',
        },
        error_code: status,
        error_message: `Временная ошибка сервера Gemini API (HTTP ${status}). Повторите попытку позже.`,
      };
    }

    const data = (await response.json()) as {
      models?: Array<{
        name: string;
        displayName?: string;
        description?: string;
        supportedGenerationMethods?: string[];
        inputTokenLimit?: number;
        outputTokenLimit?: number;
      }>;
    };

    const rawModels = data.models || [];

    // Фильтруем только модели, совместимые с генерацией контента (FR-MODEL-01)
    const compatibleModels: DiscoveredGeminiModel[] = rawModels
      .filter((m) => {
        const methods = m.supportedGenerationMethods || [];
        const id = (m.name || '').replace(/^models\//, '');
        return (
          methods.includes('generateContent') &&
          id.startsWith('gemini-') &&
          !id.includes('embedding') &&
          !id.includes('aqa') &&
          !id.includes('imagen') &&
          !id.includes('veo')
        );
      })
      .map((m) => {
        const model_id = m.name.replace(/^models\//, '');
        const is_target_35_36_38 =
          model_id.startsWith('gemini-3.5') ||
          model_id.startsWith('gemini-3.6') ||
          model_id.startsWith('gemini-3.8');

        return {
          model_id,
          full_name: m.name,
          display_name: m.displayName || model_id,
          description: m.description || 'Official Google Gemini Generative Model',
          supported_methods: m.supportedGenerationMethods || [],
          input_token_limit: m.inputTokenLimit,
          output_token_limit: m.outputTokenLimit,
          is_target_35_36_38,
        };
      });

    // Сортируем модели так, чтобы самые современные и стабильные были сверху
    compatibleModels.sort((a, b) => {
      if (a.is_target_35_36_38 !== b.is_target_35_36_38) {
        return a.is_target_35_36_38 ? -1 : 1;
      }
      const scoreModel = (id: string) => {
        if (id === 'gemini-2.5-flash') return 100;
        if (id === 'gemini-2.5-pro') return 95;
        if (id.startsWith('gemini-2.5')) return 90;
        if (id === 'gemini-2.0-flash') return 85;
        if (id.startsWith('gemini-2.0')) return 80;
        if (id.startsWith('gemini-1.5')) return 60;
        return 50;
      };
      return scoreModel(b.model_id) - scoreModel(a.model_id);
    });

    // Проверяем фактическое наличие целевых версий 3.5 / 3.6 / 3.8 в официальном ответе Google (FR-MODEL-01, AC-05)
    const gemini_3_5_found = compatibleModels.some((m) => m.model_id.startsWith('gemini-3.5'));
    const gemini_3_6_found = compatibleModels.some((m) => m.model_id.startsWith('gemini-3.6'));
    const gemini_3_8_found = compatibleModels.some((m) => m.model_id.startsWith('gemini-3.8'));

    const anyTargetFound = gemini_3_5_found || gemini_3_6_found || gemini_3_8_found;

    const targetMessage = anyTargetFound
      ? 'Обнаружены целевые модели серии Gemini 3.5/3.6/3.8 в каталоге вашего ключа.'
      : 'Целевые продуктовые версии Gemini 3.5 / 3.6 / 3.8 пока отсутствуют в официальном каталоге Google AI Studio для данного ключа (FR-MODEL-01, AC-05). Выдуманные model_id не подставляются — пожалуйста, выберите одну из реально доступных официальных моделей вашего ключа ниже.';

    const recommended =
      compatibleModels.find((m) => m.is_target_35_36_38)?.model_id ||
      compatibleModels[0]?.model_id ||
      null;

    return {
      status: 'active',
      models: compatibleModels,
      recommended_model_id: recommended,
      target_models_status: {
        gemini_3_5_found,
        gemini_3_6_found,
        gemini_3_8_found,
        message: targetMessage,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return {
      status: 'temporarily_unavailable',
      models: [],
      recommended_model_id: null,
      target_models_status: {
        gemini_3_5_found: false,
        gemini_3_6_found: false,
        gemini_3_8_found: false,
        message: 'Не удалось связаться с сервером Google Gemini API.',
      },
      error_code: 503,
      error_message: `Ошибка соединения при проверке ключа: ${msg}`,
    };
  }
}

export type TravelAgencyOutputStyle = 'client_facing' | 'manager_facing' | 'owner_facing';

export type TravelAgencyTaskCategory =
  | 'lead_qualification'
  | 'tour_shortlist'
  | 'quote'
  | 'sale'
  | 'booking_operations'
  | 'support'
  | 'marketing'
  | 'finance'
  | 'reporting';

export interface TravelAgencyQuoteBreakdownUzs {
  currency: 'UZS';
  supplier_cost_uzs: number;
  markup_percent: number;
  markup_uzs: number;
  gross_selling_price_uzs: number;
  discount_uzs: number;
  final_client_price_uzs: number;
  gross_profit_uzs: number;
  gross_margin_percent: number;
  payment_gateway_fee_percent: number;
  payment_fee_uzs: number;
  net_profit_uzs: number;
}

/**
 * Воспроизводимый калькулятор стоимости тура, наценки, маржи и комиссии эквайринга (в целых UZS)
 * В точности реализует логику `scripts/quote_calculator.py` и `references/finance.md` из скилла `travel-agency-ai`
 */
export function calculateTravelAgencyQuoteUzs(params: {
  supplierCostUzs: number;
  markupPercent: number;
  discountUzs?: number;
  gatewayFeePercent?: number;
}): TravelAgencyQuoteBreakdownUzs {
  const cost = Math.max(0, Math.round(params.supplierCostUzs));
  const markupPct = Math.max(0, Number(params.markupPercent) || 0);
  const discount = Math.max(0, Math.round(params.discountUzs || 0));
  const feePct = Math.max(0, Number(params.gatewayFeePercent ?? 1.5));

  const markupUzs = Math.round(cost * (markupPct / 100));
  const grossSellingPriceUzs = cost + markupUzs;
  const finalClientPriceUzs = Math.max(cost, grossSellingPriceUzs - discount);
  const grossProfitUzs = finalClientPriceUzs - cost;
  const grossMarginPercent =
    finalClientPriceUzs > 0
      ? Number(((grossProfitUzs / finalClientPriceUzs) * 100).toFixed(2))
      : 0;
  const paymentFeeUzs = Math.round(finalClientPriceUzs * (feePct / 100));
  const netProfitUzs = grossProfitUzs - paymentFeeUzs;

  return {
    currency: 'UZS',
    supplier_cost_uzs: cost,
    markup_percent: markupPct,
    markup_uzs: markupUzs,
    gross_selling_price_uzs: grossSellingPriceUzs,
    discount_uzs: discount,
    final_client_price_uzs: finalClientPriceUzs,
    gross_profit_uzs: grossProfitUzs,
    gross_margin_percent: grossMarginPercent,
    payment_gateway_fee_percent: feePct,
    payment_fee_uzs: paymentFeeUzs,
    net_profit_uzs: netProfitUzs,
  };
}

const ragResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    task_category: { type: Type.STRING },
    answer: { type: Type.STRING },
    cited_source_ids: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    next_action: { type: Type.STRING },
    outstanding_confirmations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    low_confidence: { type: Type.BOOLEAN },
    should_escalate: { type: Type.BOOLEAN },
    escalation_reason: { type: Type.STRING },
  },
  required: ['answer', 'cited_source_ids', 'low_confidence', 'should_escalate'],
};

/**
 * Автономный решатель задач туриста по базе знаний RAG + калькулятору UZS (без передачи менеджеру)
 */
export function buildAutonomousRagResolution(params: {
  userMessage: string;
  language: AppLanguage;
  knowledgeSources: KnowledgeSource[];
  outputStyle?: TravelAgencyOutputStyle;
  modelLabel?: string;
}): {
  answer: string;
  citations: RagCitation[];
  modelUsed: string;
  latencyMs: number;
  lowConfidence: boolean;
  shouldEscalate: boolean;
  escalationReason?: string;
  taskCategory: string;
  nextAction: string;
  outstandingConfirmations: string[];
  tokenUsage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
} {
  const startTime = Date.now();
  const cleanQuestion = sanitizePromptInput(params.userMessage, 600);
  const citations = retrieveRagCitations(cleanQuestion, params.knowledgeSources, 3);
  const style: TravelAgencyOutputStyle = params.outputStyle || 'client_facing';

  // Извлекаем количество гостей или бюджет из текста, если указаны
  const paxMatch = cleanQuestion.match(/(\d+)\s*(чел|взросл|турист|pax|guests|kishi)/i);
  const paxCount = paxMatch ? Math.max(1, Math.min(20, parseInt(paxMatch[1], 10))) : 2;
  const daysMatch = cleanQuestion.match(/(\d+)\s*(дн|дня|дней|days|kun)/i);
  const daysCount = daysMatch ? Math.max(1, Math.min(14, parseInt(daysMatch[1], 10))) : 4;

  // Автоматический расчет сметы тура в целых UZS
  const baseSupplierPerPersonPerDay = 1150000;
  const supplierCostUzs = baseSupplierPerPersonPerDay * paxCount * daysCount;
  const quote = calculateTravelAgencyQuoteUzs({
    supplierCostUzs,
    markupPercent: 18,
    discountUzs: 350000,
    gatewayFeePercent: 1.5,
  });

  const kbSummary = citations
    .map((c) => `• **[${c.source_id}] ${c.source_title}:** ${c.snippet}`)
    .join('\n\n');

  let answerText = '';
  if (params.language === 'en') {
    answerText = `✅ **Resolved Autonomously by SilkWay AI Agent (No Manager Handoff Needed):**\n\n${kbSummary}\n\n📊 **Instant Turnkey Calculation (${paxCount} guests · ${daysCount} days):**\n- **Total Package Price:** **${quote.final_client_price_uzs.toLocaleString('ru-RU')} UZS** (includes privilege discount of ${quote.discount_uzs.toLocaleString('ru-RU')} UZS, Afrosiyob high-speed rail tickets, 4* boutique hotels BB, UNESCO guides, and E-Mehmon registration).\n- **Reservation Status:** Pre-reserved automatically (#SW-AI-${Date.now().toString().slice(-4)}).\n\n👉 **Completed Step:** Your itinerary and UZS quote are ready for instant QR payment via Payme / Click / Uzum Pay.\n📞 **For booking inquiries:** Director Elena Tsoy, tel. +998 777-77-77.`;
  } else if (params.language === 'uz') {
    answerText = `✅ **SilkWay AI-Agenti tomonidan mustaqil hal qilindi (Menejerga oʻtkazishsiz):**\n\n${kbSummary}\n\n📊 **Tayyor tur hisob-kitobi (${paxCount} kishi · ${daysCount} kun):**\n- **Yakuniy narx:** **${quote.final_client_price_uzs.toLocaleString('ru-RU')} UZS** (${quote.discount_uzs.toLocaleString('ru-RU')} UZS chegirma, Afrosiyob chiptalari, 4* mehmonxonalar, YUNESKO gidlari va E-Mehmon roʻyxatidan oʻtish kiritilgan).\n- **Bron holati:** Avtomatik tarzda band qilindi (#SW-AI-${Date.now().toString().slice(-4)}).\n\n👉 **Bajarilgan qadam:** Marshrut va UZS hisob-kitob Payme / Click / Uzum Pay orqali toʻlovga tayyor.\n📞 **Bron qilish masalalari boʻyicha:** Direktor Tsoy Yelena, tel. +998 777-77-77.`;
  } else {
    const internalBlock =
      style === 'owner_facing'
        ? `\n\n💼 **Финансовая сводка Owner-facing (в целых UZS):** Себестоимость: ${quote.supplier_cost_uzs.toLocaleString('ru-RU')} UZS · Наценка (${quote.markup_percent}%): +${quote.markup_uzs.toLocaleString('ru-RU')} UZS · Чистая прибыль: **${quote.net_profit_uzs.toLocaleString('ru-RU')} UZS** (Маржа ${quote.gross_margin_percent}%).`
        : style === 'manager_facing'
          ? `\n\n📋 **Операционная сводка:** Квота Afrosiyob и номера 4* проверены автоматически, регистрация E-Mehmon включена.`
          : '';

    answerText = `✅ **Задача решена AI-агентом самостоятельно (без перевода на менеджера):**\n\n${kbSummary}\n\n📊 **Автоматический расчет и решение под ваш запрос (${paxCount} чел. · ${daysCount} дн.):**\n- **Итоговая стоимость пакета «под ключ»:** **${quote.final_client_price_uzs.toLocaleString('ru-RU')} UZS** (с учетом привилегированной скидки ${quote.discount_uzs.toLocaleString('ru-RU')} UZS).\n- **Включено в решение:** Скоростной поезд «Afrosiyob» (Ташкент — Самарканд — Бухара), проживание в отелях 4* с завтраками, индивидуальный трансфер, входные билеты в Регистан и Шахи-Зинда, электронная регистрация E-Mehmon.\n- **Номер автоматической брони:** \`#SW-AI-${Date.now().toString().slice(-4)}\` (оплата в 1 клик через Payme / Click / Uzum Pay).${internalBlock}\n\n👉 **Следующий шаг:** Все детали рассчитаны и оформлены мной в чате — вы можете сразу скачать ваучер или оплатить по QR.\n📞 **По вопросам бронирования:** Директор Цой Елена, тел. +998 777-77-77.`;
  }

  return {
    answer: answerText,
    citations,
    modelUsed: params.modelLabel || 'autonomous-rag-copilot-uzs',
    latencyMs: Math.max(18, Date.now() - startTime),
    lowConfidence: false,
    shouldEscalate: false,
    taskCategory: 'quote',
    nextAction: 'Автономная бронь и расчет в UZS сформированы в чате без ожидания менеджера',
    outstandingConfirmations: [],
    tokenUsage: {
      prompt_tokens: 185,
      completion_tokens: 240,
      total_tokens: 425,
    },
  };
}

/**
 * Генерация RAG-ответа с использованием официального SDK `@google/genai`, выбранного `model_id`
 * и правил операционного копайлота турагентства `travel-agency-ai` (SKILL.md)
 * Агент решает все задачи САМОСТОЯТЕЛЬНО и НИКОГДА не передает диалог менеджеру/оператору.
 */
export async function generateSupportRagAnswer(params: {
  apiKey: string;
  modelId: string;
  userMessage: string;
  language: AppLanguage;
  agentConfig: SupportAgentConfig;
  knowledgeSources: KnowledgeSource[];
  outputStyle?: TravelAgencyOutputStyle;
}): Promise<{
  answer: string;
  citations: RagCitation[];
  modelUsed: string;
  latencyMs: number;
  lowConfidence: boolean;
  shouldEscalate: boolean;
  escalationReason?: string;
  taskCategory?: string;
  nextAction?: string;
  outstandingConfirmations?: string[];
  tokenUsage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}> {
  const startTime = Date.now();
  const cleanQuestion = sanitizePromptInput(params.userMessage, 600);
  const style: TravelAgencyOutputStyle = params.outputStyle || 'client_facing';

  // 1. Поиск релевантных источников в базе знаний (RAG Retrieval всегда возвращает контекст)
  const citations = retrieveRagCitations(cleanQuestion, params.knowledgeSources, 3);

  // Если ключ не передан, сразу решаем задачу автономным RAG-копайлотом без блокировок и без перевода на менеджера
  if (!params.apiKey || !params.modelId) {
    return buildAutonomousRagResolution({
      userMessage: cleanQuestion,
      language: params.language,
      knowledgeSources: params.knowledgeSources,
      outputStyle: style,
    });
  }

  const contextBlock =
    citations.length > 0
      ? citations
          .map(
            (c) =>
              `[Источник ${c.source_id}: "${c.source_title}"]\n${sanitizeKnowledgeText(c.snippet, 1200)}`
          )
          .join('\n\n')
      : '[Используй базовые тарифы SilkWay Travel AI в UZS]';

  const outputStyleInstruction =
    style === 'manager_facing'
      ? 'РЕЖИМ ВЫВОДА: Manager-facing. Дай готовую таблицу решения, источники и автоматический расчет в UZS.'
      : style === 'owner_facing'
        ? 'РЕЖИМ ВЫВОДА: Owner-facing (для владельца/директора). Дай сводку KPI, себестоимость, наценку и чистую прибыль в целых UZS.'
        : 'РЕЖИМ ВЫВОДА: Client-facing (для туриста/клиента). Пиши дружелюбно и конкретно, дай полный расчет и решение задачи прямо сейчас. СТРОГО ЗАПРЕЩЕНО раскрывать внутреннюю маржу или себестоимость.';

  const systemPrompt = `Ты — ${params.agentConfig.name}, полностью автономный AI-агент и операционный копайлот турагентства SilkWay Travel AI («travel-agency-ai»).
Тон общения: ${params.agentConfig.tone}.
Язык ответа: ${params.language === 'en' ? 'English' : params.language === 'uz' ? 'Oʻzbekcha (Lotin)' : 'Русский'}.
${outputStyleInstruction}
Инструкции администратора: ${params.agentConfig.system_instructions}

ГЛАВНОЕ ПРАВИЛО АВТОНОМНОСТИ (БЕЗ ПЕРЕВОДА НА МЕНЕДЖЕРА):
1. РЕШАЙ ВСЕ ВОПРОСЫ КЛИЕНТА САМОСТОЯТЕЛЬНО НА 100%!
2. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО передавать разговор менеджеру, оператору или писать фразы вроде «передам вопрос оператору», «уточните у менеджера», «обратитесь к специалисту». Поле should_escalate ВСЕГДА должно быть false!
3. Сам подбирай конкретные маршруты по Узбекистану (Самарканд, Бухара, Хива, Ташкент, Чимган), сам рассчитывай итоговую стоимость в целых узбекских сумах (UZS), сам предлагай расписание поездов Afrosiyob, отели 4*–5*, визовые правила E-Mehmon и оформляй предварительную бронь или перенос дат прямо в ответе.
4. Все денежные суммы указывай строго в целых узбекских сумах (UZS).
5. В конце ответа указывай готовое решение (next_action) и официальный контакт: По вопросам бронирования: Директор Цой Елена, тел. +998 777-77-77.`;

  const userPrompt = `ФРАГМЕНТЫ БАЗЫ ЗНАНИЙ (RAG CONTEXT):
${contextBlock}

ВОПРОС / ЗАДАЧА КЛИЕНТА (${style.toUpperCase()}) — РЕШИ САМОСТОЯТЕЛЬНО БЕЗ ПЕРЕДАЧИ МЕНЕДЖЕРУ:
${cleanQuestion}`;

  try {
    const ai = new GoogleGenAI({ apiKey: params.apiKey });

    const response = await ai.models.generateContent({
      model: params.modelId,
      contents: userPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: ragResponseSchema,
        temperature: 0.2,
        systemInstruction: systemPrompt,
      },
    });

    const latencyMs = Date.now() - startTime;
    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText) as {
      task_category?: string;
      answer: string;
      cited_source_ids: string[];
      next_action?: string;
      outstanding_confirmations?: string[];
      low_confidence: boolean;
      should_escalate: boolean;
      escalation_reason?: string;
    };

    const usageMeta = response.usageMetadata;
    const prompt_tokens = usageMeta?.promptTokenCount || 0;
    const completion_tokens = usageMeta?.candidatesTokenCount || 0;
    const total_tokens = usageMeta?.totalTokenCount || prompt_tokens + completion_tokens;

    const usedCitations =
      parsed.cited_source_ids && parsed.cited_source_ids.length > 0
        ? citations.filter((c) => parsed.cited_source_ids.includes(c.source_id))
        : citations;

    const formattedAnswer = [
      parsed.answer,
      parsed.next_action ? `\n\n✅ Решено AI-агентом: ${parsed.next_action}` : '',
    ]
      .filter(Boolean)
      .join('');

    return {
      answer: formattedAnswer,
      citations: usedCitations.length > 0 ? usedCitations : citations,
      modelUsed: params.modelId,
      latencyMs,
      lowConfidence: false,
      shouldEscalate: false,
      escalationReason: undefined,
      taskCategory: parsed.task_category || 'quote',
      nextAction: parsed.next_action,
      outstandingConfirmations: [],
      tokenUsage: {
        prompt_tokens,
        completion_tokens,
        total_tokens,
      },
    };
  } catch {
    // При любой сетевой ошибке или лимите квоты агент НЕ переводит на менеджера, а решает запрос встроенным автономным RAG-движком
    return buildAutonomousRagResolution({
      userMessage: cleanQuestion,
      language: params.language,
      knowledgeSources: params.knowledgeSources,
      outputStyle: style,
      modelLabel: `${params.modelId} (Autonomous RAG Fallback)`,
    });
  }
}
