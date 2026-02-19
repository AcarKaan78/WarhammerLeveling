import { describe, it, expect } from 'vitest';
import {
  calculateTaskXP,
  calculateStreakMultiplier,
  calculateDiminishingFactor,
  calculateStatGains,
  getDailyXPCap,
} from '@/domain/engine/task-engine';

describe('Task Engine', () => {
  describe('calculateTaskXP', () => {
    it('should return positive XP for valid difficulty', () => {
      const xp = calculateTaskXP(3, 1.0, 1.0, 1.0);
      expect(xp).toBeGreaterThan(0);
    });

    it('should scale with streak multiplier', () => {
      const base = calculateTaskXP(3, 1.0, 1.0, 1.0);
      const streaked = calculateTaskXP(3, 2.0, 1.0, 1.0);
      expect(streaked).toBe(base * 2);
    });

    it('should reduce with diminishing factor', () => {
      const base = calculateTaskXP(3, 1.0, 1.0, 1.0);
      const diminished = calculateTaskXP(3, 1.0, 0.5, 1.0);
      expect(diminished).toBeLessThan(base);
    });

    it('should never return negative XP', () => {
      const xp = calculateTaskXP(1, 0.1, 0.1, 0.1);
      expect(xp).toBeGreaterThanOrEqual(0);
    });

    it('should scale with difficulty', () => {
      const easy = calculateTaskXP(1, 1.0, 1.0, 1.0);
      const hard = calculateTaskXP(8, 1.0, 1.0, 1.0);
      expect(hard).toBeGreaterThan(easy);
    });
  });

  describe('calculateStreakMultiplier', () => {
    it('should return 1.0 for no streak', () => {
      expect(calculateStreakMultiplier(0)).toBe(1.0);
    });

    it('should return 1.0 for streak below first threshold', () => {
      expect(calculateStreakMultiplier(3)).toBe(1.0);
    });

    it('should return higher multiplier for 7-day streak', () => {
      const multi = calculateStreakMultiplier(7);
      expect(multi).toBeGreaterThan(1.0);
    });

    it('should increase with longer streaks', () => {
      const week = calculateStreakMultiplier(7);
      const month = calculateStreakMultiplier(30);
      expect(month).toBeGreaterThan(week);
    });
  });

  describe('calculateDiminishingFactor', () => {
    it('should return 1.0 below threshold', () => {
      expect(calculateDiminishingFactor(1)).toBe(1.0);
      expect(calculateDiminishingFactor(3)).toBe(1.0);
    });

    it('should decrease above threshold', () => {
      const factor = calculateDiminishingFactor(5);
      expect(factor).toBeLessThan(1.0);
    });

    it('should not go below 0.1', () => {
      const factor = calculateDiminishingFactor(100);
      expect(factor).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe('getDailyXPCap', () => {
    it('should return a positive number', () => {
      const cap = getDailyXPCap(1);
      expect(cap).toBeGreaterThan(0);
    });

    it('should increase with level', () => {
      const low = getDailyXPCap(1);
      const high = getDailyXPCap(20);
      expect(high).toBeGreaterThan(low);
    });
  });
});
