import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StartDayUseCase, DailyBriefing } from '@/application/use-cases/daily-session/start-day';

function makeRepos() {
  return {
    characterRepo: {
      get: vi.fn().mockResolvedValue({
        id: 1, name: 'Test', level: 5, sanity: 70, sanityMax: 100,
        corruption: 10, lastPlayed: new Date(Date.now() - 86400000),
        housingLevel: 1, difficulty: 'standard',
        primaryStats: { willpower: 30 },
        hpCurrent: 20, hpMax: 20, thrones: 200, currentLocation: 'hive',
        createdAt: new Date(Date.now() - 86400000 * 10),
      }),
      update: vi.fn().mockResolvedValue({}),
      updateStats: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    },
    taskRepo: {
      getAll: vi.fn().mockResolvedValue([
        { id: 1, name: 'Task 1', currentStreak: 3, lastCompleted: new Date(Date.now() - 86400000), isActive: true, category: 'physical_training', difficulty: 3, recurring: 'daily' },
      ]),
      update: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      softDelete: vi.fn(),
      logCompletion: vi.fn(),
      getCompletionsForDate: vi.fn().mockResolvedValue([]),
      getDailySession: vi.fn().mockResolvedValue(null),
      upsertDailySession: vi.fn().mockResolvedValue({}),
    },
    eventRepo: {
      logEvent: vi.fn().mockResolvedValue({}),
      getEventLog: vi.fn().mockResolvedValue([]),
      createConsequence: vi.fn(),
      getPendingConsequences: vi.fn().mockResolvedValue([]),
      triggerConsequence: vi.fn(),
    },
    npcRepo: {
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn(),
      update: vi.fn(),
      updateRelationship: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    factionRepo: {
      getAll: vi.fn().mockResolvedValue([]),
      get: vi.fn(),
      updateReputation: vi.fn(),
      initialize: vi.fn(),
      setStanding: vi.fn(),
    },
  };
}

describe('StartDayUseCase', () => {
  let repos: ReturnType<typeof makeRepos>;
  let useCase: StartDayUseCase;

  beforeEach(() => {
    repos = makeRepos();
    useCase = new StartDayUseCase(
      repos.characterRepo as never,
      repos.taskRepo as never,
      repos.eventRepo as never,
      repos.npcRepo as never,
      repos.factionRepo as never,
    );
  });

  it('should return a daily briefing', async () => {
    const briefing = await useCase.execute(1, []);
    expect(briefing).toHaveProperty('isNewDay');
    expect(briefing).toHaveProperty('gameDay');
    expect(briefing).toHaveProperty('notifications');
    expect(briefing).toHaveProperty('brokenStreaks');
    expect(briefing).toHaveProperty('nightmareReport');
    expect(briefing).toHaveProperty('xpCap');
  });

  it('should throw for missing character', async () => {
    (repos.characterRepo.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(useCase.execute(999, [])).rejects.toThrow('Character not found');
  });

  it('should include nightmare report', async () => {
    const briefing = await useCase.execute(1, []);
    expect(briefing.nightmareReport).toHaveProperty('hadNightmare');
    expect(typeof briefing.nightmareReport.hadNightmare).toBe('boolean');
  });

  it('should include XP cap', async () => {
    const briefing = await useCase.execute(1, []);
    expect(briefing.xpCap).toBeGreaterThan(0);
  });
});
