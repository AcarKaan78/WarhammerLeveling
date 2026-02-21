// ============================================================================
// USE CASE: Execute Choice
// The master choice-resolution pipeline.
// ============================================================================

import {
  IStoryRepository,
  ICharacterRepository,
  IFactionRepository,
  INPCRepository,
  IInventoryRepository,
  IQuestRepository,
  IEventRepository,
} from '@/domain/interfaces';
import { Choice, ChoiceEffect } from '@/domain/models';
// processChoiceEffects no longer used — we build accurate notifications with difficulty scaling inline
import { performStatCheck } from '@/domain/engine/stats-engine';
import { calculateCrossEffects } from '@/domain/engine/faction-engine';
import { checkMutationThreshold } from '@/domain/engine/corruption-engine';
import { CONFIG } from '@/domain/config';
import type { Difficulty } from '@/domain/models/character';

export interface RerollContext {
  sceneId: string;
  choiceId: string;
  stat: string;
  difficulty: number;
  successScene: string;
  failureScene: string;
  baseXpGain: number;
  baseSanityChange: number;
  baseCorruptionChange: number;
  successFlags: string[];
  failureFlags: string[];
  wasCriticalFailure: boolean;
}

export interface ChoiceExecutionResult {
  success: boolean;
  skillCheckResult?: {
    roll: number; target: number; success: boolean;
    margin: number; criticalSuccess: boolean; criticalFailure: boolean;
  };
  notifications: string[];
  nextSceneId: string | null;
  triggerCombat?: { enemyIds: string[]; environment?: string };
  rerollContext?: RerollContext;
}

