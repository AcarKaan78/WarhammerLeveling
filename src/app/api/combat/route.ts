import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createContainer } from '@/infrastructure/di/container';
import { InitCombatUseCase } from '@/application/use-cases/combat/init-combat';
import { ExecuteActionUseCase } from '@/application/use-cases/combat/execute-action';
import { ResolveCombatUseCase } from '@/application/use-cases/combat/resolve-combat';
import { ProcessAITurnUseCase } from '@/application/use-cases/combat/process-ai-turn';
import { CombatAction } from '@/domain/models';

const CombatantSchema = z.object({
  id: z.string(),
  name: z.string(),
  isPlayer: z.boolean(),
  isCompanion: z.boolean(),
  hp: z.number(),
  hpMax: z.number(),
  primaryStats: z.object({
    weaponSkill: z.number(),
    ballisticSkill: z.number(),
    strength: z.number(),
    toughness: z.number(),
    agility: z.number(),
    intelligence: z.number(),
    perception: z.number(),
    willpower: z.number(),
    fellowship: z.number(),
  }),
  weapon: z.object({
    name: z.string(),
    damage: z.number(),
    accuracy: z.number(),
    armorPenetration: z.number(),
    range: z.string(),
    rateOfFire: z.number(),
    condition: z.number(),
  }),
  armor: z.object({
    name: z.string(),
    protection: z.number(),
    locations: z.array(z.string()),
  }),
  wounds: z.array(z.any()).default([]),
  statusEffects: z.array(z.string()).default([]),
  initiative: z.number(),
  position: z.number(),
  aiType: z.string().optional(),
  isAiming: z.boolean().default(false),
  isDefending: z.boolean().default(false),
  isOverwatching: z.boolean().default(false),
});

const InitCombatSchema = z.object({
  characterId: z.number().int(),
  playerCombatant: CombatantSchema,
  companions: z.array(CombatantSchema).default([]),
  enemies: z.array(CombatantSchema).min(1),
  environmentModifiers: z.array(z.object({
    name: z.string(),
    effect: z.string(),
    modifier: z.number(),
  })).default([]),
  gameDay: z.number().int(),
  saveName: z.string().default('current'),
});

const ActionSchema = z.object({
  combatState: z.any(),
  actorId: z.string(),
  combatAction: z.nativeEnum(CombatAction),
  targetId: z.string().optional(),
  params: z.record(z.unknown()).optional(),
});

const ResolveSchema = z.object({
  characterId: z.number().int(),
  combatState: z.any(),
  gameDay: z.number().int(),
  saveName: z.string().default('current'),
});

const AITurnSchema = z.object({
  combatState: z.any(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === 'init') {
      const data = InitCombatSchema.parse(body);
      const container = createContainer(data.saveName);
      const useCase = new InitCombatUseCase(container.repos.character, container.repos.event);
      const state = await useCase.execute({
        characterId: data.characterId,
        playerCombatant: data.playerCombatant as never,
        companions: data.companions as never,
        enemies: data.enemies as never,
        environmentModifiers: data.environmentModifiers,
        gameDay: data.gameDay,
      });
      return NextResponse.json(state);
    }

    if (action === 'execute') {
      const data = ActionSchema.parse(body);
      const useCase = new ExecuteActionUseCase();
      const result = await useCase.execute({
        combatState: data.combatState,
        actorId: data.actorId,
        action: data.combatAction,
        targetId: data.targetId,
        params: data.params,
      });
      return NextResponse.json(result);
    }

    if (action === 'resolve') {
      const data = ResolveSchema.parse(body);
      const container = createContainer(data.saveName);
      const useCase = new ResolveCombatUseCase(container.repos.character, container.repos.event);
      const result = await useCase.execute({
        characterId: data.characterId,
        combatState: data.combatState,
        gameDay: data.gameDay,
      });
      return NextResponse.json(result);
    }

    if (action === 'ai-turn') {
      const data = AITurnSchema.parse(body);
      const useCase = new ProcessAITurnUseCase();
      const result = await useCase.execute(data.combatState);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown action. Use: init, execute, resolve, ai-turn' }, { status: 400 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
