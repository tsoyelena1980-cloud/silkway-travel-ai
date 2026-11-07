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
  RefreshCw,
  Compass,
  Info,
  ArrowRight,
  Globe,
  Star,
  Clock,
  Award,
  X,
  ChevronRight,
  Menu,
} from 'lucide-react';
import AiSupportAgentSuite from '@/components/AiSupportAgentSuite';
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
} from '@/lib/payment';
import { buildSmartUzbekistanPlan } from '@/lib/gemini';
import {
  INITIAL_ITINERARIES_BY_LANG,
  LANGUAGE_LABELS,
  UI_TRANSLATIONS,
} from '@/lib/i18n';
import {
  getLocationPhotoByText,
  handleLandmarkImgError,
  LandmarkItem,
  resolveAssetUrl,
  UZBEKISTAN_LANDMARKS,
} from '@/lib/landmarks';

interface SignatureCityCard {
  id: string;
  name: Record<AppLanguage, string>;
  tag: Record<AppLanguage, string>;
  description: Record<AppLanguage, string>;
  image: string;
  presetRoute: Record<AppLanguage, string>;
  priceFromUzs: number;
}

const SIGNATURE_CITIES: SignatureCityCard[] = [
  {
    id: 'city-samarkand',
    name: {
      ru: 'Самарканд',
      en: 'Samarkand',
      uz: 'Samarqand',
    },
    tag: {
      ru: 'Сердце империи Тимуридов',
      en: 'Heart of the Timurid Empire',
      uz: 'Temuriylar saltanati yuragi',
    },
    description: {
      ru: 'Монументальный ансамбль Регистан, бирюзовые купола Гур-Эмира и священная улица мавзолеев Шахи-Зинда в золотых лучах заката.',
      en: 'The monumental Registan Square, turquoise domes of Gur-e-Amir, and the sacred avenue of Shah-i-Zinda bathed in golden sunset light.',
      uz: 'Ulugʻvor Registon maydoni, Goʻri Amirning moviy gumbazlari va Shohi Zinda majmuasining betakror meʼmorchiligi.',
    },
    image: '/landmarks/samarkand.jpg',
    presetRoute: {
      ru: 'Самарканд и Бухара (Наследие ЮНЕСКО)',
      en: 'Samarkand & Bukhara (UNESCO Heritage)',
      uz: 'Samarqand va Buxoro (YUNESKO merosi)',
    },
    priceFromUzs: 2650000,
  },
  {
    id: 'city-bukhara',
    name: {
      ru: 'Бухара',
      en: 'Bukhara',
      uz: 'Buxoro',
    },
    tag: {
      ru: 'Поэзия древнего Востока',
      en: 'Poetry of the Ancient East',
      uz: 'Qadimiy Sharq sheʼriyati',
    },
    description: {
      ru: 'Древняя цитадель Арк, минарет Калян, торговые купола шелкопрядов и камерные бутик-отели в исторических караван-сараях.',
      en: 'The ancient Ark Citadel, Kalyan Minaret, historic trading domes, and intimate boutique hotels set within restored caravanserais.',
      uz: 'Qadimiy Ark qalʼasi, Minorai Kalon, tarixiy savdo gumbazlari va karvonsaroylardagi shinam butik-mehmonxonalar.',
    },
    image: '/landmarks/bukhara.jpg',
    presetRoute: {
      ru: 'Золотое Кольцо: Ташкент — Самарканд — Бухара',
      en: 'Golden Ring: Tashkent — Samarkand — Bukhara',
      uz: 'Oltin Halqa: Toshkent — Samarqand — Buxoro',
    },
    priceFromUzs: 3100000,
  },
  {
    id: 'city-khiva',
    name: {
      ru: 'Хива',
      en: 'Khiva',
      uz: 'Xiva',
    },
    tag: {
      ru: 'Музей под открытым небом',
      en: 'Open-Air Oasis Museum',
      uz: 'Ochiq osmon ostidagi muzey',
    },
    description: {
      ru: 'Заповедный город Ичан-Кала за глинобитными крепостными стенами: минарет Кальта-Минор, дворцы ханов и резные колонны Джума-мечети.',
      en: 'The walled inner city of Itchan Kala: Kalta Minor minaret, royal palaces, and the 218 carved wooden columns of Juma Mosque.',
      uz: 'Qadimiy devorlar ortidagi Ichan-Qalʼa: Kalta Minor, xon saroylari va Juma masjidining oʻймакор ustunlari.',
    },
    image: '/landmarks/khiva.jpg',
    presetRoute: {
      ru: 'Легенды Хорезма: Хива и Бухара',
      en: 'Legends of Khorezm: Khiva & Bukhara',
      uz: 'Xorazm afsonalari: Xiva va Buxoro',
    },
    priceFromUzs: 3850000,
  },
  {
    id: 'city-tashkent',
    name: {
      ru: 'Ташкент',
      en: 'Tashkent',
      uz: 'Toshkent',
    },
    tag: {
      ru: 'Современная столица и Чимган',
      en: 'Modern Metropolis & Chimgan',
      uz: 'Zamonaviy poytaxt va Chimyon',
    },
    description: {
      ru: 'Восточный колорит базара Чорсу, медресе Хаст-Имам, высокая гастрономия и панорамные горные курорты Тянь-Шаня в часе езды.',
      en: 'The vibrant Chorsu Bazaar, Khast-Imam complex, fine dining, and panoramic Tian Shan mountain resorts just an hour away.',
      uz: 'Chorsu bozorining sharqona shukuhi, Hazrati Imom majmuasi, zamonaviy gastronomiya va Tyan-Shan togʻ kurortlari.',
    },
    image: '/landmarks/chorsu.jpg',
    presetRoute: {
      ru: 'Ташкент и горный курорт Чимган',
      en: 'Tashkent & Chimgan Mountain Resort',
      uz: 'Toshkent va Chimyon togʻ kurorti',
    },
    priceFromUzs: 2150000,
  },
];

const LUXURY_COPY: Record<
  AppLanguage,
  {
    navDestinations: string;
    navCurated: string;
    navConcierge: string;
    navAbout: string;
    headerCta: string;
    heroTag: string;
    heroTitle: string;
    heroSub: string;
    heroPrimaryBtn: string;
    heroSecondaryBtn: string;
    destinationsTag: string;
    destinationsTitle: string;
    destinationsSub: string;
    openDestinationLink: string;
    allLandmarksTitle: string;
    conciergeTag: string;
    conciergeTitle: string;
    conciergeSub: string;
    departureCityLabel: string;
    travelDateLabel: string;
    travelStyleLabel: string;
    conciergeSubmitBtn: string;
    whyTag: string;
    whyTitle: string;
    whySub: string;
    ivoryTag: string;
    ivoryTitle: string;
    ivorySub: string;
    discoverTitle: string;
    discoverSub: string;
    reviewsTag: string;
    reviewsTitle: string;
    reviewsDisclaimer: string;
  }
