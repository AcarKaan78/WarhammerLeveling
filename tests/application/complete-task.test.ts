import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompleteTaskUseCase } from '@/application/use-cases/tasks/complete-task';
import type { ITaskRepository, ICharacterRepository, IEventRepository } from '@/domain/interfaces';

// Mock repositories
function mockTaskRepo(): ITaskRepository {
  return {
    create: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn().mockResolvedValue({
      id: 1,
      characterId: 1,
      name: 'Push-ups',
      description: 'Do 50 push-ups',
      category: 'physical_training',
      difficulty: 3,
      recurring: 'daily',
      timeEstimateMinutes: 15,
      currentStreak: 5,
      bestStreak: 10,
      totalCompletions: 20,
      lastCompleted: new Date(Date.now() - 86400000), // yesterday
      isActive: true,
      createdAt: new Date(),
    }),
    update: vi.fn().mockImplementation((_id, changes) => Promise.resolve({ ...changes })),
    softDelete: vi.fn(),
    logCompletion: vi.fn().mockResolvedValue({}),
    getCompletionsForDate: vi.fn().mockResolvedValue([]),
    getDailySession: vi.fn().mockResolvedValue(null),
    upsertDailySession: vi.fn().mockImplementation((session) => Promise.resolve({
      id: 1,
      characterId: session.characterId,
      date: session.date,
      totalXPEarned: session.totalXPEarned ?? 0,
      xpCap: session.xpCap ?? 500,
      tasksCompleted: session.tasksCompleted ?? 0,
      categoryCounts: session.categoryCounts ?? {},
      streaksBroken: session.streaksBroken ?? [],
      gameDay: session.gameDay ?? 1,
    })),
  };
}

function mockCharacterRepo(): ICharacterRepository {
  return {
    create: vi.fn(),
    get: vi.fn().mockResolvedValue({
      id: 1,
      name: 'Test',
      level: 5,
      xp: 100,
      xpToNext: 200,
      freeStatPoints: 2,
      freeSkillPoints: 3,
      freePerkPoints: 0,
      primaryStats: {
        weaponSkill: 30, ballisticSkill: 30, strength: 30, toughness: 30,
        agility: 30, intelligence: 30, perception: 30, willpower: 30, fellowship: 30,
      },
      hpCurrent: 20, hpMax: 20, sanity: 70, sanityMax: 100,
      corruption: 10, corruptionThreshold: 26, fatigue: 0, fatigueMax: 10,
      psyRating: 0, carryCapacity: 90, influence: 10, thrones: 200,
      housingLevel: 1, currentLocation: 'hive', systemLevel: 2,
      difficulty: 'standard', ironman: false,
      createdAt: new Date(), lastPlayed: new Date(),
    }),
    update: vi.fn().mockImplementation((_id, changes) => Promise.resolve({ ...changes })),
    updateStats: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
  };
}

function mockEventRepo(): IEventRepository {
  return {
    logEvent: vi.fn().mockResolvedValue({}),
    getEventLog: vi.fn().mockResolvedValue([]),
    createConsequence: vi.fn(),
    getPendingConsequences: vi.fn().mockResolvedValue([]),
    triggerConsequence: vi.fn(),
  } as unknown as IEventRepository;
}

describe('CompleteTaskUseCase', () => {
  let taskRepo: ITaskRepository;
  let charRepo: ICharacterRepository;
  let eventRepo: IEventRepository;
  let useCase: CompleteTaskUseCase;

  beforeEach(() => {
    taskRepo = mockTaskRepo();
    charRepo = mockCharacterRepo();
    eventRepo = mockEventRepo();
    useCase = new CompleteTaskUseCase(taskRepo, charRepo, eventRepo);
  });

  it('should complete a task and return a report', async () => {
    const report = await useCase.execute(1, 1);
    expect(report).toHaveProperty('xpEarned');
    expect(report).toHaveProperty('statGains');
    expect(report).toHaveProperty('newStreak');
    expect(report.xpEarned).toBeGreaterThanOrEqual(0);
    expect(report.newStreak).toBe(6); // was 5, should be 6
  });

  it('should throw if task not found', async () => {
    (taskRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(useCase.execute(999, 1)).rejects.toThrow('Task not found');
  });

  it('should throw if character not found', async () => {
    (charRepo.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(useCase.execute(1, 999)).rejects.toThrow('Character not found');
  });

  it('should log a completion record', async () => {
    await useCase.execute(1, 1);
    expect(taskRepo.logCompletion).toHaveBeenCalled();
  });

  it('should update the task with new streak', async () => {
    await useCase.execute(1, 1);
    expect(taskRepo.update).toHaveBeenCalled();
  });
});
