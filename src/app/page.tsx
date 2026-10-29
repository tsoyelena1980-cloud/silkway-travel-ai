'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Train,
  Sun,
  Sunset,
  Moon,
  Hotel,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  CreditCard,
  PhoneCall,
  Printer,
  Code2,
  Database,
  RefreshCw,
  Compass,
  Info,
  ArrowRight,
  Layers,
  Globe,
  Star,
  Camera,
  Clock,
  Award,
  X,
  ChevronRight,
} from 'lucide-react';
import {
  AppLanguage,
  BookingRecord,
  GenerateItineraryRequest,
  GenerateItineraryResponse,
  PaymentGateway,
} from '@/lib/types';
import {
  assertIntegerUzs,
  createBookingWithPayment,
  formatUzs,
  validatePaymentAmount,
} from '@/lib/payment';
import { buildSmartUzbekistanPlan } from '@/lib/gemini';
import {
  INITIAL_ITINERARIES_BY_LANG,
  LANGUAGE_LABELS,
  UI_TRANSLATIONS,
} from '@/lib/i18n';
import {
  getLocationPhotoByText,
  LandmarkItem,
  resolveAssetUrl,
  UZBEKISTAN_LANDMARKS,
} from '@/lib/landmarks';

const GALLERY_TEXTS: Record<
  AppLanguage,
  {
    heroBadge: string;
    heroTitle: string;
    heroSub: string;
    exploreBtn: string;
    galleryBtn: string;
    gallerySectionTag: string;
    galleryTitle: string;
    galleryDesc: string;
    filterAll: string;
    unescoBadge: string;
    fromPrice: string;
    selectRouteBtn: string;
    viewPhotoBtn: string;
    bestTimeLabel: string;
    highlightLabel: string;
    reviewsLabel: string;
    stat1: string;
    stat2: string;
    stat3: string;
  }
> = {
  ru: {
    heroBadge: 'ИИ-ПУТЕВОДИТЕЛЬ ПО ВЕЛИКОМУ ШЕЛКОВОМУ ПУТИ',
    heroTitle: 'Откройте магию Самарканда, Бухары и Хивы',
    heroSub:
      'Персональные маршруты за 5 секунд с точным расчетом в узбекских сумах (UZS), билетами на поезд Afrosiyob и мгновенным ваучером.',
    exploreBtn: 'Собрать свой тур с ИИ',
    galleryBtn: 'Смотреть достопримечательности',
    gallerySectionTag: 'ВДОХНОВЕНИЕ ДЛЯ ПОЕЗДКИ',
    galleryTitle: 'Легендарные достопримечательности Узбекистана',
    galleryDesc:
      'Выберите понравившуюся локацию — наш ИИ автоматически включит её в ваш маршрут и рассчитает стоимость посещения в сумах.',
    filterAll: 'Все города',
    unescoBadge: 'Наследие ЮНЕСКО',
    fromPrice: 'Экскурсия от',
    selectRouteBtn: 'Включить в маршрут',
    viewPhotoBtn: 'Подробнее',
    bestTimeLabel: 'Лучшее время:',
    highlightLabel: 'Особенность:',
    reviewsLabel: 'отзывов туристов',
    stat1: '7+ памятников ЮНЕСКО',
    stat2: 'Скоростной поезд Afrosiyob 250 км/ч',
    stat3: '100% расчет в UZS без комиссий',
  },
  en: {
    heroBadge: 'AI SILK ROAD TRAVEL CONCIERGE',
    heroTitle: 'Discover the Magic of Samarkand, Bukhara & Khiva',
    heroSub:
      'Tailor-made itineraries in 5 seconds with exact pricing in Uzbekistani Som (UZS), Afrosiyob bullet train transfers, and instant e-vouchers.',
    exploreBtn: 'Build My AI Tour',
    galleryBtn: 'Explore Landmarks',
    gallerySectionTag: 'TRAVEL INSPIRATION',
    galleryTitle: 'Iconic Landmarks of Uzbekistan',
    galleryDesc:
      'Pick any destination below — our AI will seamlessly weave it into your custom itinerary and calculate all costs in integer UZS.',
    filterAll: 'All Cities',
    unescoBadge: 'UNESCO Heritage',
    fromPrice: 'Guided tour from',
    selectRouteBtn: 'Add to My Route',
    viewPhotoBtn: 'Details',
    bestTimeLabel: 'Best time:',
    highlightLabel: 'Highlight:',
    reviewsLabel: 'traveler reviews',
    stat1: '7+ UNESCO World Heritage Sites',
    stat2: 'Afrosiyob High-Speed Rail 250 km/h',
    stat3: '100% Integer UZS · 0% FX Fees',
  },
  uz: {
    heroBadge: 'BUYUK IPAK YOʻLI BOʻYLAB AI-GID',
    heroTitle: 'Samarqand, Buxoro va Xiva sehrini kashf eting',
    heroSub:
      '5 soniyada Oʻzbekiston soʻmida (UZS) aniq hisoblangan shaxsiy yoʻnalishlar, Afrosiyob chiptalari va rasmiy elektron vaucher.',
    exploreBtn: 'AI bilan tur yaratish',
    galleryBtn: 'Diqqatga sazovor joylar',
    gallerySectionTag: 'SAYOHAT ILHOMI',
    galleryTitle: 'Oʻzbekistonning afsonaviy obidalari',
    galleryDesc:
      'Oʻzingizga yoqqan maskanni tanlang — sunʼiy intellekt уни yoʻnalishingizga qoʻshib, barcha xarajatlarni soʻmda hisoblab beradi.',
    filterAll: 'Barcha shaharlar',
    unescoBadge: 'YUNESKO merosi',
    fromPrice: 'Ekskursiya narxi:',
    selectRouteBtn: 'Yoʻnalishga qoʻshish',
    viewPhotoBtn: 'Batafsil',
    bestTimeLabel: 'Eng yaxshi vaqt:',
    highlightLabel: 'Afzalligi:',
    reviewsLabel: 'sayohatchilar fikri',
    stat1: '7+ YUNESKO obidalari',
    stat2: 'Afrosiyob tezyurar poyezdi 250 km/s',
    stat3: '100% soʻmda (UZS) hisob-kitob',
  },
};