> = {
  ru: {
    navDestinations: 'Направления',
    navCurated: 'Авторские туры',
    navConcierge: 'AI-консьерж',
    navAbout: 'О нас',
    headerCta: 'Создать путешествие',
    heroTag: 'ROYAL SILK ROAD · PRIVATE & BESPOKE JOURNEYS',
    heroTitle: 'Узбекистан. Путешествие вне времени.',
    heroSub:
      'Откройте наследие Великого Шёлкового пути с персональными маршрутами, созданными специально для вас.',
    heroPrimaryBtn: 'Создать моё путешествие',
    heroSecondaryBtn: 'Исследовать направления',
    destinationsTag: 'ИЗБРАННЫЕ НАПРАВЛЕНИЯ',
    destinationsTitle: 'Четыре столицы Великого Шёлкового пути',
    destinationsSub:
      'Каждое направление — это продуманная глава вашего путешествия: от бирюзовых куполов Самарканда до древних караван-сараев Бухары и Хивы.',
    openDestinationLink: 'Открыть направление',
    allLandmarksTitle: 'Архитектурные шедевры и панорамы Узбекистана',
    conciergeTag: 'AI TRAVEL CONCIERGE',
    conciergeTitle: 'Ваше идеальное путешествие начинается здесь',
    conciergeSub:
      'Расскажите о своих пожеланиях, а интеллектуальный консьерж поможет создать индивидуальный маршрут по Узбекистану.',
    departureCityLabel: 'Город отправления',
    travelDateLabel: 'Дата начала поездки',
    travelStyleLabel: 'Стиль путешествия и предпочтения',
    conciergeSubmitBtn: 'Создать персональный маршрут',
    whyTag: 'СТАНДАРТ SILKWAY TRAVEL AI',
    whyTitle: 'Почему SilkWay Travel AI',
    whySub:
      'Сочетание безупречного консьерж-сервиса, глубокой экспертизы по региону и интеллектуального планирования в реальном времени.',
    ivoryTag: 'ЭКСКЛЮЗИВНАЯ ЭСТЕТИКА',
    ivoryTitle: 'Путешествия, созданные вокруг вас',
    ivorySub:
      'Мы проектируем маршруты в ритме вашего комфорта: билеты Бизнес и VIP-класса на скоростные поезда Afrosiyob, исторические бутик-отели, приватные гиды-историки и прозрачный расчёт в узбекских сумах (UZS).',
    discoverTitle: 'Откройте настоящий Узбекистан',
    discoverSub:
      'Индивидуальные гастрономические дегустации, закрытые мастерские бухарских золотошвеев и самаркандской шелковой бумаги, вечерние панорамы Регистана.',
    reviewsTag: 'ВПЕЧАТЛЕНИЯ И СЦЕНАРИИ',
    reviewsTitle: 'Отзывы путешественников',
    reviewsDisclaimer:
      'Демонстрационные примеры сценариев индивидуальных путешествий для иллюстрации форматов сервиса SilkWay Travel AI.',
  },
  en: {
    navDestinations: 'Destinations',
    navCurated: 'Curated Tours',
    navConcierge: 'AI Concierge',
    navAbout: 'About Us',
    headerCta: 'Create Journey',
    heroTag: 'ROYAL SILK ROAD · PRIVATE & BESPOKE JOURNEYS',
    heroTitle: 'Uzbekistan. A Journey Beyond Time.',
    heroSub:
      'Discover the heritage of the Great Silk Road with bespoke itineraries crafted exclusively for you.',
    heroPrimaryBtn: 'Create My Journey',
    heroSecondaryBtn: 'Explore Destinations',
    destinationsTag: 'SIGNATURE DESTINATIONS',
    destinationsTitle: 'Four Capitals of the Great Silk Road',
    destinationsSub:
      'Each city unfolds as an unforgettable chapter: from the turquoise domes of Samarkand to the timeless caravanserais of Bukhara and Khiva.',
    openDestinationLink: 'Explore Destination',
    allLandmarksTitle: 'Architectural Masterpieces & Panoramas of Uzbekistan',
    conciergeTag: 'AI TRAVEL CONCIERGE',
    conciergeTitle: 'Your Perfect Journey Begins Here',
    conciergeSub:
      'Share your preferences, and our intelligent concierge will craft a tailored itinerary across Uzbekistan.',
    departureCityLabel: 'Departure City',
    travelDateLabel: 'Preferred Departure Date',
    travelStyleLabel: 'Travel Style & Preferences',
    conciergeSubmitBtn: 'Create Personal Itinerary',
    whyTag: 'THE SILKWAY STANDARD',
    whyTitle: 'Why SilkWay Travel AI',
    whySub:
      'A synthesis of private concierge hospitality, deep regional mastery, and intelligent itinerary architecture.',
    ivoryTag: 'BESPOKE AESTHETIC',
    ivoryTitle: 'Journeys Crafted Around You',
    ivorySub:
      'Every itinerary is paced to your comfort: Business and VIP class seats aboard Afrosiyob high-speed trains, boutique heritage hotels, private historians, and transparent pricing in Uzbekistani Som (UZS).',
    discoverTitle: 'Discover the Real Uzbekistan',
    discoverSub:
      'Private culinary tastings, master silk-paper and gold-embroidery ateliers in Samarkand and Bukhara, and tranquil evening views of Registan.',
    reviewsTag: 'TRAVELER IMPRESSIONS',
    reviewsTitle: 'Traveler Reflections',
    reviewsDisclaimer:
      'Illustrative showcase scenarios demonstrating bespoke SilkWay Travel AI itinerary formats.',
  },
  uz: {
    navDestinations: 'Yoʻnalishlar',
    navCurated: 'Mualliflik turlari',
    navConcierge: 'AI-konsyerj',
    navAbout: 'Biz haqimizda',
    headerCta: 'Sayohat yaratish',
    heroTag: 'ROYAL SILK ROAD · PRIVATE & BESPOKE JOURNEYS',
    heroTitle: 'Oʻzbekiston. Vaqtdan tashqari sayohat.',
    heroSub:
      'Buyuk Ipak yoʻli merosini siz uchun maxsus yaratilgan shaxsiy yoʻnalishlar bilan kashf eting.',
    heroPrimaryBtn: 'Sayohatimni yaratish',
    heroSecondaryBtn: 'Yoʻnalishlarni koʻrish',
    destinationsTag: 'TANLANGAN YOʻNALISHLAR',
    destinationsTitle: 'Buyuk Ipak yoʻlining toʻrt poytaxti',
    destinationsSub:
      'Har bir shahar — unutilmas sayohat sahifasi: Samarqandning moviy gumbazlaridan Buxoro va Xivaning qadimiy karvonsaroylarigacha.',
    openDestinationLink: 'Yoʻnalishni ochish',
    allLandmarksTitle: 'Oʻzbekistonning meʼmoriy durdonalari',
    conciergeTag: 'AI TRAVEL CONCIERGE',
    conciergeTitle: 'Sizning mukammal sayohatingiz shu yerdan boshlanadi',
    conciergeSub:
      'Istaklaringiz haqida soʻzlab bering va intellektual konsyerj Oʻzbekiston boʻylab shaxsiy marshrut tuzib beradi.',
    departureCityLabel: 'Joʻnab ketish shahri',
    travelDateLabel: 'Sayohat sanasi',
    travelStyleLabel: 'Sayohat uslubi',
    conciergeSubmitBtn: 'Shaxsiy marshrut yaratish',
    whyTag: 'SILKWAY STANDARTI',
    whyTitle: 'Nima uchun SilkWay Travel AI',
    whySub:
      'Yuqori darajadagi konsyerj xizmati, mintaqaviy tajriba va sunʼiy intellekt yordamida aniq rejalashtirish uygʻunligi.',
    ivoryTag: 'EKSKLYUZIV ESTETIKA',
    ivoryTitle: 'Siz uchun yaratilgan sayohatlar',
    ivorySub:
      'Afrosiyob tezyurar poyezdlarining VIP va Biznes-klass chiptalari, tarixiy butik-mehmonxonalar, shaxsiy gidlar va Oʻzbekiston soʻmida (UZS) shaffof hisob-kitob.',
    discoverTitle: 'Haqiqiy Oʻzbekistonni kashf eting',
    discoverSub:
      'Samarqand va Buxoroning qadimiy hunarmandchilik ustaxonalari, milliy gastronomiya va Registonning kechki manzaralari.',
    reviewsTag: 'SAYOHATCHILAR TAASSUROTLARI',
    reviewsTitle: 'Sayohatchilar fikrlari',
    reviewsDisclaimer:
      'SilkWay Travel AI individual sayohat formatlarini namoyish etuvchi namunaviy ssenariylar.',
  },
};

