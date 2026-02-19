import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createContainer } from '@/infrastructure/di/container';
import { calculateInitialStats } from '@/domain/engine/stats-engine';
import { CONFIG } from '@/domain/config';
import { GameStateService } from '@/application/services/game-state-service';

const CreateCharacterSchema = z.object({
  name: z.string().min(1).max(50),
  gender: z.enum(['male', 'female', 'nonbinary']),
  age: z.number().int().min(16).max(80),
  appearance: z.object({
    build: z.enum(['gaunt', 'lean', 'average', 'stocky', 'heavy']),
    height: z.enum(['short', 'average', 'tall']),
    distinguishingFeatures: z.string(),
  }),
  origin: z.enum(['hive_world', 'forge_world', 'agri_world', 'shrine_world', 'feral_world', 'void_born']),
  background: z.enum(['guard_veteran', 'clerk', 'underhive_scum', 'scholam_student', 'outcast_psyker', 'sanctioned_psyker', 'merchant', 'mechanicus_initiate']),
  personality1: z.enum(['stoic', 'hot_blooded', 'curious', 'paranoid', 'devout', 'pragmatic', 'compassionate', 'ambitious']),
  personality2: z.enum(['stoic', 'hot_blooded', 'curious', 'paranoid', 'devout', 'pragmatic', 'compassionate', 'ambitious']),
  bonusStatAllocations: z.record(z.number()).default({}),
  difficulty: z.enum(['narrative', 'standard', 'grimdark']),
  ironman: z.boolean().default(false),
  saveName: z.string().default('current'),
});

export async function GET(request: NextRequest) {
  try {
    const saveName = request.nextUrl.searchParams.get('save') ?? 'current';
    const characterId = request.nextUrl.searchParams.get('id');
    const container = createContainer(saveName);

    if (request.nextUrl.searchParams.get('full') === 'true') {
      const gameStateService = new GameStateService(
        container.repos.character,
        container.repos.task,
        container.repos.inventory,
        container.repos.story,
        container.repos.quest,
        container.repos.faction,
        container.repos.npc,
        container.repos.achievement,
        container.repos.event,
      );
      const state = await gameStateService.getFullState(characterId ? parseInt(characterId) : undefined as never);
      return NextResponse.json(state);
    }

    const character = await container.repos.character.get(characterId ? parseInt(characterId) : undefined);
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }
    return NextResponse.json(character);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateCharacterSchema.parse(body);
    const container = createContainer(data.saveName);

    const exists = await container.repos.character.exists();
    if (exists) {
      return NextResponse.json({ error: 'Character already exists for this save' }, { status: 409 });
    }

    const primaryStats = calculateInitialStats(
      data.origin,
      data.background,
      [data.personality1, data.personality2],
      data.bonusStatAllocations as Record<string, number>,
    );

    const hpMax = 10 + Math.floor(primaryStats.toughness / 2);
    const sanityStarting = (CONFIG.sanity.startingValues as Record<string, number>)[data.background] ?? 70;
    const sanity = sanityStarting;
    const thronesStarting = (CONFIG.economy.startingThrones as Record<string, number>)[data.background] ?? 50;
    const thrones = thronesStarting;
    const psyRating = (data.background === 'outcast_psyker' || data.background === 'sanctioned_psyker') ? 1 : 0;

    const character = await container.repos.character.create({
      ...data,
      primaryStats,
      hpMax,
      sanity,
      thrones,
      psyRating,
    });

    await container.repos.story.initialize(character.id);

    return NextResponse.json(character, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
