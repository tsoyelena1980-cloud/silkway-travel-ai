import { NextRequest, NextResponse } from 'next/server';
import {
  assertIntegerUzs,
  bookingsStore,
  createBookingWithPayment,
  validatePaymentAmount,
} from '@/lib/payment';
import { PaymentGateway } from '@/lib/types';

export async function GET() {
  const list = Array.from(bookingsStore.values()).sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
  return NextResponse.json({ success: true, bookings: list });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      itinerary_id,
      full_name,
      phone,
      email,
      total_amount_uzs,
      incoming_webhook_amount_uzs,
      provider = 'payme',
    } = body;

    if (!itinerary_id || !full_name || !phone || total_amount_uzs === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Необходимо указать itinerary_id, full_name, phone и целочисленную сумму total_amount_uzs.',
        },
        { status: 400 }
      );
    }

    const validProviders: PaymentGateway[] = ['payme', 'click', 'uzum'];
    const selectedProvider: PaymentGateway = validProviders.includes(provider) ? provider : 'payme';

    // Проверка целочисленности BIGINT и совпадения суммы с точностью до 1 UZS (Раздел 5)
    const bookingBigInt = assertIntegerUzs(total_amount_uzs, 'total_amount_uzs');
    const webhookBigInt = assertIntegerUzs(
      incoming_webhook_amount_uzs ?? total_amount_uzs,
      'incoming_webhook_amount_uzs'
    );

    const exactMatch = validatePaymentAmount(bookingBigInt, webhookBigInt);

    const { booking } = createBookingWithPayment({
      itinerary_id,
      full_name,
      phone,
      email,
      booking_amount_uzs: total_amount_uzs,
      incoming_webhook_amount_uzs: incoming_webhook_amount_uzs ?? total_amount_uzs,
      provider: selectedProvider,
    });

    if (!exactMatch) {
      return NextResponse.json(
        {
          success: false,
          error: `Отклонено платежным шлюзом (${selectedProvider.toUpperCase()}): Несовпадение суммы бронирования (${bookingBigInt.toString()} UZS) и суммы транзакции (${webhookBigInt.toString()} UZS). Требуется точность до 1 UZS.`,
          booking,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      booking,
      support_notice: 'По вопросам бронирования: Директор Цой Елена, тел. +998 777-77-77.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ошибка валидации платежа в сумах (UZS)';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
