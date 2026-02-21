import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createContainer } from '@/infrastructure/di/container';
import { ExecuteChoiceUseCase, type RerollContext } from '@/application/use-cases/narrative/execute-choice';
import { GetAvailableScenesUseCase } from '@/application/use-cases/narrative/get-available-scenes';
import { VariableSubstituteUseCase } from '@/application/use-cases/narrative/variable-substitute';
import { loadScene, loadAllScenes } from '@/infrastructure/data-loader/scene-loader';
import type { GameStateForNarrative } from '@/domain/engine/narrative-engine';
import { filterAvailableChoices } from '@/domain/engine/narrative-engine';

const ExecuteChoiceSchema = z.object({
  characterId: z.number().int(),
  sceneId: z.string(),
  choiceId: z.string(),
  saveName: z.string().default('current'),
});

const RerollSchema = z.object({
  characterId: z.number().int(),
  saveName: z.string().default('current'),
  rerollContext: z.object({
    sceneId: z.string(),
    choiceId: z.string(),
    stat: z.string(),
    difficulty: z.number(),
    successScene: z.string(),
    failureScene: z.string(),
    baseXpGain: z.number(),
    baseSanityChange: z.number(),
    baseCorruptionChange: z.number(),
    successFlags: z.array(z.string()),
    failureFlags: z.array(z.string()),
    wasCriticalFailure: z.boolean(),
  }),
});

export async function GET(request: NextRequest) {
  try {
    const saveName = request.nextUrl.searchParams.get('save') ?? 'current';
    const characterId = parseInt(request.nextUrl.searchParams.get('characterId') ?? '0');
    const sceneId = request.nextUrl.searchParams.get('sceneId');
    const container = createContainer(saveName);

    // Load a specific scene
    if (sceneId) {
      const scene = loadScene(sceneId);
      if (!scene) {
        return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
      }

      // Apply variable substitution and choice filtering if character exists
      if (characterId) {
        const character = await container.repos.character.get(characterId);
        const storyState = await container.repos.story.get(characterId);
        if (character && storyState) {
          const substitutor = new VariableSubstituteUseCase();
          const variables: Record<string, string | number> = {
            playerName: character.name,
            level: character.level,
            location: character.currentLocation,
            thrones: character.thrones,
            ...storyState.variables,
          };
          const flags = storyState.flags as Record<string, boolean>;
          const filteredBlocks = scene.blocks.filter(block => {
            if (block.requiredFlags && block.requiredFlags.length > 0) {
              if (!block.requiredFlags.every(f => flags[f])) return false;
            }
            if (block.forbiddenFlags && block.forbiddenFlags.length > 0) {
              if (block.forbiddenFlags.some(f => flags[f])) return false;
            }
            return true;
          });
          const processedBlocks = filteredBlocks.map(block => ({
            ...block,
            text: substitutor.execute(block.text, variables),
          }));

          // Build game state for choice filtering
          const factions = await container.repos.faction.getAll(characterId);
          const factionReps: Record<string, number> = {};
          for (const f of factions) factionReps[f.factionId] = f.reputation;

          const gameState: GameStateForNarrative = {
            level: character.level,
            systemLevel: character.systemLevel,
            flags: storyState.flags as Record<string, boolean>,
            primaryStats: character.primaryStats as unknown as Record<string, number>,
            factionReps,
            npcStates: {},
            sanity: character.sanity,
            corruption: character.corruption,
            mutations: [],
            activeQuests: [],
            completedQuests: [],
            variables: storyState.variables as Record<string, string | number>,
            playerName: character.name,
            thrones: character.thrones,
            inventory: [],
          };

          // Filter choices with visibility info
          const filtered = filterAvailableChoices(scene.choices, gameState, character.systemLevel);
          const annotatedChoices = filtered.map(({ choice, visibility }) => ({
            ...choice,
            _visibility: visibility,
          }));

          return NextResponse.json({ ...scene, blocks: processedBlocks, choices: annotatedChoices });
        }
      }

      return NextResponse.json(scene);
    }

    // Get available scenes for the character
    if (characterId) {
      const allScenes = loadAllScenes();
      const character = await container.repos.character.get(characterId);
      const storyState = await container.repos.story.get(characterId);
      const factions = await container.repos.faction.getAll(characterId);

      if (!character || !storyState) {
        return NextResponse.json({ error: 'Character or story state not found' }, { status: 404 });
      }

      const factionReps: Record<string, number> = {};
      for (const f of factions) {
        factionReps[f.factionId] = f.reputation;
      }

      const npcs = await container.repos.npc.getAll(characterId);
      const npcStates: Record<string, { isAlive: boolean; relationship: Record<string, number> }> = {};
      for (const npc of npcs) {
        npcStates[npc.name] = {
          isAlive: npc.isAlive,
          relationship: npc.relationship as unknown as Record<string, number>,
        };
      }

      const quests = await container.repos.quest.getAll(characterId);
      const activeQuests = quests.filter(q => q.status === 'active').map(q => q.id);
      const completedQuests = quests.filter(q => q.status === 'completed').map(q => q.id);

      const inventory = await container.repos.inventory.getAll(characterId);
      const inventoryIds = inventory.map(i => i.item.id);

      const gameState: GameStateForNarrative = {
        level: character.level,
        systemLevel: character.systemLevel,
        flags: storyState.flags as Record<string, boolean>,
        primaryStats: character.primaryStats as unknown as Record<string, number>,
        factionReps,
        npcStates,
        sanity: character.sanity,
        corruption: character.corruption,
        mutations: [],
        activeQuests,
        completedQuests,
        variables: storyState.variables as Record<string, string | number>,
        playerName: character.name,
        thrones: character.thrones,
        inventory: inventoryIds,
      };

      const useCase = new GetAvailableScenesUseCase();
      const available = await useCase.execute(allScenes, gameState);
      return NextResponse.json(available);
    }

    return NextResponse.json({ error: 'Provide characterId or sceneId' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = ExecuteChoiceSchema.parse(body);
    const container = createContainer(data.saveName);

    // Load the scene and find the choice
    const scene = loadScene(data.sceneId);
    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }
    const choice = scene.choices.find(c => c.id === data.choiceId);
    if (!choice) {
      return NextResponse.json({ error: 'Choice not found in scene' }, { status: 404 });
    }

    const useCase = new ExecuteChoiceUseCase(
      container.repos.story,
      container.repos.character,
      container.repos.faction,
      container.repos.npc,
      container.repos.inventory,
      container.repos.quest,
      container.repos.event,
    );

    const result = await useCase.execute(data.characterId, data.sceneId, choice);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data = RerollSchema.parse(body);
    const container = createContainer(data.saveName);

    const useCase = new ExecuteChoiceUseCase(
      container.repos.story,
      container.repos.character,
      container.repos.faction,
      container.repos.npc,
      container.repos.inventory,
      container.repos.quest,
      container.repos.event,
    );

    const result = await useCase.reroll(data.characterId, data.rerollContext as RerollContext);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
