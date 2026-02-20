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
import { processChoiceEffects } from '@/domain/engine/narrative-engine';
import { performStatCheck } from '@/domain/engine/stats-engine';
import { calculateCrossEffects } from '@/domain/engine/faction-engine';
import { checkMutationThreshold } from '@/domain/engine/corruption-engine';
import { CONFIG } from '@/domain/config';
import type { Difficulty } from '@/domain/models/character';

export interface ChoiceExecutionResult {
  success: boolean;
  skillCheckResult?: {
    roll: number; target: number; success: boolean;
    margin: number; criticalSuccess: boolean; criticalFailure: boolean;
  };
  notifications: string[];
  nextSceneId: string | null;
  triggerCombat?: { enemyIds: string[]; environment?: string };
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

      notifications.push(
        result.success
          ? `Skill check passed! (rolled ${result.roll} vs ${result.target})`
          : `Skill check failed. (rolled ${result.roll} vs ${result.target})`,
      );
    }

    // 2. Process effects
    const effectNotifications = processChoiceEffects(effects);
    notifications.push(...effectNotifications.notifications);

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
    };
  }
}
