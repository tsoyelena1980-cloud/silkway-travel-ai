import { AppLanguage } from './types';

export interface LandmarkItem {
  id: string;
  image: string;
  rating: string;
  reviewsCount: number;
  priceFromUzs: number;
  unesco: boolean;
  presetDestination: Record<AppLanguage, string>;
  city: Record<AppLanguage, string>;
  title: Record<AppLanguage, string>;
  subtitle: Record<AppLanguage, string>;
  bestTime: Record<AppLanguage, string>;
  highlight: Record<AppLanguage, string>;
}

export const UZBEKISTAN_LANDMARKS: LandmarkItem[] = [
  {
    id: 'registan',
    image: 'landmarks/samarkand.jpg',
    rating: '4.98',
    reviewsCount: 4820,
    priceFromUzs: 200000,
    unesco: true,
    presetDestination: {
      ru: 'Самарканд - Бухара',
      en: 'Samarkand - Bukhara',
      uz: 'Samarqand - Buxoro',
    },
    city: {
      ru: 'Самарканд',
      en: 'Samarkand',
      uz: 'Samarqand',
    },
    title: {
      ru: 'Площадь Регистан',
      en: 'Registan Square',
      uz: 'Registon maydoni',
    },
    subtitle: {
      ru: 'Сердце империи Тимуридов: медресе Улугбека, Шердор и Тилля-Кари с золотым куполом XV–XVII веков.',
      en: 'Heart of the Timurid Empire: Ulugh Beg, Sher-Dor, and gold-adorned Tilya-Kori Madrasahs (15th–17th centuries).',
      uz: 'Temuriylar saltanatining yuragi: Ulugʻbek, Sherdor va oltin gumbazli Tillakori madrasalari (XV–XVII asrlar).',
    },
    bestTime: {
      ru: 'Рассвет или вечернее 3D световое шоу (20:00)',
      en: 'Sunrise or Evening 3D Light Show (8:00 PM)',
      uz: 'Quyosh chiqishi yoki kechki 3D nur shousi (20:00)',
    },
    highlight: {
      ru: 'Лазурная майолика и панорама с минарета',
      en: 'Azure majolica tiles & minaret panorama',
      uz: 'Moviy koshinlar va minoradan panorama',
    },
  },
  {
    id: 'shahizinda',
    image: 'landmarks/shahizinda.jpg',
    rating: '4.97',
    reviewsCount: 3610,
    priceFromUzs: 180000,
    unesco: true,
    presetDestination: {
      ru: 'Самарканд - Бухара',
      en: 'Samarkand - Bukhara',
      uz: 'Samarqand - Buxoro',
    },
    city: {
      ru: 'Самарканд',
      en: 'Samarkand',
      uz: 'Samarqand',
    },
    title: {
      ru: 'Ансамбль Шахи-Зинда',
      en: 'Shah-i-Zinda Necropolis',
      uz: 'Shohi Zinda majmuasi',
    },
    subtitle: {
      ru: 'Улица-музей средневековой бирюзовой керамики и усыпальница знати династии Тимуридов.',
      en: 'Sacred avenue of medieval turquoise glazed terracottas and Timurid royal mausoleums.',
      uz: 'Oʻrta asr feruza kulolchiligi koʻcha-muzeyi va Temuriylar zodagonlari maqbaralari.',
    },
    bestTime: {
      ru: 'Утренние часы (08:30–10:30) для лучших фото',
      en: 'Morning hours (8:30–10:30 AM) for soft light',
      uz: 'Ertalabki soatlar (08:30–10:30) fotosessiya uchun',
    },
    highlight: {
      ru: 'Самая фотогеничная локация Шелкового пути',
      en: 'Most photogenic alley on the Silk Road',
      uz: 'Buyuk Ipak yoʻlidagi eng fotogenik maskan',
    },
  },
  {
    id: 'poikalyan',
    image: 'landmarks/bukhara.jpg',
    rating: '4.96',
    reviewsCount: 3940,
    priceFromUzs: 210000,
    unesco: true,
    presetDestination: {
      ru: 'Самарканд - Бухара',
      en: 'Samarkand - Bukhara',
      uz: 'Samarqand - Buxoro',
    },
    city: {
      ru: 'Бухара',
      en: 'Bukhara',
      uz: 'Buxoro',
    },
    title: {
      ru: 'Пои-Калян и Минарет Калян',
      en: 'Po-i-Kalyan & Kalyan Minaret',
      uz: 'Poi Kalon va Minorai Kalon',
    },
    subtitle: {
      ru: 'Величественный минарет 1127 года, который поразил самого Чингисхана, и действующее медресе Мири-Араб.',
      en: 'Towering 1127 ADbrick minaret that spared Bukhara from Genghis Khan, facing Mir-i-Arab Madrasah.',
      uz: '1127-yilda qurilgan ulugʻvor minora va qarshisidagi goʻzal Mir Arab madrasasi.',
    },
    bestTime: {
      ru: 'Закат на террасе с видом на купола Бухары',
      en: 'Sunset from a rooftop cafe overlooking the domes',
      uz: 'Buxoro gumbazlariga qaragan terrasada quyosh botishi',
    },
    highlight: {
      ru: '900 лет непрерывной истории',
      en: '900 years of uninterrupted history',
      uz: '900 yillik uzluksiz tarix',
    },
  },
  {
    id: 'itchankala',
    image: 'landmarks/khiva.jpg',
    rating: '4.95',
    reviewsCount: 2890,
    priceFromUzs: 230000,
    unesco: true,
    presetDestination: {
      ru: 'Хива (Ичан-Кала)',
      en: 'Khiva (Itchan Kala)',
      uz: 'Xiva (Ichan-Qalʼa)',
    },
    city: {
      ru: 'Хива',
      en: 'Khiva',
      uz: 'Xiva',
    },
    title: {
      ru: 'Крепость Ичан-Кала и Кальта-Минор',
      en: 'Itchan Kala & Kalta Minor',
      uz: 'Ichan-Qalʼa va Kalta Minor',
    },
    subtitle: {
      ru: 'Окруженный глинобитными стенами город-музей под открытым небом с лазурным минаретом Кальта-Минор.',
      en: 'Walled oasis city-museum featuring the iconic turquoise-tiled Kalta Minor minaret and palaces.',
      uz: 'Qadimiy qalʼa devorlari bilan oʻralgan ochiq osmon ostidagi shahar-muzey.',
    },
    bestTime: {
      ru: 'Золотой час со сторожевой башни Ак-Шейх-Бобо',
      en: 'Golden hour from Ak-Sheikh-Bobo watchtower',
      uz: 'Oq Shayx Bobo minorasidan oltin soat manzarasi',
    },
    highlight: {
      ru: 'Подлинная атмосфера восточной сказки',
      en: 'Authentic Arabian Nights atmosphere',
      uz: 'Sharq ertaklarining haqiqiy muhiti',
    },
  },
  {
    id: 'gureamir',
    image: 'landmarks/gureamir.jpg',
    rating: '4.94',
    reviewsCount: 3150,
    priceFromUzs: 160000,
    unesco: true,
    presetDestination: {
      ru: 'Самарканд - Бухара - Хива',
      en: 'Samarkand - Bukhara - Khiva',
      uz: 'Samarqand - Buxoro - Xiva',
    },
    city: {
      ru: 'Самарканд',
      en: 'Samarkand',
      uz: 'Samarqand',
    },
    title: {
      ru: 'Мавзолей Гур-Эмир',
      en: 'Gur-e-Amir Mausoleum',
      uz: 'Goʻri Amir maqbarasi',
    },
    subtitle: {
      ru: 'Усыпальница Амира Темура и Улугбека с ребристым бирюзовым куполом и золотым интерьером паrest-кундаль.',
      en: 'Resting place of Amir Timur and Ulugh Beg crowned by an iconic ribbed azure dome and gilded interior.',
      uz: 'Amir Temur va Mirzo Ulugʻbek maqbarasi — moviy qovurgʻali gumbaz va zarhal naqshlar durdonasi.',
    },
    bestTime: {
      ru: 'Вечерняя архитектурная подсветка',
      en: 'Evening architectural illumination',
      uz: 'Kechki meʼmoriy yoritish vaqti',
    },
    highlight: {
      ru: 'Шедевр архитектуры эпохи Ренессанса Востока',
      en: 'Masterpiece of the Eastern Renaissance',
      uz: 'Sharq Uygʻonish davri meʼmorchiligi durdonasi',
    },
  },
  {
    id: 'chimgan',
    image: 'landmarks/chimgan.jpg',
    rating: '4.92',
    reviewsCount: 2410,
    priceFromUzs: 350000,
    unesco: false,
    presetDestination: {
      ru: 'Ташкент - Чимган - Амирсой',
      en: 'Tashkent - Chimgan - Amirsoy',
      uz: 'Toshkent - Chimyon - Amirsoy',
    },
    city: {
      ru: 'Ташкентская область',
      en: 'Tashkent Region',
      uz: 'Toshkent viloyati',
    },
    title: {
      ru: 'Горы Чимган и Чарвак',
      en: 'Chimgan Mountains & Charvak',
      uz: 'Chimyon togʻlari va Chorvoq',
    },
    subtitle: {
      ru: 'Живописные вершины Западного Тянь-Шаня, канатные дороги курорта Амирсой и бирюзовые воды Чарвака.',
      en: 'Scenic Western Tian Shan peaks, Amirsoy cable cars, and the turquoise waters of Charvak Reservoir.',
      uz: 'Gʻarbiy Tyan-Shan choʻqqilari, Amirsoy osma yoʻllari va Chorvoqning feruza suvlari.',
    },
    bestTime: {
      ru: 'Круглый год: горные лыжи зимой и треккинг летом',
      en: 'Year-round: alpine skiing in winter & summer trekking',
      uz: 'Yil davomida: qishda changʻi, yozda togʻ sayohati',
    },
    highlight: {
      ru: 'Панорама на высоте 2290 метров',
      en: 'Panoramic views at 2,290m altitude',
      uz: '2290 metr balandlikdagi togʻ panoramasi',
    },
  },
];

