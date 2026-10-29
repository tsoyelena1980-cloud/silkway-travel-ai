import { neon } from '@neondatabase/serverless';
import { BookingRecord, GenerateItineraryResponse, PaymentGateway } from './types';

let schemaInitialized = false;

export function getSql() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) return null;
  return neon(dbUrl);
}

/**
 * Автоматическая инициализация схемы БД PostgreSQL 16 (Neon) согласно Разделу 2 ТЗ
 */
export async function ensureDatabaseSchema() {
  const sql = getSql();
  if (!sql || schemaInitialized) return false;

  try {
    await sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('traveler', 'manager', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE booking_status AS ENUM ('pending', 'paid', 'cancelled', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE payment_gateway AS ENUM ('payme', 'click', 'uzum');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(150) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        role user_role DEFAULT 'traveler',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS itineraries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        destination VARCHAR(100) NOT NULL,
        duration_days INT NOT NULL,
        travelers_count INT NOT NULL,
        raw_prompt TEXT NOT NULL,
        generated_plan JSONB NOT NULL,
        estimated_total_uzs BIGINT NOT NULL CHECK (estimated_total_uzs >= 0),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        itinerary_id UUID REFERENCES itineraries(id),
        user_id UUID REFERENCES users(id),
        total_amount_uzs BIGINT NOT NULL,
        status booking_status DEFAULT 'pending',
        manager_contact_phone VARCHAR(20) DEFAULT '+998-777-77-77',
        director_name VARCHAR(100) DEFAULT 'Цой Елена',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id),
        provider payment_gateway NOT NULL,
        provider_tx_id VARCHAR(100),
        amount_uzs BIGINT NOT NULL,
        is_success BOOLEAN DEFAULT FALSE,
        payload JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_itineraries_user ON itineraries(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);`;

    schemaInitialized = true;
    return true;
  } catch (err) {
    console.error('Neon schema initialization warning:', err);
    return false;
  }
}

/**
 * Сохранение сгенерированного маршрута в таблицу itineraries (Neon PostgreSQL)
 */
export async function saveItineraryToNeon(params: {
  id: string;
  title: string;
  destination: string;
  duration_days: number;
  travelers_count: number;
  raw_prompt: string;
  generated_plan: GenerateItineraryResponse['data'];
  estimated_total_uzs: number;
}): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;

  try {
    await ensureDatabaseSchema();
    await sql`
      INSERT INTO itineraries (
        id, title, destination, duration_days, travelers_count, raw_prompt, generated_plan, estimated_total_uzs
      ) VALUES (
        ${params.id}::uuid,
        ${params.title.slice(0, 250)},
        ${params.destination.slice(0, 100)},
        ${Math.trunc(params.duration_days)},
        ${Math.trunc(params.travelers_count)},
        ${params.raw_prompt},
        ${JSON.stringify(params.generated_plan)}::jsonb,
        ${Math.trunc(params.estimated_total_uzs)}
      )
      ON CONFLICT (id) DO NOTHING;
    `;
    return true;
  } catch (err) {
    console.error('Neon saveItinerary error:', err);
    return false;
  }
}

/**
 * Сохранение пользователя, бронирования и транзакции в Neon PostgreSQL (BIGINT UZS)
 */
export async function saveBookingAndTransactionToNeon(params: {
  booking: BookingRecord;
  provider: PaymentGateway;
}): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;

  try {
    await ensureDatabaseSchema();
    const b = params.booking;

    // 1. Создаем или обновляем пользователя по номеру телефона
    const userRows = await sql`
      INSERT INTO users (full_name, phone, email, role)
      VALUES (${b.user_full_name.slice(0, 150)}, ${b.user_phone.slice(0, 20)}, ${b.user_email || null}, 'traveler')
      ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id;
    `;
    const userId = userRows[0]?.id || null;

    // 2. Проверяем наличие itinerary_id в таблице itineraries (если бронируется стартовый демо-маршрут, добавим его)
    const itinCheck = await sql`
      SELECT id FROM itineraries WHERE id = ${b.itinerary_id}::uuid LIMIT 1;
    `;
    const validItineraryId = itinCheck.length > 0 ? b.itinerary_id : null;

    // 3. Записываем бронь в таблицу bookings (BIGINT total_amount_uzs)
    await sql`
      INSERT INTO bookings (
        id, itinerary_id, user_id, total_amount_uzs, status, manager_contact_phone, director_name
      ) VALUES (
        ${b.id}::uuid,
        ${validItineraryId},
        ${userId},
        ${b.total_amount_uzs}::bigint,
        ${b.status}::booking_status,
        ${b.manager_contact_phone.slice(0, 20)},
        ${b.director_name.slice(0, 100)}
      );
    `;

    // 4. Записываем транзакцию в таблицу transactions (BIGINT amount_uzs)
    if (b.transaction) {
      await sql`
        INSERT INTO transactions (
          id, booking_id, provider, provider_tx_id, amount_uzs, is_success, payload
        ) VALUES (
          ${b.transaction.id}::uuid,
          ${b.id}::uuid,
          ${params.provider}::payment_gateway,
          ${b.transaction.provider_tx_id},
          ${b.transaction.amount_uzs}::bigint,
          ${b.transaction.is_success},
          ${JSON.stringify(b.transaction)}::jsonb
        );
      `;
    }

    return true;
  } catch (err) {
    console.error('Neon saveBookingAndTransaction error:', err);
    return false;
  }
}
