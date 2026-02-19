import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createContainer } from '@/infrastructure/di/container';
import { UnlockPowerUseCase } from '@/application/use-cases/psychic/unlock-power';
import { UsePowerUseCase } from '@/application/use-cases/psychic/use-power';
import { loadPsychicPowers } from '@/infrastructure/data-loader';
import type { PsychicPower } from '@/domain/models';

const UnlockSchema = z.object({
  characterId: z.number().int(),
  powerId: z.string(),
  gameDay: z.number().int().default(1),
  saveName: z.string().default('current'),
});

const UseSchema = z.object({
  characterId: z.number().int(),
  powerId: z.string(),
  difficulty: z.number().default(0),
  modifiers: z.array(z.number()).default([]),
  gameDay: z.number().int().default(1),
  saveName: z.string().default('current'),
});

// GET: fetch unlocked powers for a character
export async function GET(request: NextRequest) {
  try {
    const saveName = request.nextUrl.searchParams.get('save') ?? 'current';
    const characterId = parseInt(request.nextUrl.searchParams.get('characterId') ?? '0');
    if (!characterId) {
      return NextResponse.json({ error: 'characterId required' }, { status: 400 });
    }

    const container = createContainer(saveName);
    const records = await container.repos.psychic.getUnlocked(characterId);

    return NextResponse.json({
      unlockedPowerIds: records.map(r => r.powerId),
      powers: records,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: unlock or use a psychic power
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === 'unlock') {
      const data = UnlockSchema.parse(body);
      const container = createContainer(data.saveName);

      // Find the power in data
      const allPowers = loadPsychicPowers() as PsychicPower[];
      const power = allPowers.find(p => p.id === data.powerId);
      if (!power) {
        return NextResponse.json({ error: 'Power not found' }, { status: 404 });
      }

      // Get currently unlocked power IDs
      const unlockedRecords = await container.repos.psychic.getUnlocked(data.characterId);
      const unlockedPowerIds = unlockedRecords.map(r => r.powerId);

      // Run use case validation
      const useCase = new UnlockPowerUseCase(container.repos.character, container.repos.event);
      const result = await useCase.execute({
        characterId: data.characterId,
        power,
        unlockedPowerIds,
        gameDay: data.gameDay,
      });

      if (!result.unlocked) {
        return NextResponse.json({ success: false, reason: result.reason }, { status: 400 });
      }

      // Persist the unlock
      await container.repos.psychic.unlock(
        data.characterId,
        power.id,
        power.discipline,
        power.name,
        power.tier,
      );

      return NextResponse.json({ success: true, powerId: power.id });
    }

    if (action === 'use') {
      const data = UseSchema.parse(body);
      const container = createContainer(data.saveName);

      // Find the power
      const allPowers = loadPsychicPowers() as PsychicPower[];
      const power = allPowers.find(p => p.id === data.powerId);
      if (!power) {
        return NextResponse.json({ error: 'Power not found' }, { status: 404 });
      }

      // Check it's unlocked
      const isUnlocked = await container.repos.psychic.isUnlocked(data.characterId, data.powerId);
      if (!isUnlocked) {
        return NextResponse.json({ error: 'Power not unlocked' }, { status: 400 });
      }

      // Use the power
      const useCase = new UsePowerUseCase(container.repos.character, container.repos.event);
      const result = await useCase.execute({
        characterId: data.characterId,
        power,
        difficulty: data.difficulty,
        modifiers: data.modifiers,
        gameDay: data.gameDay,
      });

      // Track usage
      await container.repos.psychic.incrementUsage(data.characterId, data.powerId);

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown action. Use: unlock, use' }, { status: 400 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