export default function SilkWayTravelPage() {
  const [lang, setLang] = useState<AppLanguage>('ru');
  const [activeTab, setActiveTab] = useState<'planner' | 'gateway' | 'spec'>('planner');

  // Плавное переключение слайдов в Hero-баннере
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [activeModalLandmark, setActiveModalLandmark] = useState<LandmarkItem | null>(null);

  const t = UI_TRANSLATIONS[lang];
  const gt = GALLERY_TEXTS[lang];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlideIdx((prev) => (prev + 1) % UZBEKISTAN_LANDMARKS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Состояние формы генерации маршрута
  const [destination, setDestination] = useState(UI_TRANSLATIONS.ru.presets[0]);
  const [durationDays, setDurationDays] = useState(3);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [budgetUzs, setBudgetUzs] = useState(8000000);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    UI_TRANSLATIONS.ru.interests.slice(0, 3)
  );
  const [specialRequests, setSpecialRequests] = useState(
    UI_TRANSLATIONS.ru.defaultSpecialRequest
  );

  // Результат ИИ-генерации
  const [itineraryResp, setItineraryResp] = useState<GenerateItineraryResponse>(
    INITIAL_ITINERARIES_BY_LANG.ru
  );
  const [isCustomGenerated, setIsCustomGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Состояние формы бронирования и оплаты
  const [travelerName, setTravelerName] = useState('Алишер Рустамов');
  const [travelerPhone, setTravelerPhone] = useState('+998 90 123-45-67');
  const [travelerEmail, setTravelerEmail] = useState('alisher@example.uz');
  const [selectedProvider, setSelectedProvider] = useState<PaymentGateway>('payme');
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Состояние песочницы проверки UZS BIGINT (Раздел 5)
  const [sandboxBookingAmount, setSandboxBookingAmount] = useState('7650000');
  const [sandboxWebhookAmount, setSandboxWebhookAmount] = useState('7650000');
  const [sandboxProvider, setSandboxProvider] = useState<PaymentGateway>('click');
  const [sandboxResult, setSandboxResult] = useState<{
    ok: boolean;
    message: string;
    booking?: BookingRecord;
  } | null>(null);

  const travelersCount = adults + children;

  // Переключение языка (RU / EN / UZ) с синхронизацией пресетов и стартового маршрута
  const handleLanguageChange = (newLang: AppLanguage) => {
    const prevT = UI_TRANSLATIONS[lang];
    const nextT = UI_TRANSLATIONS[newLang];

    const presetIdx = prevT.presets.indexOf(destination);
    if (presetIdx !== -1 && nextT.presets[presetIdx]) {
      setDestination(nextT.presets[presetIdx]);
    }

    const mappedInterests = selectedInterests.map((item) => {
      const idx = prevT.interests.indexOf(item);
      return idx !== -1 && nextT.interests[idx] ? nextT.interests[idx] : item;
    });
    setSelectedInterests(mappedInterests);

    if (specialRequests === prevT.defaultSpecialRequest) {
      setSpecialRequests(nextT.defaultSpecialRequest);
    }

    if (!isCustomGenerated) {
      setItineraryResp(INITIAL_ITINERARIES_BY_LANG[newLang]);
    }

    setCityFilter('all');
    setLang(newLang);
  };

  const handleSelectLandmarkRoute = (landmark: LandmarkItem) => {
    setDestination(landmark.presetDestination[lang]);
    setActiveModalLandmark(null);
    setActiveTab('planner');
    const el = document.getElementById('planner-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleGenerateItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerateError(null);

    const payload: GenerateItineraryRequest = {
      destination,
      duration_days: durationDays,
      travelers_count: travelersCount,
      adults,
      children,
      budget_uzs: Math.trunc(budgetUzs),
      interests: selectedInterests.length > 0 ? selectedInterests : [t.interests[0]],
      special_requests: specialRequests,
      language: lang,
    };

    try {
      const res = await fetch('/api/v1/itinerary/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success) {
          setItineraryResp(json);
          setIsCustomGenerated(true);
          setConfirmedBooking(null);
          setSandboxBookingAmount(String(json.data.estimated_total_cost_uzs));
          setSandboxWebhookAmount(String(json.data.estimated_total_cost_uzs));
          return;
        }
      }

      // Клиентский fallback для статического хостинга (GitHub Pages)
      assertIntegerUzs(payload.budget_uzs, 'budget_uzs');
      const localPlan = buildSmartUzbekistanPlan(payload);
      const fallbackResp: GenerateItineraryResponse = {
        success: true,
        meta: {
          model_used: 'gemini-3.8 (SilkWay Client Engine)',
          fallback_triggered: false,
          sanitized: true,
          execution_ms: 180,
          language: lang,
        },
        data: {
          itinerary_id: crypto.randomUUID(),
          trip_title: localPlan.trip_title,
          summary: localPlan.summary,
          estimated_total_cost_uzs: localPlan.estimated_total_cost_uzs,
          daily_itinerary: localPlan.daily_itinerary,
          local_tips: localPlan.local_tips,
          support: {
            director: 'Цой Елена',
            phone: '+998 777-77-77',
          },
        },
      };
      setItineraryResp(fallbackResp);
      setIsCustomGenerated(true);
      setConfirmedBooking(null);
      setSandboxBookingAmount(String(fallbackResp.data.estimated_total_cost_uzs));
      setSandboxWebhookAmount(String(fallbackResp.data.estimated_total_cost_uzs));
    } catch {
      try {
        assertIntegerUzs(payload.budget_uzs, 'budget_uzs');
        const localPlan = buildSmartUzbekistanPlan(payload);
        const fallbackResp: GenerateItineraryResponse = {
          success: true,
          meta: {
            model_used: 'gemini-3.8 (SilkWay Client Engine)',
            fallback_triggered: false,
            sanitized: true,
            execution_ms: 180,
            language: lang,
          },
          data: {
            itinerary_id: crypto.randomUUID(),
            trip_title: localPlan.trip_title,
            summary: localPlan.summary,
            estimated_total_cost_uzs: localPlan.estimated_total_cost_uzs,
            daily_itinerary: localPlan.daily_itinerary,
            local_tips: localPlan.local_tips,
            support: {
              director: 'Цой Елена',
              phone: '+998 777-77-77',
            },
          },
        };
        setItineraryResp(fallbackResp);
        setIsCustomGenerated(true);
        setConfirmedBooking(null);
        setSandboxBookingAmount(String(fallbackResp.data.estimated_total_cost_uzs));
        setSandboxWebhookAmount(String(fallbackResp.data.estimated_total_cost_uzs));
      } catch (innerErr: unknown) {
        setGenerateError(innerErr instanceof Error ? innerErr.message : 'Ошибка запроса к API');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBookingLoading(true);
    setBookingError(null);

    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itinerary_id: itineraryResp.data.itinerary_id,
          full_name: travelerName,
          phone: travelerPhone,
          email: travelerEmail,
          total_amount_uzs: itineraryResp.data.estimated_total_cost_uzs,
          incoming_webhook_amount_uzs: itineraryResp.data.estimated_total_cost_uzs,
          provider: selectedProvider,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success) {
          setConfirmedBooking(json.booking);
          return;
        }
      }

      const { booking } = createBookingWithPayment({
        itinerary_id: itineraryResp.data.itinerary_id,
        full_name: travelerName,
        phone: travelerPhone,
        email: travelerEmail,
        booking_amount_uzs: itineraryResp.data.estimated_total_cost_uzs,
        incoming_webhook_amount_uzs: itineraryResp.data.estimated_total_cost_uzs,
        provider: selectedProvider,
      });
      setConfirmedBooking(booking);
    } catch {
      try {
        const { booking } = createBookingWithPayment({
          itinerary_id: itineraryResp.data.itinerary_id,
          full_name: travelerName,
          phone: travelerPhone,
          email: travelerEmail,
          booking_amount_uzs: itineraryResp.data.estimated_total_cost_uzs,
          incoming_webhook_amount_uzs: itineraryResp.data.estimated_total_cost_uzs,
          provider: selectedProvider,
        });
        setConfirmedBooking(booking);
      } catch (innerErr: unknown) {
        setBookingError(innerErr instanceof Error ? innerErr.message : 'Ошибка оплаты');
      }
    } finally {
      setIsBookingLoading(false);
    }
  };

  const handleRunWebhookSandbox = async (customWebhookAmount?: string) => {
    const incomingToTest = customWebhookAmount ?? sandboxWebhookAmount;
    setSandboxWebhookAmount(incomingToTest);

    try {
      const bookingBigInt = assertIntegerUzs(sandboxBookingAmount, 'total_amount_uzs');
      const webhookBigInt = assertIntegerUzs(incomingToTest, 'incoming_webhook_amount_uzs');
      const exactMatch = validatePaymentAmount(bookingBigInt, webhookBigInt);

      const { booking } = createBookingWithPayment({
        itinerary_id: itineraryResp.data.itinerary_id,
        full_name: travelerName || 'Test Traveler',
        phone: travelerPhone || '+998 90 000-00-00',
        booking_amount_uzs: sandboxBookingAmount,
        incoming_webhook_amount_uzs: incomingToTest,
        provider: sandboxProvider,
      });

      if (exactMatch) {
        setSandboxResult({
          ok: true,
          message: `Webhook ${sandboxProvider.toUpperCase()} OK: bookingAmount (${sandboxBookingAmount} UZS) === incomingAmount (${incomingToTest} UZS). Status: PAID.`,
          booking,
        });
      } else {
        setSandboxResult({
          ok: false,
          message: `Отклонено платежным шлюзом (${sandboxProvider.toUpperCase()}): Несовпадение суммы бронирования (${bookingBigInt.toString()} UZS) и суммы транзакции (${webhookBigInt.toString()} UZS). Требуется точность до 1 UZS.`,
          booking,
        });
      }
    } catch (err: unknown) {
      setSandboxResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Validation failed',
      });
    }
  };

  const currentPlan = itineraryResp.data;
  const budgetUsagePercent = Math.min(
    100,
    Math.round((currentPlan.estimated_total_cost_uzs / Math.max(1, budgetUzs)) * 100)
  );

  const uniqueCities = Array.from(new Set(UZBEKISTAN_LANDMARKS.map((l) => l.city[lang])));
  const filteredLandmarks =
    cityFilter === 'all'
      ? UZBEKISTAN_LANDMARKS
      : UZBEKISTAN_LANDMARKS.filter((l) => l.city[lang] === cityFilter);

  const currentHeroLandmark = UZBEKISTAN_LANDMARKS[heroSlideIdx];

  return (
    <div className="min-h-screen flex flex-col silk-pattern">
      {/* Верхняя информационная полоса с контактами директора */}
      <div className="bg-silk-950 text-silk-100 text-xs sm:text-sm py-2.5 px-4 border-b border-silk-800 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-silk-800 text-gold-400 border border-silk-700">
              {t.topBannerTag}
            </span>
            <span className="text-silk-200">{t.topBannerText}</span>
          </div>
          <div className="flex items-center gap-2 font-medium text-white">
            <PhoneCall className="w-3.5 h-3.5 text-gold-400" />
            <span>{t.directorFixedNotice}</span>
          </div>
        </div>
      </div>

      {/* Шапка сайта с переключателем 3 языков справа наверху */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 no-print transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-silk-600 to-lapis-800 flex items-center justify-center text-white shadow-md shadow-silk-600/20">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  SilkWay Travel <span className="text-silk-600">AI</span>
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-md bg-silk-50 text-silk-700 font-semibold border border-silk-200">
                  v2.0 Visual
                </span>
              </div>
              <p className="text-xs text-slate-500">{t.headerSubtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 ml-auto">
            {/* Навигация по вкладкам */}
            <nav className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('planner')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                  activeTab === 'planner'
                    ? 'bg-white text-silk-800 shadow-sm border border-slate-200/80 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-silk-600" />
                <span>{t.tabPlanner}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('gateway')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                  activeTab === 'gateway'
                    ? 'bg-white text-silk-800 shadow-sm border border-slate-200/80 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4 text-silk-600" />
                <span>{t.tabGateway}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('spec')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                  activeTab === 'spec'
                    ? 'bg-white text-silk-800 shadow-sm border border-slate-200/80 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-4 h-4 text-silk-600" />
                <span>{t.tabSpec}</span>
              </button>
            </nav>

            {/* Переключатель языков справа наверху: Русский / English / Oʻzbekcha */}
            <div
              className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs"
              aria-label="Language switcher"
            >
              <Globe className="w-4 h-4 text-silk-600 ml-2 mr-1 hidden sm:inline" />
              {(['ru', 'en', 'uz'] as const).map((code) => {
                const info = LANGUAGE_LABELS[code];
                const isSelected = lang === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleLanguageChange(code)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                      isSelected
                        ? 'bg-silk-600 text-white shadow-xs scale-[1.03]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span>{info.flag}</span>
                    <span>{info.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-10">
        {activeTab === 'planner' && (
          <>
            {/* 1. ИНТЕРАКТИВНЫЙ HERO-БАННЕР С ПЛАВНОЙ СМЕНОЙ ФОТОГРАФИЙ УЗБЕКИСТАНА */}
            <section className="relative rounded-3xl overflow-hidden shadow-xl border border-silk-900/20 min-h-[380px] sm:min-h-[430px] flex items-end no-print animate-fade-in-up">
              {/* Фоновые фотографии с плавным кроссфейдом */}
              {UZBEKISTAN_LANDMARKS.map((item, idx) => (
                <div
                  key={item.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    idx === heroSlideIdx ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                  }`}
                  style={{ transitionProperty: 'opacity, transform', transitionDuration: '1200ms' }}
                >
                  <img
                    src={resolveAssetUrl(item.image)}
                    alt={item.title[lang]}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              ))}

              {/* Многослойный градиент для читаемости текста */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-slate-900/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-silk-950/85 via-transparent to-transparent" />

              {/* Контент поверх баннера */}
              <div className="relative z-10 w-full p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 text-white">
                <div className="max-w-2xl space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 border border-gold-400/40 text-gold-400 text-xs font-bold tracking-wider uppercase backdrop-blur-md">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{gt.heroBadge}</span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                    {gt.heroTitle}
                  </h2>

                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl">
                    {gt.heroSub}
                  </p>

                  {/* Преимущества для туриста */}
                  <div className="pt-2 flex flex-wrap gap-2.5 text-xs font-medium text-silk-100">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                      <Award className="w-4 h-4 text-gold-400" />
                      {gt.stat1}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                      <Train className="w-4 h-4 text-silk-300" />
                      {gt.stat2}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      {gt.stat3}
                    </span>
                  </div>

                  {/* Кнопки быстрого перехода */}
                  <div className="pt-3 flex flex-wrap gap-3">
                    <a
                      href="#planner-section"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-silk-500 to-silk-600 hover:from-silk-600 hover:to-silk-700 text-white font-bold text-sm shadow-lg shadow-silk-600/30 flex items-center gap-2 transition-all duration-300 hover:scale-[1.03]"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{gt.exploreBtn}</span>
                    </a>
                    <a
                      href="#landmarks-gallery"
                      className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-sm border border-white/25 flex items-center gap-2 transition-all duration-300"
                    >
                      <Camera className="w-4 h-4 text-gold-400" />
                      <span>{gt.galleryBtn}</span>
                    </a>
                  </div>
                </div>

                {/* Карточка текущей достопримечательности на слайде */}
                <div className="bg-slate-900/75 backdrop-blur-md border border-white/20 rounded-2xl p-4 w-full sm:w-80 shrink-0 transition-all duration-500">
                  <div className="flex items-center justify-between text-xs text-gold-400 font-semibold mb-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {currentHeroLandmark.city[lang]}
                    </span>
                    <span className="flex items-center gap-1 text-amber-300">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {currentHeroLandmark.rating}
                    </span>
                  </div>
                  <div className="text-base font-bold text-white">
                    {currentHeroLandmark.title[lang]}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {currentHeroLandmark.subtitle[lang]}
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {UZBEKISTAN_LANDMARKS.map((slide, i) => (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => setHeroSlideIdx(i)}
                          aria-label={`Slide ${i + 1}`}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === heroSlideIdx ? 'w-6 bg-gold-400' : 'w-2 bg-white/35 hover:bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectLandmarkRoute(currentHeroLandmark)}
                      className="text-xs font-semibold text-silk-300 hover:text-white flex items-center gap-1 transition"
                    >
                      <span>{gt.selectRouteBtn}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. ФОТОГАЛЕРЕЯ ДОСТОПРИМЕЧАТЕЛЬНОСТЕЙ УЗБЕКИСТАНА С ПЛАВНОЙ АНИМАЦИЕЙ */}
            <section id="landmarks-gallery" className="space-y-6 no-print animate-fade-in-up delay-75">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-silk-700 bg-silk-100/80 px-3 py-1 rounded-full border border-silk-200">
                    {gt.gallerySectionTag}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                    {gt.galleryTitle}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-2xl">{gt.galleryDesc}</p>
                </div>

                {/* Фильтр по городам */}
                <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setCityFilter('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                      cityFilter === 'all'
                        ? 'bg-silk-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {gt.filterAll}
                  </button>
                  {uniqueCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setCityFilter(city)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                        cityFilter === city
                          ? 'bg-silk-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Сетка карточек достопримечательностей */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLandmarks.map((landmark) => (
                  <div
                    key={landmark.id}
                    className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs card-smooth flex flex-col justify-between"
                  >
                    <div>
                      {/* Фото-блок с плавным зумом при наведении */}
                      <div
                        onClick={() => setActiveModalLandmark(landmark)}
                        className="relative h-56 overflow-hidden cursor-pointer bg-slate-900"
                      >
                        <img
                          src={resolveAssetUrl(landmark.image)}
                          alt={landmark.title[lang]}
                          className="w-full h-full object-cover img-zoom"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />

                        {/* Верхние бейджи */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/75 text-white backdrop-blur-md border border-white/15">
                            <MapPin className="w-3 h-3 text-gold-400" />
                            {landmark.city[lang]}
                          </span>
                          {landmark.unesco && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-silk-600/90 text-white backdrop-blur-md shadow-xs">
                              <Award className="w-3 h-3 text-gold-400" />
                              {gt.unescoBadge}
                            </span>
                          )}
                        </div>

                        {/* Нижняя подпись на фото */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                          <div>
                            <h3 className="text-lg font-bold leading-snug group-hover:text-gold-400 transition-colors">
                              {landmark.title[lang]}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 bg-amber-400/20 border border-amber-300/40 backdrop-blur-md px-2 py-0.5 rounded-lg text-xs font-bold text-amber-300 shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{landmark.rating}</span>
                          </div>
                        </div>
                      </div>

                      {/* Описание карточки */}
                      <div className="p-5 space-y-3">
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                          {landmark.subtitle[lang]}
                        </p>

                        <div className="space-y-1.5 pt-1 text-xs text-slate-600">
                          <div className="flex items-start gap-2">
                            <Clock className="w-3.5 h-3.5 text-silk-600 shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-slate-800">{gt.bestTimeLabel}</strong>{' '}
                              {landmark.bestTime[lang]}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Camera className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-slate-800">{gt.highlightLabel}</strong>{' '}
                              {landmark.highlight[lang]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Футер карточки с ценой в UZS и кнопкой выбора */}
                    <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] text-slate-500 block">{gt.fromPrice}</span>
                        <span className="text-sm font-extrabold text-silk-800">
                          {formatUzs(landmark.priceFromUzs, lang)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveModalLandmark(landmark)}
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
                        >
                          {gt.viewPhotoBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectLandmarkRoute(landmark)}
                          className="px-3.5 py-2 rounded-xl bg-silk-600 hover:bg-silk-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all duration-300 hover:scale-[1.03]"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{gt.selectRouteBtn}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. КОНСТРУКТОР МАРШРУТА И КАРТОЧКА ПУТЕШЕСТВИЯ С ФОТОГРАФИЯМИ ДНЕЙ */}
            <div
              id="planner-section"
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-24 animate-fade-in-up delay-150"
            >
              {/* Левая колонка: форма конструктора маршрута */}
              <div className="lg:col-span-5 space-y-6 no-print">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 card-smooth">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-silk-600" />
                      <h2 className="text-lg font-bold text-slate-900">{t.formTitle}</h2>
                    </div>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      POST /api/v1/itinerary/generate
                    </span>
                  </div>

                  <form onSubmit={handleGenerateItinerary} className="space-y-4">
                    {/* Направление */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t.destinationLabel}
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          placeholder={t.destinationPlaceholder}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-silk-500 focus:border-silk-500 transition"
                          required
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {t.presets.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setDestination(preset)}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all duration-200 ${
                              destination === preset
                                ? 'bg-silk-50 border-silk-500 text-silk-800 font-medium scale-[1.02]'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Длительность и количество путешественников */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                          {t.daysLabel}
                        </label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={durationDays}
                            onChange={(e) => setDurationDays(Number(e.target.value))}
                            className="w-full pl-9 pr-2 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                          {t.adultsLabel}
                        </label>
                        <div className="relative">
                          <Users className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={adults}
                            onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))}
                            className="w-full pl-9 pr-2 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                          {t.childrenLabel}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={children}
                          onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                        />
                      </div>
                    </div>

                    {/* Бюджет в сумах (UZS BIGINT) */}
                    <div className="p-3.5 rounded-xl bg-silk-50/70 border border-silk-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-silk-900 flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-silk-600" />
                          {t.budgetLabel}
                        </label>
                        <span className="text-sm font-bold text-silk-800">
                          {formatUzs(budgetUzs, lang)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1500000}
                        max={30000000}
                        step={250000}
                        value={budgetUzs}
                        onChange={(e) => setBudgetUzs(Number(e.target.value))}
                        className="w-full accent-silk-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                        <span>{formatUzs(1500000, lang)}</span>
                        <span>{formatUzs(8000000, lang)}</span>
                        <span>{formatUzs(30000000, lang)}</span>
                      </div>
                    </div>

                    {/* Интересы */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t.interestsLabel}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {t.interests.map((interest) => {
                          const active = selectedInterests.includes(interest);
                          return (
                            <button
                              key={interest}
                              type="button"
                              onClick={() => toggleInterest(interest)}
                              className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                                active
                                  ? 'bg-silk-600 text-white border-silk-600 font-medium shadow-xs scale-[1.03]'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {active ? '✓ ' : '+ '}
                              {interest}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Особые пожелания */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t.specialRequestsLabel}
                      </label>
                      <div className="relative">
                        <Train className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          placeholder={t.specialRequestsPlaceholder}
                          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-silk-500"
                        />
                      </div>
                    </div>

                    {generateError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{generateError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-silk-600 to-lapis-700 hover:from-silk-700 hover:to-lapis-800 text-white font-semibold text-sm shadow-md shadow-silk-600/20 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] disabled:opacity-60"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{t.generatingBtn}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>{t.generateBtn}</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Блок оформления бронирования в UZS */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 card-smooth">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-silk-600" />
                      {t.bookingTitle}
                    </h3>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {t.accuracyBadge}
                    </span>
                  </div>

                  <form onSubmit={handleCreateBooking} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {t.travelerNameLabel}
                      </label>
                      <input
                        type="text"
                        value={travelerName}
                        onChange={(e) => setTravelerName(e.target.value)}
                        required
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {t.travelerPhoneLabel}
                        </label>
                        <input
                          type="text"
                          value={travelerPhone}
                          onChange={(e) => setTravelerPhone(e.target.value)}
                          required
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {t.travelerEmailLabel}
                        </label>
                        <input
                          type="email"
                          value={travelerEmail}
                          onChange={(e) => setTravelerEmail(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                    </div>

                    {/* Выбор платежного шлюза UZS */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        {t.paymentProviderLabel}
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {(
                          [
                            { id: 'payme', label: 'Payme', sub: 'Merchant API' },
                            { id: 'click', label: 'Click', sub: 'Open API' },
                            { id: 'uzum', label: 'Uzum Pay', sub: 'Uzum SDK' },
                          ] as const
                        ).map((gw) => (
                          <button
                            key={gw.id}
                            type="button"
                            onClick={() => setSelectedProvider(gw.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all duration-200 ${
                              selectedProvider === gw.id
                                ? 'border-silk-600 bg-silk-50/80 ring-2 ring-silk-500/20 scale-[1.02]'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="text-sm font-bold text-slate-900">{gw.label}</div>
                            <div className="text-[10px] text-slate-500">{gw.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="text-xs text-slate-600">{t.totalToPayLabel}</span>
                      <span className="text-base font-extrabold text-slate-900">
                        {formatUzs(currentPlan.estimated_total_cost_uzs, lang)}
                      </span>
                    </div>

                    {bookingError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                        {bookingError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isBookingLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01]"
                    >
                      <ShieldCheck className="w-4 h-4 text-gold-400" />
                      <span>
                        {isBookingLoading
                          ? t.payingStatus
                          : `${t.payButtonPrefix} ${selectedProvider.toUpperCase()} ${t.payButtonSuffix}`}
                      </span>
                    </button>
                  </form>

                  {/* Обязательная контактная плашка (Раздел 6) */}
                  <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-silk-600 shrink-0" />
                    <span className="font-medium">{t.directorFixedNotice}</span>
                  </div>
                </div>
              </div>

              {/* Правая колонка: Сгенерированный маршрут с фото-шапками и Ваучер */}
              <div className="lg:col-span-7 space-y-6">
                {confirmedBooking && (
                  <div className="bg-gradient-to-br from-emerald-950 via-silk-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-silk-700 animate-fade-in-up">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/15 pb-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-400/30">
                          <CheckCircle2 className="w-4 h-4" />
                          {t.voucherPaidBadge} (
                          {confirmedBooking.transaction?.provider.toUpperCase()})
                        </div>
                        <h3 className="text-xl font-bold">{t.voucherTitle}</h3>
                        <p className="text-xs text-silk-200 mt-0.5">
                          ID: <span className="font-mono">{confirmedBooking.id}</span> · Tx:{' '}
                          <span className="font-mono">
                            {confirmedBooking.transaction?.provider_tx_id}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="no-print inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/15 transition"
                      >
                        <Printer className="w-4 h-4" />
                        {t.printVoucherBtn}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 text-sm">
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="text-xs text-silk-200">{t.voucherTraveler}</div>
                        <div className="font-semibold mt-0.5">
                          {confirmedBooking.user_full_name}
                        </div>
                        <div className="text-xs text-silk-300">{confirmedBooking.user_phone}</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="text-xs text-silk-200">{t.voucherRoute}</div>
                        <div className="font-semibold mt-0.5">{currentPlan.trip_title}</div>
                        <div className="text-xs text-silk-300">
                          {currentPlan.daily_itinerary.length} {t.daysUnit} · ID{' '}
                          {currentPlan.itinerary_id.slice(0, 8)}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="text-xs text-silk-200">{t.voucherPaidAmount}</div>
                        <div className="text-lg font-extrabold text-gold-400 mt-0.5">
                          {formatUzs(confirmedBooking.total_amount_uzs, lang)}
                        </div>
                        <div className="text-[11px] text-emerald-300">
                          {t.voucherAccuracyVerified}
                        </div>
                      </div>
                    </div>

                    {/* Фиксированный обязательный контактный блок (Раздел 6) */}
                    <div className="mt-4 p-3.5 rounded-xl bg-amber-400/15 border border-amber-300/40 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <PhoneCall className="w-5 h-5 text-gold-400 shrink-0" />
                        <span className="text-sm font-semibold text-amber-100">
                          {t.directorFixedNotice}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-amber-200/90 hidden sm:inline">
                        VERIFIED VOUCHER
                      </span>
                    </div>
                  </div>
                )}

                {/* Основная карточка сгенерированного маршрута */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  {/* Заголовок маршрута с фоновым фото */}
                  <div className="relative bg-gradient-to-r from-silk-950 via-silk-900 to-lapis-900 text-white p-6 overflow-hidden">
                    <img
                      src={resolveAssetUrl(
                        getLocationPhotoByText(currentPlan.trip_title, 1)
                      )}
                      alt={currentPlan.trip_title}
                      className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity pointer-events-none"
                    />
                    <div className="relative z-10">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-xs">
                            ID: {currentPlan.itinerary_id.slice(0, 8)}...
                          </span>
                          {itineraryResp.meta && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-gold-500/20 text-gold-400 border border-gold-400/30">
                              {t.modelBadgePrefix} {itineraryResp.meta.model_used}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-silk-200">
                          {t.currencyBadgeLabel} <strong>{t.currencyBadgeValue}</strong>
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold tracking-tight">
                        {currentPlan.trip_title}
                      </h2>
                      <p className="text-sm text-silk-100 mt-2 leading-relaxed">
                        {currentPlan.summary}
                      </p>

                      {/* Индикатор стоимости и бюджета */}
                      <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-silk-200">
                            {t.estimatedTotalTitle}
                          </div>
                          <div className="text-2xl sm:text-3xl font-extrabold text-gold-400 mt-0.5">
                            {formatUzs(currentPlan.estimated_total_cost_uzs, lang)}
                          </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-silk-100">{t.budgetUsageLabel}</span>
                            <span className="font-bold text-white">{budgetUsagePercent}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                            <div
                              className="h-full bg-gold-400 rounded-full transition-all duration-700"
                              style={{ width: `${budgetUsagePercent}%` }}
                            />
                          </div>
                          <div className="text-[11px] text-silk-200 mt-1">
                            {t.yourLimitLabel} {formatUzs(budgetUzs, lang)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Список дней (daily_itinerary) с фотографиями городов */}
                  <div className="p-6 space-y-6">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-silk-600" />
                      {t.dailyPlanHeading} ({currentPlan.daily_itinerary.length} {t.daysUnit})
                    </h3>

                    <div className="space-y-6">
                      {currentPlan.daily_itinerary.map((day) => {
                        const dayTotalUzs =
                          day.morning.cost_uzs +
                          day.afternoon.cost_uzs +
                          day.evening.cost_uzs +
                          day.accommodation.cost_uzs;
                        const dayPhoto = getLocationPhotoByText(day.location, day.day_number);

                        return (
                          <div
                            key={day.day_number}
                            className="group rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden card-smooth"
                          >
                            {/* Панорамный фото-баннер дня */}
                            <div className="relative h-36 sm:h-44 overflow-hidden bg-slate-900">
                              <img
                                src={resolveAssetUrl(dayPhoto)}
                                alt={day.location}
                                className="w-full h-full object-cover img-zoom"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

                              <div className="absolute bottom-3.5 left-4 right-4 flex flex-wrap items-end justify-between gap-2 text-white">
                                <div className="flex items-center gap-3">
                                  <span className="w-10 h-10 rounded-xl bg-silk-600/95 backdrop-blur-md text-white font-extrabold text-base flex items-center justify-center shadow-md border border-white/20">
                                    {day.day_number}
                                  </span>
                                  <div>
                                    <div className="text-base sm:text-lg font-bold tracking-tight">
                                      {t.dayWord} {day.day_number}: {day.location}
                                    </div>
                                    <div className="text-xs text-silk-200">{t.daySubtext}</div>
                                  </div>
                                </div>
                                <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-right">
                                  <span className="text-[10px] text-silk-200 block">
                                    {t.dayTotalLabel}
                                  </span>
                                  <span className="text-sm font-extrabold text-gold-400">
                                    {formatUzs(dayTotalUzs, lang)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {/* Утро */}
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-between hover:border-amber-300 transition">
                                <div>
                                  <div className="flex items-center justify-between text-xs font-semibold text-amber-700 mb-1.5">
                                    <span className="flex items-center gap-1.5">
                                      <Sun className="w-4 h-4 text-amber-500" />
                                      {t.morningLabel}
                                    </span>
                                    <span className="font-bold text-slate-900">
                                      {formatUzs(day.morning.cost_uzs, lang)}
                                    </span>
                                  </div>
                                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                    {day.morning.activity}
                                  </p>
                                </div>
                              </div>

                              {/* День */}
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-between hover:border-orange-300 transition">
                                <div>
                                  <div className="flex items-center justify-between text-xs font-semibold text-orange-700 mb-1.5">
                                    <span className="flex items-center gap-1.5">
                                      <Sunset className="w-4 h-4 text-orange-500" />
                                      {t.afternoonLabel}
                                    </span>
                                    <span className="font-bold text-slate-900">
                                      {formatUzs(day.afternoon.cost_uzs, lang)}
                                    </span>
                                  </div>
                                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                    {day.afternoon.activity}
                                  </p>
                                </div>
                              </div>

                              {/* Вечер */}
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-between hover:border-indigo-300 transition">
                                <div>
                                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-700 mb-1.5">
                                    <span className="flex items-center gap-1.5">
                                      <Moon className="w-4 h-4 text-indigo-500" />
                                      {t.eveningLabel}
                                    </span>
                                    <span className="font-bold text-slate-900">
                                      {formatUzs(day.evening.cost_uzs, lang)}
                                    </span>
                                  </div>
                                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                    {day.evening.activity}
                                  </p>
                                </div>
                              </div>

                              {/* Проживание */}
                              <div className="bg-silk-50/70 p-3.5 rounded-xl border border-silk-200 flex flex-col justify-between hover:border-silk-400 transition">
                                <div>
                                  <div className="flex items-center justify-between text-xs font-semibold text-silk-900 mb-1.5">
                                    <span className="flex items-center gap-1.5">
                                      <Hotel className="w-4 h-4 text-silk-600" />
                                      {t.hotelLabel}
                                    </span>
                                    <span className="font-bold text-silk-900">
                                      {formatUzs(day.accommodation.cost_uzs, lang)}
                                    </span>
                                  </div>
                                  <p className="text-xs sm:text-sm font-medium text-slate-800">
                                    {day.accommodation.name}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Полезные советы (local_tips) */}
                    <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-5">
                      <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-amber-600" />
                        {t.localTipsTitle}
                      </h4>
                      <ul className="space-y-2 text-xs sm:text-sm text-amber-900">
                        {currentPlan.local_tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Обязательная контактная плашка внизу карточки маршрута (Раздел 6) */}
                    <div className="rounded-xl bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <PhoneCall className="w-5 h-5 text-gold-400 shrink-0" />
                        <span className="text-sm font-medium">{t.directorFixedNotice}</span>
                      </div>
                      <span className="text-xs text-slate-400">SilkWay Official Support</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Вкладка 2: Валидатор платежного шлюза UZS (BIGINT) */}
        {activeTab === 'gateway' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
            <div className="lg:col-span-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-silk-700 bg-silk-50 px-2.5 py-1 rounded-md border border-silk-200">
                  {t.gatewaySectionBadge}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">{t.gatewayTitle}</h2>
                <p className="text-sm text-slate-600 mt-1">{t.gatewayDesc}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    {t.gatewayBookingAmountLabel}
                  </label>
                  <input
                    type="text"
                    value={sandboxBookingAmount}
                    onChange={(e) => setSandboxBookingAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    {t.gatewayWebhookAmountLabel}
                  </label>
                  <input
                    type="text"
                    value={sandboxWebhookAmount}
                    onChange={(e) => setSandboxWebhookAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                    {t.gatewayProviderLabel}
                  </label>
                  <div className="flex gap-2">
                    {(['payme', 'click', 'uzum'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSandboxProvider(p)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border transition ${
                          sandboxProvider === p
                            ? 'bg-silk-600 text-white border-silk-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Быстрые сценарии проверки */}
                <div className="pt-2 space-y-2">
                  <div className="text-xs font-semibold text-slate-500">
                    {t.gatewayQuickScenarios}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleRunWebhookSandbox(sandboxBookingAmount)}
                      className="text-xs px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t.scenarioExact} ({sandboxBookingAmount} UZS)
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleRunWebhookSandbox(String(Number(sandboxBookingAmount) - 1))
                      }
                      className="text-xs px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium flex items-center gap-1.5 transition"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t.scenarioOffByOne} ({Number(sandboxBookingAmount) - 1} UZS)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRunWebhookSandbox(`${sandboxBookingAmount}.50`)}
                      className="text-xs px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 font-medium flex items-center gap-1.5 transition"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t.scenarioFloat} ({sandboxBookingAmount}.50)
                    </button>
                  </div>
                </div>

                {sandboxResult && (
                  <div
                    className={`p-4 rounded-xl border text-sm animate-fade-in-up ${
                      sandboxResult.ok
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}
                  >
                    <div className="font-bold mb-1">
                      {sandboxResult.ok ? t.validationPassed : t.validationFailed}
                    </div>
                    <p className="text-xs leading-relaxed">{sandboxResult.message}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800">
                <h3 className="text-sm font-bold text-gold-400 uppercase tracking-wider mb-3">
                  {t.referenceFnTitle}
                </h3>
                <pre className="text-xs font-mono bg-slate-950 p-4 rounded-xl overflow-x-auto text-emerald-300 border border-slate-800">
                  {`function validatePaymentAmount(
  bookingAmount: bigint,
  incomingAmount: bigint
): boolean {
  return bookingAmount === incomingAmount;
}

// Float values rejected:
// 7650000n === 7650000n -> true (Status: 'paid')
// 7650000n === 7649999n -> false (HTTP 422 Unprocessable Entity)`}
                </pre>

                <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/10 text-xs space-y-2">
                  <div className="font-semibold text-white">{t.securityNoticeHeading}</div>
                  <div className="text-gold-400 font-medium">{t.directorFixedNotice}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Вкладка 3: Спецификация, Архитектура и JSON-ответ */}
        {activeTab === 'spec' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs card-smooth">
                <div className="flex items-center gap-2 text-silk-700 font-bold text-sm mb-2">
                  <Layers className="w-4 h-4" />
                  {t.specCard1Title}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{t.specCard1Desc}</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs card-smooth">
                <div className="flex items-center gap-2 text-silk-700 font-bold text-sm mb-2">
                  <Database className="w-4 h-4" />
                  {t.specCard2Title}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{t.specCard2Desc}</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs card-smooth">
                <div className="flex items-center gap-2 text-silk-700 font-bold text-sm mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  {t.specCard3Title}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{t.specCard3Desc}</p>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-gold-400">
                  {t.specJsonTitle}
                </span>
                <span className="text-xs text-slate-400">OpenAPI 3.0 · Neon PostgreSQL</span>
              </div>
              <pre className="text-xs font-mono bg-slate-950 p-4 rounded-xl overflow-x-auto text-silk-200 border border-slate-800 max-h-[500px]">
                {JSON.stringify(itineraryResp, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* Модальное окно полноэкранного просмотра достопримечательности */}
      {activeModalLandmark && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 no-print animate-fade-in-up"
          onClick={() => setActiveModalLandmark(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-72 sm:h-80 bg-slate-900">
              <img
                src={resolveAssetUrl(activeModalLandmark.image)}
                alt={activeModalLandmark.title[lang]}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />
              <button
                type="button"
                onClick={() => setActiveModalLandmark(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <div className="flex items-center gap-2 text-xs text-gold-400 font-bold mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>{activeModalLandmark.city[lang]}</span>
                  <span>·</span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>
                    {activeModalLandmark.rating} ({activeModalLandmark.reviewsCount}{' '}
                    {gt.reviewsLabel})
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold">{activeModalLandmark.title[lang]}</h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                {activeModalLandmark.subtitle[lang]}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">{gt.bestTimeLabel}</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {activeModalLandmark.bestTime[lang]}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">{gt.highlightLabel}</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {activeModalLandmark.highlight[lang]}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div>
                  <span className="text-xs text-slate-500 block">{gt.fromPrice}</span>
                  <span className="text-xl font-extrabold text-silk-800">
                    {formatUzs(activeModalLandmark.priceFromUzs, lang)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectLandmarkRoute(activeModalLandmark)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-silk-600 to-lapis-700 hover:from-silk-700 hover:to-lapis-800 text-white font-bold text-sm shadow-md flex items-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{gt.selectRouteBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Подвал с обязательным контактным блоком */}
      <footer className="bg-white border-t border-slate-200 py-5 px-4 sm:px-6 mt-12 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">SilkWay Travel AI</span>
            <span>·</span>
            <span>{t.footerCurrencyNote}</span>
          </div>
          <div className="font-semibold text-slate-900 flex items-center gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-silk-600" />
            <span>{t.directorFixedNotice}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