export default function SilkWayTravelPage() {
  const [lang, setLang] = useState<AppLanguage>('ru');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [cityFilter, setCityFilter] = useState<string>('all');
  const [activeModalLandmark, setActiveModalLandmark] = useState<LandmarkItem | null>(null);

  const t = UI_TRANSLATIONS[lang];
  const lx = LUXURY_COPY[lang];

  // Поля формы персонального AI-консьержа
  const [departureCity, setDepartureCity] = useState('Ташкент');
  const [travelDate, setTravelDate] = useState('2026-11-15');
  const [destination, setDestination] = useState(UI_TRANSLATIONS.ru.presets[0]);
  const [durationDays, setDurationDays] = useState(4);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [budgetUzs, setBudgetUzs] = useState(8500000);
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

  const travelersCount = adults + children;

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
    const el = document.getElementById('planner-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectSignatureCity = (city: SignatureCityCard) => {
    setDestination(city.presetRoute[lang]);
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

    const enrichedSpecialRequests = [
      departureCity ? `Отправление: ${departureCity}` : '',
      travelDate ? `Дата: ${travelDate}` : '',
      specialRequests,
    ]
      .filter(Boolean)
      .join(' · ');

    const payload: GenerateItineraryRequest = {
      destination,
      duration_days: durationDays,
      travelers_count: travelersCount,
      adults,
      children,
      budget_uzs: Math.trunc(budgetUzs),
      interests: selectedInterests.length > 0 ? selectedInterests : [t.interests[0]],
      special_requests: enrichedSpecialRequests,
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
          return;
        }
      }

      assertIntegerUzs(payload.budget_uzs, 'budget_uzs');
      const localPlan = buildSmartUzbekistanPlan(payload);
      const fallbackResp: GenerateItineraryResponse = {
        success: true,
        meta: {
          model_used: 'SilkWay AI Concierge',
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
    } catch {
      try {
        assertIntegerUzs(payload.budget_uzs, 'budget_uzs');
        const localPlan = buildSmartUzbekistanPlan(payload);
        const fallbackResp: GenerateItineraryResponse = {
          success: true,
          meta: {
            model_used: 'SilkWay AI Concierge',
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

  return (
    <div className="min-h-screen flex flex-col bg-[#101C2D] text-white">
      {/* Тонкая статусная строка консьерж-сервиса */}
      <div className="bg-[#0B1420] text-[#F5F1E9]/85 text-xs py-2 px-4 border-b border-[#C7A46A]/20 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 tracking-wider uppercase text-[11px] text-[#C7A46A]">
            <span>ROYAL SILK ROAD CONCIERGE</span>
            <span className="text-white/30">·</span>
            <span className="text-white/75 normal-case tracking-normal">{t.topBannerText}</span>
          </div>
          <div className="flex items-center gap-2 font-medium text-[#C7A46A]">
            <PhoneCall className="w-3.5 h-3.5 text-[#C7A46A]" />
            <span>{t.directorFixedNotice}</span>
          </div>
        </div>
      </div>

      {/* 2. ПРЕМИАЛЬНАЯ МИНИМАЛИСТИЧНАЯ ШАПКА САЙТА */}
      <header className="bg-[#101C2D]/95 backdrop-blur-xl sticky top-0 z-30 border-b border-[#C7A46A]/20 no-print transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          {/* Слева: SILKWAY TRAVEL / AI Luxury Journeys */}
          <a href="#" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#16283F] border border-[#C7A46A]/45 flex items-center justify-center text-[#C7A46A] transition-colors group-hover:border-[#C7A46A]">
              <Compass className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="font-serif-luxury text-xl sm:text-2xl font-semibold tracking-[0.14em] text-white uppercase">
                SILKWAY TRAVEL
              </div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#C7A46A]">
                AI Luxury Journeys
              </p>
            </div>
          </a>

          {/* По центру: Направления · Авторские туры · AI-консьерж · О нас */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-white/85">
            <a
              href="#destinations-section"
              className="hover:text-[#C7A46A] transition-colors tracking-wide"
            >
              {lx.navDestinations}
            </a>
            <a
              href="#curated-journeys-section"
              className="hover:text-[#C7A46A] transition-colors tracking-wide"
            >
              {lx.navCurated}
            </a>
            <a
              href="#planner-section"
              className="hover:text-[#C7A46A] transition-colors tracking-wide"
            >
              {lx.navConcierge}
            </a>
            <a
              href="#why-silkway-section"
              className="hover:text-[#C7A46A] transition-colors tracking-wide"
            >
              {lx.navAbout}
            </a>
          </nav>

          {/* Справа: Переключение RU / EN / UZ и кнопка «Создать путешествие» */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-0.5 bg-[#16283F] p-1 rounded-xl border border-[#C7A46A]/25"
              aria-label="Language switcher"
            >
              <Globe className="w-3.5 h-3.5 text-[#C7A46A] ml-2 mr-1 hidden sm:inline" />
              {(['ru', 'en', 'uz'] as const).map((code) => {
                const isSelected = lang === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleLanguageChange(code)}
                    title={LANGUAGE_LABELS[code].name}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                      isSelected
                        ? 'bg-[#C7A46A] text-[#101C2D]'
                        : 'text-white/75 hover:text-white'
                    }`}
                  >
                    {code.toUpperCase()}
                  </button>
                );
              })}
            </div>

            <a
              href="#planner-section"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl luxury-gold-btn text-xs sm:text-sm font-semibold tracking-wide"
            >
              <span>{lx.headerCta}</span>
            </a>

            {/* Мобильное меню */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="lg:hidden p-2 rounded-xl bg-[#16283F] border border-[#C7A46A]/30 text-[#C7A46A]"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Выпадающее мобильное меню для смартфонов */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#16283F] border-t border-[#C7A46A]/25 px-6 py-5 space-y-3 animate-fade-in-up">
            <div className="flex flex-col space-y-2.5 text-sm font-medium text-white">
              <a
                href="#destinations-section"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#C7A46A]"
              >
                {lx.navDestinations}
              </a>
              <a
                href="#curated-journeys-section"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#C7A46A]"
              >
                {lx.navCurated}
              </a>
              <a
                href="#planner-section"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#C7A46A]"
              >
                {lx.navConcierge}
              </a>
              <a
                href="#why-silkway-section"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#C7A46A]"
              >
                {lx.navAbout}
              </a>
            </div>
            <div className="pt-2">
              <a
                href="#planner-section"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl luxury-gold-btn text-center font-semibold text-sm block"
              >
                {lx.headerCta}
              </a>
            </div>
          </div>
        )}
      </header>

      {/* 3. HERO SECTION — ГЛАВНЫЙ ЭКРАН (РЕГИСТАН НА ЗАКАТЕ, БЕЗ ПЕРЕГРУЖЕННЫХ КАРТОЧЕК ПОВЕРХ ФОТО) */}
      <section className="relative min-h-[580px] sm:min-h-[680px] lg:min-h-[740px] flex items-center overflow-hidden no-print bg-[#101C2D]">
        <img
          src={resolveAssetUrl('/landmarks/samarkand.jpg')}
          onError={(e) => handleLandmarkImgError(e, '/landmarks/samarkand.jpg')}
          alt="Регистан, Самарканд"
          className="absolute inset-0 w-full h-full object-cover object-center hero-bg-motion img-zoom"
        />
        {/* Мягкий тёмный градиент для безупречной читаемости текста */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#101C2D]/90 via-[#101C2D]/60 to-[#101C2D]/25" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#101C2D] via-[#101C2D]/65 to-transparent" />

        <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-8 py-16 sm:py-24">
          <div className="max-w-3xl space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#101C2D]/75 border border-[#C7A46A]/45 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C7A46A]" />
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#C7A46A]">
                {lx.heroTag}
              </span>
            </div>

            <h1 className="font-serif-luxury text-4xl sm:text-6xl lg:text-7xl font-semibold text-white leading-[1.08] tracking-tight">
              {lx.heroTitle}
            </h1>

            <p className="text-base sm:text-xl text-[#F5F1E9]/90 leading-relaxed max-w-2xl font-normal">
              {lx.heroSub}
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href="#planner-section"
                className="px-7 py-4 rounded-xl luxury-gold-btn font-semibold text-sm sm:text-base inline-flex items-center gap-2.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{lx.heroPrimaryBtn}</span>
              </a>

              <a
                href="#destinations-section"
                className="px-7 py-4 rounded-xl bg-[#16283F]/80 hover:bg-[#16283F] text-white border border-[#C7A46A]/35 font-medium text-sm sm:text-base inline-flex items-center gap-2 backdrop-blur-md transition"
              >
                <span>{lx.heroSecondaryBtn}</span>
                <ArrowRight className="w-4 h-4 text-[#C7A46A]" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="gold-divider max-w-7xl mx-auto w-full" />

      {/* 6. НАПРАВЛЕНИЯ — ПРЕМИАЛЬНЫЕ ЖУРНАЛЬНЫЕ КАРТОЧКИ 4 СТОЛИЦ (САМАРКАНД, БУХАРА, ХИВА, ТАШКЕНТ) */}
      <section
        id="destinations-section"
        className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-14 no-print scroll-mt-20"
      >
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C7A46A] block">
            {lx.destinationsTag}
          </span>
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-semibold text-white leading-tight">
            {lx.destinationsTitle}
          </h2>
          <p className="text-sm sm:text-base text-white/75 leading-relaxed">
            {lx.destinationsSub}
          </p>
        </div>

        {/* 4 журнальные карточки главных городов */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SIGNATURE_CITIES.map((city) => (
            <article
              key={city.id}
              onClick={() => handleSelectSignatureCity(city)}
              className="group cursor-pointer rounded-[14px] bg-[#16283F] border border-[#C7A46A]/20 overflow-hidden card-smooth flex flex-col justify-between"
            >
              <div>
                <div className="relative h-72 overflow-hidden bg-[#101C2D]">
                  <img
                    src={resolveAssetUrl(city.image)}
                    onError={(e) => handleLandmarkImgError(e, city.image)}
                    alt={city.name[lang]}
                    className="w-full h-full object-cover img-zoom"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#16283F] via-[#16283F]/45 to-transparent" />
                  <div className="absolute top-3.5 left-3.5">
                    <span className="px-3 py-1 rounded-full text-[11px] font-medium tracking-wider uppercase bg-[#101C2D]/80 text-[#C7A46A] border border-[#C7A46A]/35 backdrop-blur-md">
                      {city.tag[lang]}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-2.5">
                  <h3 className="font-serif-luxury text-2xl font-semibold text-white group-hover:text-[#C7A46A] transition-colors">
                    {city.name[lang]}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                    {city.description[lang]}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#C7A46A]/15 flex items-center justify-between text-xs">
                <span className="text-white/60">
                  от <strong className="text-[#C7A46A]">{formatUzs(city.priceFromUzs, lang)}</strong>
                </span>
                <span className="font-semibold text-[#C7A46A] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>{lx.openDestinationLink}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Расширенная коллекция всех 8 архитектурных шедевров ЮНЕСКО */}
        <div className="pt-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-t border-[#C7A46A]/20 pt-10">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#357B91] block">
                UNESCO HERITAGE COLLECTION
              </span>
              <h3 className="font-serif-luxury text-2xl sm:text-3xl font-semibold text-white mt-1">
                {lx.allLandmarksTitle}
              </h3>
            </div>

            <div className="flex flex-wrap gap-1.5 bg-[#16283F] p-1.5 rounded-xl border border-[#C7A46A]/20">
              <button
                type="button"
                onClick={() => setCityFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  cityFilter === 'all'
                    ? 'bg-[#C7A46A] text-[#101C2D]'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                {lang === 'en' ? 'All Cities' : lang === 'uz' ? 'Barcha shaharlar' : 'Все города'}
              </button>
              {uniqueCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setCityFilter(city)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    cityFilter === city
                      ? 'bg-[#C7A46A] text-[#101C2D]'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredLandmarks.map((landmark) => (
              <div
                key={landmark.id}
                className="group bg-[#16283F] rounded-[14px] border border-[#C7A46A]/20 overflow-hidden card-smooth flex flex-col justify-between"
              >
                <div>
                  <div
                    onClick={() => setActiveModalLandmark(landmark)}
                    className="relative h-56 overflow-hidden cursor-pointer bg-[#101C2D]"
                  >
                    <img
                      src={resolveAssetUrl(landmark.image)}
                      onError={(e) => handleLandmarkImgError(e, landmark.image)}
                      alt={landmark.title[lang]}
                      className="w-full h-full object-cover img-zoom"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#16283F] via-[#16283F]/40 to-transparent" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#101C2D]/85 text-white backdrop-blur-md border border-[#C7A46A]/30">
                        <MapPin className="w-3 h-3 text-[#C7A46A]" />
                        {landmark.city[lang]}
                      </span>
                      {landmark.unesco && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#C7A46A] text-[#101C2D]">
                          UNESCO
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between text-white">
                      <h4 className="font-serif-luxury text-xl font-semibold leading-snug group-hover:text-[#C7A46A] transition-colors">
                        {landmark.title[lang]}
                      </h4>
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <p className="text-xs sm:text-sm text-white/75 leading-relaxed line-clamp-2">
                      {landmark.subtitle[lang]}
                    </p>
                    <div className="text-xs text-white/65 flex items-center gap-1.5 pt-1">
                      <Clock className="w-3.5 h-3.5 text-[#C7A46A] shrink-0" />
                      <span className="truncate">{landmark.bestTime[lang]}</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-[#101C2D]/50 border-t border-[#C7A46A]/15 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-white/50 block">
                      Индивидуальный тур от
                    </span>
                    <span className="text-sm font-semibold text-[#C7A46A]">
                      {formatUzs(landmark.priceFromUzs, lang)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectLandmarkRoute(landmark)}
                    className="px-3.5 py-2 rounded-xl luxury-gold-btn text-xs font-semibold flex items-center gap-1.5 shrink-0"
                  >
                    <span>{lx.openDestinationLink}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. СВЕТЛАЯ ЖУРНАЛЬНАЯ СЕКЦИЯ WARM IVORY (#F5F1E9): «ПУТЕШЕСТВИЯ, СОЗДАННЫЕ ВОКРУГ ВАС» & «ОТКРОЙТЕ НАСТОЯЩИЙ УЗБЕКИСТАН» */}
      <section
        id="curated-journeys-section"
        className="luxury-ivory-section py-16 sm:py-24 px-4 sm:px-8 border-y border-[#C7A46A]/35 no-print scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#357B91] block">
                {lx.ivoryTag}
              </span>
              <h2 className="font-serif-luxury text-3xl sm:text-5xl font-semibold text-[#101C2D] leading-tight">
                {lx.ivoryTitle}
              </h2>
              <p className="text-sm sm:text-base text-[#101C2D]/80 leading-relaxed">
                {lx.ivorySub}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                <div className="p-4 rounded-xl bg-white border border-[#C7A46A]/35 shadow-sm">
                  <Train className="w-5 h-5 text-[#357B91] mb-2" />
                  <div className="font-serif-luxury text-lg font-semibold text-[#101C2D]">
                    Afrosiyob VIP
                  </div>
                  <p className="text-xs text-[#101C2D]/70 mt-1">
                    Скоростные переезды Ташкент — Самарканд — Бухара в купе первого и бизнес-класса.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#C7A46A]/35 shadow-sm">
                  <Hotel className="w-5 h-5 text-[#C7A46A] mb-2" />
                  <div className="font-serif-luxury text-lg font-semibold text-[#101C2D]">
                    Heritage Boutique
                  </div>
                  <p className="text-xs text-[#101C2D]/70 mt-1">
                    Отели 5* и исторические резиденции с авторскими завтраками и регистрацией E-Mehmon.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#C7A46A]/35 shadow-sm">
                  <Wallet className="w-5 h-5 text-[#357B91] mb-2" />
                  <div className="font-serif-luxury text-lg font-semibold text-[#101C2D]">
                    100% UZS
                  </div>
                  <p className="text-xs text-[#101C2D]/70 mt-1">
                    Прозрачное ценообразование в узбекских сумах с мгновенной оплатой Payme, Click и Uzum.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-[14px] overflow-hidden h-64 shadow-lg border border-[#C7A46A]/30">
                  <img
                    src={resolveAssetUrl('/landmarks/shahizinda.jpg')}
                    onError={(e) => handleLandmarkImgError(e, '/landmarks/shahizinda.jpg')}
                    alt="Шахи-Зинда"
                    className="w-full h-full object-cover img-zoom"
                  />
                </div>
                <div className="p-5 rounded-[14px] bg-[#101C2D] text-white space-y-1.5">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#C7A46A]">
                    PRIVATE ACCESS
                  </div>
                  <div className="font-serif-luxury text-xl font-semibold">
                    {lx.discoverTitle}
                  </div>
                  <p className="text-xs text-white/75 leading-relaxed">{lx.discoverSub}</p>
                </div>
              </div>
              <div className="space-y-4 pt-6">
                <div className="p-5 rounded-[14px] bg-white border border-[#C7A46A]/35 text-[#101C2D] space-y-1.5 shadow-sm">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#357B91]">
                    CURATED BY AI & EXPERTS
                  </div>
                  <div className="font-serif-luxury text-xl font-semibold">
                    Индивидуальный ритм
                  </div>
                  <p className="text-xs text-[#101C2D]/75 leading-relaxed">
                    Персональные гиды-искусствоведы, приватные трансферы и круглосуточное сопровождение.
                  </p>
                </div>
                <div className="rounded-[14px] overflow-hidden h-64 shadow-lg border border-[#C7A46A]/30">
                  <img
                    src={resolveAssetUrl('/landmarks/gureamir.jpg')}
                    onError={(e) => handleLandmarkImgError(e, '/landmarks/gureamir.jpg')}
                    alt="Гур-Эмир"
                    className="w-full h-full object-cover img-zoom"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. AI TRAVEL CONCIERGE — ПЕРСОНАЛЬНЫЙ КОНСЬЕРЖ И ПРОЕКТИРОВАНИЕ МАРШРУТА */}
      <main
        id="planner-section"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-20 scroll-mt-20"
      >
        <div className="space-y-10">
          <div className="max-w-3xl space-y-3 no-print">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#C7A46A]">
              <Sparkles className="w-3.5 h-3.5 text-[#C7A46A]" />
              {lx.conciergeTag}
            </span>
            <h2 className="font-serif-luxury text-3xl sm:text-5xl font-semibold text-white leading-tight">
              {lx.conciergeTitle}
            </h2>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              {lx.conciergeSub}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Левая колонка: Интерактивный блок персонального консьержа и бронирования */}
            <div className="lg:col-span-5 space-y-8 no-print">
              <div className="bg-[#16283F] rounded-[16px] shadow-2xl border border-[#C7A46A]/25 p-6 sm:p-8 card-smooth">
                <form onSubmit={handleGenerateItinerary} className="space-y-5">
                  {/* 1. Город отправления и Дата путешествия */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-[#F5F1E9]/80 mb-1.5">
                        {lx.departureCityLabel}
                      </label>
                      <select
                        value={departureCity}
                        onChange={(e) => setDepartureCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/30 text-sm text-white focus:outline-none focus:border-[#C7A46A]"
                      >
                        <option value="Ташкент">Ташкент (TAS)</option>
                        <option value="Самарканд">Самарканд (SKD)</option>
                        <option value="Бухара">Бухара (BHK)</option>
                        <option value="Международный рейс">Международный вылет</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-[#F5F1E9]/80 mb-1.5">
                        {lx.travelDateLabel}
                      </label>
                      <input
                        type="date"
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/30 text-sm text-white focus:outline-none focus:border-[#C7A46A]"
                      />
                    </div>
                  </div>

                  {/* 2. Направления */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#F5F1E9]/80 mb-1.5">
                      {t.destinationLabel}
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-[#C7A46A] absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder={t.destinationPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/30 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#C7A46A] transition"
                        required
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {t.presets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDestination(preset)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            destination === preset
                              ? 'bg-[#C7A46A]/20 border-[#C7A46A] text-[#C7A46A] font-semibold'
                              : 'bg-[#101C2D] border-white/15 text-white/75 hover:border-[#C7A46A]/50 hover:text-white'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Длительность и количество путешественников */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-[#F5F1E9]/80 mb-1">
                        {t.daysLabel}
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-[#C7A46A] absolute left-3 top-2.5" />
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={durationDays}
                          onChange={(e) => setDurationDays(Number(e.target.value))}
                          className="w-full pl-9 pr-2 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/30 text-sm font-semibold text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-[#F5F1E9]/80 mb-1">
                        {t.adultsLabel}
                      </label>
                      <div className="relative">
                        <Users className="w-4 h-4 text-[#C7A46A] absolute left-3 top-2.5" />
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={adults}
                          onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))}
                          className="w-full pl-9 pr-2 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/30 text-sm font-semibold text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-[#F5F1E9]/80 mb-1">
                        {t.childrenLabel}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={children}
                        onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-xl bg-[#101C2D] border border-[#C7A46A]/30 text-sm font-semibold text-white"
                      />
                    </div>
                  </div>

                  {/* 4. Бюджет в UZS */}
                  <div className="p-4 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-[#F5F1E9]/90 flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-[#C7A46A]" />
                        {t.budgetLabel}
                      </label>
                      <span className="text-base font-bold text-[#C7A46A]">
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
                      className="w-full accent-[#C7A46A] cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-white/55 mt-1">
                      <span>{formatUzs(1500000, lang)}</span>
                      <span>{formatUzs(12000000, lang)}</span>
                      <span>{formatUzs(30000000, lang)}</span>
                    </div>
                  </div>

                  {/* 5. Стиль путешествия */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#F5F1E9]/80 mb-2">
                      {lx.travelStyleLabel}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {t.interests.map((interest) => {
                        const active = selectedInterests.includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => toggleInterest(interest)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                              active
                                ? 'bg-[#C7A46A] text-[#101C2D] border-[#C7A46A] font-semibold'
                                : 'bg-[#101C2D] text-white/75 border-white/15 hover:border-[#C7A46A]/50 hover:text-white'
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
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#F5F1E9]/80 mb-1.5">
                      {t.specialRequestsLabel}
                    </label>
                    <div className="relative">
                      <Train className="w-4 h-4 text-[#C7A46A] absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder={t.specialRequestsPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/30 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#C7A46A]"
                      />
                    </div>
                  </div>

                  {generateError && (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{generateError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full py-4 px-5 rounded-xl luxury-gold-btn font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{t.generatingBtn}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>{lx.conciergeSubmitBtn}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Блок мгновенного бронирования в UZS */}
              <div className="bg-[#16283F] rounded-[16px] shadow-2xl border border-[#C7A46A]/25 p-6 sm:p-8 card-smooth">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif-luxury text-2xl font-semibold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#C7A46A]" />
                    {t.bookingTitle}
                  </h3>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C7A46A] bg-[#C7A46A]/15 px-3 py-1 rounded-full border border-[#C7A46A]/35">
                    UZS Guaranteed
                  </span>
                </div>

                <form onSubmit={handleCreateBooking} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      {t.travelerNameLabel}
                    </label>
                    <input
                      type="text"
                      value={travelerName}
                      onChange={(e) => setTravelerName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/30 text-sm text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-white/80 mb-1">
                        {t.travelerPhoneLabel}
                      </label>
                      <input
                        type="text"
                        value={travelerPhone}
                        onChange={(e) => setTravelerPhone(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/30 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/80 mb-1">
                        {t.travelerEmailLabel}
                      </label>
                      <input
                        type="email"
                        value={travelerEmail}
                        onChange={(e) => setTravelerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/30 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1.5">
                      {t.paymentProviderLabel}
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(
                        [
                          { id: 'payme', label: 'Payme', sub: 'QR · Uzcard · Humo' },
                          { id: 'click', label: 'Click', sub: 'QR · Быстрая оплата' },
                          { id: 'uzum', label: 'Uzum Pay', sub: 'Мгновенно · 0%' },
                        ] as const
                      ).map((gw) => (
                        <button
                          key={gw.id}
                          type="button"
                          onClick={() => setSelectedProvider(gw.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            selectedProvider === gw.id
                              ? 'border-[#C7A46A] bg-[#C7A46A]/15 ring-1 ring-[#C7A46A]/40'
                              : 'bg-[#101C2D] border-white/15 hover:border-[#C7A46A]/40'
                          }`}
                        >
                          <div className="text-sm font-bold text-white">{gw.label}</div>
                          <div className="text-[10px] text-white/65">{gw.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 flex items-center justify-between">
                    <span className="text-xs text-white/80 font-medium">{t.totalToPayLabel}</span>
                    <span className="text-base font-bold text-[#C7A46A]">
                      {formatUzs(currentPlan.estimated_total_cost_uzs, lang)}
                    </span>
                  </div>

                  {bookingError && (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200">
                      {bookingError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isBookingLoading}
                    className="w-full py-3.5 px-4 rounded-xl luxury-silk-btn font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#C7A46A]" />
                    <span>
                      {isBookingLoading
                        ? t.payingStatus
                        : `${t.payButtonPrefix} ${selectedProvider.toUpperCase()} ${t.payButtonSuffix}`}
                    </span>
                  </button>
                </form>

                <div className="mt-4 pt-3 border-t border-[#C7A46A]/20 text-xs text-[#C7A46A] flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-[#C7A46A] shrink-0" />
                  <span className="font-medium">{t.directorFixedNotice}</span>
                </div>
              </div>
            </div>

            {/* Правая колонка: Персональная программа путешествия (с поддержкой Skeleton Loading) */}
            <div className="lg:col-span-7 space-y-6">
              {confirmedBooking && (
                <div className="bg-[#16283F] text-white rounded-[16px] p-6 sm:p-8 shadow-2xl border border-[#C7A46A] animate-fade-in-up">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#C7A46A]/25 pb-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-400/40">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {t.voucherPaidBadge} ({confirmedBooking.transaction?.provider.toUpperCase()})
                      </div>
                      <h3 className="font-serif-luxury text-2xl font-semibold text-white">
                        {t.voucherTitle}
                      </h3>
                      <p className="text-xs text-white/70 mt-0.5">
                        Booking Ref: <span className="font-mono">{confirmedBooking.id}</span> · Tx:{' '}
                        <span className="font-mono">
                          {confirmedBooking.transaction?.provider_tx_id}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="no-print inline-flex items-center gap-1.5 px-4 py-2 rounded-xl luxury-gold-btn text-xs font-semibold"
                    >
                      <Printer className="w-4 h-4" />
                      {t.printVoucherBtn}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 text-sm">
                    <div className="bg-[#101C2D] rounded-xl p-3.5 border border-[#C7A46A]/20">
                      <div className="text-xs text-white/60">{t.voucherTraveler}</div>
                      <div className="font-semibold mt-0.5 text-white">
                        {confirmedBooking.user_full_name}
                      </div>
                      <div className="text-xs text-[#C7A46A]">{confirmedBooking.user_phone}</div>
                    </div>
                    <div className="bg-[#101C2D] rounded-xl p-3.5 border border-[#C7A46A]/20">
                      <div className="text-xs text-white/60">{t.voucherRoute}</div>
                      <div className="font-semibold mt-0.5 text-white">{currentPlan.trip_title}</div>
                      <div className="text-xs text-[#C7A46A]">
                        {currentPlan.daily_itinerary.length} {t.daysUnit}
                      </div>
                    </div>
                    <div className="bg-[#101C2D] rounded-xl p-3.5 border border-[#C7A46A]/20">
                      <div className="text-xs text-white/60">{t.voucherPaidAmount}</div>
                      <div className="text-lg font-bold text-[#C7A46A] mt-0.5">
                        {formatUzs(confirmedBooking.total_amount_uzs, lang)}
                      </div>
                      <div className="text-[11px] text-emerald-300">
                        {t.voucherAccuracyVerified}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3.5 rounded-xl bg-[#101C2D] border border-[#C7A46A]/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <PhoneCall className="w-4 h-4 text-[#C7A46A] shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-[#F5F1E9]">
                        {t.directorFixedNotice}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[#C7A46A] hidden sm:inline">
                      OFFICIAL VOUCHER
                    </span>
                  </div>
                </div>
              )}

              {/* Skeleton Loading во время генерации маршрута */}
              {isGenerating ? (
                <div className="bg-[#16283F] rounded-[16px] border border-[#C7A46A]/25 p-8 space-y-6 animate-pulse">
                  <div className="h-7 w-1/3 bg-[#101C2D] rounded-lg" />
                  <div className="h-10 w-3/4 bg-[#101C2D] rounded-lg" />
                  <div className="h-20 w-full bg-[#101C2D] rounded-xl" />
                  <div className="space-y-4 pt-4">
                    <div className="h-44 w-full bg-[#101C2D] rounded-xl" />
                    <div className="h-44 w-full bg-[#101C2D] rounded-xl" />
                  </div>
                </div>
              ) : (
                <div className="bg-[#16283F] rounded-[16px] shadow-2xl border border-[#C7A46A]/25 overflow-hidden">
                  {/* Заголовок маршрута с атмосферной фотографией */}
                  <div className="relative bg-[#101C2D] text-white p-6 sm:p-8 overflow-hidden border-b border-[#C7A46A]/25">
                    <img
                      src={resolveAssetUrl(getLocationPhotoByText(currentPlan.trip_title, 1))}
                      onError={(e) =>
                        handleLandmarkImgError(
                          e,
                          getLocationPhotoByText(currentPlan.trip_title, 1)
                        )
                      }
                      alt={currentPlan.trip_title}
                      className="absolute inset-0 w-full h-full object-cover opacity-45 img-zoom pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#101C2D] via-[#101C2D]/70 to-[#101C2D]/35 pointer-events-none" />
                    <div className="relative z-10 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#101C2D]/85 text-[#C7A46A] border border-[#C7A46A]/40 backdrop-blur-md">
                            ✓ Afrosiyob · Boutique 4*–5* · ЮНЕСКО
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#357B91]/30 text-white border border-[#357B91]/60 backdrop-blur-md">
                            {currentPlan.daily_itinerary.length} {t.daysUnit}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-[#C7A46A] bg-[#101C2D]/85 px-3 py-1 rounded-full border border-[#C7A46A]/30">
                          UZS · Официальный расчёт
                        </span>
                      </div>

                      <h2 className="font-serif-luxury text-3xl sm:text-4xl font-semibold text-white leading-tight">
                        {currentPlan.trip_title}
                      </h2>
                      <p className="text-sm text-[#F5F1E9]/85 leading-relaxed">
                        {currentPlan.summary}
                      </p>

                      <div className="pt-4 border-t border-[#C7A46A]/25 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-[#C7A46A]">
                            {t.estimatedTotalTitle}
                          </div>
                          <div className="text-2xl sm:text-3xl font-bold text-white mt-0.5">
                            {formatUzs(currentPlan.estimated_total_cost_uzs, lang)}
                          </div>
                        </div>

                        <div className="bg-[#101C2D]/85 backdrop-blur-md rounded-xl p-3.5 border border-[#C7A46A]/25">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-white/80">{t.budgetUsageLabel}</span>
                            <span className="font-semibold text-[#C7A46A]">{budgetUsagePercent}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-[#C7A46A] rounded-full transition-all duration-700"
                              style={{ width: `${budgetUsagePercent}%` }}
                            />
                          </div>
                          <div className="text-[11px] text-white/60 mt-1">
                            {t.yourLimitLabel} {formatUzs(budgetUzs, lang)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Программа по дням */}
                  <div className="p-6 sm:p-8 space-y-6">
                    <h3 className="font-serif-luxury text-2xl font-semibold text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#C7A46A]" />
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
                            className="group rounded-[14px] border border-[#C7A46A]/20 bg-[#101C2D] overflow-hidden card-smooth"
                          >
                            <div className="relative h-48 sm:h-56 overflow-hidden bg-[#101C2D]">
                              <img
                                src={resolveAssetUrl(dayPhoto)}
                                onError={(e) => handleLandmarkImgError(e, dayPhoto)}
                                alt={day.location}
                                className="w-full h-full object-cover img-zoom"
                              />
                              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#101C2D] via-[#101C2D]/50 to-transparent" />

                              <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-2 text-white">
                                <div className="flex items-center gap-3.5">
                                  <span className="w-10 h-10 rounded-xl luxury-gold-btn font-serif-luxury font-bold text-lg flex items-center justify-center">
                                    {day.day_number}
                                  </span>
                                  <div>
                                    <div className="font-serif-luxury text-xl sm:text-2xl font-semibold text-white">
                                      {t.dayWord} {day.day_number}: {day.location}
                                    </div>
                                    <div className="text-xs text-white/75">{t.daySubtext}</div>
                                  </div>
                                </div>
                                <div className="bg-[#16283F]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#C7A46A]/35 text-right">
                                  <span className="text-[10px] text-white/65 block">
                                    {t.dayTotalLabel}
                                  </span>
                                  <span className="text-sm font-bold text-[#C7A46A]">
                                    {formatUzs(dayTotalUzs, lang)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              <div className="bg-[#16283F] p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between text-xs font-semibold text-[#C7A46A] mb-1.5">
                                    <span className="flex items-center gap-1.5">
                                      <Sun className="w-4 h-4 text-[#C7A46A]" />
                                      {t.morningLabel}
                                    </span>
                                    <span className="font-semibold text-white">
                                      {formatUzs(day.morning.cost_uzs, lang)}
                                    </span>
                                  </div>
                                  <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                                    {day.morning.activity}
                                  </p>
                                </div>
                              </div>

                              <div className="bg-[#16283F] p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between text-xs font-semibold text-[#C7A46A] mb-1.5">
                                    <span className="flex items-center gap-1.5">
                                      <Sunset className="w-4 h-4 text-[#C7A46A]" />
                                      {t.afternoonLabel}
                                    </span>
                                    <span className="font-semibold text-white">
                                      {formatUzs(day.afternoon.cost_uzs, lang)}
                                    </span>
                                  </div>
                                  <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                                    {day.afternoon.activity}
                                  </p>
                                </div>
                              </div>

                              <div className="bg-[#16283F] p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between text-xs font-semibold text-[#C7A46A] mb-1.5">
                                    <span className="flex items-center gap-1.5">
                                      <Moon className="w-4 h-4 text-[#C7A46A]" />
                                      {t.eveningLabel}
                                    </span>
                                    <span className="font-semibold text-white">
                                      {formatUzs(day.evening.cost_uzs, lang)}
                                    </span>
                                  </div>
                                  <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                                    {day.evening.activity}
                                  </p>
                                </div>
                              </div>

                              <div className="bg-[#16283F] p-4 rounded-xl border border-[#C7A46A]/35 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between text-xs font-semibold text-[#C7A46A] mb-1.5">
                                    <span className="flex items-center gap-1.5">
                                      <Hotel className="w-4 h-4 text-[#C7A46A]" />
                                      {t.hotelLabel}
                                    </span>
                                    <span className="font-bold text-[#C7A46A]">
                                      {formatUzs(day.accommodation.cost_uzs, lang)}
                                    </span>
                                  </div>
                                  <p className="text-xs sm:text-sm font-semibold text-white">
                                    {day.accommodation.name}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Рекомендации консьержа */}
                    <div className="rounded-xl bg-[#101C2D] border border-[#C7A46A]/25 p-5">
                      <h4 className="text-sm font-semibold text-[#C7A46A] flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-[#C7A46A]" />
                        {t.localTipsTitle}
                      </h4>
                      <ul className="space-y-2 text-xs sm:text-sm text-white/85">
                        {currentPlan.local_tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-[#C7A46A]">✦</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl bg-[#101C2D] text-white border border-[#C7A46A]/35 p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <PhoneCall className="w-4 h-4 text-[#C7A46A] shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-[#F5F1E9]">
                          {t.directorFixedNotice}
                        </span>
                      </div>
                      <span className="text-xs text-[#C7A46A] uppercase tracking-widest">
                        SilkWay Private Concierge
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="gold-divider" />

        {/* 8. РАЗДЕЛЫ ДОВЕРИЯ И КОНВЕРСИИ: «ПОЧЕМУ SILKWAY TRAVEL AI» & «ОТЗЫВЫ ПУТЕШЕСТВЕННИКОВ» */}
        <section id="why-silkway-section" className="space-y-14 no-print scroll-mt-20">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C7A46A] block">
              {lx.whyTag}
            </span>
            <h2 className="font-serif-luxury text-3xl sm:text-5xl font-semibold text-white leading-tight">
              {lx.whyTitle}
            </h2>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              {lx.whySub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-[14px] bg-[#16283F] border border-[#C7A46A]/20 space-y-3 card-smooth">
              <div className="w-10 h-10 rounded-xl bg-[#101C2D] border border-[#C7A46A]/35 flex items-center justify-center text-[#C7A46A]">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-serif-luxury text-xl font-semibold text-white">
                Персональная архитектура маршрутов
              </h3>
              <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                Каждый маршрут проектируется под ваш темп, интересы и бюджет в узбекских сумах (UZS) с точностью до каждого трансфера.
              </p>
            </div>

            <div className="p-6 rounded-[14px] bg-[#16283F] border border-[#C7A46A]/20 space-y-3 card-smooth">
              <div className="w-10 h-10 rounded-xl bg-[#101C2D] border border-[#C7A46A]/35 flex items-center justify-center text-[#C7A46A]">
                <Train className="w-5 h-5" />
              </div>
              <h3 className="font-serif-luxury text-xl font-semibold text-white">
                Логистика скоростных поездов Afrosiyob
              </h3>
              <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                Синхронизация расписания высокоскоростных поездов Talgo 250 между Ташкентом, Самаркандом и Бухарой с индивидуальными автомобилями.
              </p>
            </div>

            <div className="p-6 rounded-[14px] bg-[#16283F] border border-[#C7A46A]/20 space-y-3 card-smooth">
              <div className="w-10 h-10 rounded-xl bg-[#101C2D] border border-[#C7A46A]/35 flex items-center justify-center text-[#C7A46A]">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-serif-luxury text-xl font-semibold text-white">
                Экспертиза наследия ЮНЕСКО
              </h3>
              <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                Лицензированные историки и искусствоведы в Ичан-Кале, Пои-Каляне, Регистане и ансамбле Шахи-Зинда без суеты туристических групп.
              </p>
            </div>

            <div className="p-6 rounded-[14px] bg-[#16283F] border border-[#C7A46A]/20 space-y-3 card-smooth">
              <div className="w-10 h-10 rounded-xl bg-[#101C2D] border border-[#C7A46A]/35 flex items-center justify-center text-[#357B91]">
                <ShieldCheck className="w-5 h-5 text-[#C7A46A]" />
              </div>
              <h3 className="font-serif-luxury text-xl font-semibold text-white">
                Автономный AI-Консьерж 24/7
              </h3>
              <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                Мгновенные ответы по базе знаний, расчёт сметы, электронная регистрация E-Mehmon и прямая поддержка дирекции.
              </p>
            </div>
          </div>

          {/* Секция «Отзывы путешественников» (с явной маркировкой демонстрационных сценариев) */}
          <div className="pt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C7A46A] block">
                  {lx.reviewsTag}
                </span>
                <h3 className="font-serif-luxury text-2xl sm:text-4xl font-semibold text-white mt-1">
                  {lx.reviewsTitle}
                </h3>
              </div>
              <span className="text-xs text-white/55 italic max-w-md">
                {lx.reviewsDisclaimer}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  scenario: 'Сценарий: Семейное путешествие (4 дня)',
                  route: 'Ташкент — Самарканд — Бухара',
                  quote:
                    '«Идеальный баланс между утренними экскурсиями по Регистану до приезда основных групп и отдыхом в бутик-отеле с видом на купола Бухары. Все билеты на Afrosiyob и расчёт в сумах были подготовлены заранее.»',
                  format: 'Демонстрационный кейс · VIP Afrosiyob & Boutique 4*',
                },
                {
                  scenario: 'Сценарий: Авторский гастро- и арт-тур (6 дней)',
                  route: 'Самарканд — Бухара — Хива',
                  quote:
                    '«Знакомство с мастерами шелковой бумаги в Конигиле, закрытая дегустация самаркандского плова и закат на бастионе Ак-Шейх-Бобо в Хиве. Маршрут собран консьержем с учётом каждой детали.»',
                  format: 'Демонстрационный кейс · Частные гиды ЮНЕСКО',
                },
                {
                  scenario: 'Сценарий: Уикенд высокого класса (2 дня)',
                  route: 'Самарканд Экспресс',
                  quote:
                    '«Выезд утренним рейсом Afrosiyob, индивидуальный трансфер, вечерняя световая панорама Регистана и мгновенное оформление ваучера через Payme в узбекских сумах без скрытых комиссий.»',
                  format: 'Демонстрационный кейс · Express Weekend UZS',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-[14px] bg-[#16283F] border border-[#C7A46A]/20 flex flex-col justify-between space-y-4 card-smooth"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#C7A46A]">
                      <span className="font-semibold">{item.route}</span>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#101C2D] border border-[#C7A46A]/30">
                        Demo Scenario
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-white/85 leading-relaxed italic">
                      {item.quote}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/10 text-xs">
                    <div className="font-semibold text-white">{item.scenario}</div>
                    <div className="text-white/55 text-[11px]">{item.format}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="gold-divider" />

        {/* «ВАШ ПЕРСОНАЛЬНЫЙ AI-КОНСЬЕРЖ» (МОДУЛЬ AI SUPPORT AGENT & TRAVEL AGENCY COPILOT) */}
        <AiSupportAgentSuite lang={lang} directorNotice={t.directorFixedNotice} />
      </main>

      {/* Модальное окно полноэкранного просмотра достопримечательности */}
      {activeModalLandmark && (
        <div
          className="fixed inset-0 z-50 bg-[#101C2D]/90 backdrop-blur-md flex items-center justify-center p-4 no-print animate-fade-in-up"
          onClick={() => setActiveModalLandmark(null)}
        >
          <div
            className="bg-[#16283F] rounded-[16px] max-w-2xl w-full overflow-hidden shadow-2xl border border-[#C7A46A]/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-72 sm:h-80 bg-[#101C2D]">
              <img
                src={resolveAssetUrl(activeModalLandmark.image)}
                onError={(e) => handleLandmarkImgError(e, activeModalLandmark.image)}
                alt={activeModalLandmark.title[lang]}
                className="w-full h-full object-cover img-zoom"
              />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#16283F] via-[#16283F]/45 to-transparent" />
              <button
                type="button"
                onClick={() => setActiveModalLandmark(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#101C2D]/85 hover:bg-[#101C2D] text-[#C7A46A] border border-[#C7A46A]/40 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <div className="flex items-center gap-2 text-xs text-[#C7A46A] font-semibold mb-1">
                  <MapPin className="w-4 h-4 text-[#C7A46A]" />
                  <span>{activeModalLandmark.city[lang]}</span>
                  <span>·</span>
                  <Star className="w-4 h-4 fill-[#C7A46A] text-[#C7A46A]" />
                  <span>{activeModalLandmark.rating}</span>
                </div>
                <h3 className="font-serif-luxury text-3xl font-semibold text-white">
                  {activeModalLandmark.title[lang]}
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-white/85 leading-relaxed">
                {activeModalLandmark.subtitle[lang]}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#101C2D] p-4 rounded-xl border border-[#C7A46A]/25 text-xs">
                <div>
                  <span className="text-white/55 block">Лучшее время для визита:</span>
                  <span className="font-semibold text-white mt-0.5 block">
                    {activeModalLandmark.bestTime[lang]}
                  </span>
                </div>
                <div>
                  <span className="text-white/55 block">Особенность архитектуры:</span>
                  <span className="font-semibold text-white mt-0.5 block">
                    {activeModalLandmark.highlight[lang]}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div>
                  <span className="text-xs text-white/55 block">Индивидуальная программа от</span>
                  <span className="text-xl font-bold text-[#C7A46A]">
                    {formatUzs(activeModalLandmark.priceFromUzs, lang)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectLandmarkRoute(activeModalLandmark)}
                  className="px-6 py-3 rounded-xl luxury-gold-btn font-semibold text-sm flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{lx.openDestinationLink}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Элегантный премиальный футер */}
      <footer className="bg-[#0B1420] border-t border-[#C7A46A]/25 py-10 px-4 sm:px-8 mt-12 no-print text-white/75">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs">
          <div className="space-y-1">
            <div className="font-serif-luxury text-lg font-semibold tracking-[0.14em] text-white uppercase">
              SILKWAY TRAVEL <span className="text-[#C7A46A]">AI</span>
            </div>
            <p className="text-white/60">{t.footerCurrencyNote}</p>
          </div>
          <div className="font-medium text-[#C7A46A] flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-[#C7A46A]" />
            <span>{t.directorFixedNotice}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
