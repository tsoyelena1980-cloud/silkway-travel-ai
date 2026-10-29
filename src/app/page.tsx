'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  AppLanguage,
  BookingRecord,
  GenerateItineraryRequest,
  GenerateItineraryResponse,
  PaymentGateway,
} from '@/lib/types';
import { formatUzs } from '@/lib/payment';
import {
  INITIAL_ITINERARIES_BY_LANG,
  LANGUAGE_LABELS,
  UI_TRANSLATIONS,
} from '@/lib/i18n';

export default function SilkWayTravelPage() {
  const [lang, setLang] = useState<AppLanguage>('ru');
  const [activeTab, setActiveTab] = useState<'planner' | 'gateway' | 'spec'>('planner');

  const t = UI_TRANSLATIONS[lang];

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

  // Переключение языка (RU / UZ / EN) с синхронизацией пресетов и стартового маршрута
  const handleLanguageChange = (newLang: AppLanguage) => {
    const prevT = UI_TRANSLATIONS[lang];
    const nextT = UI_TRANSLATIONS[newLang];

    // Переводим выбранное направление, если оно из стандартного списка
    const presetIdx = prevT.presets.indexOf(destination);
    if (presetIdx !== -1 && nextT.presets[presetIdx]) {
      setDestination(nextT.presets[presetIdx]);
    }

    // Переводим выбранные теги интересов
    const mappedInterests = selectedInterests.map((item) => {
      const idx = prevT.interests.indexOf(item);
      return idx !== -1 && nextT.interests[idx] ? nextT.interests[idx] : item;
    });
    setSelectedInterests(mappedInterests);

    // Переводим дефолтное пожелание по Afrosiyob
    if (specialRequests === prevT.defaultSpecialRequest) {
      setSpecialRequests(nextT.defaultSpecialRequest);
    }

    // Если открыт стартовый демонстрационный маршрут — переключаем его на выбранный язык
    if (!isCustomGenerated) {
      setItineraryResp(INITIAL_ITINERARIES_BY_LANG[newLang]);
    }

    setLang(newLang);
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

    try {
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

      const res = await fetch('/api/v1/itinerary/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Не удалось сгенерировать маршрут');
      }

      setItineraryResp(json);
      setIsCustomGenerated(true);
      setConfirmedBooking(null);
      setSandboxBookingAmount(String(json.data.estimated_total_cost_uzs));
      setSandboxWebhookAmount(String(json.data.estimated_total_cost_uzs));
    } catch (err: unknown) {
      setGenerateError(err instanceof Error ? err.message : 'Ошибка запроса к API');
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

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Ошибка создания бронирования');
      }

      setConfirmedBooking(json.booking);
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : 'Ошибка оплаты');
    } finally {
      setIsBookingLoading(false);
    }
  };

  const handleRunWebhookSandbox = async (customWebhookAmount?: string) => {
    const incomingToTest = customWebhookAmount ?? sandboxWebhookAmount;
    setSandboxWebhookAmount(incomingToTest);

    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itinerary_id: itineraryResp.data.itinerary_id,
          full_name: travelerName || 'Test Traveler',
          phone: travelerPhone || '+998 90 000-00-00',
          total_amount_uzs: Number(sandboxBookingAmount),
          incoming_webhook_amount_uzs: Number(incomingToTest),
          provider: sandboxProvider,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSandboxResult({
          ok: true,
          message: `Webhook ${sandboxProvider.toUpperCase()} OK: bookingAmount (${sandboxBookingAmount} UZS) === incomingAmount (${incomingToTest} UZS). Status: PAID.`,
          booking: json.booking,
        });
      } else {
        setSandboxResult({
          ok: false,
          message: json.error || 'Validation error',
          booking: json.booking,
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

      {/* Шапка сайта с переключателем 3 языков (RU / UZ / EN) */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
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
                  v1.0 MVP
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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'planner'
                    ? 'bg-white text-silk-800 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-silk-600" />
                <span>{t.tabPlanner}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('gateway')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'gateway'
                    ? 'bg-white text-silk-800 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4 text-silk-600" />
                <span>{t.tabGateway}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('spec')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'spec'
                    ? 'bg-white text-silk-800 shadow-sm border border-slate-200/80'
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
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-silk-600 text-white shadow-xs'
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'planner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Левая колонка: форма конструктора маршрута */}
            <div className="lg:col-span-5 space-y-6 no-print">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
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
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-silk-500 focus:border-silk-500"
                        required
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {t.presets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDestination(preset)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                            destination === preset
                              ? 'bg-silk-50 border-silk-500 text-silk-800 font-medium'
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
                            className={`text-xs px-3 py-1.5 rounded-full border transition ${
                              active
                                ? 'bg-silk-600 text-white border-silk-600 font-medium shadow-xs'
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
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-silk-600 to-lapis-700 hover:from-silk-700 hover:to-lapis-800 text-white font-semibold text-sm shadow-md shadow-silk-600/20 flex items-center justify-center gap-2 transition disabled:opacity-60"
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
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
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
                          className={`p-2.5 rounded-xl border text-left transition ${
                            selectedProvider === gw.id
                              ? 'border-silk-600 bg-silk-50/80 ring-2 ring-silk-500/20'
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
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
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

            {/* Правая колонка: Сгенерированный маршрут и Ваучер бронирования */}
            <div className="lg:col-span-7 space-y-6">
              {/* Если есть подтвержденное бронирование — показываем карточку-ваучер */}
              {confirmedBooking && (
                <div className="bg-gradient-to-br from-emerald-950 via-silk-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-silk-700">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/15 pb-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-400/30">
                        <CheckCircle2 className="w-4 h-4" />
                        {t.voucherPaidBadge} ({confirmedBooking.transaction?.provider.toUpperCase()})
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
                      <div className="font-semibold mt-0.5">{confirmedBooking.user_full_name}</div>
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
                {/* Заголовок маршрута */}
                <div className="bg-gradient-to-r from-silk-900 via-silk-800 to-lapis-900 text-white p-6">
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

                  <h2 className="text-2xl font-bold tracking-tight">{currentPlan.trip_title}</h2>
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

                    <div className="bg-white/10 rounded-xl p-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-silk-100">{t.budgetUsageLabel}</span>
                        <span className="font-bold text-white">{budgetUsagePercent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                        <div
                          className="h-full bg-gold-400 rounded-full transition-all duration-500"
                          style={{ width: `${budgetUsagePercent}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-silk-200 mt-1">
                        {t.yourLimitLabel} {formatUzs(budgetUzs, lang)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Список дней (daily_itinerary) */}
                <div className="p-6 space-y-6">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-silk-600" />
                    {t.dailyPlanHeading} ({currentPlan.daily_itinerary.length} {t.daysUnit})
                  </h3>

                  <div className="space-y-5">
                    {currentPlan.daily_itinerary.map((day) => {
                      const dayTotalUzs =
                        day.morning.cost_uzs +
                        day.afternoon.cost_uzs +
                        day.evening.cost_uzs +
                        day.accommodation.cost_uzs;

                      return (
                        <div
                          key={day.day_number}
                          className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden"
                        >
                          <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-lg bg-silk-600 text-white font-bold text-sm flex items-center justify-center">
                                {day.day_number}
                              </span>
                              <div>
                                <div className="text-sm font-bold text-slate-900">
                                  {t.dayWord} {day.day_number}: {day.location}
                                </div>
                                <div className="text-xs text-slate-500">{t.daySubtext}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-slate-500 block">
                                {t.dayTotalLabel}
                              </span>
                              <span className="text-sm font-bold text-silk-800">
                                {formatUzs(dayTotalUzs, lang)}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {/* Утро */}
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
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
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
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
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
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
                            <div className="bg-silk-50/70 p-3.5 rounded-xl border border-silk-200 flex flex-col justify-between">
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
        )}

        {/* Вкладка 2: Валидатор платежного шлюза UZS (BIGINT) */}
        {activeTab === 'gateway' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                      className="text-xs px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t.scenarioExact} ({sandboxBookingAmount} UZS)
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleRunWebhookSandbox(String(Number(sandboxBookingAmount) - 1))
                      }
                      className="text-xs px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t.scenarioOffByOne} ({Number(sandboxBookingAmount) - 1} UZS)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRunWebhookSandbox(`${sandboxBookingAmount}.50`)}
                      className="text-xs px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 font-medium flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t.scenarioFloat} ({sandboxBookingAmount}.50)
                    </button>
                  </div>
                </div>

                {sandboxResult && (
                  <div
                    className={`p-4 rounded-xl border text-sm ${
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-silk-700 font-bold text-sm mb-2">
                  <Layers className="w-4 h-4" />
                  {t.specCard1Title}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{t.specCard1Desc}</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-silk-700 font-bold text-sm mb-2">
                  <Database className="w-4 h-4" />
                  {t.specCard2Title}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{t.specCard2Desc}</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
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
                <span className="text-xs text-slate-400">OpenAPI 3.0 Compliant</span>
              </div>
              <pre className="text-xs font-mono bg-slate-950 p-4 rounded-xl overflow-x-auto text-silk-200 border border-slate-800 max-h-[500px]">
                {JSON.stringify(itineraryResp, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>

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
