import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createContainer } from '@/infrastructure/di/container';
import { calculateInitialStats } from '@/domain/engine/stats-engine';
import { CONFIG } from '@/domain/config';
import { GameStateService } from '@/application/services/game-state-service';
import { loadAllNPCs } from '@/infrastructure/data-loader/npc-loader';
import { AllocateStatPointUseCase } from '@/application/use-cases/character/allocate-stat-point';
import type { PrimaryStatKey } from '@/domain/models';
import type { Container } from '@/infrastructure/di/container';

async function seedNPCsAndFactions(container: Container, characterId: number) {
  // Seed factions from CONFIG
  const factionIds = Object.keys(CONFIG.factionCrossEffects);
  for (const factionId of factionIds) {
    const existing = await container.repos.faction.get(characterId, factionId);
    if (!existing) {
      await container.repos.faction.initialize({
        characterId,
        factionId,
        reputation: 0,
        standing: 'neutral',
        lastChange: new Date(),
      });
    }
  }

  // Seed NPCs from data/npcs/*.json
  const allNPCs = loadAllNPCs();
  for (const npc of allNPCs) {
    const existing = await container.repos.npc.getById(npc.id);
    if (!existing) {
      await container.repos.npc.create(characterId, npc);
    }
  }
}

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
      // Resolve character ID — either from ?id= param or by fetching the save's character
      let cid = characterId ? parseInt(characterId) : undefined;
      if (!cid) {
        const char = await container.repos.character.get();
        if (char) cid = char.id;
      }

      // Auto-seed NPCs and factions if missing (for existing characters)
      if (cid) {
        const existingFactions = await container.repos.faction.getAll(cid);
        const existingNPCs = await container.repos.npc.getAll(cid);
        if (existingFactions.length === 0 || existingNPCs.length === 0) {
          await seedNPCsAndFactions(container, cid);
        }
      }

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
      const state = await gameStateService.getFullState(cid as number);
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
    await seedNPCsAndFactions(container, character.id);

    return NextResponse.json(character, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, characterId, saveName = 'current', stat, points = 1 } = body;
    const container = createContainer(saveName);

    if (action === 'allocate_stat') {
      const useCase = new AllocateStatPointUseCase(container.repos.character);
      const result = await useCase.execute(characterId, stat as PrimaryStatKey, points);
      if (!result.success) {
        return NextResponse.json({ error: result.reason }, { status: 400 });
      }
      return NextResponse.json(result.character);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
