# SilkWay Travel AI — Техническая спецификация и MVP-прототип

Интеллектуальная платформа планирования путешествий по Узбекистану с расчетом всех цен исключительно в узбекских сумах (`UZS`, целочисленный `BIGINT`) и интеграцией с **Google Gemini API** (`gemini-3.8` / `gemini-3.5-flash-lite`) и локальными платежными провайдерами (**Payme**, **Click**, **Uzum Pay**).

---

## Структура проекта

- [`database/schema.sql`](./database/schema.sql) — PostgreSQL 16 DDL (`users`, `itineraries`, `bookings`, `transactions`, перечисления и индексы).
- [`docs/openapi.yaml`](./docs/openapi.yaml) — Спецификация REST API в формате OpenAPI 3.0.
- [`src/lib/gemini.ts`](./src/lib/gemini.ts) — Интеграция с `@google/generative-ai`, строгая JSON-схема `itineraryResponseSchema`, защита от Prompt Injection (`sanitizePromptInput`), Exponential Backoff (`1с, 2с, 4с`) и автоматический fallback с `gemini-3.8` на `gemini-3.5-flash-lite`.
- [`src/lib/payment.ts`](./src/lib/payment.ts) — Целочисленная валидация сумм в сумах (`validatePaymentAmount(bookingAmount: bigint, incomingAmount: bigint)`), запрет float-значений и симулятор платежных вебхуков Payme / Click / Uzum.
- [`src/app/api/v1/itinerary/generate/route.ts`](./src/app/api/v1/itinerary/generate/route.ts) — Endpoint `POST /api/v1/itinerary/generate` (поддерживает `application/json` и `text/event-stream` SSE).
- [`src/app/api/v1/bookings/route.ts`](./src/app/api/v1/bookings/route.ts) — Endpoint `POST /api/v1/bookings` для оформления бронирования и валидации платежа с точностью до `1 UZS`.
- [`src/app/page.tsx`](./src/app/page.tsx) — Клиентский интерфейс (Next.js App Router / React 19): конструктор туров, подневный план, печать PDF-ваучера и песочница тестирования UZS-вебхуков.

---

## Быстрый старт

1. **Настройте переменные окружения** в `.env.local` (создан автоматически на основе `.env.example`):
   ```ini
   GOOGLE_GENAI_API_KEY=ваш_ключ_google_ai_studio
   GEMINI_ROUTING_MODEL=gemini-3.5-flash-lite
   GEMINI_PLANNING_MODEL=gemini-3.8
   DEFAULT_CURRENCY=UZS
   DIRECTOR_CONTACT_NAME="Цой Елена"
   DIRECTOR_CONTACT_PHONE="+998 777-77-77"
   ```
   *(Если `GOOGLE_GENAI_API_KEY` оставлен демонстрационным, система автоматически использует встроенный локальный движок генерации маршрутов по Узбекистану в UZS).*

2. **Запустите сервер разработки**:
   ```bash
   npm run dev
   ```
   Откройте [http://localhost:3000](http://localhost:3000) в браузере.

---

## Контактная плашка

На всех карточках подтверждения бронирования и PDF-ваучерах выводится фиксированный блок:
> **По вопросам бронирования: Директор Цой Елена, тел. +998 777-77-77.**
