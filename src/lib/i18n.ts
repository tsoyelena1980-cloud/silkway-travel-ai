import { AppLanguage, GenerateItineraryResponse } from './types';

export const LANGUAGE_LABELS: Record<
  AppLanguage,
  { code: string; name: string; flag: string }
> = {
  ru: { code: 'RU', name: 'Русский', flag: '🇷🇺' },
  uz: { code: 'UZ', name: 'Oʻzbekcha', flag: '🇺🇿' },
  en: { code: 'EN', name: 'English', flag: '🇬🇧' },
};

export const INITIAL_ITINERARIES_BY_LANG: Record<AppLanguage, GenerateItineraryResponse> = {
  ru: {
    success: true,
    meta: {
      model_used: 'gemini-3.8',
      fallback_triggered: false,
      sanitized: true,
      execution_ms: 420,
      language: 'ru',
    },
    data: {
      itinerary_id: '8f3b6c20-68a8-4c3e-8c33-d8cfecf1aa30',
      trip_title: 'Классическое путешествие: Самарканд и Бухара',
      summary:
        'Трехдневный исторический и гастрономический маршрут для 2 путешественников с проездом на скоростном поезде Afrosiyob.',
      estimated_total_cost_uzs: 7650000,
      daily_itinerary: [
        {
          day_number: 1,
          location: 'Самарканд',
          morning: {
            activity:
              'Прибытие на поезде Afrosiyob и индивидуальная экскурсия по площади Регистан (медресе Улугбека, Шердор и Тилля-Кари)',
            cost_uzs: 400000,
          },
          afternoon: {
            activity: 'Обед в центре самаркандского плова «Зигир Ош» и осмотр мавзолея Гур-Эмир',
            cost_uzs: 500000,
          },
          evening: {
            activity:
              'Вечерняя фотосессия и прогулка по туристической деревне «Вечный город» (Silk Road Samarkand)',
            cost_uzs: 350000,
          },
          accommodation: {
            name: 'Miran International Hotel Samarkand 4*',
            cost_uzs: 1300000,
          },
        },
        {
          day_number: 2,
          location: 'Самарканд — Бухара',
          morning: {
            activity:
              'Посещение некрополя Шахи-Зинда, соборной мечети Биби-Ханым и Сиабского базара',
            cost_uzs: 380000,
          },
          afternoon: {
            activity:
              'Экскурсия в обсерваторию Улугбека, бумажную мастерскую «Конигил» и переезд на Afrosiyob в Бухару',
            cost_uzs: 620000,
          },
          evening: {
            activity:
              'Ужин у ансамбля Ляби-Хауз с дегустацией бухарских блюд и травяного чая',
            cost_uzs: 400000,
          },
          accommodation: {
            name: 'Mercure Bukhara Old Town 4*',
            cost_uzs: 1450000,
          },
        },
        {
          day_number: 3,
          location: 'Бухара',
          morning: {
            activity:
              'Экскурсия по цитадели Арк, комплексу Пои-Калян (минарет Калян, медресе Мири-Араб)',
            cost_uzs: 420000,
          },
          afternoon: {
            activity:
              'Обед с бухарским пловом «Оши-Софи» и прогулка по средневековым Торговым куполам',
            cost_uzs: 480000,
          },
          evening: {
            activity:
              'Фольклорное шоу в медресе Нодир Диван-Беги и трансфер на вокзал (поезд Afrosiyob)',
            cost_uzs: 1350000,
          },
          accommodation: {
            name: 'Boutique Hotel Minzifa (поздний выезд / дневной пакет)',
            cost_uzs: 0,
          },
        },
      ],
      local_tips: [
        'Билеты на скоростной поезд Afrosiyob приобретайте минимум за 15–20 дней до отправления.',
        'Для входа в действующие мечети и мавзолеи необходима закрытая одежда (прикрытые плечи и колени).',
        'Все цены рассчитаны строго в узбекских сумах (UZS) без скрытых валютных комиссий.',
      ],
      support: {
        director: 'Цой Елена',
        phone: '+998 777-77-77',
      },
    },
  },
  uz: {
    success: true,
    meta: {
      model_used: 'gemini-3.8',
      fallback_triggered: false,
      sanitized: true,
      execution_ms: 410,
      language: 'uz',
    },
    data: {
      itinerary_id: '8f3b6c20-68a8-4c3e-8c33-d8cfecf1aa30',
      trip_title: 'Klassik sayohat: Samarqand va Buxoro',
      summary:
        'Afrosiyob tezyurar poyezdida harakatlanish bilan 2 nafar sayohatchi uchun 3 kunlik tarixiy va gastronomik yoʻnalish.',
      estimated_total_cost_uzs: 7650000,
      daily_itinerary: [
        {
          day_number: 1,
          location: 'Samarqand',
          morning: {
            activity:
              'Afrosiyob poyezdida yetib kelish va Registon maydoni (Ulugʻbek, Sherdor va Tillakori madrasalari) boʻylab individual ekskursiya',
            cost_uzs: 400000,
          },
          afternoon: {
            activity:
              'Samarqand osh markazida «Zigʻir osh» tushligi va Goʻri Amir maqbarasini ziyorat qilish',
            cost_uzs: 500000,
          },
          evening: {
            activity:
              '«Boqiy shahar» (Silk Road Samarkand) turistik majmuasida kechki fotosessiya va sayr',
            cost_uzs: 350000,
          },
          accommodation: {
            name: 'Miran International Hotel Samarkand 4*',
            cost_uzs: 1300000,
          },
        },
        {
          day_number: 2,
          location: 'Samarqand — Buxoro',
          morning: {
            activity:
              'Shohi Zinda majmuasi, Bibixonim jome masjidi va Siyob bozoriga tashrif',
            cost_uzs: 380000,
          },
          afternoon: {
            activity:
              'Ulugʻbek rasadxonasi, «Konigil Meros» qogʻoz ustaxonasi va Afrosiyob poyezdida Buxoroga joʻnab ketish',
            cost_uzs: 620000,
          },
          evening: {
            activity:
              'Labi Hovuz majmuasida Buxoro milliy taomlari va giyohli choy bilan kechki ovqat',
            cost_uzs: 400000,
          },
          accommodation: {
            name: 'Mercure Bukhara Old Town 4*',
            cost_uzs: 1450000,
          },
        },
        {
          day_number: 3,
          location: 'Buxoro',
          morning: {
            activity:
              'Ark qoʻrgʻoni va Poi Kalon majmuasi (Minorai Kalon, Mir Arab madrasasi) boʻylab ekskursiya',
            cost_uzs: 420000,
          },
          afternoon: {
            activity:
              'Buxorocha «Oshi Sofi» palovi bilan tushlik va qadimiy Savdo gumbazlari boʻylab sayr',
            cost_uzs: 480000,
          },
          evening: {
            activity:
              'Nodir Devonbegi madrasasida folklor shou va vokzalga transfer (Afrosiyob poyezdi)',
            cost_uzs: 1350000,
          },
          accommodation: {
            name: 'Boutique Hotel Minzifa (kechki chiqish / kunduzgi paket)',
            cost_uzs: 0,
          },
        },
      ],
      local_tips: [
        'Afrosiyob tezyurar poyezdi chiptalarini joʻnashdan kamida 15–20 kun oldin xarid qiling.',
        'Masjid va maqbaralarga kirishda yelkalar va tizzalarni yopuvchi kiyim kiyish tavsiya etiladi.',
        'Barcha narxlar yashirin valyuta komissiyalarisiz faqat Oʻzbekiston soʻmida (UZS) hisoblangan.',
      ],
      support: {
        director: 'Цой Елена (Tsoy Yelena)',
        phone: '+998 777-77-77',
      },
    },
  },
  en: {
    success: true,
    meta: {
      model_used: 'gemini-3.8',
      fallback_triggered: false,
      sanitized: true,
      execution_ms: 415,
      language: 'en',
    },
    data: {
      itinerary_id: '8f3b6c20-68a8-4c3e-8c33-d8cfecf1aa30',
      trip_title: 'Classic Silk Road Journey: Samarkand & Bukhara',
      summary:
        'Three-day historical and culinary itinerary for 2 travelers featuring high-speed Afrosiyob train transfers.',
      estimated_total_cost_uzs: 7650000,
      daily_itinerary: [
        {
          day_number: 1,
          location: 'Samarkand',
          morning: {
            activity:
              'Arrival by Afrosiyob bullet train and private guided tour of Registan Square (Ulugh Beg, Sher-Dor & Tilya-Kori Madrasahs)',
            cost_uzs: 400000,
          },
          afternoon: {
            activity:
              'Authentic Samarkand "Zigir Osh" plov lunch and visit to the Gur-e-Amir Mausoleum',
            cost_uzs: 500000,
          },
          evening: {
            activity:
              'Evening photoshoot and stroll through the "Eternal City" complex (Silk Road Samarkand)',
            cost_uzs: 350000,
          },
          accommodation: {
            name: 'Miran International Hotel Samarkand 4*',
            cost_uzs: 1300000,
          },
        },
        {
          day_number: 2,
          location: 'Samarkand — Bukhara',
          morning: {
            activity:
              'Visit Shah-i-Zinda necropolis, Bibi-Khanym Mosque, and tasting oriental sweets at Siyob Bazaar',
            cost_uzs: 380000,
          },
          afternoon: {
            activity:
              'Tour Ulugh Beg Observatory, Konigil Silk Paper Mill, and board the Afrosiyob train to Bukhara',
            cost_uzs: 620000,
          },
          evening: {
            activity:
              'Dinner by the Lyab-i Hauz pond with Bukharan specialties and spiced herbal tea',
            cost_uzs: 400000,
          },
          accommodation: {
            name: 'Mercure Bukhara Old Town 4*',
            cost_uzs: 1450000,
          },
        },
        {
          day_number: 3,
          location: 'Bukhara',
          morning: {
            activity:
              'Guided tour of the Ark Fortress and Po-i-Kalyan ensemble (Kalyan Minaret & Mir-i-Arab Madrasah)',
            cost_uzs: 420000,
          },
          afternoon: {
            activity:
              'Lunch featuring Bukharan "Oshi Sofi" plov and walk through medieval Trading Domes',
            cost_uzs: 480000,
          },
          evening: {
            activity:
              'Folklore show at Nadir Divan-Begi Madrasah and transfer to the railway station (Afrosiyob train)',
            cost_uzs: 1350000,
          },
          accommodation: {
            name: 'Boutique Hotel Minzifa (late check-out / day package)',
            cost_uzs: 0,
          },
        },
      ],
      local_tips: [
        'Book Afrosiyob high-speed train tickets at least 15–20 days in advance.',
        'Modest dress covering shoulders and knees is required when visiting active mosques and mausoleums.',
        'All prices are calculated strictly in integer Uzbekistani Som (UZS) with zero currency conversion fees.',
      ],
      support: {
        director: 'Elena Tsoy (Цой Елена)',
        phone: '+998 777-77-77',
      },
    },
  },
};