export class ExecuteChoiceUseCase {
  constructor(
    private storyRepo: IStoryRepository,
    private characterRepo: ICharacterRepository,
    private factionRepo: IFactionRepository,
    private npcRepo: INPCRepository,
    private inventoryRepo: IInventoryRepository,
    private questRepo: IQuestRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(
    characterId: number,
    sceneId: string,
    choice: Choice,
  ): Promise<ChoiceExecutionResult> {
    const character = await this.characterRepo.get(characterId);
    if (!character) throw new Error('Character not found');

    const notifications: string[] = [];
    let skillCheckResult: ChoiceExecutionResult['skillCheckResult'];
    let rerollContext: RerollContext | undefined;
    let effects = choice.effects;

    // 1. Handle skill check if present (apply game difficulty bonus)
    const diffSettings = CONFIG.difficulty[character.difficulty as Difficulty] ?? CONFIG.difficulty.standard;

    if (choice.skillCheck) {
      const statValue =
        (character.primaryStats as unknown as Record<string, number>)[choice.skillCheck.stat] ?? 25;
      const result = performStatCheck(statValue, choice.skillCheck.difficulty, [diffSettings.skillCheckBonus]);

      skillCheckResult = {
        roll: result.roll, target: result.target, success: result.success,
        margin: result.margin, criticalSuccess: result.criticalSuccess,
        criticalFailure: result.criticalFailure,
      };

      if (result.success && choice.skillCheck.successScene) {
        effects = { ...effects, nextScene: choice.skillCheck.successScene };
      } else if (!result.success && choice.skillCheck.failureScene) {
        effects = { ...effects, nextScene: choice.skillCheck.failureScene };
      }

      // Apply success/failure-specific flags
      if (result.success && effects.successFlags) {
        effects = { ...effects, setFlags: [...(effects.setFlags ?? []), ...effects.successFlags] };
      } else if (!result.success && effects.failureFlags) {
        effects = { ...effects, setFlags: [...(effects.setFlags ?? []), ...effects.failureFlags] };
      }

      // Skill check success/failure modifies the effects:
      // Success: halve negative effects, +50% XP bonus
      // Failure: increase negative effects by 50%, reduce XP
      // Critical: double the modifier
      if (result.success) {
        const mod = result.criticalSuccess ? 0.25 : 0.5;
        if (effects.sanityChange && effects.sanityChange < 0) {
          effects = { ...effects, sanityChange: Math.round(effects.sanityChange * mod) };
        }
        if (effects.corruptionChange && effects.corruptionChange > 0) {
          effects = { ...effects, corruptionChange: Math.round(effects.corruptionChange * mod) };
        }
        if (effects.xpGain) {
          const xpMod = result.criticalSuccess ? 2.5 : 1.5;
          effects = { ...effects, xpGain: Math.round(effects.xpGain * xpMod) };
        }
      } else {
        const mod = result.criticalFailure ? 2.0 : 1.5;
        if (effects.sanityChange && effects.sanityChange < 0) {
          effects = { ...effects, sanityChange: Math.round(effects.sanityChange * mod) };
        }
        if (effects.corruptionChange && effects.corruptionChange > 0) {
          effects = { ...effects, corruptionChange: Math.round(effects.corruptionChange * mod) };
        }
        if (effects.xpGain) {
          effects = { ...effects, xpGain: Math.round(effects.xpGain * 0.5) };
        }

        // Build reroll context so player can spend Thrones to retry
        rerollContext = {
          sceneId,
          choiceId: choice.id,
          stat: choice.skillCheck.stat,
          difficulty: choice.skillCheck.difficulty,
          successScene: choice.skillCheck.successScene ?? choice.effects.nextScene ?? sceneId,
          failureScene: choice.skillCheck.failureScene ?? choice.effects.nextScene ?? sceneId,
          baseXpGain: choice.effects.xpGain ?? 0,
          baseSanityChange: choice.effects.sanityChange ?? 0,
          baseCorruptionChange: choice.effects.corruptionChange ?? 0,
          successFlags: choice.effects.successFlags ?? [],
          failureFlags: choice.effects.failureFlags ?? [],
          wasCriticalFailure: result.criticalFailure,
        };
      }
    }

    // 2. Build accurate notifications (with difficulty scaling applied)
    if (effects.xpGain) {
      const scaledXP = Math.round(effects.xpGain * diffSettings.xpGain);
      notifications.push(`+${scaledXP} XP`);
    }
    if (effects.throneChange) {
      if (effects.throneChange > 0) notifications.push(`+${effects.throneChange} Thrones`);
      else notifications.push(`${effects.throneChange} Thrones`);
    }
    if (effects.sanityChange) {
      const scaled = effects.sanityChange < 0
        ? Math.round(effects.sanityChange * diffSettings.sanityDrain) : effects.sanityChange;
      if (scaled > 0) notifications.push(`+${scaled} Sanity`);
      else notifications.push(`${scaled} Sanity`);
    }
    if (effects.corruptionChange) {
      const scaled = Math.round(effects.corruptionChange * diffSettings.corruptionGain);
      if (scaled > 0) notifications.push(`+${scaled} Corruption`);
      else notifications.push(`${scaled} Corruption`);
    }
    if (effects.addItems && effects.addItems.length > 0) {
      notifications.push(`Received: ${effects.addItems.join(', ')}`);
    }
    if (effects.setFlags) {
      // Don't notify about internal flags, but we can note key ones
    }

    // 3. Apply flags
    if (effects.setFlags) {
      for (const flag of effects.setFlags) {
        await this.storyRepo.setFlag(characterId, flag, true);
      }
    }
    if (effects.removeFlags) {
      for (const flag of effects.removeFlags) {
        await this.storyRepo.setFlag(characterId, flag, false);
      }
    }

    // 4. Apply stat / resource changes
    const characterUpdates: Record<string, unknown> = {};

    if (effects.xpGain) {
      characterUpdates.xp = character.xp + Math.round(effects.xpGain * diffSettings.xpGain);
    }
    if (effects.throneChange) {
      characterUpdates.thrones = Math.max(0, character.thrones + effects.throneChange);
    }
    if (effects.sanityChange) {
      const scaledSanity = effects.sanityChange < 0
        ? Math.round(effects.sanityChange * diffSettings.sanityDrain)
        : effects.sanityChange;
      characterUpdates.sanity = Math.max(0,
        Math.min(character.sanityMax, character.sanity + scaledSanity));
    }
    if (effects.corruptionChange) {
      const scaledCorruption = Math.round(effects.corruptionChange * diffSettings.corruptionGain);
      const oldCorruption = character.corruption;
      const newCorruption = Math.max(0, Math.min(100, character.corruption + scaledCorruption));
      characterUpdates.corruption = newCorruption;
      if (checkMutationThreshold(oldCorruption, newCorruption)) {
        notifications.push('You feel the warp twisting your flesh... A mutation manifests!');
      }
    }
    if (effects.statChanges) {
      await this.characterRepo.updateStats(characterId, effects.statChanges as any);
    }
    if (Object.keys(characterUpdates).length > 0) {
      await this.characterRepo.update(characterId, characterUpdates as any);
    }

    // 5. Apply faction reputation changes with cross-effects
    if (effects.factionRepChanges) {
      for (const [factionId, change] of Object.entries(effects.factionRepChanges)) {
        await this.factionRepo.updateReputation(characterId, factionId, change);
        const crossEffects = calculateCrossEffects(factionId, change);
        for (const [crossFaction, crossChange] of Object.entries(crossEffects)) {
          await this.factionRepo.updateReputation(characterId, crossFaction, crossChange);
        }
      }
    }

    // 6. Apply NPC relationship changes
    if (effects.npcRelationshipChanges) {
      for (const [npcId, changes] of Object.entries(effects.npcRelationshipChanges)) {
        await this.npcRepo.updateRelationship(npcId, changes as any);
      }
    }

    // 7. Apply quest changes
    if (effects.startQuest) {
      await this.questRepo.create(characterId, {
        id: effects.startQuest, title: effects.startQuest,
        description: '', giver: null, factionId: null,
        status: 'active', objectives: [],
        rewards: { xp: 0, thrones: 0, items: [], factionRep: {}, traits: [], flags: [] },
        failureConsequences: {}, deadline: null, startDay: 1, completedDay: null, chainNext: null,
      });
    }
    if (effects.completeQuest) {
      await this.questRepo.update(characterId, effects.completeQuest, { status: 'completed' } as any);
    }
    if (effects.failQuest) {
      await this.questRepo.update(characterId, effects.failQuest, { status: 'failed' } as any);
    }
    if (effects.updateQuest) {
      const quest = await this.questRepo.getById(characterId, effects.updateQuest.questId);
      if (quest) {
        const updatedObjectives = quest.objectives.map(obj =>
          obj.id === effects.updateQuest!.objectiveId
            ? { ...obj, completed: effects.updateQuest!.complete } : obj);
        await this.questRepo.update(characterId, effects.updateQuest.questId,
          { objectives: updatedObjectives } as any);
      }
    }

    // 8. Inventory changes
    if (effects.addItems) {
      for (const itemId of effects.addItems) {
        await this.inventoryRepo.add(characterId, {
          item: { id: itemId, name: itemId, description: '',
            category: 'key_item', weight: 0, basePrice: 0,
            rarity: 'common', stackable: false, maxStack: 1,
            requirements: {}, properties: {} },
          quantity: 1, condition: 100, conditionMax: 100, equipped: false, slot: null,
        });
      }
    }
    if (effects.removeItems) {
      const allItems = await this.inventoryRepo.getAll(characterId);
      for (const itemId of effects.removeItems) {
        const found = allItems.find(inv => inv.item.id === itemId);
        if (found) await this.inventoryRepo.remove(found.instanceId);
      }
    }

    // 9. Kill NPC
    if (effects.killNpc) {
      const npc = await this.npcRepo.getById(effects.killNpc);
      if (npc) {
        await this.npcRepo.update(effects.killNpc, { isAlive: false });
        notifications.push(`${npc.name} has died.`);
      }
    }

    // 10. Scheduled consequence
    if (effects.scheduledConsequence) {
      await this.eventRepo.createConsequence({
        characterId, source: sceneId, triggerType: 'game_day',
        triggerValue: effects.scheduledConsequence.triggerDay,
        consequenceType: effects.scheduledConsequence.type as any,
        data: effects.scheduledConsequence.data, createdDay: 1, expiresDay: null,
      });
    }

    // 11. Record choice in story state
    await this.storyRepo.addChoiceHistory(characterId, {
      sceneId, choiceId: choice.id, timestamp: new Date(),
    });
    await this.storyRepo.addVisitedScene(characterId, sceneId);

    // 12. Log event
    await this.eventRepo.logEvent(characterId, {
      eventType: 'choice_made', title: 'Story Choice',
      description: `Made choice: ${choice.text}`,
      data: { sceneId, choiceId: choice.id }, gameDay: 1,
    });

    return {
      success: true, skillCheckResult, notifications,
      nextSceneId: effects.nextScene ?? null, triggerCombat: effects.triggerCombat,
      rerollContext,
    };
  }

  async reroll(
    characterId: number,
    ctx: RerollContext,
  ): Promise<ChoiceExecutionResult> {
    const character = await this.characterRepo.get(characterId);
    if (!character) throw new Error('Character not found');

    if (character.thrones < CONFIG.economy.rerollCost) {
      throw new Error('Not enough Thrones');
    }

    const diffSettings = CONFIG.difficulty[character.difficulty as Difficulty] ?? CONFIG.difficulty.standard;
    const statValue =
      (character.primaryStats as unknown as Record<string, number>)[ctx.stat] ?? 25;
    const result = performStatCheck(statValue, ctx.difficulty, [diffSettings.skillCheckBonus]);

    // Rerolls use standard scaling only — no crit bonuses (prevents crit fishing)
    const skillCheckResult = {
      roll: result.roll, target: result.target, success: result.success,
      margin: result.margin, criticalSuccess: false, criticalFailure: false,
    };

    const notifications: string[] = [`-${CONFIG.economy.rerollCost} Thrones (reroll)`];
    const updates: Record<string, unknown> = {
      thrones: character.thrones - CONFIG.economy.rerollCost,
    };

    if (!result.success) {
      // Still failed — only thrones lost, no other changes
      await this.characterRepo.update(characterId, updates as any);
      return {
        success: true, skillCheckResult, notifications,
        nextSceneId: ctx.failureScene,
      };
    }

    // SUCCESS — compute delta between what failure applied and what success would apply
    const failMod = ctx.wasCriticalFailure ? 2.0 : 1.5;

    if (ctx.baseXpGain) {
      const failXP = Math.round(ctx.baseXpGain * 0.5);
      const successXP = Math.round(ctx.baseXpGain * 1.5);
      const xpDelta = Math.round((successXP - failXP) * diffSettings.xpGain);
      updates.xp = character.xp + xpDelta;
      notifications.push(`+${xpDelta} XP`);
    }

    if (ctx.baseSanityChange && ctx.baseSanityChange < 0) {
      const failApplied = Math.round(Math.round(ctx.baseSanityChange * failMod) * diffSettings.sanityDrain);
      const successApplied = Math.round(Math.round(ctx.baseSanityChange * 0.5) * diffSettings.sanityDrain);
      const sanityDelta = successApplied - failApplied; // positive = recovery
      updates.sanity = Math.max(0, Math.min(character.sanityMax, character.sanity + sanityDelta));
      if (sanityDelta > 0) notifications.push(`+${sanityDelta} Sanity`);
    }

    if (ctx.baseCorruptionChange && ctx.baseCorruptionChange > 0) {
      const failApplied = Math.round(Math.round(ctx.baseCorruptionChange * failMod) * diffSettings.corruptionGain);
      const successApplied = Math.round(Math.round(ctx.baseCorruptionChange * 0.5) * diffSettings.corruptionGain);
      const corruptionDelta = successApplied - failApplied; // negative = reduction
      updates.corruption = Math.max(0, Math.min(100, character.corruption + corruptionDelta));
      if (corruptionDelta < 0) notifications.push(`${corruptionDelta} Corruption`);
    }

    await this.characterRepo.update(characterId, updates as any);

    // Swap flags: remove failure flags, add success flags
    for (const flag of ctx.failureFlags) {
      await this.storyRepo.setFlag(characterId, flag, false);
    }
    for (const flag of ctx.successFlags) {
      await this.storyRepo.setFlag(characterId, flag, true);
    }

    // Log reroll event
    await this.eventRepo.logEvent(characterId, {
      eventType: 'choice_made', title: 'Skill Check Reroll',
      description: `Rerolled ${ctx.stat} check — SUCCESS`,
      data: { sceneId: ctx.sceneId, choiceId: ctx.choiceId, reroll: true }, gameDay: 1,
    });

    return {
      success: true, skillCheckResult, notifications,
      nextSceneId: ctx.successScene,
      // No rerollContext — prevents re-reroll
    };
  }
}
