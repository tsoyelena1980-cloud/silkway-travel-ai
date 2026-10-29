import { NextRequest, NextResponse } from 'next/server';
import { generateTourPlan } from '@/lib/gemini';
import { assertIntegerUzs, itinerariesStore } from '@/lib/payment';
import { GenerateItineraryRequest, GenerateItineraryResponse } from '@/lib/types';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = (await req.json()) as GenerateItineraryRequest;

    if (!body.destination || typeof body.destination !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Поле destination обязательно для заполнения.' },
        { status: 400 }
      );
    }

    // Проверка запрета float-значений для бюджета в сумах (Раздел 5)
    assertIntegerUzs(body.budget_uzs, 'budget_uzs');

    const durationDays = Number(body.duration_days) || 3;
    const adults = Number(body.adults ?? body.travelers_count ?? 2);
    const children = Number(body.children ?? 0);
    const travelersCount = Number(body.travelers_count) || adults + children;
    const language = body.language === 'uz' || body.language === 'en' ? body.language : 'ru';

    const { plan, modelUsed, fallbackTriggered } = await generateTourPlan({
      destination: body.destination,
      duration_days: durationDays,
      travelers_count: travelersCount,
      adults,
      children,
      budget_uzs: Number(body.budget_uzs),
      interests: Array.isArray(body.interests) ? body.interests : ['история', 'национальная кухня'],
      special_requests: body.special_requests,
      language,
    });

    const itineraryId = crypto.randomUUID();
    const directorName = process.env.DIRECTOR_CONTACT_NAME || 'Цой Елена';
    const directorPhone = process.env.DIRECTOR_CONTACT_PHONE || '+998 777-77-77';

    const responseData: GenerateItineraryResponse = {
      success: true,
      meta: {
        model_used: modelUsed,
        fallback_triggered: fallbackTriggered,
        sanitized: true,
        execution_ms: Date.now() - startTime,
        language,
      },
      data: {
        itinerary_id: itineraryId,
        trip_title: plan.trip_title,
        summary: plan.summary,
        estimated_total_cost_uzs: plan.estimated_total_cost_uzs,
        daily_itinerary: plan.daily_itinerary,
        local_tips: plan.local_tips,
        support: {
          director: directorName,
          phone: directorPhone,
        },
      },
    };

    itinerariesStore.set(itineraryId, responseData.data);

    // Поддержка Server-Sent Events (Accept: text/event-stream) согласно Разделу 3.1
    const acceptHeader = req.headers.get('accept') || '';
    if (acceptHeader.includes('text/event-stream')) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            encoder.encode(
              `event: status\ndata: ${JSON.stringify({ stage: 'sanitizing_prompt', model: modelUsed })}\n\n`
            )
          );
          controller.enqueue(
            encoder.encode(`event: complete\ndata: ${JSON.stringify(responseData)}\n\n`)
          );
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка генерации маршрута';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
