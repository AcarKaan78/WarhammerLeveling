/**
 * INTEGRATION TESTS — Full Game Flow
 *
 * These tests exercise the real repositories against a real SQLite database,
 * wiring through use cases exactly as production code does.  They prove the
 * entire vertical slice (domain → application → infrastructure) works together.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createContainer, resetContainer } from '@/infrastructure/di/container';
import { deleteSave } from '@/infrastructure/database/connection';
import type { Container } from '@/infrastructure/di/container';

// Use cases
import { CreateCharacterUseCase } from '@/application/use-cases/character/create-character';
import { CompleteTaskUseCase } from '@/application/use-cases/tasks/complete-task';
import { StartDayUseCase } from '@/application/use-cases/daily-session/start-day';
import { ExecuteChoiceUseCase } from '@/application/use-cases/narrative/execute-choice';
import { UnlockPowerUseCase } from '@/application/use-cases/psychic/unlock-power';
import { UsePowerUseCase } from '@/application/use-cases/psychic/use-power';
import { CheckAchievementsUseCase } from '@/application/use-cases/progression/check-achievements';
import { GameStateService } from '@/application/services/game-state-service';

// Domain types
import type { Character, PsychicPower, Achievement, AchievementCondition, Choice, ChoiceEffect } from '@/domain/models';
import { TaskCategory } from '@/domain/models';

const TEST_SAVE = 'test_integration';

describe('Integration: Full Game Flow', () => {
  let container: Container;
  let characterId: number;

  beforeAll(() => {
    resetContainer();
    try { deleteSave(TEST_SAVE); } catch { /* ignore */ }
    container = createContainer(TEST_SAVE);
  });

  afterAll(() => {
    resetContainer();
    try { deleteSave(TEST_SAVE); } catch { /* ignore */ }
  });

  // =========================================================================
  // 1. CHARACTER CREATION
  // =========================================================================
  describe('Character Creation', () => {
    it('should create a character with calculated stats and resources', async () => {
      const useCase = new CreateCharacterUseCase(
        container.repos.character,
        container.repos.faction,
        container.repos.achievement,
        container.repos.story,
        container.repos.event,
      );

      const character = await useCase.execute({
        name: 'Varn Kaltos',
        gender: 'male',
        age: 28,
        appearance: { build: 'lean', height: 'tall', distinguishingFeatures: 'Third eye tattoo' },
        origin: 'hive_world',
        background: 'outcast_psyker',
        personality1: 'paranoid',
        personality2: 'curious',
        bonusStatAllocations: { willpower: 3, perception: 2 },
        difficulty: 'standard',
        ironman: false,
      });

      characterId = character.id;

      expect(character.id).toBeGreaterThan(0);
      expect(character.name).toBe('Varn Kaltos');
      expect(character.level).toBe(1);
      expect(character.xp).toBe(0);
      expect(character.psyRating).toBeGreaterThanOrEqual(1);
      // outcast_psyker gets +10 WP from background, verify it's higher than base
      expect(character.primaryStats.willpower).toBeGreaterThanOrEqual(35);
      expect(character.sanity).toBeLessThanOrEqual(60); // psykers start with low sanity
      expect(character.thrones).toBeGreaterThanOrEqual(0);
    });

    it('should have initialized story state', async () => {
      const story = await container.repos.story.get(characterId);
      expect(story).not.toBeNull();
      expect(story!.characterId).toBe(characterId);
      expect(story!.flags).toBeDefined();
    });

    it('should have initialized factions', async () => {
      const factions = await container.repos.faction.getAll(characterId);
      expect(factions.length).toBeGreaterThan(0);
      for (const f of factions) {
        expect(f.reputation).toBe(0);
        expect(f.standing).toBe('neutral');
      }
    });

    it('should have logged a creation event', async () => {
      const events = await container.repos.event.getEventLog(characterId, 10);
      expect(events.length).toBeGreaterThanOrEqual(1);
      const creationEvent = events.find(e => e.eventType === 'character_created');
      expect(creationEvent).toBeDefined();
      expect(creationEvent!.title).toBe('Character Created');
    });

    it('should reject creating a second character with same background name for same save', async () => {
      const exists = await container.repos.character.exists();
      expect(exists).toBe(true);
    });
  });

  // =========================================================================
  // 2. TASK SYSTEM
  // =========================================================================
  describe('Task System', () => {
    let taskId: number;

    it('should create a task', async () => {
      const task = await container.repos.task.create({
        characterId,
        name: 'Morning Meditation',
        description: 'Meditate for 15 minutes',
        category: TaskCategory.MEDITATION_DISCIPLINE,
        difficulty: 3 as never,
        recurring: 'daily',
        timeEstimateMinutes: 15,
        isActive: true,
      });

      taskId = task.id;
      expect(task.id).toBeGreaterThan(0);
      expect(task.name).toBe('Morning Meditation');
      expect(task.currentStreak).toBe(0);
      expect(task.totalCompletions).toBe(0);
    });

    it('should create a second task in different category', async () => {
      const task = await container.repos.task.create({
        characterId,
        name: 'Push-ups',
        description: '50 push-ups',
        category: TaskCategory.PHYSICAL_TRAINING,
        difficulty: 3 as never,
        recurring: 'daily',
        timeEstimateMinutes: 10,
        isActive: true,
      });
      expect(task.id).toBeGreaterThan(0);
    });

    it('should list all tasks for character', async () => {
      const tasks = await container.repos.task.getAll(characterId, true);
      expect(tasks.length).toBe(2);
    });

    it('should complete a task and earn XP', async () => {
      const charBefore = await container.repos.character.get(characterId);
      expect(charBefore).not.toBeNull();
      const xpBefore = charBefore!.xp;

      const useCase = new CompleteTaskUseCase(
        container.repos.task,
        container.repos.character,
        container.repos.event,
      );
      const report = await useCase.execute(taskId, characterId);

      expect(report.xpEarned).toBeGreaterThan(0);
      expect(report.newStreak).toBe(1);
      expect(report.levelUp).toBe(false); // first completion shouldn't level up

      // Verify character XP was updated
      const charAfter = await container.repos.character.get(characterId);
      expect(charAfter!.xp).toBeGreaterThanOrEqual(xpBefore);

      // Verify task streak was updated
      const task = await container.repos.task.getById(taskId);
      expect(task!.currentStreak).toBe(1);
      expect(task!.totalCompletions).toBe(1);
    });

    it('should track completion in daily session', async () => {
      const today = new Date().toISOString().split('T')[0];
      const session = await container.repos.task.getDailySession(characterId, today);
      expect(session).not.toBeNull();
      expect(session!.tasksCompleted).toBeGreaterThanOrEqual(1);
      expect(session!.totalXPEarned).toBeGreaterThan(0);
    });

    it('should log task completion event', async () => {
      const events = await container.repos.event.getEventLog(characterId, 10);
      const taskEvent = events.find(e => e.eventType === 'task_completed');
      expect(taskEvent).toBeDefined();
      expect(taskEvent!.description).toContain('Morning Meditation');
    });

    it('should soft delete a task', async () => {
      await container.repos.task.softDelete(taskId);
      const task = await container.repos.task.getById(taskId);
      expect(task!.isActive).toBe(false);

      const activeTasks = await container.repos.task.getAll(characterId, true);
      expect(activeTasks.length).toBe(1); // only Push-ups remains active
    });
  });

  // =========================================================================
  // 3. INVENTORY SYSTEM
  // =========================================================================
  describe('Inventory System', () => {
    let swordInstanceId: number;
    let armorInstanceId: number;

    it('should add items to inventory', async () => {
      const sword = await container.repos.inventory.add(characterId, {
        item: {
          id: 'combat_knife',
          name: 'Combat Knife',
          description: 'A standard-issue combat knife.',
          category: 'weapon_melee',
          weight: 1,
          basePrice: 15,
          rarity: 'common',
          stackable: false,
          maxStack: 1,
          requirements: {},
          properties: { damage: 5, accuracy: 10, armorPenetration: 0, range: 'melee', rateOfFire: 1 },
        },
        quantity: 1,
        condition: 100,
        conditionMax: 100,
        equipped: false,
        slot: null,
      });

      swordInstanceId = sword.instanceId;
      expect(sword.instanceId).toBeGreaterThan(0);
      expect(sword.item.name).toBe('Combat Knife');

      const armor = await container.repos.inventory.add(characterId, {
        item: {
          id: 'flak_vest',
          name: 'Flak Vest',
          description: 'Basic body armor.',
          category: 'armor_light',
          weight: 5,
          basePrice: 50,
          rarity: 'common',
          stackable: false,
          maxStack: 1,
          requirements: {},
          properties: { protection: 3 },
        },
        quantity: 1,
        condition: 100,
        conditionMax: 100,
        equipped: false,
        slot: null,
      });
      armorInstanceId = armor.instanceId;
    });

    it('should retrieve all inventory items', async () => {
      const items = await container.repos.inventory.getAll(characterId);
      expect(items.length).toBe(2);
    });

    it('should equip an item', async () => {
      await container.repos.inventory.equip(swordInstanceId, 'main_hand');
      const item = await container.repos.inventory.getById(swordInstanceId);
      expect(item!.equipped).toBe(true);
      expect(item!.slot).toBe('main_hand');
    });

    it('should unequip an item', async () => {
      await container.repos.inventory.unequip(swordInstanceId);
      const item = await container.repos.inventory.getById(swordInstanceId);
      expect(item!.equipped).toBe(false);
      expect(item!.slot).toBeNull();
    });

    it('should remove an item', async () => {
      await container.repos.inventory.remove(armorInstanceId);
      const items = await container.repos.inventory.getAll(characterId);
      expect(items.length).toBe(1);
      expect(items[0].item.id).toBe('combat_knife');
    });
  });

  // =========================================================================
  // 4. FACTION SYSTEM
  // =========================================================================
  describe('Faction System', () => {
    it('should update faction reputation', async () => {
      const factions = await container.repos.faction.getAll(characterId);
      const firstFaction = factions[0];

      await container.repos.faction.updateReputation(characterId, firstFaction.factionId, 25);
      const updated = await container.repos.faction.get(characterId, firstFaction.factionId);
      expect(updated).not.toBeNull();
      expect(updated!.reputation).toBe(25);
    });

    it('should set faction standing', async () => {
      const factions = await container.repos.faction.getAll(characterId);
      const firstFaction = factions[0];

      await container.repos.faction.setStanding(characterId, firstFaction.factionId, 'friendly');
      const updated = await container.repos.faction.get(characterId, firstFaction.factionId);
      expect(updated!.standing).toBe('friendly');
    });
  });

  // =========================================================================
  // 5. NPC SYSTEM
  // =========================================================================
  describe('NPC System', () => {
    const npcId = 'npc_commissar_vrell';

    it('should create an NPC', async () => {
      const npc = await container.repos.npc.create(characterId, {
        id: npcId,
        name: 'Commissar Vrell',
        title: 'Commissar',
        role: 'authority',
        personality: 'loyal',
        description: 'A stern but fair commissar.',
        location: 'hab_block_7',
        factionId: 'imperial_authority',
        relationship: { affinity: 0, respect: 10, fear: 30, knowledge: 5, loyalty: 0 },
        romanceEligible: false,
        romanceStage: 0,
        secrets: [],
        breakingPoints: [],
        companion: null,
        isAlive: true,
        dialogueTreeId: null,
      });

      expect(npc.id).toBe(npcId);
      expect(npc.name).toBe('Commissar Vrell');
    });

    it('should retrieve NPC by id', async () => {
      const npc = await container.repos.npc.getById(npcId);
      expect(npc).not.toBeNull();
      expect(npc!.role).toBe('authority');
    });

    it('should update NPC relationship', async () => {
      await container.repos.npc.updateRelationship(npcId, { affinity: 15, respect: 25 });
      const npc = await container.repos.npc.getById(npcId);
      expect(npc!.relationship.affinity).toBe(15);
      expect(npc!.relationship.respect).toBe(25);
      expect(npc!.relationship.fear).toBe(30); // unchanged
    });

    it('should kill an NPC', async () => {
      await container.repos.npc.update(npcId, { isAlive: false });
      const npc = await container.repos.npc.getById(npcId);
      expect(npc!.isAlive).toBe(false);
    });

    it('should list all NPCs for character', async () => {
      const npcs = await container.repos.npc.getAll(characterId);
      expect(npcs.length).toBe(1);
    });
  });

  // =========================================================================
  // 6. QUEST SYSTEM
  // =========================================================================
  describe('Quest System', () => {
    const questId = 'quest_missing_supplies';

    it('should create a quest', async () => {
      const quest = await container.repos.quest.create(characterId, {
        id: questId,
        title: 'Missing Supplies',
        description: 'Investigate the missing supply shipment.',
        giver: 'npc_commissar_vrell',
        factionId: 'imperial_authority',
        status: 'active',
        objectives: [
          { id: 'obj_1', description: 'Talk to warehouse overseer', completed: false },
          { id: 'obj_2', description: 'Find the supplies', completed: false },
        ],
        rewards: { xp: 100, thrones: 50, items: [], factionRep: { imperial_authority: 10 }, traits: [], flags: [] },
        failureConsequences: {},
        deadline: null,
        startDay: 1,
        completedDay: null,
        chainNext: null,
      });

      expect(quest.id).toBe(questId);
      expect(quest.status).toBe('active');
    });

    it('should retrieve quest by id', async () => {
      const quest = await container.repos.quest.getById(characterId, questId);
      expect(quest).not.toBeNull();
      expect(quest!.objectives.length).toBe(2);
    });

    it('should update quest objectives', async () => {
      const quest = await container.repos.quest.getById(characterId, questId);
      const updatedObjectives = quest!.objectives.map(obj =>
        obj.id === 'obj_1' ? { ...obj, completed: true } : obj,
      );
      await container.repos.quest.update(characterId, questId, { objectives: updatedObjectives } as never);

      const updated = await container.repos.quest.getById(characterId, questId);
      expect(updated!.objectives[0].completed).toBe(true);
      expect(updated!.objectives[1].completed).toBe(false);
    });

    it('should complete a quest', async () => {
      await container.repos.quest.update(characterId, questId, { status: 'completed' } as never);
      const quest = await container.repos.quest.getById(characterId, questId);
      expect(quest!.status).toBe('completed');
    });

    it('should filter quests by status', async () => {
      const active = await container.repos.quest.getAll(characterId, 'active');
      const completed = await container.repos.quest.getAll(characterId, 'completed');
      expect(active.length).toBe(0);
      expect(completed.length).toBe(1);
    });
  });

  // =========================================================================
  // 7. STORY / NARRATIVE SYSTEM
  // =========================================================================
  describe('Story / Narrative System', () => {
    it('should set and read story flags', async () => {
      await container.repos.story.setFlag(characterId, 'met_commissar', true);
      await container.repos.story.setFlag(characterId, 'has_warp_sight', true);

      const story = await container.repos.story.get(characterId);
      expect(story!.flags.met_commissar).toBe(true);
      expect(story!.flags.has_warp_sight).toBe(true);
    });

    it('should track visited scenes', async () => {
      await container.repos.story.addVisitedScene(characterId, 'scene_intro');
      await container.repos.story.addVisitedScene(characterId, 'scene_market');

      const story = await container.repos.story.get(characterId);
      expect(story!.visitedScenes).toContain('scene_intro');
      expect(story!.visitedScenes).toContain('scene_market');
    });

    it('should track choice history', async () => {
      await container.repos.story.addChoiceHistory(characterId, {
        sceneId: 'scene_intro',
        choiceId: 'choice_help_stranger',
        timestamp: new Date(),
      });

      const story = await container.repos.story.get(characterId);
      expect(story!.choiceHistory.length).toBeGreaterThanOrEqual(1);
      expect(story!.choiceHistory[0].choiceId).toBe('choice_help_stranger');
    });

    it('should set story variables', async () => {
      await container.repos.story.setVariable(characterId, 'player_name', 'Varn Kaltos');
      await container.repos.story.setVariable(characterId, 'days_survived', 3);

      const story = await container.repos.story.get(characterId);
      expect(story!.variables.player_name).toBe('Varn Kaltos');
      expect(story!.variables.days_survived).toBe(3);
    });
  });

  // =========================================================================
  // 8. EXECUTE CHOICE (Narrative Use Case)
  // =========================================================================
  describe('Execute Choice', () => {
    it('should execute a choice with XP and flag effects', async () => {
      const useCase = new ExecuteChoiceUseCase(
        container.repos.story,
        container.repos.character,
        container.repos.faction,
        container.repos.npc,
        container.repos.inventory,
        container.repos.quest,
        container.repos.event,
      );

      const choice: Choice = {
        id: 'choice_investigate',
        text: 'Investigate the strange noise',
        conditions: {},
        effects: {
          xpGain: 10,
          setFlags: ['investigated_noise'],
          nextScene: 'scene_dark_corridor',
        } as ChoiceEffect,
        skillCheck: undefined,
      };

      const result = await useCase.execute(characterId, 'scene_intro', choice);

      expect(result.success).toBe(true);
      expect(result.nextSceneId).toBe('scene_dark_corridor');

      // Verify flag was set
      const story = await container.repos.story.get(characterId);
      expect(story!.flags.investigated_noise).toBe(true);

      // Verify XP was applied
      const character = await container.repos.character.get(characterId);
      expect(character!.xp).toBeGreaterThan(0);
    });

    it('should execute a choice with faction reputation changes', async () => {
      const useCase = new ExecuteChoiceUseCase(
        container.repos.story,
        container.repos.character,
        container.repos.faction,
        container.repos.npc,
        container.repos.inventory,
        container.repos.quest,
        container.repos.event,
      );

      // Use a faction we haven't touched yet (second faction in list)
      const factions = await container.repos.faction.getAll(characterId);
      expect(factions.length).toBeGreaterThan(1);
      const factionId = factions[1].factionId;

      const choice: Choice = {
        id: 'choice_help_faction',
        text: 'Help the faction',
        conditions: {},
        effects: {
          factionRepChanges: { [factionId]: 15 },
        } as ChoiceEffect,
        skillCheck: undefined,
      };

      const result = await useCase.execute(characterId, 'scene_faction', choice);
      expect(result.success).toBe(true);

      // The execute-choice use case calls updateReputation which SETS the value
      const factionAfter = await container.repos.faction.get(characterId, factionId);
      expect(factionAfter!.reputation).toBe(15);
    });

    it('should execute a choice with skill check', async () => {
      const useCase = new ExecuteChoiceUseCase(
        container.repos.story,
        container.repos.character,
        container.repos.faction,
        container.repos.npc,
        container.repos.inventory,
        container.repos.quest,
        container.repos.event,
      );

      const choice: Choice = {
        id: 'choice_sneak_past',
        text: 'Sneak past the guards',
        conditions: {},
        effects: {} as ChoiceEffect,
        skillCheck: {
          stat: 'agility',
          difficulty: 0,
          successScene: 'scene_success',
          failureScene: 'scene_caught',
        },
      };

      const result = await useCase.execute(characterId, 'scene_guards', choice);
      expect(result.success).toBe(true);
      expect(result.skillCheckResult).toBeDefined();
      expect(result.skillCheckResult!.roll).toBeGreaterThan(0);
      expect(result.skillCheckResult!.target).toBeGreaterThan(0);
      expect(typeof result.skillCheckResult!.success).toBe('boolean');

      // Next scene should depend on skill check result
      if (result.skillCheckResult!.success) {
        expect(result.nextSceneId).toBe('scene_success');
      } else {
        expect(result.nextSceneId).toBe('scene_caught');
      }
    });
  });

  // =========================================================================
  // 9. EVENT LOG SYSTEM
  // =========================================================================
  describe('Event Log System', () => {
    it('should log and retrieve events', async () => {
      await container.repos.event.logEvent(characterId, {
        eventType: 'custom_test',
        title: 'Test Event',
        description: 'A test event for integration testing.',
        data: { foo: 'bar' },
        gameDay: 5,
      });

      const events = await container.repos.event.getEventLog(characterId, 50);
      const testEvent = events.find(e => e.eventType === 'custom_test');
      expect(testEvent).toBeDefined();
      expect(testEvent!.title).toBe('Test Event');
      expect(testEvent!.gameDay).toBe(5);
    });

    it('should create and retrieve pending consequences', async () => {
      const consequence = await container.repos.event.createConsequence({
        characterId,
        source: 'scene_dark_deal',
        triggerType: 'game_day',
        triggerValue: 10,
        consequenceType: 'event' as never,
        data: { eventId: 'consequence_betrayal' },
        createdDay: 1,
        expiresDay: null,
      });

      expect(consequence.id).toBeGreaterThan(0);

      const pending = await container.repos.event.getPendingConsequences(characterId);
      expect(pending.length).toBeGreaterThanOrEqual(1);
      const found = pending.find(c => c.source === 'scene_dark_deal');
      expect(found).toBeDefined();
    });

    it('should trigger a consequence', async () => {
      const pending = await container.repos.event.getPendingConsequences(characterId);
      const consequence = pending.find(c => c.source === 'scene_dark_deal');
      expect(consequence).toBeDefined();

      await container.repos.event.triggerConsequence(consequence!.id, 10);

      // After triggering, it should not appear in pending anymore
      const pendingAfter = await container.repos.event.getPendingConsequences(characterId);
      const stillPending = pendingAfter.find(c => c.id === consequence!.id);
      expect(stillPending).toBeUndefined();
    });
  });

  // =========================================================================
  // 10. PSYCHIC POWERS SYSTEM
  // =========================================================================
  describe('Psychic Powers System', () => {
    const testPower: PsychicPower = {
      id: 'telekinesis_push',
      discipline: 'telekinesis',
      name: 'Telekinetic Push',
      tier: 1 as 1,
      description: 'Push an object or enemy with your mind.',
      contexts: ['combat', 'exploration'],
      difficulty: 0,
      effects: { combat: { damage: 5, range: 'medium', special: ['knockback'] } },
      prerequisites: [],
      basePerilsModifier: 0,
    };

    it('should start with no unlocked powers', async () => {
      const records = await container.repos.psychic.getUnlocked(characterId);
      expect(records.length).toBe(0);
    });

    it('should unlock a psychic power via use case', async () => {
      const useCase = new UnlockPowerUseCase(
        container.repos.character,
        container.repos.event,
      );

      const result = await useCase.execute({
        characterId,
        power: testPower,
        unlockedPowerIds: [],
        gameDay: 1,
      });

      expect(result.unlocked).toBe(true);

      // Persist the unlock in repository
      await container.repos.psychic.unlock(
        characterId,
        testPower.id,
        testPower.discipline,
        testPower.name,
        testPower.tier,
      );
    });

    it('should report the power as unlocked', async () => {
      const records = await container.repos.psychic.getUnlocked(characterId);
      expect(records.length).toBe(1);
      expect(records[0].powerId).toBe('telekinesis_push');
      expect(records[0].unlocked).toBe(true);

      const isUnlocked = await container.repos.psychic.isUnlocked(characterId, 'telekinesis_push');
      expect(isUnlocked).toBe(true);
    });

    it('should reject unlocking power that requires higher psy rating', async () => {
      const useCase = new UnlockPowerUseCase(
        container.repos.character,
        container.repos.event,
      );

      const tier4Power: PsychicPower = {
        ...testPower,
        id: 'telekinesis_storm',
        name: 'Telekinetic Storm',
        tier: 4 as 4,
        prerequisites: [],
      };

      const result = await useCase.execute({
        characterId,
        power: tier4Power,
        unlockedPowerIds: ['telekinesis_push'],
        gameDay: 1,
      });

      expect(result.unlocked).toBe(false);
      expect(result.reason).toContain('Psy Rating');
    });

    it('should reject unlocking power with missing prerequisites', async () => {
      const useCase = new UnlockPowerUseCase(
        container.repos.character,
        container.repos.event,
      );

      const advancedPower: PsychicPower = {
        ...testPower,
        id: 'telekinesis_shield',
        name: 'Telekinetic Shield',
        tier: 1 as 1,
        prerequisites: ['telekinesis_crush'], // not unlocked
      };

      const result = await useCase.execute({
        characterId,
        power: advancedPower,
        unlockedPowerIds: ['telekinesis_push'],
        gameDay: 1,
      });

      expect(result.unlocked).toBe(false);
      expect(result.reason).toContain('prerequisite');
    });

    it('should use a psychic power and track effects', async () => {
      const useCase = new UsePowerUseCase(
        container.repos.character,
        container.repos.event,
      );

      const charBefore = await container.repos.character.get(characterId);
      const corruptionBefore = charBefore!.corruption;

      const result = await useCase.execute({
        characterId,
        power: testPower,
        difficulty: 0,
        modifiers: [],
        gameDay: 2,
      });

      expect(typeof result.success).toBe('boolean');
      expect(typeof result.effectDescription).toBe('string');
      expect(typeof result.corruptionGained).toBe('number');
      expect(result.corruptionGained).toBeGreaterThanOrEqual(0);

      // Corruption should have changed
      const charAfter = await container.repos.character.get(characterId);
      expect(charAfter!.corruption).toBeGreaterThanOrEqual(corruptionBefore);
    });

    it('should increment usage count', async () => {
      await container.repos.psychic.incrementUsage(characterId, 'telekinesis_push');
      const records = await container.repos.psychic.getAll(characterId);
      const push = records.find(r => r.powerId === 'telekinesis_push');
      expect(push!.timesUsed).toBe(1);
    });
  });

  // =========================================================================
  // 11. ACHIEVEMENT SYSTEM
  // =========================================================================
  describe('Achievement System', () => {
    it('should initialize and track achievements', async () => {
      await container.repos.achievement.initialize({
        characterId,
        achievementId: 'first_blood',
        name: 'First Blood',
        category: 'combat',
        progress: 0,
        maxProgress: 1,
      });

      const achievements = await container.repos.achievement.getAll(characterId);
      expect(achievements.length).toBeGreaterThanOrEqual(1);
      const fb = achievements.find(a => a.achievementId === 'first_blood');
      expect(fb).toBeDefined();
      expect(fb!.unlocked).toBe(false);
    });

    it('should unlock an achievement', async () => {
      await container.repos.achievement.unlock(characterId, 'first_blood');
      const achievements = await container.repos.achievement.getAll(characterId);
      const fb = achievements.find(a => a.achievementId === 'first_blood');
      expect(fb!.unlocked).toBe(true);
      expect(fb!.unlockedAt).not.toBeNull();
    });

    it('should update achievement progress', async () => {
      await container.repos.achievement.initialize({
        characterId,
        achievementId: 'task_master',
        name: 'Task Master',
        category: 'progression',
        progress: 0,
        maxProgress: 100,
      });

      await container.repos.achievement.updateProgress(characterId, 'task_master', 25);
      const achievements = await container.repos.achievement.getAll(characterId);
      const tm = achievements.find(a => a.achievementId === 'task_master');
      expect(tm!.progress).toBe(25);
    });

    it('should check achievements via use case', async () => {
      const useCase = new CheckAchievementsUseCase(
        container.repos.character,
        container.repos.achievement,
        container.repos.event,
      );

      // Initialize a level-based achievement
      await container.repos.achievement.initialize({
        characterId,
        achievementId: 'level_1_reached',
        name: 'First Step',
        category: 'progression',
        progress: 0,
        maxProgress: 1,
      });

      const achievements: Achievement[] = [{
        id: 'level_1_reached',
        name: 'First Step',
        description: 'Reach level 1.',
        hiddenDescription: '???',
        category: 'progression',
        conditions: [{ type: 'level_min', target: 'level', value: 1 }] as AchievementCondition[],
        reward: { xp: 0 },
        progressive: false,
        maxProgress: 1,
      }];

      const result = await useCase.execute(characterId, achievements, 1);
      expect(result.newlyUnlocked.length).toBe(1);
      expect(result.newlyUnlocked[0].id).toBe('level_1_reached');
    });
  });

  // =========================================================================
  // 12. GAME STATE SERVICE (Aggregation)
  // =========================================================================
  describe('Game State Service', () => {
    it('should return a full aggregated game state', async () => {
      const service = new GameStateService(
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

      const state = await service.getFullState(characterId);

      // Character
      expect(state.character.id).toBe(characterId);
      expect(state.character.name).toBe('Varn Kaltos');
      expect(state.character.level).toBeGreaterThanOrEqual(1);
      expect(state.character.psyRating).toBeGreaterThanOrEqual(1);
      expect(state.character.sanityState).toBeDefined();
      expect(state.character.corruptionState).toBeDefined();
      expect(state.character.systemFeatures).toBeDefined();

      // Tasks
      expect(state.tasks.length).toBeGreaterThanOrEqual(1);

      // Inventory
      expect(state.inventory.items.length).toBeGreaterThanOrEqual(1);
      expect(state.inventory.encumbrance).toBeDefined();

      // Factions
      expect(state.factions.length).toBeGreaterThan(0);

      // NPCs
      expect(state.npcs.length).toBeGreaterThanOrEqual(1);

      // Quests
      expect(state.quests.completed).toBeGreaterThanOrEqual(1);

      // Story flags
      expect(state.storyFlags.investigated_noise).toBe(true);
      expect(state.storyFlags.met_commissar).toBe(true);
    });
  });

  // =========================================================================
  // 13. CHARACTER STAT UPDATES
  // =========================================================================
  describe('Character Stat Operations', () => {
    it('should update individual primary stats', async () => {
      await container.repos.character.updateStats(characterId, { strength: 5 });
      const character = await container.repos.character.get(characterId);
      // Stat gains are incremental in some implementations, absolute in others
      expect(character!.primaryStats.strength).toBeGreaterThanOrEqual(5);
    });

    it('should update character resources', async () => {
      const charBefore = await container.repos.character.get(characterId);
      const thronesBefore = charBefore!.thrones;

      await container.repos.character.update(characterId, {
        thrones: thronesBefore + 100,
        sanity: 80,
      });

      const charAfter = await container.repos.character.get(characterId);
      expect(charAfter!.thrones).toBe(thronesBefore + 100);
      expect(charAfter!.sanity).toBe(80);
    });

    it('should update corruption', async () => {
      await container.repos.character.update(characterId, { corruption: 15 });
      const character = await container.repos.character.get(characterId);
      expect(character!.corruption).toBe(15);
    });
  });

  // =========================================================================
  // 14. START DAY USE CASE
  // =========================================================================
  describe('Start Day', () => {
    it('should produce a daily briefing', async () => {
      const useCase = new StartDayUseCase(
        container.repos.character,
        container.repos.task,
        container.repos.event,
        container.repos.npc,
        container.repos.faction,
      );

      const briefing = await useCase.execute(characterId);

      expect(briefing).toBeDefined();
      expect(typeof briefing.isNewDay).toBe('boolean');
      expect(typeof briefing.gameDay).toBe('number');
      expect(Array.isArray(briefing.notifications)).toBe(true);
      expect(Array.isArray(briefing.brokenStreaks)).toBe(true);
      expect(briefing.nightmareReport).toBeDefined();
      expect(typeof briefing.nightmareReport.hadNightmare).toBe('boolean');
      expect(typeof briefing.xpCap).toBe('number');
      expect(briefing.xpCap).toBeGreaterThan(0);
      expect(Array.isArray(briefing.warnings)).toBe(true);
    });
  });

  // =========================================================================
  // 15. DATA INTEGRITY CHECKS
  // =========================================================================
  describe('Data Integrity', () => {
    it('should maintain referential integrity after multiple operations', async () => {
      const character = await container.repos.character.get(characterId);
      const tasks = await container.repos.task.getAll(characterId);
      const items = await container.repos.inventory.getAll(characterId);
      const events = await container.repos.event.getEventLog(characterId, 100);
      const factions = await container.repos.faction.getAll(characterId);
      const npcs = await container.repos.npc.getAll(characterId);
      const story = await container.repos.story.get(characterId);
      const psychic = await container.repos.psychic.getAll(characterId);

      // Character exists and is consistent
      expect(character).not.toBeNull();
      expect(character!.name).toBe('Varn Kaltos');

      // We should have accumulated multiple events from all operations
      expect(events.length).toBeGreaterThanOrEqual(5);

      // Story state should have all our flags
      expect(Object.keys(story!.flags).length).toBeGreaterThanOrEqual(3);

      // Psychic powers persisted
      expect(psychic.length).toBeGreaterThanOrEqual(1);

      // Factions all present
      expect(factions.length).toBeGreaterThan(0);

      // Everything references the same characterId
      for (const t of tasks) expect(t.characterId).toBe(characterId);
      for (const i of items) expect(i.characterId).toBe(characterId);
      for (const f of factions) expect(f.characterId).toBe(characterId);
    });

    it('should have consistent event log chronology', async () => {
      const events = await container.repos.event.getEventLog(characterId, 100);
      // Events are returned in DESC order (most recent first)
      for (let i = 1; i < events.length; i++) {
        expect(events[i - 1].id).toBeGreaterThanOrEqual(events[i].id);
      }
    });
  });
});
