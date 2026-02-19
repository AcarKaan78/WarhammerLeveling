import { describe, it, expect } from 'vitest';
import {
  calculateXPToNext,
  checkLevelUp,
  getSystemLevelUnlocks,
  getAllUnlockedFeatures,
} from '@/domain/engine/progression-engine';

describe('Progression Engine', () => {
  describe('calculateXPToNext', () => {
    it('should return positive XP for level 1', () => {
      const xp = calculateXPToNext(1);
      expect(xp).toBeGreaterThan(0);
    });

    it('should increase XP requirement per level', () => {
      const xp1 = calculateXPToNext(1);
      const xp10 = calculateXPToNext(10);
      expect(xp10).toBeGreaterThan(xp1);
    });

    it('should handle max level', () => {
      const xp = calculateXPToNext(50);
      expect(xp).toBeGreaterThan(0);
    });
  });

  describe('checkLevelUp', () => {
    it('should not level up with insufficient XP', () => {
      const xpToNext = calculateXPToNext(1);
      const result = checkLevelUp(0, xpToNext, 1);
      expect(result.levelsGained).toBe(0);
    });

    it('should level up with enough XP', () => {
      const xpToNext = calculateXPToNext(1);
      const result = checkLevelUp(xpToNext + 1, xpToNext, 1);
      expect(result.levelsGained).toBeGreaterThan(0);
      expect(result.rewards.length).toBeGreaterThan(0);
      expect(result.rewards[0].level).toBe(2);
    });

    it('should include rewards for level up', () => {
      const xpToNext = calculateXPToNext(1);
      const result = checkLevelUp(xpToNext + 1, xpToNext, 1);
      expect(result.rewards).toBeDefined();
      expect(result.rewards[0]).toHaveProperty('statPoints');
      expect(result.rewards[0]).toHaveProperty('skillPoints');
      expect(result.rewards[0]).toHaveProperty('perkPoint');
    });
  });

  describe('getSystemLevelUnlocks', () => {
    it('should return unlocks for valid levels', () => {
      const info = getSystemLevelUnlocks(5);
      expect(info).toHaveProperty('systemLevel');
      expect(info).toHaveProperty('newFeatures');
      expect(Array.isArray(info.newFeatures)).toBe(true);
    });
  });

  describe('getAllUnlockedFeatures', () => {
    it('should return array of feature strings', () => {
      const features = getAllUnlockedFeatures(10);
      expect(Array.isArray(features)).toBe(true);
    });

    it('should return more features at higher levels', () => {
      const low = getAllUnlockedFeatures(1);
      const high = getAllUnlockedFeatures(25);
      expect(high.length).toBeGreaterThanOrEqual(low.length);
    });
  });
});
