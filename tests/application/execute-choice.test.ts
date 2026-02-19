import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecuteChoiceUseCase } from '@/application/use-cases/narrative/execute-choice';
import type { Choice } from '@/domain/models';

function makeRepos() {
  return {
    storyRepo: {
      get: vi.fn().mockResolvedValue({
        characterId: 1,
        currentSceneId: 'scene_1',
        flags: {},
        visitedScenes: [],
        choiceHistory: [],
        variables: {},
      }),
      update: vi.fn().mockResolvedValue({}),
      setFlag: vi.fn(),
      addVisitedScene: vi.fn(),
      addChoiceHistory: vi.fn(),
      setVariable: vi.fn(),
      initialize: vi.fn(),
    },
    characterRepo: {
      get: vi.fn().mockResolvedValue({
        id: 1, name: 'Test', level: 5,
        primaryStats: { weaponSkill: 40, ballisticSkill: 30, strength: 30, toughness: 30, agility: 30, intelligence: 30, perception: 30, willpower: 30, fellowship: 30 },
        sanity: 70, corruption: 10, thrones: 200, currentLocation: 'hive',
      }),
      update: vi.fn().mockResolvedValue({}),
      updateStats: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    },
    factionRepo: {
      get: vi.fn().mockResolvedValue(null),
      getAll: vi.fn().mockResolvedValue([]),
      updateReputation: vi.fn(),
      initialize: vi.fn(),
      setStanding: vi.fn(),
    },
    npcRepo: {
      getById: vi.fn().mockResolvedValue(null),
      getAll: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      updateRelationship: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    inventoryRepo: {
      add: vi.fn(),
      getById: vi.fn(),
      getAll: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      remove: vi.fn(),
      equip: vi.fn(),
      unequip: vi.fn(),
    },
    questRepo: {
      create: vi.fn(),
      getById: vi.fn().mockResolvedValue(null),
      getAll: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      delete: vi.fn(),
    },
    eventRepo: {
      logEvent: vi.fn(),
      getEvents: vi.fn().mockResolvedValue([]),
      getRecentEvents: vi.fn().mockResolvedValue([]),
    },
  };
}

describe('ExecuteChoiceUseCase', () => {
  let repos: ReturnType<typeof makeRepos>;
  let useCase: ExecuteChoiceUseCase;

  beforeEach(() => {
    repos = makeRepos();
    useCase = new ExecuteChoiceUseCase(
      repos.storyRepo as never,
      repos.characterRepo as never,
      repos.factionRepo as never,
      repos.npcRepo as never,
      repos.inventoryRepo as never,
      repos.questRepo as never,
      repos.eventRepo as never,
    );
  });

  it('should execute a simple choice with flags', async () => {
    const choice: Choice = {
      id: 'choice_1',
      text: 'Open the door',
      effects: { setFlags: ['door_opened'] },
      visibleWhenLocked: false,
    };

    const result = await useCase.execute(1, 'scene_1', choice, 1);
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('notifications');
    expect(repos.storyRepo.setFlag).toHaveBeenCalledWith(1, 'door_opened', true);
  });

  it('should handle XP gain from choice', async () => {
    const choice: Choice = {
      id: 'choice_2',
      text: 'Help the merchant',
      effects: { xpGain: 50 },
      visibleWhenLocked: false,
    };

    const result = await useCase.execute(1, 'scene_1', choice, 1);
    expect(result.success).toBe(true);
  });

  it('should log event after choice execution', async () => {
    const choice: Choice = {
      id: 'choice_3',
      text: 'Walk away',
      effects: {},
      visibleWhenLocked: false,
    };

    await useCase.execute(1, 'scene_1', choice, 1);
    expect(repos.eventRepo.logEvent).toHaveBeenCalled();
  });
});
