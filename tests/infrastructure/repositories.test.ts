import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createContainer, resetContainer } from '@/infrastructure/di/container';
import { deleteSave, closeAll } from '@/infrastructure/database/connection';
import type { Container } from '@/infrastructure/di/container';

describe('Repository Infrastructure', () => {
  let container: Container;

  beforeAll(() => {
    // Clean up any leftover test database from previous runs
    resetContainer();
    try {
      deleteSave('test_repos');
    } catch {
      // ignore cleanup errors
    }
    container = createContainer('test_repos');
  });

  afterAll(() => {
    resetContainer();
    try {
      deleteSave('test_repos');
    } catch {
      // ignore cleanup errors
    }
  });

  describe('Container', () => {
    it('should create a container with all repositories', () => {
      expect(container.repos).toBeDefined();
      expect(container.repos.character).toBeDefined();
      expect(container.repos.task).toBeDefined();
      expect(container.repos.npc).toBeDefined();
      expect(container.repos.inventory).toBeDefined();
      expect(container.repos.story).toBeDefined();
      expect(container.repos.quest).toBeDefined();
      expect(container.repos.faction).toBeDefined();
      expect(container.repos.event).toBeDefined();
      expect(container.repos.achievement).toBeDefined();
    });

    it('should return same container for same save name', () => {
      const container2 = createContainer('test_repos');
      expect(container2).toBe(container);
    });

    it('should reset container', () => {
      resetContainer();
      const newContainer = createContainer('test_repos');
      expect(newContainer).not.toBe(container);
      container = newContainer; // update reference for cleanup
    });
  });

  describe('Character Repository', () => {
    it('should report no character exists initially', async () => {
      const exists = await container.repos.character.exists();
      expect(exists).toBe(false);
    });

    it('should create and retrieve a character', async () => {
      const char = await container.repos.character.create({
        name: 'Test Hero',
        gender: 'male',
        age: 25,
        origin: 'hive_world',
        background: 'guard_veteran',
        personality1: 'stoic',
        personality2: 'pragmatic',
        appearance: { build: 'average', height: 'average', distinguishingFeatures: 'Scar' },
        difficulty: 'standard',
        ironman: false,
        bonusStatAllocations: {},
        primaryStats: {
          weaponSkill: 30, ballisticSkill: 30, strength: 30, toughness: 30,
          agility: 30, intelligence: 30, perception: 30, willpower: 30, fellowship: 30,
        },
        hpMax: 20,
        sanity: 100,
        thrones: 200,
        psyRating: 0,
      });

      expect(char.id).toBeDefined();
      expect(char.name).toBe('Test Hero');
      expect(char.level).toBe(1);

      const retrieved = await container.repos.character.get(char.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe('Test Hero');
    });
  });

  describe('Task Repository', () => {
    it('should create and retrieve tasks', async () => {
      const task = await container.repos.task.create({
        characterId: 1,
        name: 'Morning Push-ups',
        description: 'Do 50 push-ups',
        category: 'physical_training' as never,
        difficulty: 3 as never,
        recurring: 'daily' as never,
        timeEstimateMinutes: 15,
        isActive: true,
      });

      expect(task.id).toBeDefined();
      expect(task.name).toBe('Morning Push-ups');
      expect(task.currentStreak).toBe(0);

      const tasks = await container.repos.task.getAll(1, true);
      expect(tasks.length).toBeGreaterThanOrEqual(1);
    });
  });
});
