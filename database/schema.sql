-- ============================================================================
-- SilkWay Travel AI — PostgreSQL 16 DDL Schema
-- Все финансовые сущности хранятся как целочисленный BIGINT в сумах (UZS) без тийинов/копеек
-- ============================================================================

-- Перечисления
CREATE TYPE user_role AS ENUM ('traveler', 'manager', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'paid', 'cancelled', 'completed');
CREATE TYPE payment_gateway AS ENUM ('payme', 'click', 'uzum');

-- Таблица пользователей
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    role user_role DEFAULT 'traveler',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица сгенерированных и сохраненных маршрутов
CREATE TABLE itineraries (
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

-- Таблица бронирований
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID REFERENCES itineraries(id),
    user_id UUID REFERENCES users(id),
    total_amount_uzs BIGINT NOT NULL,
    status booking_status DEFAULT 'pending',
    manager_contact_phone VARCHAR(20) DEFAULT '+998-777-77-77',
    director_name VARCHAR(100) DEFAULT 'Цой Елена',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица транзакций
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    provider payment_gateway NOT NULL,
    provider_tx_id VARCHAR(100),
    amount_uzs BIGINT NOT NULL,
    is_success BOOLEAN DEFAULT FALSE,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы производительности
CREATE INDEX idx_itineraries_user ON itineraries(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
