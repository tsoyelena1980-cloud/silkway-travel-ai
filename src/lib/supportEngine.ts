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
    title: 'Бронирование, индивидуальные условия, возвраты и контакты Директора',
    type: 'faq',
    uri_or_ref: 'silkway://kb/booking-director',
    content: `Для подтверждения групповых и индивидуальных VIP-туров, изменения дат бронирования, оформления возвратов или заказа персонального гида-переводчика обращайтесь напрямую в дирекцию.
По вопросам бронирования: Директор Цой Елена, тел. +998 777-77-77.
AI-агент не выполняет самостоятельных денежных возвратов или списаний без подтверждения оператором (согласно политике безопасности MVP).`,
    chunks_count: 2,
    status: 'indexed',
    version: 1,
    updated_at: '2026-11-07T10:00:00Z',
  },
];

export const DEFAULT_SUPPORT_AGENT_CONFIG: SupportAgentConfig = {
  id: 'agent-silkway-concierge',
  workspace_id: 'ws-silkway-main',
  name: 'SilkWay AI Support Concierge',
  description:
    'Официальный AI-агент поддержки туристов по Узбекистану (RAG по базе знаний + BYOK Google AI Studio)',
  language: 'ru',
  tone: 'professional',
  model_id: null,
  system_instructions:
    'Отвечай точно по базе знаний SilkWay Travel AI. Все суммы указывай только в целых узбекских сумах (UZS). Не придумывай несуществующие факты. При запросе возврата средств, жалобе или отсутствии ответа в базе знаний предлагай передачу диалога оператору и указывай контакт: По вопросам бронирования: Директор Цой Елена, тел. +998 777-77-77.',
  greeting: {
    ru: 'Ассалому алейкум! Я AI-агент поддержки SilkWay Travel. Отвечу на вопросы по поездам Afrosiyob, памятникам ЮНЕСКО, оплате в сумах (UZS) и визам на основе проверенной базы знаний.',
    en: 'Assalomu alaykum! I am the SilkWay Travel AI Support Agent. Ask me about Afrosiyob trains, UNESCO landmarks, UZS payments, or visas backed by our verified knowledge base.',
    uz: 'Assalomu alaykum! Men SilkWay Travel AI qoʻllab-quvvatlash agentiman. Afrosiyob poyezdlari, YUNESKO obidalari, UZS toʻlovlari va vizalar boʻyicha tasdiqlangan bilimlar bazasi asosida javob beraman.',
  },
  working_hours: '24/7 (AI RAG) · 09:00–21:00 UZT (Операторы и Дирекция)',
  strict_rag_only: true,
  version: 1,
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
 * Генерация RAG-ответа с использованием официального SDK `@google/genai`, выбранного `model_id`
 * и правил операционного копайлота турагентства `travel-agency-ai` (SKILL.md)
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

  // Проверяем, не просит ли пользователь сразу оператора / возврат / жалобу
  const lowerQ = cleanQuestion.toLowerCase();
  const explicitHumanRequest =
    lowerQ.includes('оператор') ||
    lowerQ.includes('человек') ||
    lowerQ.includes('директор') ||
    lowerQ.includes('возврат денег') ||
    lowerQ.includes('жалоб') ||
    lowerQ.includes('human agent') ||
    lowerQ.includes('refund');

  // 1. Поиск релевантных источников в базе знаний (RAG Retrieval)
  const citations = retrieveRagCitations(cleanQuestion, params.knowledgeSources, 3);

  // Если в базе знаний нет подходящих источников и включен строгий режим RAG (AC-08)
  if (citations.length === 0 && params.agentConfig.strict_rag_only && !explicitHumanRequest) {
    const latencyMs = Date.now() - startTime;
    const noSourceMsg =
      params.language === 'en'
        ? 'I could not find a verified answer to this specific question in the SilkWay Knowledge Base (**ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ**). To avoid inventing facts, I recommend transferring this request to a specialist. Next Action: Confirm departure city, citizenship, and dates with our operator. For booking inquiries: Director Elena Tsoy, tel. +998 777-77-77.'
        : params.language === 'uz'
          ? 'SilkWay bilimlar bazasida ushbu savol boʻyicha tasdiqlangan maʼlumot topilmadi (**ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ**). Taxmin qilmaslik uchun muloqotni operatorga oʻtkazishni tavsiya qilaman. Bron qilish masalalari boʻyicha: Direktor Tsoy Yelena, tel. +998 777-77-77.'
          : 'В проверенной базе знаний SilkWay нет подтверждённых данных по этому вопросу (**ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ**). Согласно правилам скилла `travel-agency-ai` и RAG Strict Mode, я не выдумываю наличие мест, тарифы или правила и предлагаю передать ваш вопрос оператору.\n\n**Следующий шаг (Next Action):** Уточнить детали у менеджера.\n**По вопросам бронирования:** Директор Цой Елена, тел. +998 777-77-77.';

    return {
      answer: noSourceMsg,
      citations: [],
      modelUsed: params.modelId,
      latencyMs,
      lowConfidence: true,
      shouldEscalate: true,
      escalationReason: 'Отсутствует подтвержденный источник в базе знаний (AC-08 / ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ)',
      taskCategory: 'support',
      nextAction: 'Передать запрос оператору для проверки у поставщика',
      outstandingConfirmations: ['Наличие мест и актуальный тариф у туроператора (ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ)'],
      tokenUsage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }

  const contextBlock =
    citations.length > 0
      ? citations
          .map(
            (c) =>
              `[Источник ${c.source_id}: "${c.source_title}"]\n${sanitizeKnowledgeText(c.snippet, 1200)}`
          )
          .join('\n\n')
      : '[Подтвержденные источники по теме не найдены]';

  const outputStyleInstruction =
    style === 'manager_facing'
      ? 'РЕЖИМ ВЫВОДА: Manager-facing (для менеджера турагентства). Укажи классификацию задачи, структурируй ответ (таблица/пункты), укажи источник/статус, операционные риски (например, дефицит билетов Afrosiyob или проверка гражданства) и следующий шаг.'
      : style === 'owner_facing'
        ? 'РЕЖИМ ВЫВОДА: Owner-facing (для владельца/директора турагентства). Дай краткую сводку KPI, финансовые допущения в UZS, флаги сверки (ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ) и конкретные шаги исполнения.'
        : 'РЕЖИМ ВЫВОДА: Client-facing (для туриста/клиента). Пиши лаконично, дружелюбно, с акцентом на выгоды для туриста. СТРОГО ЗАПРЕЩЕНО раскрывать внутреннюю маржу, наценку или себестоимость агентства.';

  const systemPrompt = `Ты — ${params.agentConfig.name}, операционный копайлот турагентства («travel-agency-ai») и AI-агент поддержки SilkWay Travel AI.
Тон общения: ${params.agentConfig.tone}.
Язык ответа: ${params.language === 'en' ? 'English' : params.language === 'uz' ? 'Oʻzbekcha (Lotin)' : 'Русский'}.
${outputStyleInstruction}
Инструкции администратора: ${params.agentConfig.system_instructions}

ПРАВИЛА СКИЛЛА TRAVEL-AGENCY-AI И БЕЗОПАСНОСТИ RAG (PRD Раздел 14, AC-07, AC-08):
1. Классифицируй задачу в поле task_category: lead_qualification, tour_shortlist, quote, sale, booking_operations, support, marketing, finance, или reporting.
2. Отделяй проверенные данные из базы знаний от допущений. Любые живые цены, наличие мест на поездах/рейсах, визовые правила без подтвержденного гражданства маркируй явно как **ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ**.
3. Никогда не предполагай гражданство клиента автоматически по его локации — при вопросах о визах уточняй гражданство и город отправления.
4. Все денежные суммы указывай строго в целых узбекских сумах (UZS).
5. Запрещено собирать в чате сканы паспортов или данные банковских карт. Бронирование никогда не считается подтвержденным до получения подтверждения от поставщика/дирекции.
6. Завершай ответ четким следующим шагом (next_action) и списком открытых подтверждений (outstanding_confirmations).`;

  const userPrompt = `ФРАГМЕНТЫ БАЗЫ ЗНАНИЙ (RAG CONTEXT):
${contextBlock}

ВОПРОС / ЗАДАЧА (${style.toUpperCase()}):
${cleanQuestion}`;

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
    parsed.next_action ? `\n\n👉 Следующий шаг: ${parsed.next_action}` : '',
    parsed.outstanding_confirmations && parsed.outstanding_confirmations.length > 0
      ? `\n📌 ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ: ${parsed.outstanding_confirmations.join('; ')}`
      : '',
  ]
    .filter(Boolean)
    .join('');

  return {
    answer: formattedAnswer,
    citations: usedCitations.length > 0 ? usedCitations : citations,
    modelUsed: params.modelId,
    latencyMs,
    lowConfidence: Boolean(parsed.low_confidence),
    shouldEscalate: Boolean(parsed.should_escalate || explicitHumanRequest),
    escalationReason:
      parsed.escalation_reason ||
      (explicitHumanRequest ? 'Запрос перевода на оператора / дирекцию' : undefined),
    taskCategory: parsed.task_category || 'support',
    nextAction: parsed.next_action,
    outstandingConfirmations: parsed.outstanding_confirmations,
    tokenUsage: {
      prompt_tokens,
      completion_tokens,
      total_tokens,
    },
  };
}