export const UI_TRANSLATIONS = {
  ru: {
    topBannerTag: 'UZS BIGINT ONLY',
    topBannerText:
      'AI-платформа туров по Великому Шелковому пути · Расчет строго в узбекских сумах',
    directorFixedNotice:
      'По вопросам бронирования: Директор Цой Елена, тел. +998 777-77-77.',
    headerSubtitle:
      'Google Gemini 3.8 Planner · 3.5 Flash-Lite Stream · Payme / Click / Uzum',
    tabPlanner: 'AI-Маршрут и Бронь',
    tabGateway: 'Валидатор UZS (BIGINT)',
    tabSpec: 'OpenAPI & Архитектура',
    formTitle: 'Параметры путешествия',
    destinationLabel: 'Направление по Узбекистану',
    destinationPlaceholder: 'Например: Самарканд - Бухара',
    daysLabel: 'Дней',
    adultsLabel: 'Взрослых',
    childrenLabel: 'Детей',
    budgetLabel: 'Бюджет поездки (целочисленный UZS)',
    interestsLabel: 'Интересы и акценты',
    specialRequestsLabel: 'Особые пожелания (защищено Prompt Sanitization)',
    specialRequestsPlaceholder: 'Например: Передвижение на поезде Afrosiyob',
    generateBtn: 'Сгенерировать маршрут через Gemini AI',
    generatingBtn: 'Генерация маршрута в сумах (UZS)...',
    bookingTitle: 'Мгновенное бронирование тура',
    accuracyBadge: '1 UZS точность',
    travelerNameLabel: 'ФИО путешественника',
    travelerPhoneLabel: 'Телефон (Узбекистан)',
    travelerEmailLabel: 'Email для ваучера',
    paymentProviderLabel: 'Платежный провайдер (Узбекистан, UZS)',
    totalToPayLabel: 'К оплате (BIGINT UZS):',
    payButtonPrefix: 'Оплатить через',
    payButtonSuffix: 'и получить ваучер',
    payingStatus: 'Проверка суммы в UZS...',
    voucherPaidBadge: 'БРОНИРОВАНИЕ ОПЛАЧЕНО',
    voucherTitle: 'Электронный туристический ваучер SilkWay Travel AI',
    printVoucherBtn: 'Печать PDF-ваучера',
    voucherTraveler: 'Турист',
    voucherRoute: 'Маршрут',
    voucherPaidAmount: 'Оплаченная сумма (BIGINT)',
    voucherAccuracyVerified: 'Точность проверена до 1 UZS',
    currencyBadgeLabel: 'Валюта расчета:',
    currencyBadgeValue: 'Узбекский сум (UZS)',
    modelBadgePrefix: 'Модель:',
    estimatedTotalTitle: 'Итоговая расчетная стоимость маршрута',
    budgetUsageLabel: 'Использование бюджета',
    yourLimitLabel: 'Ваш лимит:',
    dailyPlanHeading: 'Подневный план путешествия',
    daysUnit: 'дн.',
    dayWord: 'День',
    daySubtext: 'Все активности и проживание включены в смету',
    dayTotalLabel: 'Итого за день:',
    morningLabel: 'Утро (Morning)',
    afternoonLabel: 'День и обед (Afternoon)',
    eveningLabel: 'Вечер (Evening)',
    hotelLabel: 'Отель (Accommodation)',
    localTipsTitle: 'Локальные рекомендации эксперта SilkWay Travel AI',
    gatewaySectionBadge: 'Раздел 5 Технической Спецификации',
    gatewayTitle: 'Тестирование Webhook-валидации цен в сумах (UZS BIGINT)',
    gatewayDesc:
      'Все финансовые сущности передаются как целые числа (BIGINT), где 1 UZS = 1 единица. Float-значения запрещены. Каждый webhook от Payme, Click или Uzum проверяет совпадение суммы с точностью до 1 UZS.',
    gatewayBookingAmountLabel: 'Сумма в bookings.total_amount_uzs (BIGINT)',
    gatewayWebhookAmountLabel: 'Входящая сумма от Webhook (incomingAmount)',
    gatewayProviderLabel: 'Провайдер Webhook-уведомления',
    gatewayQuickScenarios: 'Быстрые сценарии тестирования:',
    scenarioExact: 'Точное совпадение',
    scenarioOffByOne: 'Ошибка в 1 сум',
    scenarioFloat: 'Попытка передать float',
    validationPassed: '✓ Валидация пройдена',
    validationFailed: '✕ Транзакция отклонена',
    referenceFnTitle: 'Эталонная функция валидации (src/lib/payment.ts)',
    securityNoticeHeading: 'Контактная плашка безопасности на всех транзакциях:',
    specCard1Title: '1. Архитектура и Fallback ИИ',
    specCard1Desc:
      'Основной планировщик использует gemini-3.8 с responseSchema. При возврате HTTP 429/503 выполняется Exponential Backoff (1с, 2с, 4с) с автоматическим переключением на gemini-3.5-flash-lite.',
    specCard2Title: '2. Схема PostgreSQL 16 (DDL)',
    specCard2Desc:
      'Таблицы users, itineraries, bookings и transactions сохранены в database/schema.sql. Все суммы хранятся в BIGINT.',
    specCard3Title: '3. Защита от Prompt Injection',
    specCard3Desc:
      'Все пользовательские поля (destination, interests, special_requests) проходят санитизацию в sanitizePromptInput() перед передачей в LLM.',
    specJsonTitle: 'Текущий JSON-ответ POST /api/v1/itinerary/generate',
    footerCurrencyNote: 'Все цены указаны в узбекских сумах (UZS, BIGINT)',
    presets: [
      'Самарканд - Бухара',
      'Самарканд - Бухара - Хива',
      'Ташкент - Чимган - Амирсой',
      'Хива (Ичан-Кала)',
      'Ферганская долина (Коканд - Риштан - Маргилан)',
    ],
    interests: [
      'история',
      'национальная кухня',
      'фотосессии',
      'восточные базары',
      'ремесла и керамика',
      'архитектура ЮНЕСКО',
      'природа и горы',
    ],
    defaultSpecialRequest: 'Передвижение на поезде Afrosiyob',
  },
  uz: {
    topBannerTag: 'FAQAT UZS BIGINT',
    topBannerText:
      'Buyuk Ipak yoʻli boʻylab AI-sayohat platformasi · Hisob-kitob faqat Oʻzbekiston soʻmida',
    directorFixedNotice:
      'Bron qilish boʻyicha: Direktor Tsoy Yelena (Цой Елена), tel. +998 777-77-77.',
    headerSubtitle:
      'Google Gemini 3.8 Planner · 3.5 Flash-Lite Stream · Payme / Click / Uzum',
    tabPlanner: 'AI-Yoʻnalish va Bron',
    tabGateway: 'UZS Validator (BIGINT)',
    tabSpec: 'OpenAPI va Arxitektura',
    formTitle: 'Sayohat parametrlari',
    destinationLabel: 'Oʻzbekiston boʻylab yoʻnalish',
    destinationPlaceholder: 'Masalan: Samarqand - Buxoro',
    daysLabel: 'Kunlar',
    adultsLabel: 'Kattalar',
    childrenLabel: 'Bolalar',
    budgetLabel: 'Sayohat byudjeti (butun sonli UZS)',
    interestsLabel: 'Qiziqishlar va yoʻnalishlar',
    specialRequestsLabel: 'Maxsus istaklar (Prompt Sanitization himoyalangan)',
    specialRequestsPlaceholder: 'Masalan: Afrosiyob poyezdida harakatlanish',
    generateBtn: 'Gemini AI orqali yoʻnalish yaratish',
    generatingBtn: 'Soʻmda (UZS) yoʻnalish yaratilmoqda...',
    bookingTitle: 'Turni tezkor bron qilish',
    accuracyBadge: '1 UZS aniqlik',
    travelerNameLabel: 'Sayohatchining F.I.Sh.',
    travelerPhoneLabel: 'Telefon raqami (Oʻzbekiston)',
    travelerEmailLabel: 'Vaucher uchun Email',
    paymentProviderLabel: 'Toʻlov tizimi (Oʻzbekiston, UZS)',
    totalToPayLabel: 'Toʻlov summasi (BIGINT UZS):',
    payButtonPrefix: 'Toʻlash:',
    payButtonSuffix: 'va vaucherni olish',
    payingStatus: 'UZS summasi tekshirilmoqda...',
    voucherPaidBadge: 'BRON TOʻLANDI',
    voucherTitle: 'SilkWay Travel AI elektron turistik vaucheri',
    printVoucherBtn: 'PDF-vaucherni chop etish',
    voucherTraveler: 'Sayohatchi',
    voucherRoute: 'Yoʻnalish',
    voucherPaidAmount: 'Toʻlangan summa (BIGINT)',
    voucherAccuracyVerified: '1 UZS aniqlikkacha tekshirildi',
    currencyBadgeLabel: 'Hisob valyutasi:',
    currencyBadgeValue: 'Oʻzbekiston soʻmi (UZS)',
    modelBadgePrefix: 'Model:',
    estimatedTotalTitle: 'Yoʻnalishning umumiy hisoblangan qiymati',
    budgetUsageLabel: 'Byudjetdan foydalanish',
    yourLimitLabel: 'Sizning limitingiz:',
    dailyPlanHeading: 'Kunlik sayohat rejasi',
    daysUnit: 'kun',
    dayWord: 'Kun',
    daySubtext: 'Barcha ekskursiyalar va mehmonxona smetaga kiritilgan',
    dayTotalLabel: 'Bir kunlik jami:',
    morningLabel: 'Ertalab (Morning)',
    afternoonLabel: 'Kunduzi va tushlik (Afternoon)',
    eveningLabel: 'Kechqurun (Evening)',
    hotelLabel: 'Mehmonxona (Accommodation)',
    localTipsTitle: 'SilkWay Travel AI ekspertining mahalliy tavsiyalari',
    gatewaySectionBadge: 'Texnik spetsifikatsiyaning 5-boʻlimi',
    gatewayTitle: 'Soʻmdagi (UZS BIGINT) narxlar uchun Webhook-validatsiya testi',
    gatewayDesc:
      'Barcha moliyaviy qiymatlar butun son (BIGINT) sifatida uzatiladi (1 UZS = 1 birlik). Float qiymatlar taqiqlangan. Payme, Click yoki Uzum webhooklari summani 1 UZS aniqlikda tekshiradi.',
    gatewayBookingAmountLabel: 'bookings.total_amount_uzs summasi (BIGINT)',
    gatewayWebhookAmountLabel: 'Webhookdan kelgan summa (incomingAmount)',
    gatewayProviderLabel: 'Webhook provayderi',
    gatewayQuickScenarios: 'Tezkor test ssenariylari:',
    scenarioExact: 'Toʻliq moslik',
    scenarioOffByOne: '1 soʻm farq xatosi',
    scenarioFloat: 'Float yuborishga urinish',
    validationPassed: '✓ Validatsiya muvaffaqiyatli oʻtdi',
    validationFailed: '✕ Tranzaksiya rad etildi',
    referenceFnTitle: 'Etalon validatsiya funksiyasi (src/lib/payment.ts)',
    securityNoticeHeading: 'Barcha tranzaksiyalarda xavfsizlik aloqa bloki:',
    specCard1Title: '1. AI Arxitekturasi va Fallback',
    specCard1Desc:
      'Asosiy rejalashtiruvchi responseSchema bilan gemini-3.8 modelidan foydalanadi. HTTP 429/503 xatoligida Exponential Backoff (1s, 2s, 4s) orqali avtomatik gemini-3.5-flash-lite ga oʻtadi.',
    specCard2Title: '2. PostgreSQL 16 sxemasi (DDL)',
    specCard2Desc:
      'users, itineraries, bookings va transactions jadvallari database/schema.sql faylida saqlangan. Barcha summalar BIGINT formatida.',
    specCard3Title: '3. Prompt Injection himoyasi',
    specCard3Desc:
      'Barcha foydalanuvchi kiritmalari (destination, interests, special_requests) LLM ga yuborishdan oldin sanitizePromptInput() orqali tozalanadi.',
    specJsonTitle: 'Joriy JSON-javob: POST /api/v1/itinerary/generate',
    footerCurrencyNote: 'Barcha narxlar Oʻzbekiston soʻmida koʻrsatilgan (UZS, BIGINT)',
    presets: [
      'Samarqand - Buxoro',
      'Samarqand - Buxoro - Xiva',
      'Toshkent - Chimyon - Amirsoy',
      'Xiva (Ichan-Qalʼa)',
      'Fargʻona vodiysi (Qoʻqon - Rishton - Margʻilon)',
    ],
    interests: [
      'tarix',
      'milliy taomlar',
      'fotosessiya',
      'sharq bozorlari',
      'hunarmandchilik va kulolchilik',
      'YUNESKO meʼmorchiligi',
      'tabiat va togʻlar',
    ],
    defaultSpecialRequest: 'Afrosiyob poyezdida harakatlanish',
  },
  en: {
    topBannerTag: 'UZS BIGINT ONLY',
    topBannerText:
      'AI Silk Road Travel Platform · All calculations strictly in Uzbekistani Som (UZS)',
    directorFixedNotice:
      'For booking inquiries: Director Elena Tsoy (Цой Елена), tel. +998 777-77-77.',
    headerSubtitle:
      'Google Gemini 3.8 Planner · 3.5 Flash-Lite Stream · Payme / Click / Uzum',
    tabPlanner: 'AI Itinerary & Booking',
    tabGateway: 'UZS Validator (BIGINT)',
    tabSpec: 'OpenAPI & Architecture',
    formTitle: 'Trip Parameters',
    destinationLabel: 'Destination in Uzbekistan',
    destinationPlaceholder: 'e.g., Samarkand - Bukhara',
    daysLabel: 'Days',
    adultsLabel: 'Adults',
    childrenLabel: 'Children',
    budgetLabel: 'Total Trip Budget (Integer UZS)',
    interestsLabel: 'Interests & Highlights',
    specialRequestsLabel: 'Special Requests (Prompt Sanitization Protected)',
    specialRequestsPlaceholder: 'e.g., Travel by Afrosiyob high-speed train',
    generateBtn: 'Generate Itinerary with Gemini AI',
    generatingBtn: 'Generating itinerary in UZS...',
    bookingTitle: 'Instant Tour Booking',
    accuracyBadge: '1 UZS Precision',
    travelerNameLabel: 'Traveler Full Name',
    travelerPhoneLabel: 'Phone Number (Uzbekistan)',
    travelerEmailLabel: 'Email for Voucher',
    paymentProviderLabel: 'Payment Provider (Uzbekistan, UZS)',
    totalToPayLabel: 'Total to Pay (BIGINT UZS):',
    payButtonPrefix: 'Pay via',
    payButtonSuffix: '& Get Voucher',
    payingStatus: 'Validating UZS amount...',
    voucherPaidBadge: 'BOOKING PAID',
    voucherTitle: 'SilkWay Travel AI Official E-Voucher',
    printVoucherBtn: 'Print PDF Voucher',
    voucherTraveler: 'Traveler',
    voucherRoute: 'Itinerary',
    voucherPaidAmount: 'Amount Paid (BIGINT)',
    voucherAccuracyVerified: 'Verified to 1 UZS precision',
    currencyBadgeLabel: 'Calculation Currency:',
    currencyBadgeValue: 'Uzbekistani Som (UZS)',
    modelBadgePrefix: 'Model:',
    estimatedTotalTitle: 'Estimated Total Itinerary Cost',
    budgetUsageLabel: 'Budget Utilization',
    yourLimitLabel: 'Your limit:',
    dailyPlanHeading: 'Day-by-Day Itinerary',
    daysUnit: 'days',
    dayWord: 'Day',
    daySubtext: 'All activities and hotel accommodation included in estimate',
    dayTotalLabel: 'Day Total:',
    morningLabel: 'Morning',
    afternoonLabel: 'Afternoon & Lunch',
    eveningLabel: 'Evening',
    hotelLabel: 'Accommodation (Hotel)',
    localTipsTitle: 'SilkWay Travel AI Local Expert Tips',
    gatewaySectionBadge: 'Technical Specification Section 5',
    gatewayTitle: 'UZS (BIGINT) Webhook Payment Validation Sandbox',
    gatewayDesc:
      'All financial entities are transmitted as integers (BIGINT), where 1 UZS = 1 unit. Float values are strictly forbidden. Every webhook from Payme, Click, or Uzum validates the amount to 1 UZS precision.',
    gatewayBookingAmountLabel: 'Amount in bookings.total_amount_uzs (BIGINT)',
    gatewayWebhookAmountLabel: 'Incoming Webhook Amount (incomingAmount)',
    gatewayProviderLabel: 'Webhook Provider',
    gatewayQuickScenarios: 'Quick Test Scenarios:',
    scenarioExact: 'Exact Match',
    scenarioOffByOne: 'Off by 1 UZS Error',
    scenarioFloat: 'Float Value Attempt',
    validationPassed: '✓ Validation Passed',
    validationFailed: '✕ Transaction Rejected',
    referenceFnTitle: 'Reference Validation Function (src/lib/payment.ts)',
    securityNoticeHeading: 'Mandatory contact block on all transactions:',
    specCard1Title: '1. AI Architecture & Fallback',
    specCard1Desc:
      'Primary planner uses gemini-3.8 with responseSchema. On HTTP 429/503, it executes Exponential Backoff (1s, 2s, 4s) and automatically switches to gemini-3.5-flash-lite.',
    specCard2Title: '2. PostgreSQL 16 Schema (DDL)',
    specCard2Desc:
      'Tables users, itineraries, bookings, and transactions are stored in database/schema.sql. All monetary amounts use BIGINT.',
    specCard3Title: '3. Prompt Injection Defense',
    specCard3Desc:
      'All user inputs (destination, interests, special_requests) are sanitized via sanitizePromptInput() prior to LLM prompt concatenation.',
    specJsonTitle: 'Current JSON Response: POST /api/v1/itinerary/generate',
    footerCurrencyNote: 'All prices are stated in Uzbekistani Som (UZS, BIGINT)',
    presets: [
      'Samarkand - Bukhara',
      'Samarkand - Bukhara - Khiva',
      'Tashkent - Chimgan - Amirsoy',
      'Khiva (Itchan Kala)',
      'Fergana Valley (Kokand - Rishtan - Margilan)',
    ],
    interests: [
      'history',
      'national cuisine',
      'photoshoots',
      'oriental bazaars',
      'crafts & ceramics',
      'UNESCO architecture',
      'nature & mountains',
    ],
    defaultSpecialRequest: 'Travel by Afrosiyob high-speed train',
  },
};