export function resolveAssetUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/silkway-travel-ai')) {
    return `/silkway-travel-ai/${clean}`;
  }
  return `/${clean}`;
}

export function getLocationPhotoByText(locationText: string, dayNumber: number): string {
  const lower = (locationText || '').toLowerCase();
  if (lower.includes('хива') || lower.includes('khiva') || lower.includes('xiva') || lower.includes('ичан')) {
    return 'landmarks/khiva.jpg';
  }
  if (lower.includes('бухар') || lower.includes('bukhara') || lower.includes('buxoro') || lower.includes('гиждуван')) {
    return dayNumber % 2 === 0 ? 'landmarks/ark.jpg' : 'landmarks/bukhara.jpg';
  }
  if (lower.includes('чимган') || lower.includes('chimgan') || lower.includes('chimyon') || lower.includes('амирсой') || lower.includes('ташкент') || lower.includes('toshkent') || lower.includes('tashkent')) {
    return dayNumber % 2 === 0 ? 'landmarks/chorsu.jpg' : 'landmarks/chimgan.jpg';
  }
  if (lower.includes('самарканд') || lower.includes('samarkand') || lower.includes('samarqand')) {
    if (dayNumber === 1) return 'landmarks/samarkand.jpg';
    if (dayNumber === 2) return 'landmarks/shahizinda.jpg';
    return 'landmarks/gureamir.jpg';
  }
  const fallbackPool = [
    'landmarks/samarkand.jpg',
    'landmarks/shahizinda.jpg',
    'landmarks/bukhara.jpg',
    'landmarks/khiva.jpg',
    'landmarks/gureamir.jpg',
  ];
  return fallbackPool[(dayNumber - 1) % fallbackPool.length];
}
