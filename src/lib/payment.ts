import { AppLanguage, BookingRecord, GenerateItineraryResponse, PaymentGateway } from './types';

/**
 * Раздел 5 Технической спецификации:
 * Все финансовые сущности в БД и API передаются как целые числа (BIGINT), где 1 UZS = 1 единица.
 * Запрещены float-значения цен в API во избежание ошибок округления.
 * Каждый webhook от провайдеров (Payme, Click, Uzum) проверяет соответствие полученной суммы
 * в сумах сумме в bookings.total_amount_uzs с точностью до 1 UZS.
 */
export function validatePaymentAmount(bookingAmount: bigint, incomingAmount: bigint): boolean {
  return bookingAmount === incomingAmount;
}

/**
 * Проверка, что переданное число в API является строгим целым числом без дробной части (float запрещен)
 */
export function assertIntegerUzs(amount: number | string, fieldName = 'amount_uzs'): bigint {
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 0) {
      throw new Error(
        `Ошибка валидации UZS (${fieldName}): Запрещены float-значения и отрицательные суммы. Получено: ${amount}`
      );
    }
    return BigInt(amount);
  }

  const trimmed = String(amount).trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(
      `Ошибка валидации UZS (${fieldName}): Значение должно быть целым неотрицательным числом BIGINT без копеек/тийинов. Получено: "${amount}"`
    );
  }
  return BigInt(trimmed);
}

/**
 * Форматирование суммы в узбекских сумах (UZS) с учетом выбранного языка (RU / UZ / EN)
 */
export function formatUzs(amount: number | bigint | string, lang: AppLanguage = 'ru'): string {
  const num = typeof amount === 'bigint' ? Number(amount) : Number(amount);
  if (Number.isNaN(num)) {
    return lang === 'uz' ? '0 soʻm' : lang === 'en' ? '0 UZS' : '0 сум';
  }
  const formatted = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'ru-RU', {
    maximumFractionDigits: 0,
  }).format(Math.trunc(num));

  if (lang === 'uz') return `${formatted} soʻm`;
  if (lang === 'en') return `${formatted} UZS`;
  return `${formatted} сум`;
}

// In-Memory хранилище для MVP (имитация таблиц itineraries, bookings, transactions PostgreSQL 16)
const globalForStore = globalThis as unknown as {
  itinerariesStore?: Map<string, GenerateItineraryResponse['data']>;
  bookingsStore?: Map<string, BookingRecord>;
};

export const itinerariesStore =
  globalForStore.itinerariesStore ?? new Map<string, GenerateItineraryResponse['data']>();
export const bookingsStore =
  globalForStore.bookingsStore ?? new Map<string, BookingRecord>();

if (process.env.NODE_ENV !== 'production') {
  globalForStore.itinerariesStore = itinerariesStore;
  globalForStore.bookingsStore = bookingsStore;
}

export function createBookingWithPayment(params: {
  itinerary_id: string;
  full_name: string;
  phone: string;
  email?: string;
  booking_amount_uzs: number | string;
  incoming_webhook_amount_uzs: number | string;
  provider: PaymentGateway;
}): {
  booking: BookingRecord;
  validationPassed: boolean;
} {
  const bookingAmountBigInt = assertIntegerUzs(params.booking_amount_uzs, 'total_amount_uzs');
  const incomingAmountBigInt = assertIntegerUzs(
    params.incoming_webhook_amount_uzs,
    'incoming_webhook_amount_uzs'
  );

  const isExactMatch = validatePaymentAmount(bookingAmountBigInt, incomingAmountBigInt);
  const bookingId = crypto.randomUUID();
  const txId = crypto.randomUUID();
  const providerPrefix = params.provider.toUpperCase();
  const providerTxId = `${providerPrefix}-UZ-${Date.now().toString().slice(-8)}`;

  const booking: BookingRecord = {
    id: bookingId,
    itinerary_id: params.itinerary_id,
    user_full_name: params.full_name,
    user_phone: params.phone,
    user_email: params.email,
    total_amount_uzs: bookingAmountBigInt.toString(),
    status: isExactMatch ? 'paid' : 'pending',
    manager_contact_phone: process.env.DIRECTOR_CONTACT_PHONE || '+998 777-77-77',
    director_name: process.env.DIRECTOR_CONTACT_NAME || 'Цой Елена',
    created_at: new Date().toISOString(),
    transaction: {
      id: txId,
      provider: params.provider,
      provider_tx_id: providerTxId,
      amount_uzs: incomingAmountBigInt.toString(),
      is_success: isExactMatch,
      created_at: new Date().toISOString(),
    },
  };

  bookingsStore.set(bookingId, booking);
  return { booking, validationPassed: isExactMatch };
}
