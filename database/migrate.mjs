import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Please set DATABASE_URL environment variable');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log('Applying SilkWay Travel AI DDL schema to Neon PostgreSQL...');

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

  // Seed Director user
  await sql`
    INSERT INTO users (full_name, phone, email, role)
    VALUES ('Цой Елена', '+998 777-77-77', 'director@silkway-travel.uz', 'admin')
    ON CONFLICT (phone) DO NOTHING;
  `;

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;

  console.log(
    'Neon PostgreSQL tables ready:',
    tables.map((t) => t.table_name)
  );
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
