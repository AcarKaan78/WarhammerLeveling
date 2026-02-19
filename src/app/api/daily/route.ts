import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createContainer } from '@/infrastructure/di/container';
import { StartDayUseCase } from '@/application/use-cases/daily-session/start-day';
import { EndDayUseCase } from '@/application/use-cases/daily-session/end-day';
import { GetDailyBriefingUseCase } from '@/application/use-cases/daily-session/get-daily-briefing';
import { loadAllEvents } from '@/infrastructure/data-loader/event-loader';

const StartDaySchema = z.object({
  characterId: z.number().int(),
  saveName: z.string().default('current'),
});

const EndDaySchema = z.object({
  characterId: z.number().int(),
  saveName: z.string().default('current'),
});

export async function GET(request: NextRequest) {
  try {
    const saveName = request.nextUrl.searchParams.get('save') ?? 'current';
    const characterId = parseInt(request.nextUrl.searchParams.get('characterId') ?? '0');
    const container = createContainer(saveName);

    const useCase = new GetDailyBriefingUseCase(
      container.repos.character,
      container.repos.task,
      container.repos.event,
    );
    const briefing = await useCase.execute(characterId);
    return NextResponse.json(briefing);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === 'start-day') {
      const data = StartDaySchema.parse(body);
      const container = createContainer(data.saveName);
      const eventPool = loadAllEvents();
      const useCase = new StartDayUseCase(
        container.repos.character,
        container.repos.task,
        container.repos.event,
        container.repos.npc,
        container.repos.faction,
      );
      const briefing = await useCase.execute(data.characterId, eventPool);
      return NextResponse.json(briefing);
    }

    if (action === 'end-day') {
      const data = EndDaySchema.parse(body);
      const container = createContainer(data.saveName);
      const useCase = new EndDayUseCase(
        container.repos.character,
        container.repos.task,
        container.repos.event,
      );
      const summary = await useCase.execute(data.characterId);
      return NextResponse.json(summary);
    }

    return NextResponse.json({ error: 'Unknown action. Use: start-day, end-day' }, { status: 400 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
